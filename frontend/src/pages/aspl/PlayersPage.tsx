// src/pages/aspl/PlayersPage.tsx
import { useState, useEffect, useMemo } from 'react';
import { Download, Search, ChevronUp, ChevronDown, SlidersHorizontal, Users, X, User, Hash, Phone, Briefcase, Building2, Mail, ShieldCheck, ShieldOff } from 'lucide-react';
import { asplApi, AsplPlayer, AsplSeason } from '../../lib/api';
import './aspl.css';

function downloadCSV(players: AsplPlayer[], seasonName: string) {
    const headers = ['#', 'Name', 'Batch', 'Position', 'Email', 'Phone'];
    const rows = players.map(p => [
        p.sl, p.name, p.batch, p.playing_position, p.member_email ?? '', p.phone ?? '',
    ]);
    const csv = [headers, ...rows]
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

type SortKey = 'sl' | 'name' | 'batch' | 'playing_position';
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

function SortIcon({ col, sortKey, dir }: { col: SortKey; sortKey: SortKey; dir: SortDir }) {
    if (col !== sortKey) return <ChevronUp className="w-3 h-3 text-gray-300" />;
    return dir === 'asc'
        ? <ChevronUp className="w-3 h-3 text-[#2F5BEA]" />
        : <ChevronDown className="w-3 h-3 text-[#2F5BEA]" />;
}

// ── Player Detail Popup ───────────────────────────────────────────────────────
function PlayerPopup({ player, onClose }: { player: AsplPlayer; onClose: () => void }) {
    const photo = asplApi.imageUrl(player.photo_url);
    const pos = posMeta[player.playing_position?.toUpperCase()] ?? { bg: '#F3F4F6', text: '#374151', border: '#D1D5DB' };

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
                {/* Accent bar using position colour */}
                <div className="h-1" style={{ background: pos.text }} />

                {/* Close */}
                <button
                    onClick={onClose}
                    className="absolute top-3 right-3 w-8 h-8 rounded-xl flex items-center justify-center transition-colors z-10"
                    style={{ background: 'rgba(255,255,255,0.08)' }}
                >
                    <X className="w-4 h-4 text-white/60" />
                </button>

                {/* Photo + name hero */}
                <div className="flex items-center gap-4 px-6 pt-6 pb-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <div className="w-20 h-20 rounded-2xl overflow-hidden flex-shrink-0 flex items-center justify-center"
                        style={{ background: 'rgba(255,255,255,0.06)', border: '2px solid rgba(255,255,255,0.1)' }}>
                        {photo
                            ? <img src={photo} alt={player.name} className="w-full h-full object-cover" />
                            : <User className="w-8 h-8 text-white/20" />}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-lg font-bold text-white truncate" style={{ fontFamily: 'fredoka' }}>
                            {player.name}
                        </p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <PosBadge pos={player.playing_position} />
                            {player.status
                                ? <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 border border-red-500/20">
                                    <ShieldOff className="w-2.5 h-2.5" /> SOLD
                                </span>
                                : <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-500/15 text-green-400 border border-green-500/20">
                                    <ShieldCheck className="w-2.5 h-2.5" /> AVAILABLE
                                </span>
                            }
                        </div>
                    </div>
                </div>

                {/* Details grid */}
                <div className="px-6 py-5 space-y-3">
                    <DetailRow icon={<Hash className="w-3.5 h-3.5" />} label="Player #" value={String(player.sl)} />
                    <DetailRow icon={<Hash className="w-3.5 h-3.5" />} label="Batch" value={player.batch != null ? `Batch ${player.batch}` : '-'} />
                    <DetailRow icon={<Mail className="w-3.5 h-3.5" />} label="Email" value={player.member_email} />
                    {player.phone && (
                        <DetailRow icon={<Phone className="w-3.5 h-3.5" />} label="Phone" value={player.phone} />
                    )}
                    {player.job_title && (
                        <DetailRow icon={<Briefcase className="w-3.5 h-3.5" />} label="Title" value={player.job_title} />
                    )}
                    {player.organisation && (
                        <DetailRow icon={<Building2 className="w-3.5 h-3.5" />} label="Org" value={player.organisation} />
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
    const [season, setSeason] = useState<AsplSeason | null>(null);
    const [players, setPlayers] = useState<AsplPlayer[]>([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState<AsplPlayer | null>(null);

    const [search, setSearch] = useState('');
    const [batchFilter, setBatch] = useState<string>('ALL');
    const [posFilter, setPos] = useState<string>('ALL');
    const [sortKey, setSortKey] = useState<SortKey>('batch');
    const [sortDir, setSortDir] = useState<SortDir>('asc');

    useEffect(() => {
        asplApi.getActiveSeason()
            .catch(() => null)
            .then(s => { setSeason(s); return asplApi.getPlayers(s?.id); })
            .then(ps => setPlayers(ps))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    // Close popup on Escape
    useEffect(() => {
        const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setSelected(null); };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, []);

    const batches = useMemo(() => [...new Set(players.map(p => String(p.batch)))].sort(), [players]);
    const positions = useMemo(() => [...new Set(players.map(p => p.playing_position))].sort(), [players]);

    const filtered = useMemo(() => {
        let list = players.filter(p => {
            const matchSearch = !search ||
                p.name.toLowerCase().includes(search.toLowerCase()) ||
                (p.member_email ?? '').toLowerCase().includes(search.toLowerCase());
            const matchBatch = batchFilter === 'ALL' || String(p.batch) === batchFilter;
            const matchPos = posFilter === 'ALL' || p.playing_position === posFilter;
            return matchSearch && matchBatch && matchPos;
        });
        list = [...list].sort((a, b) => {
            let av: string | number = a[sortKey] ?? '';
            let bv: string | number = b[sortKey] ?? '';
            if (typeof av === 'string') av = av.toLowerCase();
            if (typeof bv === 'string') bv = bv.toLowerCase();
            if (av < bv) return sortDir === 'asc' ? -1 : 1;
            if (av > bv) return sortDir === 'asc' ? 1 : -1;
            return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
        });
        return list;
    }, [players, search, batchFilter, posFilter, sortKey, sortDir]);

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

            {/* Popup */}
            {selected && <PlayerPopup player={selected} onClose={() => setSelected(null)} />}

            {/* Header */}
            <div className="bg-[#1F2A44] text-white">
                <div className="max-w-7xl mx-auto px-4 py-10">
                    <div className="flex items-end justify-between gap-4 flex-wrap">
                        <div>
                            <span className="text-xs font-bold tracking-widest uppercase text-[#7BA3F5] block mb-1">
                                {season?.name ?? 'ASPL'} · Registered Players
                            </span>
                            <h1 className="text-3xl font-extrabold text-white">Player Registry</h1>
                            <p className="text-gray-400 mt-1 text-sm">All approved players for the active season</p>
                        </div>
                        <button
                            onClick={() => downloadCSV(filtered, season?.name ?? 'ASPL')}
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
                            placeholder="Search name or email…"
                            className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-[#2F5BEA] bg-[#F5F7FA]" />
                    </div>
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
                    {(search || batchFilter !== 'ALL' || posFilter !== 'ALL') && (
                        <button onClick={() => { setSearch(''); setBatch('ALL'); setPos('ALL'); }}
                            className="text-xs text-gray-400 hover:text-red-500 transition-colors font-semibold">
                            Clear filters
                        </button>
                    )}
                    <span className="ml-auto text-xs text-gray-400 font-medium">
                        {filtered.length} of {players.length} players
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
                                {players.length === 0 ? 'No players registered yet' : 'No players match filters'}
                            </p>
                        </div>
                    ) : (
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-100">
                                <tr>
                                    {th('sl', '#')}
                                    {th('name', 'Name')}
                                    {th('batch', 'Batch')}
                                    {th('playing_position', 'Position')}
                                    <th className="text-left py-3 px-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filtered.map(p => (
                                    <tr
                                        key={p.sl}
                                        className="hover:bg-[#F5F7FA] transition-colors cursor-pointer group"
                                        onClick={() => setSelected(p)}
                                    >
                                        <td className="py-3 px-4 text-sm text-gray-400 font-mono w-12">{p.sl}</td>
                                        <td className="py-3 px-4">
                                            <div className="flex items-center gap-2.5">
                                                {/* Mini avatar */}
                                                <div className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center bg-gray-100">
                                                    {asplApi.imageUrl(p.photo_url)
                                                        ? <img src={asplApi.imageUrl(p.photo_url)!} alt={p.name} className="w-full h-full object-cover" />
                                                        : <span className="text-[10px] font-bold text-gray-400">{p.name.charAt(0)}</span>}
                                                </div>
                                                <span className="text-sm font-semibold text-[#1F2A44] group-hover:text-[#2F5BEA] transition-colors">
                                                    {p.name}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="py-3 px-4">
                                            <span className="text-sm font-bold text-[#2F5BEA]">{p.batch}</span>
                                        </td>
                                        <td className="py-3 px-4">
                                            <PosBadge pos={p.playing_position} />
                                        </td>
                                        <td className="py-3 px-4">
                                            {p.status
                                                ? <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-500 border border-red-100">SOLD</span>
                                                : <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-50 text-green-600 border border-green-100">AVAILABLE</span>
                                            }
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}