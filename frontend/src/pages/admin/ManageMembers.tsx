// src/pages/admin/ManageMembers.tsx
import { useEffect, useRef, useState } from 'react';
import {
    Users, CheckCircle, Archive, Trash2, Clock,
    Search, ChevronDown, Eye, X, Mail, Phone,
    Building2, MapPin, Briefcase, RefreshCw,
    Download, Filter, ChevronRight, ArrowRight,
    AlertCircle, Camera, ZoomIn, Upload,
} from 'lucide-react';
import { adminApi, imageUrl } from '../../lib/api';

type MemberStatus = 'PENDING' | 'APPROVED' | 'ARCHIVED';
type UpdateStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
type ActiveTab = MemberStatus | 'UPDATES';

interface RawMember {
    id: string; full_name: string; email: string; batch: number;
    phone_number: string; alternative_phone?: string; job_title?: string;
    organisation?: string; organisation_address?: string;
    notify_events: boolean; status: MemberStatus; created_at: string;
    photo_url?: string | null;
    blood_group?: string | null;
}

interface MemberUpdateRequest {
    id: string; member_id: string;
    batch: number | null; full_name: string | null; phone_number: string | null;
    alternative_phone: string | null; job_title: string | null;
    organisation: string | null; organisation_address: string | null;
    notify_events: boolean | null;
    blood_group: string | null;
    status: UpdateStatus; admin_note: string | null;
    created_at: string; reviewed_at: string | null;
    member: RawMember;
}

// ── Lightbox ──────────────────────────────────────────────────────────────────
function Lightbox({ src, alt, onClose }: { src: string; alt: string; onClose: () => void }) {
    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center"
            style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(6px)' }}
            onClick={onClose}
        >
            <div className="relative max-w-sm w-full mx-4" onClick={e => e.stopPropagation()}>
                <img src={src} alt={alt} className="w-full rounded-2xl shadow-2xl object-cover" />
                <button
                    onClick={onClose}
                    className="absolute -top-3 -right-3 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg hover:bg-gray-100 transition-colors"
                >
                    <X className="w-4 h-4 text-gray-700" />
                </button>
            </div>
        </div>
    );
}

// Clickable photo - opens lightbox on click
function ExpandablePhoto({ src, alt, className }: { src: string; alt: string; className: string }) {
    const [open, setOpen] = useState(false);
    return (
        <>
            <div className="relative group cursor-zoom-in" onClick={() => setOpen(true)}>
                <img src={src} alt={alt} className={className} />
                <div className="absolute inset-0 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: 'rgba(0,0,0,0.35)' }}>
                    <ZoomIn className="w-5 h-5 text-white drop-shadow" />
                </div>
            </div>
            {open && <Lightbox src={src} alt={alt} onClose={() => setOpen(false)} />}
        </>
    );
}

// Generic avatar - photo if available, else initial letter
function MemberAvatar({ member, size = 'md' }: { member: RawMember; size?: 'sm' | 'md' | 'lg' }) {
    const photoSrc = imageUrl(member.photo_url);
    const dims = size === 'sm' ? 'w-8 h-8 text-xs' : size === 'lg' ? 'w-16 h-16 text-2xl' : 'w-10 h-10 text-sm';
    const radius = size === 'lg' ? 'rounded-xl' : 'rounded-full';
    if (photoSrc) {
        return <img src={photoSrc} alt={member.full_name} className={`${dims} ${radius} object-cover border-2 border-white shadow-sm flex-shrink-0`} />;
    }
    return (
        <div className={`${dims} ${radius} bg-[#2F5BEA] flex items-center justify-center text-white font-bold flex-shrink-0`}>
            {member.full_name.charAt(0).toUpperCase()}
        </div>
    );
}

function DiffRow({ label, oldVal, newVal }: { label: string; oldVal: string; newVal: string | null }) {
    if (newVal === null) return null;
    const changed = String(oldVal) !== String(newVal);
    return (
        <div className={`grid grid-cols-[120px_1fr_24px_1fr] gap-2 items-center py-2 px-3 rounded-lg text-sm ${changed ? 'bg-amber-50' : 'bg-gray-50'}`}>
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{label}</span>
            <span className={`truncate ${changed ? 'text-red-500 line-through' : 'text-gray-500'}`}>{oldVal || '-'}</span>
            {changed ? <ArrowRight className="w-4 h-4 text-amber-500 flex-shrink-0" /> : <span />}
            <span className={changed ? 'text-green-700 font-semibold' : 'text-gray-500'}>{newVal || '-'}</span>
        </div>
    );
}

function UpdateRequestCard({ req, onApprove, onReject }: {
    req: MemberUpdateRequest;
    onApprove: (id: string, note?: string) => Promise<void>;
    onReject: (id: string, note?: string) => Promise<void>;
}) {
    const [loading, setLoading] = useState(false);
    const [note, setNote] = useState('');
    const m = req.member;
    const photoSrc = imageUrl(m.photo_url);
    const notifyLabel = (v: boolean) => v ? 'Yes - notify me' : "No - don't notify";
    const handle = async (action: 'approve' | 'reject') => {
        setLoading(true);
        try { if (action === 'approve') await onApprove(req.id, note || undefined); else await onReject(req.id, note || undefined); }
        finally { setLoading(false); }
    };

    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {/* Header */}
            <div className="flex items-center gap-3 px-5 py-4 bg-[#F5F7FA] border-b border-gray-100">
                <MemberAvatar member={m} size="md" />
                <div className="min-w-0">
                    <p className="font-semibold text-[#1F2A44] truncate">{m.full_name}</p>
                    <p className="text-xs text-gray-400">{m.email} · Batch {m.batch}</p>
                </div>
                <span className="ml-auto text-xs text-gray-400 flex-shrink-0">
                    {new Date(req.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
            </div>

            <div className="px-5 py-4 space-y-1.5">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Proposed Changes</p>

                {/* Profile photo - always visible, click to expand */}
                <div className="flex items-center gap-3 py-2 px-3 rounded-lg bg-gray-50">
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider w-[120px] flex-shrink-0">Photo</span>
                    {photoSrc ? (
                        <div className="flex items-center gap-3">
                            <ExpandablePhoto
                                src={photoSrc}
                                alt={m.full_name}
                                className="w-14 h-14 rounded-xl object-cover border-2 border-white shadow ring-1 ring-gray-200"
                            />
                            <span className="text-xs text-gray-400">Click photo to expand</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-3">
                            <div className="w-14 h-14 rounded-xl bg-gray-100 border border-dashed border-gray-300 flex items-center justify-center flex-shrink-0">
                                <Camera className="w-5 h-5 text-gray-300" />
                            </div>
                            <span className="text-xs text-gray-400 italic">No photo uploaded</span>
                        </div>
                    )}
                </div>

                <DiffRow label="Name" oldVal={m.full_name} newVal={req.full_name} />
                <DiffRow label="Batch" oldVal={String(m.batch)} newVal={req.batch !== null ? String(req.batch) : null} />
                <DiffRow label="Phone" oldVal={m.phone_number} newVal={req.phone_number} />
                <DiffRow label="Alt. Phone" oldVal={m.alternative_phone ?? ''} newVal={req.alternative_phone} />
                <DiffRow label="Job Title" oldVal={m.job_title ?? ''} newVal={req.job_title} />
                <DiffRow label="Org" oldVal={m.organisation ?? ''} newVal={req.organisation} />
                <DiffRow label="Address" oldVal={m.organisation_address ?? ''} newVal={req.organisation_address} />
                <DiffRow label="Notify" oldVal={notifyLabel(m.notify_events)} newVal={req.notify_events !== null ? notifyLabel(req.notify_events) : null} />
                <DiffRow label="Blood Group" oldVal={m.blood_group ?? '-'} newVal={req.blood_group} />
            </div>

            <div className="px-5 pb-4">
                <input type="text" value={note} onChange={e => setNote(e.target.value)}
                    placeholder="Admin note (optional)…"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#2F5BEA] focus:border-transparent outline-none" />
            </div>
            <div className="flex gap-2 px-5 pb-5">
                <button onClick={() => handle('approve')} disabled={loading}
                    className="flex items-center gap-1.5 bg-[#2ECC71] hover:bg-[#27AE60] text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50">
                    <CheckCircle className="w-4 h-4" /> Approve & Apply
                </button>
                <button onClick={() => handle('reject')} disabled={loading}
                    className="flex items-center gap-1.5 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50">
                    <X className="w-4 h-4" /> Reject
                </button>
            </div>
        </div>
    );
}


function PhotoUploadRow({ memberId, currentPhotoSrc, onUploaded }: {
    memberId: string;
    currentPhotoSrc: string | null;
    onUploaded: (url: string) => void;
}) {
    const fileRef = useRef<HTMLInputElement>(null);
    const [preview, setPreview] = useState<string | null>(currentPhotoSrc);
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [saved, setSaved] = useState(false);
    const [err, setErr] = useState('');

    const handlePick = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0];
        if (!f) return;
        setFile(f); setSaved(false); setErr('');
        const r = new FileReader();
        r.onload = () => setPreview(r.result as string);
        r.readAsDataURL(f);
    };

    const handleUpload = async () => {
        if (!file) return;
        setUploading(true); setErr('');
        try {
            const res = await adminApi.uploadMemberPhoto(memberId, file);
            setFile(null); setSaved(true);
            onUploaded(res.data.photo_url);
            if (fileRef.current) fileRef.current.value = '';
        } catch (e: unknown) {
            setErr(e instanceof Error ? e.message : 'Upload failed');
        } finally { setUploading(false); }
    };

    return (
        <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-lg bg-[#F5F7FA] flex items-center justify-center flex-shrink-0 text-[#2F5BEA] mt-0.5">
                <Camera className="w-4 h-4" />
            </div>
            <div className="flex-1">
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-2">Profile Photo</p>
                <div className="flex items-center gap-3">
                    {preview
                        ? <img src={preview} alt="photo" className="w-12 h-12 rounded-lg object-cover border border-gray-200 shadow-sm" />
                        : <div className="w-12 h-12 rounded-lg bg-gray-100 border border-dashed border-gray-300 flex items-center justify-center"><Camera className="w-4 h-4 text-gray-300" /></div>
                    }
                    <div className="space-y-1.5">
                        <input ref={fileRef} type="file" accept="image/*" onChange={handlePick} className="hidden" />
                        <button onClick={() => fileRef.current?.click()}
                            className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-medium text-gray-600 hover:border-[#2F5BEA] hover:text-[#2F5BEA] transition-colors bg-white">
                            <Camera className="w-3 h-3" /> {preview ? 'Change' : 'Upload'}
                        </button>
                        {file && !saved && (
                            <button onClick={handleUpload} disabled={uploading}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#2F5BEA] text-white rounded-lg text-xs font-semibold hover:bg-[#1a3fc7] transition-colors disabled:opacity-50">
                                {uploading ? <><span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving…</> : <><Upload className="w-3 h-3" /> Save Photo</>}
                            </button>
                        )}
                        {saved && <p className="text-xs text-green-600 font-medium">✓ Saved</p>}
                        {err && <p className="text-xs text-red-500">{err}</p>}
                    </div>
                </div>
            </div>
        </div>
    );
}

function MemberDetailModal({ member, onClose, onAction }: {
    member: RawMember; onClose: () => void;
    onAction: (id: string, action: 'APPROVED' | 'ARCHIVED' | 'PENDING' | 'DELETE') => Promise<void>;
}) {
    const [loading, setLoading] = useState(false);
    const photoSrc = imageUrl(member.photo_url);
    const handle = async (action: 'APPROVED' | 'ARCHIVED' | 'PENDING' | 'DELETE') => {
        setLoading(true);
        try { await onAction(member.id, action); } finally { setLoading(false); onClose(); }
    };
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backgroundColor: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(2px)' }} onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="bg-gradient-to-r from-[#1F2A44] to-[#2F5BEA] h-16" />
                <div className="px-6 -mt-8 flex justify-between items-end mb-4">
                    {photoSrc
                        ? <ExpandablePhoto src={photoSrc} alt={member.full_name} className="w-16 h-16 rounded-xl object-cover border-4 border-white shadow-md" />
                        : <div className="w-16 h-16 rounded-xl bg-[#2F5BEA] flex items-center justify-center text-white text-2xl font-bold border-4 border-white shadow">
                            {member.full_name.charAt(0).toUpperCase()}
                        </div>
                    }
                    <div className="flex items-center gap-2 pb-1">
                        <StatusBadge status={member.status} />
                        <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center">
                            <X className="w-4 h-4 text-gray-500" />
                        </button>
                    </div>
                </div>
                <div className="px-6 mb-5">
                    <h2 className="text-xl font-bold text-[#1F2A44]">{member.full_name}</h2>
                    <span className="bg-[#1F2A44] text-white text-xs px-2 py-0.5 rounded-full font-medium">Batch {member.batch}</span>
                </div>
                <div className="px-6 pb-4 space-y-3">
                    <DetailRow icon={<Mail className="w-4 h-4" />} label="Email" value={member.email} />
                    <DetailRow icon={<Phone className="w-4 h-4" />} label="Phone" value={member.phone_number} />
                    {member.alternative_phone && <DetailRow icon={<Phone className="w-4 h-4" />} label="Alt. Phone" value={member.alternative_phone} />}
                    {member.blood_group && <DetailRow icon={<span className="text-sm font-bold">🩸</span>} label="Blood Group" value={member.blood_group} />}
                    {member.job_title && <DetailRow icon={<Briefcase className="w-4 h-4" />} label="Job Title" value={member.job_title} />}
                    {member.organisation && <DetailRow icon={<Building2 className="w-4 h-4" />} label="Organisation" value={member.organisation} />}
                    {member.organisation_address && <DetailRow icon={<MapPin className="w-4 h-4" />} label="Address" value={member.organisation_address} />}
                    <DetailRow icon={<Clock className="w-4 h-4" />} label="Registered" value={new Date(member.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} />
                    <PhotoUploadRow memberId={member.id} currentPhotoSrc={photoSrc} onUploaded={(url) => {
                        // update member in parent list
                    }} />
                </div>
                <div className="px-6 pb-6 pt-2 border-t border-gray-100 flex flex-wrap gap-2">
                    {member.status !== 'APPROVED' && <button disabled={loading} onClick={() => handle('APPROVED')} className="flex items-center gap-1.5 bg-[#2ECC71] hover:bg-[#27AE60] text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"><CheckCircle className="w-4 h-4" /> Approve</button>}
                    {member.status !== 'ARCHIVED' && <button disabled={loading} onClick={() => handle('ARCHIVED')} className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"><Archive className="w-4 h-4" /> Archive</button>}
                    {member.status !== 'PENDING' && <button disabled={loading} onClick={() => handle('PENDING')} className="flex items-center gap-1.5 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"><RefreshCw className="w-4 h-4" /> Set Pending</button>}
                    <button disabled={loading} onClick={() => handle('DELETE')} className="flex items-center gap-1.5 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 ml-auto"><Trash2 className="w-4 h-4" /> Delete</button>
                </div>
            </div>
        </div>
    );
}

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
    return (
        <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-lg bg-[#F5F7FA] flex items-center justify-center flex-shrink-0 text-[#2F5BEA] mt-0.5">{icon}</div>
            <div>
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">{label}</p>
                <p className="text-sm text-[#1F2A44] font-medium break-all">{value}</p>
            </div>
        </div>
    );
}

function StatusBadge({ status }: { status: MemberStatus }) {
    const map = { PENDING: 'bg-amber-100 text-amber-700 border-amber-200', APPROVED: 'bg-green-100 text-green-700 border-green-200', ARCHIVED: 'bg-gray-100 text-gray-600 border-gray-200' };
    const labels = { PENDING: 'Pending', APPROVED: 'Approved', ARCHIVED: 'Archived' };
    return <span className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${map[status]}`}>{labels[status]}</span>;
}

export default function ManageMembers() {
    const [members, setMembers] = useState<RawMember[]>([]);
    const [updateRequests, setUpdateRequests] = useState<MemberUpdateRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState<ActiveTab>('PENDING');
    const [search, setSearch] = useState('');
    const [selected, setSelected] = useState<RawMember | null>(null);
    const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
    const [pendingUpdateCount, setPendingUpdateCount] = useState(0);
    const [csvOpen, setCsvOpen] = useState(false);
    const [csvBatch, setCsvBatch] = useState('');
    const [csvNotify, setCsvNotify] = useState('');
    const [csvLoading, setCsvLoading] = useState(false);
    const [availableBatches, setAvailableBatches] = useState<number[]>([]);

    const showToast = (msg: string, ok = true) => {
        setToast({ msg, ok });
        setTimeout(() => setToast(null), 3000);
    };

    const refreshUpdateCount = () => {
        adminApi.getPendingUpdateCount().then(res => setPendingUpdateCount(res.data.count)).catch(() => { });
    };

    useEffect(() => {
        adminApi.getApprovedBatches().then(res => setAvailableBatches(res.data)).catch(() => { });
        refreshUpdateCount();
    }, []);

    const loadMembers = async (status: MemberStatus) => {
        setLoading(true);
        try { const res = await adminApi.getMembersByStatus(status); setMembers(res.data); }
        catch { showToast('Failed to load members', false); }
        finally { setLoading(false); }
    };

    const loadUpdateRequests = async () => {
        setLoading(true);
        try { const res = await adminApi.getMemberUpdateRequests('PENDING'); setUpdateRequests(res.data); }
        catch { showToast('Failed to load update requests', false); }
        finally { setLoading(false); }
    };

    useEffect(() => {
        if (tab === 'UPDATES') loadUpdateRequests();
        else loadMembers(tab as MemberStatus);
    }, [tab]);

    const handleMemberAction = async (id: string, action: 'APPROVED' | 'ARCHIVED' | 'PENDING' | 'DELETE') => {
        try {
            if (action === 'DELETE') { await adminApi.deleteMember(id); showToast('Member deleted'); }
            else { await adminApi.updateMemberStatus(id, action); showToast(`Member ${action.toLowerCase()}`); }
            loadMembers(tab as MemberStatus);
        } catch (err: unknown) { showToast(err instanceof Error ? err.message : 'Action failed', false); }
    };

    const handleApproveUpdate = async (id: string, note?: string) => {
        try { await adminApi.approveMemberUpdate(id, note); showToast('Update approved and applied!'); loadUpdateRequests(); refreshUpdateCount(); }
        catch (err: unknown) { showToast(err instanceof Error ? err.message : 'Approve failed', false); }
    };

    const handleRejectUpdate = async (id: string, note?: string) => {
        try { await adminApi.rejectMemberUpdate(id, note); showToast('Update request rejected'); loadUpdateRequests(); refreshUpdateCount(); }
        catch (err: unknown) { showToast(err instanceof Error ? err.message : 'Reject failed', false); }
    };

    const handleExportCSV = async () => {
        setCsvLoading(true);
        try {
            const filters: { batch?: number | ''; notify_events?: boolean | '' } = {};
            if (csvBatch !== '') filters.batch = parseInt(csvBatch);
            if (csvNotify !== '') filters.notify_events = csvNotify === 'true';
            const res = await adminApi.exportMembersCSV(filters);
            if (!res.ok) { showToast('Export failed', false); return; }
            const blob = await res.blob();
            const disposition = res.headers.get('Content-Disposition') || '';
            const match = disposition.match(/filename="?([^"]+)"?/);
            const filename = match ? match[1] : 'stata_members.csv';
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a'); a.href = url; a.download = filename;
            document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
            showToast(`Downloaded: ${filename}`);
        } catch { showToast('Export failed', false); } finally { setCsvLoading(false); }
    };

    const filtered = members.filter(m =>
        !search || m.full_name.toLowerCase().includes(search.toLowerCase()) || m.email.toLowerCase().includes(search.toLowerCase())
    );

    const tabs: { key: ActiveTab; label: string; color: string; badge?: number }[] = [
        { key: 'PENDING', label: 'Pending', color: 'border-amber-500 text-amber-600' },
        { key: 'APPROVED', label: 'Approved', color: 'border-[#2ECC71] text-[#2ECC71]' },
        { key: 'ARCHIVED', label: 'Archived', color: 'border-gray-400 text-gray-500' },
        { key: 'UPDATES', label: 'Updates', color: 'border-[#2F5BEA] text-[#2F5BEA]', badge: pendingUpdateCount },
    ];

    return (
        <div className="min-h-[calc(100vh-4rem)] bg-[#F5F7FA] py-8 px-4">
            <div className="max-w-6xl mx-auto">
                <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
                    <div>
                        <h1 className="text-3xl font-bold text-[#1F2A44] mb-1">Member Approvals</h1>
                        <p className="text-gray-500 text-sm">Review and manage member registrations</p>
                    </div>
                    <button onClick={() => setCsvOpen(v => !v)}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all border ${csvOpen ? 'bg-[#1F2A44] text-white border-[#1F2A44]' : 'bg-white text-[#1F2A44] border-gray-200 hover:border-[#2F5BEA] hover:text-[#2F5BEA]'} shadow-sm`}>
                        <Download className="w-4 h-4" /> Export CSV <ChevronRight className={`w-4 h-4 transition-transform ${csvOpen ? 'rotate-90' : ''}`} />
                    </button>
                </div>

                {csvOpen && (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
                        <div className="flex items-center gap-2 mb-5">
                            <div className="w-8 h-8 rounded-lg bg-[#2F5BEA]/10 flex items-center justify-center"><Filter className="w-4 h-4 text-[#2F5BEA]" /></div>
                            <div><h3 className="text-sm font-bold text-[#1F2A44]">Export Approved Members</h3><p className="text-xs text-gray-400">Leave filters empty to download all approved members</p></div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Batch</label>
                                <div className="relative">
                                    <select value={csvBatch} onChange={e => setCsvBatch(e.target.value)} className="w-full appearance-none px-3 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-700 focus:ring-2 focus:ring-[#2F5BEA] focus:border-transparent outline-none bg-white pr-8">
                                        <option value="">All Batches</option>
                                        {availableBatches.map(b => <option key={b} value={b}>{b}</option>)}
                                    </select>
                                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Event Notifications</label>
                                <div className="relative">
                                    <select value={csvNotify} onChange={e => setCsvNotify(e.target.value)} className="w-full appearance-none px-3 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-700 focus:ring-2 focus:ring-[#2F5BEA] focus:border-transparent outline-none bg-white pr-8">
                                        <option value="">All Members</option>
                                        <option value="true">Subscribed only</option>
                                        <option value="false">Not subscribed only</option>
                                    </select>
                                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                </div>
                            </div>
                        </div>
                        {(csvBatch !== '' || csvNotify !== '') && (
                            <div className="flex flex-wrap gap-2 mb-4">
                                <span className="text-xs text-gray-400 font-medium self-center">Filtering by:</span>
                                {csvBatch !== '' && <span className="flex items-center gap-1 bg-[#2F5BEA]/10 text-[#2F5BEA] text-xs font-semibold px-2.5 py-1 rounded-full">Batch {csvBatch}<button onClick={() => setCsvBatch('')} className="hover:text-red-500 ml-0.5"><X className="w-3 h-3" /></button></span>}
                                {csvNotify !== '' && <span className="flex items-center gap-1 bg-[#2F5BEA]/10 text-[#2F5BEA] text-xs font-semibold px-2.5 py-1 rounded-full">{csvNotify === 'true' ? 'Subscribed' : 'Not subscribed'}<button onClick={() => setCsvNotify('')} className="hover:text-red-500 ml-0.5"><X className="w-3 h-3" /></button></span>}
                            </div>
                        )}
                        <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                            <button onClick={handleExportCSV} disabled={csvLoading} className="flex items-center gap-2 bg-[#2F5BEA] hover:bg-[#1a3fc7] text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 shadow-sm">
                                {csvLoading ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Preparing…</> : <><Download className="w-4 h-4" /> Download CSV</>}
                            </button>
                            <button onClick={() => { setCsvBatch(''); setCsvNotify(''); }} className="text-sm text-gray-400 hover:text-gray-600 transition-colors">Reset filters</button>
                        </div>
                    </div>
                )}

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6">
                    <div className="flex border-b border-gray-100">
                        {tabs.map(t => (
                            <button key={t.key} onClick={() => { setTab(t.key); setSearch(''); }}
                                className={`flex-1 py-3.5 text-sm font-semibold border-b-2 transition-colors ${tab === t.key ? t.color : 'border-transparent text-gray-400 hover:text-gray-600'}`}>
                                {t.label}
                                {t.badge !== undefined && t.badge > 0 && (
                                    <span className="ml-1.5 inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#2F5BEA] text-white text-[10px] font-bold">{t.badge}</span>
                                )}
                            </button>
                        ))}
                    </div>

                    {tab === 'UPDATES' ? (
                        <div className="p-5">
                            {loading ? (
                                <div className="text-center py-16"><div className="inline-block w-8 h-8 border-4 border-[#2F5BEA] border-t-transparent rounded-full animate-spin" /></div>
                            ) : updateRequests.length === 0 ? (
                                <div className="text-center py-16 text-gray-400">
                                    <AlertCircle className="w-10 h-10 mx-auto mb-3 opacity-40" />
                                    <p className="text-sm font-medium">No pending profile update requests</p>
                                    <p className="text-xs mt-1">When members submit profile changes, they will appear here for review</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <p className="text-sm text-gray-500">{updateRequests.length} pending update{updateRequests.length !== 1 ? 's' : ''} - review proposed changes below. Highlighted rows show what will change.</p>
                                    {updateRequests.map(req => (
                                        <UpdateRequestCard key={req.id} req={req} onApprove={handleApproveUpdate} onReject={handleRejectUpdate} />
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        <>
                            <div className="p-4 border-b border-gray-50">
                                <div className="relative max-w-sm">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input type="text" placeholder="Search by name or email..." value={search} onChange={e => setSearch(e.target.value)}
                                        className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#2F5BEA] focus:border-transparent outline-none" />
                                </div>
                            </div>
                            {loading ? (
                                <div className="text-center py-16"><div className="inline-block w-8 h-8 border-4 border-[#2F5BEA] border-t-transparent rounded-full animate-spin" /></div>
                            ) : filtered.length === 0 ? (
                                <div className="text-center py-16 text-gray-400"><Users className="w-10 h-10 mx-auto mb-3 opacity-40" /><p className="text-sm">No {tab.toLowerCase()} members</p></div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="bg-[#F5F7FA] border-b border-gray-100">
                                                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">#</th>
                                                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                                                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Batch</th>
                                                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Email</th>
                                                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Registered</th>
                                                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {filtered.map((m, idx) => (
                                                <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                                                    <td className="px-5 py-3.5 text-gray-400 text-xs">{idx + 1}</td>
                                                    <td className="px-5 py-3.5">
                                                        <div className="flex items-center gap-2.5">
                                                            <MemberAvatar member={m} size="sm" />
                                                            <span className="font-medium text-[#1F2A44]">{m.full_name}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-5 py-3.5"><span className="bg-[#1F2A44] text-white text-xs px-2 py-0.5 rounded-full font-medium">{m.batch}</span></td>
                                                    <td className="px-5 py-3.5 text-gray-500 hidden md:table-cell">{m.email}</td>
                                                    <td className="px-5 py-3.5 text-gray-400 text-xs hidden lg:table-cell">{new Date(m.created_at).toLocaleDateString()}</td>
                                                    <td className="px-5 py-3.5">
                                                        <div className="flex items-center gap-1.5">
                                                            <button onClick={() => setSelected(m)} className="p-1.5 rounded-lg text-gray-400 hover:text-[#2F5BEA] hover:bg-blue-50 transition-colors" title="View details"><Eye className="w-4 h-4" /></button>
                                                            {m.status !== 'APPROVED' && <button onClick={() => handleMemberAction(m.id, 'APPROVED')} className="p-1.5 rounded-lg text-gray-400 hover:text-green-600 hover:bg-green-50 transition-colors" title="Approve"><CheckCircle className="w-4 h-4" /></button>}
                                                            {m.status !== 'ARCHIVED' && <button onClick={() => handleMemberAction(m.id, 'ARCHIVED')} className="p-1.5 rounded-lg text-gray-400 hover:text-amber-500 hover:bg-amber-50 transition-colors" title="Archive"><Archive className="w-4 h-4" /></button>}
                                                            <button onClick={() => handleMemberAction(m.id, 'DELETE')} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors" title="Delete"><Trash2 className="w-4 h-4" /></button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    <div className="px-5 py-3 bg-[#F5F7FA] border-t border-gray-100 text-xs text-gray-500">{filtered.length} {tab.toLowerCase()} member{filtered.length !== 1 ? 's' : ''}</div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {selected && <MemberDetailModal member={selected} onClose={() => setSelected(null)} onAction={handleMemberAction} />}
            {toast && <div className={`fixed bottom-6 right-6 px-5 py-3 rounded-xl shadow-lg text-white text-sm font-medium z-50 transition-all ${toast.ok ? 'bg-[#2ECC71]' : 'bg-red-500'}`}>{toast.msg}</div>}
        </div>
    );
}
