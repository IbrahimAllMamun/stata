// src/pages/aspl/AsplPage.tsx
import { useState, useEffect } from 'react';
import { Trophy, Users, Wallet, ArrowRight, ChevronRight, X, Loader2 } from 'lucide-react';
import { asplApi, AsplTeam, AsplTeamPlayer, AsplSeason } from '../../lib/api';
import RegistrationForm from '../../components/aspl/RegistrationForm';
import './aspl.css';

// ── Position badge colours (light-mode) ───────────────────────────────────────
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

// ── Player Drawer ─────────────────────────────────────────────────────────────
function PlayerDrawer({ teamId, onClose }: { teamId: number; onClose: () => void }) {
  const [players, setPlayers] = useState<AsplTeamPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const team = players[0]?.team;
  const totalSpent = players.reduce((s, r) => s + r.price, 0);

  useEffect(() => {
    asplApi.getTeamPlayersByTeam(teamId).then(setPlayers).catch(console.error).finally(() => setLoading(false));
  }, [teamId]);

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed top-0 right-0 bottom-0 w-[400px] z-50 flex flex-col bg-white shadow-2xl"
        style={{ animation: 'aspl-slideleft 0.3s cubic-bezier(0.22,1,0.36,1) both' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div>
            <p className="text-xs font-bold tracking-widest uppercase text-[#2F5BEA] mb-0.5">Squad</p>
            <h2 className="text-xl font-bold text-[#1F2A44]">{team?.team_name ?? '—'}</h2>
          </div>
          <button onClick={onClose}
            className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Stats */}
        {!loading && (
          <div className="grid grid-cols-3 gap-0 border-b border-gray-100">
            {[
              { label: 'Players', value: players.length, color: '#1F2A44' },
              { label: 'Balance', value: `$${team?.balance ?? '—'}`, color: '#2ECC71' },
              { label: 'Spent', value: `$${totalSpent}`, color: '#F39C12' },
            ].map(({ label, value, color }, i) => (
              <div key={label} className={`px-5 py-4 ${i < 2 ? 'border-r border-gray-100' : ''}`}>
                <p className="text-xs text-gray-400 mb-1">{label}</p>
                <p className="text-xl font-bold" style={{ color }}>{value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Player list */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-40 gap-2 text-gray-400">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Loading…</span>
            </div>
          ) : players.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 gap-2">
              <Users className="w-8 h-8 text-gray-200" />
              <p className="text-sm text-gray-400">No players yet</p>
            </div>
          ) : (
            <div className="p-4 flex flex-col gap-2">
              {players.map((tp, i) => {
                const photo = asplApi.imageUrl(tp.player?.photo_url);
                return (
                  <div key={tp.player.sl}
                    className="flex items-center gap-3 bg-[#F5F7FA] hover:bg-gray-100 px-4 py-3 rounded-xl transition-colors"
                    style={{ animation: `aspl-slideup 0.3s ease both`, animationDelay: `${i * 0.04}s` }}>
                    <div className="w-9 h-9 rounded-xl overflow-hidden flex-shrink-0 bg-gray-200 flex items-center justify-center">
                      {photo
                        ? <img src={photo} alt={tp.player.name} className="w-full h-full object-cover"
                          onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                        : <span className="text-xs font-bold text-gray-400">#{tp.player.sl}</span>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#1F2A44] truncate">{tp.player.name}</p>
                      <p className="text-xs text-gray-400">Batch {tp.player.batch}</p>
                    </div>
                    <PosBadge pos={tp.player.playing_position} />
                    <span className="text-sm font-bold text-[#F39C12] w-12 text-right">${tp.price}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ── Team Card ─────────────────────────────────────────────────────────────────
function TeamCard({ team, startingBalance, onClick }: { team: AsplTeam; startingBalance: number; onClick: () => void }) {
  const [players, setPlayers] = useState<AsplTeamPlayer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    asplApi.getTeamPlayersByTeam(team.id).then(setPlayers).catch(console.error).finally(() => setLoading(false));
  }, [team.id]);

  const count = players.length;
  const TARGET = 11;
  const slotsLeft = Math.max(0, TARGET - count - 1);
  const maxBid = count < TARGET ? Math.max(0, team.balance - slotsLeft * 20) : team.balance;
  const pct = Math.max(0, Math.min(100, (team.balance / (startingBalance || 1000)) * 100));
  const danger = team.balance < 20;
  const logoUrl = asplApi.imageUrl(team.logo_url);

  return (
    <div onClick={onClick}
      className="bg-white rounded-2xl border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden group">
      <div className="h-1.5 w-full" style={{ background: team.color ?? '#2F5BEA' }} />
      <div className="p-5 flex flex-col gap-4">
        {/* Logo + name */}
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-2xl overflow-hidden flex-shrink-0 bg-[#F5F7FA] flex items-center justify-center border border-gray-100">
            {logoUrl
              ? <img src={logoUrl} alt={team.team_name} className="w-full h-full object-contain p-1"
                onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              : <span className="text-2xl font-extrabold" style={{ color: team.color ?? '#2F5BEA' }}>{team.team_name[0]}</span>
            }
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-[#1F2A44] text-lg truncate group-hover:text-[#2F5BEA] transition-colors">{team.team_name}</h3>
            {loading
              ? <p className="text-xs text-gray-300 animate-pulse">loading…</p>
              : <p className="text-xs text-gray-400">{count} players</p>}
          </div>
          {danger && (
            <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-red-50 text-red-500 border border-red-100 flex-shrink-0">
              LOW
            </span>
          )}
        </div>

        {/* Balance stats */}
        {!loading && (
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Balance', value: `$${team.balance}`, color: '#2ECC71' },
              { label: 'Max Bid', value: `$${maxBid}`, color: danger ? '#EF4444' : '#F39C12' },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-[#F5F7FA] rounded-xl px-3 py-2.5">
                <p className="text-[10px] text-gray-400 font-medium mb-0.5">{label}</p>
                <p className="text-lg font-bold" style={{ color }}>{value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Progress */}
        <div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-500"
              style={{ width: `${pct}%`, background: danger ? '#EF4444' : `linear-gradient(90deg, #2ECC71, ${team.color ?? '#2F5BEA'})` }} />
          </div>
          <div className="flex justify-between mt-1.5">
            <span className="text-[10px] text-gray-300">$0</span>
            <span className="text-[10px] text-gray-300">${startingBalance}</span>
          </div>
        </div>

        <div className="flex items-center gap-1 text-xs font-semibold text-[#2F5BEA] group-hover:text-[#F39C12] transition-colors">
          View squad <ChevronRight className="w-3.5 h-3.5" />
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function AsplPage() {
  const [season, setSeason] = useState<AsplSeason | null>(null);
  const [teams, setTeams] = useState<AsplTeam[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [showRegister, setShowRegister] = useState(false);

  useEffect(() => {
    asplApi.getActiveSeason()
      .catch(() => null)
      .then(s => { setSeason(s); return asplApi.getTeams(s?.id); })
      .then(setTeams)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const seasonName = season?.name ?? 'ASPL';
  const sportLabel = season ? (season.sport === 'FOOTBALL' ? 'Football' : 'Cricket') : null;

  return (
    <div className="bg-[#F5F7FA] min-h-screen aspl-root">

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative bg-[#1F2A44] text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-0 left-0 w-96 h-96 bg-[#2F5BEA] rounded-full -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#F39C12] rounded-full translate-x-1/2 translate-y-1/2" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 py-20 md:py-28 text-center">
          <div className="inline-block bg-[#2F5BEA]/20 border border-[#2F5BEA]/30 text-[#7BA3F5] text-xs font-bold tracking-widest uppercase px-4 py-1.5 rounded-full mb-6">
            ISRT · University of Dhaka{sportLabel ? ` · ${sportLabel}` : ''}
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold mb-4 leading-tight tracking-tight">
            <span style={{ color: '#F39C12' }}>{seasonName}</span>
          </h1>
          <p className="text-xl text-gray-300 mb-8">Applied Statistics Premier League</p>

          {season?.registration_open && (
            <div className="mt-4">
              <button onClick={() => setShowRegister(true)}
                className="inline-flex items-center gap-2 bg-[#F39C12] hover:bg-[#E67E22] text-white px-8 py-3.5 rounded-xl font-bold tracking-wide transition-all hover:scale-105 active:scale-95 shadow-lg shadow-[#F39C12]/20">
                Register as Player <ArrowRight className="w-5 h-5" />
              </button>
              <p className="text-xs text-gray-500 mt-3">
                Already registered? Submit again with your email to update
              </p>
            </div>
          )}
        </div>
      </section>

      {/* ── Teams ────────────────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="flex items-end justify-between mb-10">
          <div>
            <span className="text-xs font-bold tracking-widest uppercase text-[#2F5BEA] block mb-2">{seasonName}</span>
            <h2 className="text-3xl md:text-4xl font-bold text-[#1F2A44]">Teams</h2>
            <p className="text-gray-500 mt-2">Click a team to view their squad and bids</p>
          </div>
          {!loading && teams.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Trophy className="w-4 h-4 text-[#F39C12]" />
              {teams.length} competing teams
            </div>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-14 h-14 bg-gray-200 rounded-2xl" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                    <div className="h-3 bg-gray-100 rounded w-1/3" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <div className="h-14 bg-gray-100 rounded-xl" />
                  <div className="h-14 bg-gray-100 rounded-xl" />
                </div>
                <div className="h-2 bg-gray-100 rounded-full" />
              </div>
            ))}
          </div>
        ) : teams.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-2xl border border-gray-100">
            <Wallet className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400">No teams yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {teams.map((team, i) => (
              <div key={team.id} style={{ animation: `aspl-slideup 0.4s ease both`, animationDelay: `${i * 0.07}s` }}>
                <TeamCard
                  team={team}
                  startingBalance={season?.starting_balance ?? 1000}
                  onClick={() => setExpanded(expanded === team.id ? null : team.id)}
                />
              </div>
            ))}
          </div>
        )}
      </section>

      {expanded && <PlayerDrawer teamId={expanded} onClose={() => setExpanded(null)} />}
      {showRegister && season?.registration_open && (
        <RegistrationForm season={season} onClose={() => setShowRegister(false)} />
      )}
    </div>
  );
}