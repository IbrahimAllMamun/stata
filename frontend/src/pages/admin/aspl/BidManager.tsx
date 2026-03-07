// src/pages/admin/aspl/BidManager.tsx
import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft, RefreshCw, Trash2, Check, X, ChevronDown,
  DollarSign, Users, AlertCircle, Search, Trophy
} from 'lucide-react';
import { asplApi, AsplTeamPlayer, AsplTeam, AsplSeason } from '../../../lib/api';

// ── Row component ─────────────────────────────────────────────────────────────
function BidRow({
  record, teams, onSaved, onDelete,
}: {
  record: AsplTeamPlayer;
  teams: AsplTeam[];
  onSaved: (updated: AsplTeamPlayer) => void;
  onDelete: (id: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [teamId, setTeamId]   = useState(record.team_id);
  const [price, setPrice]     = useState(String(record.price));
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState('');
  const priceRef = useRef<HTMLInputElement>(null);

  const handleSave = async () => {
    const p = parseInt(price);
    if (isNaN(p) || p < 0) { setError('Invalid price.'); return; }
    setSaving(true); setError('');
    try {
      const updated = await asplApi.updateTeamPlayer(record.id, {
        team_id: teamId !== record.team_id ? teamId : undefined,
        price:   p      !== record.price   ? p      : undefined,
      });
      onSaved(updated);
      setEditing(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save.');
    } finally { setSaving(false); }
  };

  const handleCancel = () => {
    setTeamId(record.team_id);
    setPrice(String(record.price));
    setError('');
    setEditing(false);
  };

  const photoUrl = asplApi.imageUrl(record.player?.photo_url);

  return (
    <tr className={`border-b border-gray-100 transition-colors ${editing ? 'bg-blue-50/50' : 'hover:bg-gray-50/60'}`}>
      {/* Player */}
      <td className="py-3 pl-4 pr-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100 flex items-center justify-center">
            {photoUrl
              ? <img src={photoUrl} alt={record.player?.name} className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              : <span className="text-xs font-bold text-gray-400">#{record.player_sl}</span>}
          </div>
          <div>
            <p className="text-sm font-semibold text-[#1F2A44] leading-tight">{record.player?.name ?? `#${record.player_sl}`}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[10px] font-mono bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">{record.player?.playing_position}</span>
              <span className="text-[10px] text-gray-400">Batch {record.player?.batch}</span>
            </div>
          </div>
        </div>
      </td>

      {/* Team (editable) */}
      <td className="py-3 px-2">
        {editing ? (
          <div className="relative">
            <select value={teamId} onChange={e => setTeamId(parseInt(e.target.value))}
              className="w-full border border-[#2F5BEA]/40 rounded-lg px-2 py-1.5 text-xs text-[#1F2A44] focus:outline-none focus:border-[#2F5BEA] bg-white appearance-none pr-6">
              {teams.map(t => <option key={t.id} value={t.id}>{t.team_name}</option>)}
            </select>
            <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
          </div>
        ) : (
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: record.team?.color ?? '#888' }} />
            <span className="text-sm text-[#1F2A44]">{record.team?.team_name ?? '—'}</span>
          </div>
        )}
      </td>

      {/* Price (editable) */}
      <td className="py-3 px-2">
        {editing ? (
          <div className="flex items-center gap-1">
            <span className="text-xs text-gray-400">$</span>
            <input ref={priceRef} type="number" value={price} min={0}
              onChange={e => setPrice(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') handleCancel(); }}
              className="w-20 border border-[#2F5BEA]/40 rounded-lg px-2 py-1.5 text-xs text-[#1F2A44] focus:outline-none focus:border-[#2F5BEA]" />
          </div>
        ) : (
          <span className="text-sm font-semibold text-[#2F5BEA]">${record.price}</span>
        )}
      </td>

      {/* Error */}
      <td className="py-3 px-2">
        {error && <span className="text-xs text-red-500">{error}</span>}
      </td>

      {/* Actions */}
      <td className="py-3 pl-2 pr-4">
        <div className="flex items-center gap-1.5 justify-end">
          {editing ? (
            <>
              <button onClick={handleSave} disabled={saving}
                className="flex items-center gap-1 text-xs font-semibold text-white bg-green-500 hover:bg-green-600 px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-50">
                {saving ? <div className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <Check className="w-3 h-3" />}
                Save
              </button>
              <button onClick={handleCancel} disabled={saving}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-3.5 h-3.5" />
              </button>
            </>
          ) : (
            <>
              <button onClick={() => { setEditing(true); setTimeout(() => priceRef.current?.focus(), 50); }}
                className="text-xs font-semibold text-[#2F5BEA] border border-[#2F5BEA]/20 hover:bg-blue-50 px-2.5 py-1.5 rounded-lg transition-colors">
                Edit
              </button>
              <button onClick={() => onDelete(record.id)}
                className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      </td>
    </tr>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function BidManager() {
  const [season, setSeason]           = useState<AsplSeason | null>(null);
  const [bids, setBids]               = useState<AsplTeamPlayer[]>([]);
  const [teams, setTeams]             = useState<AsplTeam[]>([]);
  const [loading, setLoading]         = useState(true);
  const [refreshing, setRefreshing]   = useState(false);
  const [error, setError]             = useState('');
  const [search, setSearch]           = useState('');
  const [filterTeam, setFilterTeam]   = useState<number | 'ALL'>('ALL');

  useEffect(() => { load(); }, []);

  const load = async (quiet = false) => {
    if (!quiet) setLoading(true); else setRefreshing(true);
    try {
      const s = await asplApi.getActiveSeason().catch(() => null);
      setSeason(s);
      const [bs, ts] = await Promise.all([
        asplApi.getTeamPlayers(s?.id),
        asplApi.getTeams(s?.id),
      ]);
      setBids(bs);
      setTeams(ts);
    } catch { setError('Failed to load bids.'); }
    finally { setLoading(false); setRefreshing(false); }
  };

  const handleSaved = (updated: AsplTeamPlayer) => {
    setBids(bs => bs.map(b => b.id === updated.id ? updated : b));
    // also update team balances in teams list
    setTeams(ts => ts.map(t => {
      if (t.id === updated.team_id) return { ...t, balance: updated.team.balance };
      return t;
    }));
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this bid? The player will be marked unsold and the balance refunded.')) return;
    try {
      await asplApi.deleteTeamPlayer(id);
      const deleted = bids.find(b => b.id === id);
      setBids(bs => bs.filter(b => b.id !== id));
      // refund in local teams state
      if (deleted) {
        setTeams(ts => ts.map(t => t.id === deleted.team_id ? { ...t, balance: t.balance + deleted.price } : t));
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to delete bid.');
    }
  };

  // filtered bids
  const filtered = bids.filter(b => {
    const matchTeam  = filterTeam === 'ALL' || b.team_id === filterTeam;
    const matchSearch = !search || b.player?.name?.toLowerCase().includes(search.toLowerCase()) || String(b.player_sl).includes(search);
    return matchTeam && matchSearch;
  });

  // team balance summary
  const totalSpent = teams.reduce((sum, t) => sum + ((season?.starting_balance ?? 0) - t.balance), 0);

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#F5F7FA] py-8 px-4">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Link to="/admin/aspl" className="w-9 h-9 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:text-[#2F5BEA] hover:border-[#2F5BEA]/30 transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-[#1F2A44]">Bid Manager</h1>
              <p className="text-xs text-gray-400">{season?.name ?? 'No active season'} · {bids.length} bids</p>
            </div>
          </div>
          <button onClick={() => load(true)} disabled={refreshing}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#2F5BEA] border border-gray-200 hover:border-[#2F5BEA]/30 bg-white px-3 py-2 rounded-xl transition-colors disabled:opacity-50">
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-center justify-between">
            <span className="flex items-center gap-2"><AlertCircle className="w-4 h-4" />{error}</span>
            <button onClick={() => setError('')} className="text-red-400 hover:text-red-600">✕</button>
          </div>
        )}

        {/* Team balance summary */}
        {teams.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-6">
            {teams.map(t => {
              const logoUrl = asplApi.imageUrl(t.logo_url);
              const spent = (season?.starting_balance ?? 0) - t.balance;
              const pct = season ? Math.round((spent / season.starting_balance) * 100) : 0;
              return (
                <div key={t.id} className="bg-white rounded-2xl border border-gray-100 p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-7 h-7 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center"
                      style={{ background: t.color + '22', border: `1.5px solid ${t.color}44` }}>
                      {logoUrl
                        ? <img src={logoUrl} alt={t.team_name} className="w-full h-full object-contain p-0.5" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                        : <span className="text-xs font-bold" style={{ color: t.color }}>{t.team_name[0]}</span>}
                    </div>
                    <p className="text-xs font-semibold text-[#1F2A44] truncate">{t.team_name}</p>
                  </div>
                  <div className="flex justify-between text-[10px] text-gray-400 mb-1">
                    <span>Spent <span className="text-[#1F2A44] font-semibold">${spent}</span></span>
                    <span className="font-semibold" style={{ color: t.balance < 50 ? '#e53e3e' : t.color }}>${t.balance} left</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: t.color }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-2xl border border-gray-100 mb-4 p-3 flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[160px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search player…"
              className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-[#2F5BEA]" />
          </div>
          <div className="relative">
            <select value={filterTeam === 'ALL' ? 'ALL' : filterTeam}
              onChange={e => setFilterTeam(e.target.value === 'ALL' ? 'ALL' : parseInt(e.target.value))}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm text-[#1F2A44] focus:outline-none focus:border-[#2F5BEA] appearance-none pr-7 bg-white">
              <option value="ALL">All Teams</option>
              {teams.map(t => <option key={t.id} value={t.id}>{t.team_name}</option>)}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-400 ml-auto">
            <DollarSign className="w-3.5 h-3.5" />
            Total spent: <span className="font-semibold text-[#1F2A44]">${totalSpent}</span>
          </div>
        </div>

        {/* Bids table */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-7 h-7 border-2 border-[#2F5BEA] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center">
              <Trophy className="w-10 h-10 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-400 text-sm">{bids.length === 0 ? 'No bids yet' : 'No bids match filter'}</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60">
                  <th className="text-left text-[10px] font-semibold text-gray-400 tracking-widest uppercase py-3 pl-4 pr-2">Player</th>
                  <th className="text-left text-[10px] font-semibold text-gray-400 tracking-widest uppercase py-3 px-2">Team</th>
                  <th className="text-left text-[10px] font-semibold text-gray-400 tracking-widest uppercase py-3 px-2">Price</th>
                  <th className="py-3 px-2" />
                  <th className="py-3 pl-2 pr-4" />
                </tr>
              </thead>
              <tbody>
                {filtered.map(record => (
                  <BidRow key={record.id} record={record} teams={teams} onSaved={handleSaved} onDelete={handleDelete} />
                ))}
              </tbody>
            </table>
          )}
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          Press <kbd className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-500 font-mono">Enter</kbd> to save · <kbd className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-500 font-mono">Esc</kbd> to cancel
        </p>
      </div>
    </div>
  );
}
