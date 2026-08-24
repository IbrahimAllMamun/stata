// src/pages/aspl/PlayersPage.tsx
import { useState, useEffect, useMemo } from 'react';
import { Download, Search, ChevronUp, ChevronDown, SlidersHorizontal, Users, X, User, Hash, Phone, Briefcase, Building2, Mail, ShieldCheck, ShieldOff, Clock } from 'lucide-react';
import { asplApi, AsplPlayer, AsplRosterEntry, AsplSeason } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import './aspl.css';

// One row of the registry: every registrant, whether or not they've been approved.
type Row = {
    key: string;
    sl: number | null;
    name: string;
    batch: number | null;
    playing_position: string;
    registration_status: 'PENDING' | 'APPROVED';
    sold: boolean;
    photo_url?: string | null;
    member_email?: string;
    phone?: string | null;
    job_title?: string | null;
    organisation?: string | null;
};

function downloadCSV(rows: Row[], seasonName: string, includeContact: boolean) {
    const headers = includeContact
        ? ['#', 'Name', 'Batch', 'Position', 'Registration', 'Auction', 'Email', 'Phone']
        : ['#', 'Name', 'Batch', 'Position', 'Registration', 'Auction'];
    const body = rows.map(r => {
        const base = [
            r.sl ?? '',
            r.name,
            r.batch ?? '',
            r.playing_position,
            r.registration_status,
            r.registration_status === 'PENDING' ? '-' : r.sold ? 'SOLD' : 'AVAILABLE',
        ];
        return includeContact ? [...base, r.member_email ?? '', r.phone ?? ''] : base;
    });
    const csv = [headers, ...body]
        .map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
        .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${seasonName.replace(/\s+/g, '_')}_players.csv`;
    a.click();
    URL.revokeObjectURL(url);
}

type SortKey = 'sl' | 'name' | 'batch' | 'playing_position' | 'registration_status';
type SortDir = 'asc' | 'desc';

const posMeta: Record<string, { bg: string; text: string; border: string }> = {
    GK: { bg: '#EDE9FE', text: '#7C3AED', border: '#C4B5FD' },
    DEF: { bg: '#DBEAFE', text: '#1D4ED8', border: '#93C5FD' },
    LB: { bg: '#DBEAFE', text: '#1D4ED8', border: '#93C5FD' },
    RB: { bg: '#DBEAFE', text: '#1D4ED8', border: '#93C5FD' },
    CDM: { bg: '#D1FAE5', text: '#065F46', border: '#6EE7B7' },
    CM: { bg: '#D1FAE5', text: '#065F46', border: '#6EE7B7' },
    MID: { bg: '#D1FAE5', text: '#065F46', border: '#6EE7B7' },
    LW: { bg: '#FEF3C7', text: '#92400E', border: '#FCD34D' },
    RW: { bg: '#FEF3C7', text: '#92400E', border: '#FCD34D' },
    CF: { bg: '#FEE2E2', text: '#991B1B', border: '#FCA5A5' },
    FWD: { bg: '#FEE2E2', text: '#991B1B', border: '#FCA5A5' },
    BAT: { bg: '#DBEAFE', text: '#1D4ED8', border: '#93C5FD' },
    BOWL: { bg: '#FEE2E2', text: '#991B1B', border: '#FCA5A5' },
    AR: { bg: '#D1FAE5', text: '#065F46', border: '#6EE7B7' },
    WK: { bg: '#EDE9FE', text: '#7C3AED', border: '#C4B5FD' },
};

function PosBadge({ pos }: { pos: string }) {
    const m = posMeta[pos?.toUpperCase()] ?? { bg: '#F3F4F6', text: '#374151', border: '#D1D5DB' };
    return (
        <span className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full"
            style={{ background: m.bg, color: m.text, border: `1px solid ${m.border}` }}>
            {pos}
        </span>
    );
}

// Pending registrations have no auction state yet, so they get their own badge.
function StatusBadge({ row, dark = false }: { row: Row; dark?: boolean }) {
    if (row.registration_status === 'PENDING') {
        return (
            <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${dark
                ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20'
                : 'bg-amber-50 text-amber-600 border border-amber-100'}`}>
                <Clock className="w-2.5 h-2.5" /> PENDING
            </span>
        );
    }
    if (row.sold) {
        return (
            <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${dark
                ? 'bg-red-500/15 text-red-400 border border-red-500/20'
                : 'bg-red-50 text-red-500 border border-red-100'}`}>
                <ShieldOff className="w-2.5 h-2.5" /> SOLD
            </span>
        );
    }
    return (
        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${dark
            ? 'bg-green-500/15 text-green-400 border border-green-500/20'
            : 'bg-green-50 text-green-600 border border-green-100'}`}>
            <ShieldCheck className="w-2.5 h-2.5" /> AVAILABLE
        </span>
    );
}

function SortIcon({ col, sortKey, dir }: { col: SortKey; sortKey: SortKey; dir: SortDir }) {
    if (col !== sortKey) return <ChevronUp className="w-3 h-3 text-gray-300" />;
    return dir === 'asc'
        ? <ChevronUp className="w-3 h-3 text-[#2F5BEA]" />
        : <ChevronDown className="w-3 h-3 text-[#2F5BEA]" />;
}

// ── Player Detail Popup ───────────────────────────────────────────────────────
function PlayerPopup({ row, onClose }: { row: Row; onClose: () => void }) {
    const photo = asplApi.imageUrl(row.photo_url);
    const pos = posMeta[row.playing_position?.toUpperCase()] ?? { bg: '#F3F4F6', text: '#374151', border: '#D1D5DB' };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(15,23,42,0.7)', backdropFilter: 'blur(6px)' }}
            onClick={onClose}
        >
            <div
                className="relative w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl"
                style={{ background: '#1F2A44', border: '1px solid rgba(255,255,255,0.08)' }}
                onClick={e => e.stopPropagation()}
            >
                <div className="h-1" style={{ background: pos.text }} />

                <button
                    onClick={onClose}
                    className="absolute top-3 right-3 w-8 h-8 rounded-xl flex items-center justify-center transition-colors z-10"
                    style={{ background: 'rgba(255,255,255,0.08)' }}
                >
                    <X className="w-4 h-4 text-white/60" />
                </button>

                <div className="flex items-center gap-4 px-6 pt-6 pb-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <div className="w-20 h-20 rounded-2xl overflow-hidden flex-shrink-0 flex items-center justify-center"
                        style={{ background: 'rgba(255,255,255,0.06)', border: '2px solid rgba(255,255,255,0.1)' }}>
                        {photo
                            ? <img src={photo} alt={row.name} className="w-full h-full object-cover" />
                            : <User className="w-8 h-8 text-white/20" />}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-lg font-bold text-white truncate" style={{ fontFamily: 'fredoka' }}>
                            {row.name}
                        </p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <PosBadge pos={row.playing_position} />
                            <StatusBadge row={row} dark />
                        </div>
                    </div>
                </div>

                <div className="px-6 py-5 space-y-3">
                    <DetailRow icon={<Hash className="w-3.5 h-3.5" />} label="Player #" value={row.sl != null ? String(row.sl) : 'Not yet assigned'} />
                    <DetailRow icon={<Hash className="w-3.5 h-3.5" />} label="Batch" value={row.batch != null ? `Batch ${row.batch}` : '-'} />
                    {row.member_email && (
                        <DetailRow icon={<Mail className="w-3.5 h-3.5" />} label="Email" value={row.member_email} />
                    )}
                    {row.phone && (
                        <DetailRow icon={<Phone className="w-3.5 h-3.5" />} label="Phone" value={row.phone} />
                    )}
                    {row.job_title && (
                        <DetailRow icon={<Briefcase className="w-3.5 h-3.5" />} label="Title" value={row.job_title} />
                    )}
                    {row.organisation && (
                        <DetailRow icon={<Building2 className="w-3.5 h-3.5" />} label="Org" value={row.organisation} />
                    )}
                    {row.registration_status === 'PENDING' && (
                        <p className="text-xs text-amber-400/70 pt-1 leading-relaxed">
                            This registration is awaiting admin approval. A player number is assigned once approved.
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
    return (
        <div className="flex items-center gap-3">
            <span className="text-white/30 flex-shrink-0">{icon}</span>
            <span className="text-[10px] text-white/30 uppercase tracking-widest w-14 flex-shrink-0"
                style={{ fontFamily: 'kanit' }}>{label}</span>
            <span className="text-sm text-white/75 font-medium truncate" style={{ fontFamily: 'fredoka' }}>{value}</span>
        </div>
    );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function PlayersPage() {
    const { isMember } = useAuth();
    const [season, setSeason] = useState<AsplSeason | null>(null);
    const [rows, setRows] = useState<Row[]>([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState<Row | null>(null);

    const [search, setSearch] = useState('');
    const [batchFilter, setBatch] = useState<string>('ALL');
    const [posFilter, setPos] = useState<string>('ALL');
    const [statusFilter, setStatus] = useState<'ALL' | 'APPROVED' | 'PENDING'>('ALL');
    const [sortKey, setSortKey] = useState<SortKey>('registration_status');
    const [sortDir, setSortDir] = useState<SortDir>('asc');

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const s = await asplApi.getActiveSeason().catch(() => null);
                if (cancelled) return;
                setSeason(s);
                if (!s) { setRows([]); return; }

                // The roster carries everyone (pending included) but no contact details;
                // the players endpoint fills those in for logged-in members.
                const [roster, players] = await Promise.all([
                    asplApi.getRoster(s.id),
                    asplApi.getPlayers(s.id).catch(() => [] as AsplPlayer[]),
                ]);
                if (cancelled) return;

                const bySL = new Map(players.map(p => [p.sl, p]));
                setRows(roster.map((r: AsplRosterEntry) => {
                    const p = r.player_sl != null ? bySL.get(r.player_sl) : undefined;
                    return {
                        key: `reg-${r.id}`,
                        sl: r.player_sl,
                        name: r.name,
                        batch: r.batch,
                        playing_position: r.playing_position,
                        registration_status: r.registration_status,
                        sold: r.sold,
                        photo_url: r.photo_url ?? p?.photo_url ?? null,
                        member_email: p?.member_email,
                        phone: p?.phone ?? null,
                        job_title: p?.job_title ?? null,
                        organisation: p?.organisation ?? null,
                    };
                }));
            } catch (err) {
                console.error(err);
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, []);

    useEffect(() => {
        const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setSelected(null); };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, []);

    const batches = useMemo(
        () => [...new Set(rows.map(r => String(r.batch)).filter(b => b !== 'null'))].sort(),
        [rows]
    );
    const positions = useMemo(() => [...new Set(rows.map(r => r.playing_position))].sort(), [rows]);
    const approvedCount = rows.filter(r => r.registration_status === 'APPROVED').length;
    const pendingCount = rows.length - approvedCount;

    const filtered = useMemo(() => {
        const list = rows.filter(r => {
            const matchSearch = !search ||
                r.name.toLowerCase().includes(search.toLowerCase()) ||
                (r.member_email ?? '').toLowerCase().includes(search.toLowerCase());
            const matchBatch = batchFilter === 'ALL' || String(r.batch) === batchFilter;
            const matchPos = posFilter === 'ALL' || r.playing_position === posFilter;
            const matchStatus = statusFilter === 'ALL' || r.registration_status === statusFilter;
            return matchSearch && matchBatch && matchPos && matchStatus;
        });
        return [...list].sort((a, b) => {
            let av: string | number = a[sortKey] ?? '';
            let bv: string | number = b[sortKey] ?? '';
            // Pending rows have no player number yet — keep them at the end.
            if (sortKey === 'sl') {
                av = a.sl ?? Number.MAX_SAFE_INTEGER;
                bv = b.sl ?? Number.MAX_SAFE_INTEGER;
            }
            if (typeof av === 'string') av = av.toLowerCase();
            if (typeof bv === 'string') bv = bv.toLowerCase();
            if (av < bv) return sortDir === 'asc' ? -1 : 1;
            if (av > bv) return sortDir === 'asc' ? 1 : -1;
            return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
        });
    }, [rows, search, batchFilter, posFilter, statusFilter, sortKey, sortDir]);

    const toggleSort = (key: SortKey) => {
        if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        else { setSortKey(key); setSortDir('asc'); }
    };

    const th = (key: SortKey, label: string) => (
        <th className="text-left py-3 px-4 cursor-pointer select-none group" onClick={() => toggleSort(key)}>
            <div className="flex items-center gap-1 text-xs font-bold text-gray-500 uppercase tracking-widest group-hover:text-[#2F5BEA] transition-colors">
                {label}
                <SortIcon col={key} sortKey={sortKey} dir={sortDir} />
            </div>
        </th>
    );

    return (
        <div className="bg-[#F5F7FA] min-h-screen aspl-root">

            {selected && <PlayerPopup row={selected} onClose={() => setSelected(null)} />}

            {/* Header */}
            <div className="bg-[#1F2A44] text-white">
                <div className="max-w-7xl mx-auto px-4 py-10">
                    <div className="flex items-end justify-between gap-4 flex-wrap">
                        <div>
                            <span className="text-xs font-bold tracking-widest uppercase text-[#7BA3F5] block mb-1">
                                {season?.name ?? 'ASPL'} · Registered Players
                            </span>
                            <h1 className="text-3xl font-extrabold text-white">Player Registry</h1>
                            <p className="text-gray-400 mt-1 text-sm">
                                Everyone registered for the active season — approved and pending
                            </p>
                            {!loading && rows.length > 0 && (
                                <div className="flex items-center gap-4 mt-3">
                                    <span className="inline-flex items-center gap-1.5 text-xs text-green-400">
                                        <ShieldCheck className="w-3.5 h-3.5" /> {approvedCount} approved
                                    </span>
                                    <span className="inline-flex items-center gap-1.5 text-xs text-amber-400">
                                        <Clock className="w-3.5 h-3.5" /> {pendingCount} pending
                                    </span>
                                </div>
                            )}
                        </div>
                        <button
                            onClick={() => downloadCSV(filtered, season?.name ?? 'ASPL', isMember)}
                            disabled={filtered.length === 0}
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all hover:scale-105 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                            style={{ background: '#F39C12', color: '#1F2A44' }}>
                            <Download className="w-4 h-4" />
                            Export CSV ({filtered.length})
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-8">

                {/* Filters bar */}
                <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-5 flex flex-wrap items-center gap-3">
                    <SlidersHorizontal className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <div className="relative flex-1 min-w-[180px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300" />
                        <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                            placeholder={isMember ? 'Search name or email…' : 'Search name…'}
                            className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-[#2F5BEA] bg-[#F5F7FA]" />
                    </div>
                    <select value={statusFilter} onChange={e => setStatus(e.target.value as 'ALL' | 'APPROVED' | 'PENDING')}
                        className="text-sm border border-gray-200 rounded-xl px-3 py-2 bg-[#F5F7FA] text-[#1F2A44] focus:outline-none focus:border-[#2F5BEA]">
                        <option value="ALL">All Registrations</option>
                        <option value="APPROVED">Approved only</option>
                        <option value="PENDING">Pending only</option>
                    </select>
                    <select value={batchFilter} onChange={e => setBatch(e.target.value)}
                        className="text-sm border border-gray-200 rounded-xl px-3 py-2 bg-[#F5F7FA] text-[#1F2A44] focus:outline-none focus:border-[#2F5BEA]">
                        <option value="ALL">All Batches</option>
                        {batches.map(b => <option key={b} value={b}>Batch {b}</option>)}
                    </select>
                    <select value={posFilter} onChange={e => setPos(e.target.value)}
                        className="text-sm border border-gray-200 rounded-xl px-3 py-2 bg-[#F5F7FA] text-[#1F2A44] focus:outline-none focus:border-[#2F5BEA]">
                        <option value="ALL">All Positions</option>
                        {positions.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                    {(search || batchFilter !== 'ALL' || posFilter !== 'ALL' || statusFilter !== 'ALL') && (
                        <button onClick={() => { setSearch(''); setBatch('ALL'); setPos('ALL'); setStatus('ALL'); }}
                            className="text-xs text-gray-400 hover:text-red-500 transition-colors font-semibold">
                            Clear filters
                        </button>
                    )}
                    <span className="ml-auto text-xs text-gray-400 font-medium">
                        {filtered.length} of {rows.length} players
                    </span>
                </div>

                {/* Table */}
                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                    {loading ? (
                        <div className="p-8 space-y-3">
                            {[1, 2, 3, 4, 5].map(i => (
                                <div key={i} className="flex gap-4 animate-pulse">
                                    <div className="h-4 bg-gray-100 rounded w-8" />
                                    <div className="h-4 bg-gray-100 rounded flex-1" />
                                    <div className="h-4 bg-gray-100 rounded w-16" />
                                    <div className="h-4 bg-gray-100 rounded w-16" />
                                </div>
                            ))}
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="py-20 text-center">
                            <Users className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                            <p className="text-gray-400 text-sm">
                                {rows.length === 0 ? 'No players registered yet' : 'No players match filters'}
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-100">
                                    <tr>
                                        {th('sl', '#')}
                                        {th('name', 'Name')}
                                        {th('batch', 'Batch')}
                                        {th('playing_position', 'Position')}
                                        {th('registration_status', 'Status')}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {filtered.map(r => (
                                        <tr
                                            key={r.key}
                                            className="hover:bg-[#F5F7FA] transition-colors cursor-pointer group"
                                            onClick={() => setSelected(r)}
                                        >
                                            <td className="py-3 px-4 text-sm text-gray-400 font-mono w-12">
                                                {r.sl ?? <span className="text-gray-300">—</span>}
                                            </td>
                                            <td className="py-3 px-4">
                                                <div className="flex items-center gap-2.5">
                                                    <div className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center bg-gray-100">
                                                        {asplApi.imageUrl(r.photo_url)
                                                            ? <img src={asplApi.imageUrl(r.photo_url)!} alt={r.name} className="w-full h-full object-cover" />
                                                            : <span className="text-[10px] font-bold text-gray-400">{r.name.charAt(0)}</span>}
                                                    </div>
                                                    <span className="text-sm font-semibold text-[#1F2A44] group-hover:text-[#2F5BEA] transition-colors">
                                                        {r.name}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4">
                                                <span className="text-sm font-bold text-[#2F5BEA]">{r.batch ?? '—'}</span>
                                            </td>
                                            <td className="py-3 px-4">
                                                <PosBadge pos={r.playing_position} />
                                            </td>
                                            <td className="py-3 px-4">
                                                <StatusBadge row={r} />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
