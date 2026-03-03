// src/pages/admin/ManageMembers.tsx
import { useEffect, useState } from 'react';
import {
    Users, CheckCircle, Archive, Trash2, Clock,
    Search, ChevronDown, Eye, X, Mail, Phone,
    Building2, MapPin, Briefcase, RefreshCw,
} from 'lucide-react';
import { adminApi } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';

type MemberStatus = 'PENDING' | 'APPROVED' | 'ARCHIVED';

interface RawMember {
    id: string;
    full_name: string;
    email: string;
    batch: number;
    phone_number: string;
    alternative_phone?: string;
    job_title?: string;
    organisation?: string;
    organisation_address?: string;
    notify_events: boolean;
    status: MemberStatus;
    created_at: string;
}

// ─── Detail Modal ─────────────────────────────────────────────────────────────
function MemberDetailModal({ member, onClose, onAction }: {
    member: RawMember;
    onClose: () => void;
    onAction: (id: string, action: 'APPROVED' | 'ARCHIVED' | 'PENDING' | 'DELETE') => Promise<void>;
}) {
    const [loading, setLoading] = useState(false);

    const handle = async (action: 'APPROVED' | 'ARCHIVED' | 'PENDING' | 'DELETE') => {
        setLoading(true);
        try {
            await onAction(member.id, action);
        } finally {
            setLoading(false);
            onClose();
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backgroundColor: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(2px)' }}
            onClick={onClose}
        >
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="bg-gradient-to-r from-[#1F2A44] to-[#2F5BEA] h-16" />
                <div className="px-6 -mt-8 flex justify-between items-end mb-4">
                    <div className="w-16 h-16 rounded-xl bg-[#2F5BEA] flex items-center justify-center text-white text-2xl font-bold border-4 border-white shadow">
                        {member.full_name.charAt(0).toUpperCase()}
                    </div>
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
                    {member.job_title && <DetailRow icon={<Briefcase className="w-4 h-4" />} label="Job Title" value={member.job_title} />}
                    {member.organisation && <DetailRow icon={<Building2 className="w-4 h-4" />} label="Organisation" value={member.organisation} />}
                    {member.organisation_address && <DetailRow icon={<MapPin className="w-4 h-4" />} label="Address" value={member.organisation_address} />}
                    <DetailRow icon={<Clock className="w-4 h-4" />} label="Registered" value={new Date(member.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} />
                </div>

                {/* Action buttons */}
                <div className="px-6 pb-6 pt-2 border-t border-gray-100 flex flex-wrap gap-2">
                    {member.status !== 'APPROVED' && (
                        <button disabled={loading} onClick={() => handle('APPROVED')}
                            className="flex items-center gap-1.5 bg-[#2ECC71] hover:bg-[#27AE60] text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50">
                            <CheckCircle className="w-4 h-4" /> Approve
                        </button>
                    )}
                    {member.status !== 'ARCHIVED' && (
                        <button disabled={loading} onClick={() => handle('ARCHIVED')}
                            className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50">
                            <Archive className="w-4 h-4" /> Archive
                        </button>
                    )}
                    {member.status !== 'PENDING' && (
                        <button disabled={loading} onClick={() => handle('PENDING')}
                            className="flex items-center gap-1.5 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50">
                            <RefreshCw className="w-4 h-4" /> Set Pending
                        </button>
                    )}
                    <button disabled={loading} onClick={() => handle('DELETE')}
                        className="flex items-center gap-1.5 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 ml-auto">
                        <Trash2 className="w-4 h-4" /> Delete
                    </button>
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
    const map = {
        PENDING: 'bg-amber-100 text-amber-700 border-amber-200',
        APPROVED: 'bg-green-100 text-green-700 border-green-200',
        ARCHIVED: 'bg-gray-100 text-gray-600 border-gray-200',
    };
    const labels = { PENDING: 'Pending', APPROVED: 'Approved', ARCHIVED: 'Archived' };
    return (
        <span className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${map[status]}`}>
            {labels[status]}
        </span>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ManageMembers() {
    const { isAdmin } = useAuth();
    const [members, setMembers] = useState<RawMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState<MemberStatus>('PENDING');
    const [search, setSearch] = useState('');
    const [selected, setSelected] = useState<RawMember | null>(null);
    const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

    const showToast = (msg: string, ok = true) => {
        setToast({ msg, ok });
        setTimeout(() => setToast(null), 3000);
    };

    const load = async (status: MemberStatus) => {
        setLoading(true);
        try {
            const res = await adminApi.getMembersByStatus(status);
            setMembers(res.data);
        } catch (_err) {
            showToast('Failed to load members', false);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(tab); }, [tab]);

    const handleAction = async (id: string, action: 'APPROVED' | 'ARCHIVED' | 'PENDING' | 'DELETE') => {
        try {
            if (action === 'DELETE') {
                await adminApi.deleteMember(id);
                showToast('Member deleted');
            } else {
                const status: string = action;
                await adminApi.updateMemberStatus(id, status);
                showToast(`Member ${action.toLowerCase()}`);
            }
            load(tab);
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Action failed';
            showToast(msg, false);
        }
    };

    const filtered = members.filter(m =>
        !search ||
        m.full_name.toLowerCase().includes(search.toLowerCase()) ||
        m.email.toLowerCase().includes(search.toLowerCase())
    );

    const tabs: { key: MemberStatus; label: string; color: string }[] = [
        { key: 'PENDING', label: 'Pending', color: 'border-amber-500 text-amber-600' },
        { key: 'APPROVED', label: 'Approved', color: 'border-[#2ECC71] text-[#2ECC71]' },
        { key: 'ARCHIVED', label: 'Archived', color: 'border-gray-400 text-gray-500' },
    ];

    return (
        <div className="min-h-[calc(100vh-4rem)] bg-[#F5F7FA] py-8 px-4">
            <div className="max-w-6xl mx-auto">

                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-[#1F2A44] mb-1">Member Approvals</h1>
                    <p className="text-gray-500 text-sm">Review and manage member registrations</p>
                </div>

                {/* Tabs */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6">
                    <div className="flex border-b border-gray-100">
                        {tabs.map(t => (
                            <button
                                key={t.key}
                                onClick={() => { setTab(t.key); setSearch(''); }}
                                className={`flex-1 py-3.5 text-sm font-semibold border-b-2 transition-colors ${tab === t.key ? t.color : 'border-transparent text-gray-400 hover:text-gray-600'
                                    }`}
                            >
                                {t.label}
                            </button>
                        ))}
                    </div>

                    {/* Search */}
                    <div className="p-4 border-b border-gray-50">
                        <div className="relative max-w-sm">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search by name or email..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#2F5BEA] focus:border-transparent outline-none"
                            />
                        </div>
                    </div>

                    {/* Table */}
                    {loading ? (
                        <div className="text-center py-16">
                            <div className="inline-block w-8 h-8 border-4 border-[#2F5BEA] border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="text-center py-16 text-gray-400">
                            <Users className="w-10 h-10 mx-auto mb-3 opacity-40" />
                            <p className="text-sm">No {tab.toLowerCase()} members</p>
                        </div>
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
                                                    <div className="w-8 h-8 rounded-full bg-[#2F5BEA] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                                        {m.full_name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <span className="font-medium text-[#1F2A44]">{m.full_name}</span>
                                                </div>
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <span className="bg-[#1F2A44] text-white text-xs px-2 py-0.5 rounded-full font-medium">{m.batch}</span>
                                            </td>
                                            <td className="px-5 py-3.5 text-gray-500 hidden md:table-cell">{m.email}</td>
                                            <td className="px-5 py-3.5 text-gray-400 text-xs hidden lg:table-cell">
                                                {new Date(m.created_at).toLocaleDateString()}
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <div className="flex items-center gap-1.5">
                                                    {/* View details */}
                                                    <button onClick={() => setSelected(m)}
                                                        className="p-1.5 rounded-lg text-gray-400 hover:text-[#2F5BEA] hover:bg-blue-50 transition-colors" title="View details">
                                                        <Eye className="w-4 h-4" />
                                                    </button>
                                                    {/* Quick approve */}
                                                    {m.status !== 'APPROVED' && (
                                                        <button onClick={() => handleAction(m.id, 'APPROVED')}
                                                            className="p-1.5 rounded-lg text-gray-400 hover:text-green-600 hover:bg-green-50 transition-colors" title="Approve">
                                                            <CheckCircle className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                    {/* Quick archive */}
                                                    {m.status !== 'ARCHIVED' && (
                                                        <button onClick={() => handleAction(m.id, 'ARCHIVED')}
                                                            className="p-1.5 rounded-lg text-gray-400 hover:text-amber-500 hover:bg-amber-50 transition-colors" title="Archive">
                                                            <Archive className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                    {/* Delete */}
                                                    <button onClick={() => handleAction(m.id, 'DELETE')}
                                                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors" title="Delete">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <div className="px-5 py-3 bg-[#F5F7FA] border-t border-gray-100 text-xs text-gray-500">
                                {filtered.length} {tab.toLowerCase()} member{filtered.length !== 1 ? 's' : ''}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Detail modal */}
            {selected && (
                <MemberDetailModal
                    member={selected}
                    onClose={() => setSelected(null)}
                    onAction={handleAction}
                />
            )}

            {/* Toast */}
            {toast && (
                <div className={`fixed bottom-6 right-6 px-5 py-3 rounded-xl shadow-lg text-white text-sm font-medium z-50 transition-all ${toast.ok ? 'bg-[#2ECC71]' : 'bg-red-500'
                    }`}>
                    {toast.msg}
                </div>
            )}
        </div>
    );
}