// src/pages/aspl/AsplPage.tsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Trophy, Users, ArrowRight, X, Loader2, Download } from 'lucide-react';
import { asplApi, AsplTeam, AsplTeamPlayer, AsplSeason } from '../../lib/api';
import RegistrationForm from '../../components/aspl/RegistrationForm';
import './aspl.css';

const posCls = (p: string) => {
  const u = p?.toUpperCase() || '';
  if (u === 'GK') return 'pos-GK';
  if (['LB', 'RB', 'DEF'].includes(u)) return 'pos-DEF';
  if (['CDM', 'CM', 'MID'].includes(u)) return 'pos-MID';
  if (['LW', 'RW'].includes(u)) return 'pos-LW';
  if (['CF', 'FWD'].includes(u)) return 'pos-FWD';
  return 'pos-MID';
};

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

  const exportCSV = () => {
    if (!players.length || !team) return;
    const headers = ['#', 'Name', 'Batch', 'Position', 'Email', 'Phone', 'Price', 'Team'];
    const rows = players.map(tp => [
      tp.player.sl,
      tp.player.name,
      tp.player.batch,
      tp.player.playing_position,
      tp.player.member_email ?? '',
      tp.player.phone ?? '',
      tp.price,
      team.team_name,
    ]);
    const csv = [headers, ...rows]
      .map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${team.team_name.replace(/\s+/g, '_')}_squad.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <div className="fixed inset-0 z-40" style={{ background: 'rgba(10,22,40,0.7)', backdropFilter: 'blur(6px)' }} onClick={onClose} />
      <div className="fixed top-0 right-0 bottom-0 w-[420px] z-50 flex flex-col"
        style={{ background: 'var(--pitch-mid)', borderLeft: '1px solid var(--border)', animation: 'aspl-slideleft 0.3s cubic-bezier(0.22,1,0.36,1) both' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 shrink-0" style={{ borderBottom: '1px solid rgba(245,200,66,0.1)' }}>
          <div>
            <p className="text-[10px] tracking-widest" style={{ color: 'var(--muted)', fontFamily: 'kanit' }}>SQUAD</p>
            <h2 className="text-lg" style={{ color: 'var(--gold)', fontFamily: 'kanit' }}>{team?.team_name ?? '-'}</h2>
          </div>
          <div className="flex items-center gap-2">
            {!loading && players.length > 0 && (
              <button onClick={exportCSV} title="Export squad CSV"
                className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
                style={{ color: 'var(--accent)' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,229,160,0.1)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                <Download className="w-3.5 h-3.5" />
              </button>
            )}
            <button onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
              style={{ color: 'var(--muted)' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Stats */}
        {!loading && (
          <div className="flex gap-4 px-6 py-3 shrink-0" style={{ borderBottom: '1px solid rgba(245,200,66,0.08)' }}>
            {[
              ['PLAYERS', players.length, 'var(--white)'],
              ['BALANCE', `$${team?.balance ?? '-'}`, 'var(--accent)'],
              ['SPENT', `$${totalSpent}`, 'var(--gold)'],
            ].map(([label, val, color]) => (
              <div key={String(label)}>
                <p className="text-[9px] tracking-widest" style={{ color: 'var(--muted)', fontFamily: 'kanit' }}>{label}</p>
                <p className="text-xl" style={{ color: String(color), fontFamily: 'kanit' }}>{val}</p>
              </div>
            ))}
          </div>
        )}

        {/* Player list */}
        <div className="flex-1 overflow-y-auto px-4 py-3">
          {loading ? (
            <div className="flex items-center justify-center h-full gap-2">
              <Loader2 className="w-4 h-4 animate-spin" style={{ color: 'var(--muted)' }} />
              <p className="text-xs" style={{ color: 'var(--muted)', fontFamily: 'kanit' }}>LOADING…</p>
            </div>
          ) : players.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-2">
              <Users className="w-8 h-8" style={{ color: 'var(--muted)' }} />
              <p className="text-sm" style={{ color: 'var(--muted)', fontFamily: 'fredoka' }}>No players yet</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {players.map((tp, i) => {
                const photo = asplApi.imageUrl(tp.player?.photo_url);
                return (
                  <div key={tp.player.sl}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', animation: `aspl-slideup 0.3s ease both`, animationDelay: `${i * 0.04}s` }}>
                    <div className="w-9 h-9 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center"
                      style={{ background: 'rgba(255,255,255,0.06)' }}>
                      {photo
                        ? <img src={photo} alt={tp.player.name} className="w-full h-full object-cover"
                          onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                        : <span className="text-xs font-bold" style={{ color: 'var(--muted)' }}>#{tp.player.sl}</span>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate" style={{ color: 'var(--white)', fontFamily: 'fredoka' }}>{tp.player.name}</p>
                      <p className="text-[10px]" style={{ color: 'var(--muted)', fontFamily: 'kanit' }}>Batch {tp.player.batch}</p>
                    </div>
                    <span className={`badge text-[10px] px-2 py-0.5 ${posCls(tp.player.playing_position)}`} style={{ fontFamily: 'kanit' }}>
                      {tp.player.playing_position}
                    </span>
                    <span className="text-sm w-14 text-right" style={{ color: 'var(--gold)', fontFamily: 'kanit' }}>${tp.price}</span>
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
      className="glass rounded-2xl p-5 flex flex-col gap-4 cursor-pointer transition-all duration-200 hover:scale-[1.02] relative overflow-hidden"
      style={{ border: danger ? '1px solid rgba(229,62,62,0.4)' : '1px solid var(--border)' }}>
      {danger && <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(circle at top, rgba(229,62,62,0.07), transparent 70%)' }} />}

      {/* Logo + name */}
      <div className="flex items-center gap-3">
        <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 flex items-center justify-center"
          style={{ background: 'rgba(255,255,255,0.04)', border: `2px solid ${team.color || 'rgba(255,255,255,0.08)'}33` }}>
          {logoUrl
            ? <img src={logoUrl} alt={team.team_name} className="w-full h-full object-contain p-1"
              onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            : <span className="text-xl font-bold" style={{ color: team.color || 'var(--gold)' }}>{team.team_name[0]}</span>
          }
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-base truncate" style={{ color: 'var(--white)', fontFamily: 'kanit' }}>{team.team_name}</h2>
          {loading
            ? <p className="text-xs animate-pulse" style={{ color: 'var(--muted)' }}>loading…</p>
            : <p className="text-xs" style={{ color: 'var(--muted)', fontFamily: 'fredoka' }}>{count} players</p>}
        </div>
        {danger && (
          <span className="text-[10px] tracking-widest px-2 py-1 rounded flex-shrink-0"
            style={{ background: 'rgba(229,62,62,0.15)', color: '#fca5a5', border: '1px solid rgba(229,62,62,0.4)', fontFamily: 'kanit' }}>
            LOW
          </span>
        )}
      </div>

      {/* Balance stats */}
      {!loading && (
        <div className="grid grid-cols-2 gap-2">
          {[
            ['BALANCE', `$${team.balance}`, 'var(--accent)'],
            ['MAX BID', `$${maxBid}`, danger ? '#fca5a5' : 'var(--gold)'],
          ].map(([label, val, color]) => (
            <div key={String(label)} className="rounded-lg px-3 py-2" style={{ background: 'rgba(255,255,255,0.04)' }}>
              <p className="text-[9px] tracking-widest" style={{ color: 'var(--muted)', fontFamily: 'kanit' }}>{label}</p>
              <p className="text-lg" style={{ color: String(color), fontFamily: 'kanit' }}>{val}</p>
            </div>
          ))}
        </div>
      )}

      {/* Progress */}
      <div>
        <div className="progress-track"><div className="progress-fill" style={{ width: `${pct}%` }} /></div>
        <div className="flex justify-between mt-3">
          <span className="text-[9px] tracking-widest" style={{ color: 'var(--muted)', fontFamily: 'kanit' }}>$0</span>
          <span className="text-[9px] tracking-widest" style={{ color: 'var(--muted)', fontFamily: 'kanit' }}>${startingBalance}</span>
        </div>
      </div>

      <p className="text-[10px] text-center" style={{ color: 'var(--muted)', fontFamily: 'fredoka' }}>Click to view squad</p>
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

          <div className="flex items-center justify-center gap-10 mt-8 mb-8">
            <div className="text-center">
              <p className="text-3xl font-extrabold text-white">{teams.length}</p>
              <p className="text-xs font-bold tracking-widest uppercase text-gray-400 mt-1">Teams</p>
            </div>
            <div className="w-px h-10 bg-white/10" />
            <div className="text-center">
              <p className="text-3xl font-extrabold" style={{ color: '#F39C12' }}>{season?.total_players ?? 0}</p>
              <p className="text-xs font-bold tracking-widest uppercase text-gray-400 mt-1">Players</p>
            </div>
          </div>

          {season?.registration_open && (
            <div className="mt-4">
              <button onClick={() => setShowRegister(true)}
                className="inline-flex items-center gap-2 bg-[#F39C12] hover:bg-[#E67E22] text-white px-8 py-3.5 rounded-xl font-bold tracking-wide transition-all hover:scale-105 active:scale-95 shadow-lg shadow-[#F39C12]/20">
                Register as Player <ArrowRight className="w-5 h-5" />
              </button>
              <p className="text-xs text-gray-500 mt-3">
                Already registered? Re-submit to update your information.
              </p>
            </div>
          )}

          <div className="mt-6">
            <Link to="/aspl/players"
              className="inline-flex items-center gap-2 text-sm font-semibold text-gray-400 hover:text-white transition-colors">
              <Users className="w-4 h-4" /> View all registered players →
            </Link>
          </div>
        </div>
      </section>

      {/* ── Teams ────────────────────────────────────────────────────────── */}
      <section className="pitch-bg py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-end justify-between mb-10">
            <div>
              <span className="text-xs font-bold tracking-widest uppercase block mb-2" style={{ color: 'var(--muted)', fontFamily: 'kanit' }}>{seasonName}</span>
              <h2 className="text-3xl md:text-4xl font-bold" style={{ color: 'var(--white)', fontFamily: 'kanit' }}>Teams</h2>
              <p className="mt-2 text-sm" style={{ color: 'var(--muted)', fontFamily: 'fredoka' }}>Click a team to view their squad and bids</p>
            </div>
            {!loading && teams.length > 0 && (
              <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--muted)' }}>
                <Trophy className="w-4 h-4" style={{ color: 'var(--gold)' }} />
                {teams.length} competing teams
              </div>
            )}
          </div>
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1, 2, 3].map(i => (
                <div key={i} className="glass rounded-2xl p-5 animate-pulse">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-14 h-14 rounded-xl" style={{ background: 'rgba(255,255,255,0.06)' }} />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 rounded" style={{ background: 'rgba(255,255,255,0.08)', width: '70%' }} />
                      <div className="h-3 rounded" style={{ background: 'rgba(255,255,255,0.04)', width: '40%' }} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    <div className="h-14 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)' }} />
                    <div className="h-14 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)' }} />
                  </div>
                  <div className="h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }} />
                </div>
              ))}
            </div>
          ) : teams.length === 0 ? (
            <div className="glass rounded-2xl text-center py-24">
              <Trophy className="w-10 h-10 mx-auto mb-3" style={{ color: 'var(--muted)' }} />
              <p className="text-sm" style={{ color: 'var(--muted)', fontFamily: 'fredoka' }}>No teams yet</p>
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
        </div>
      </section>

      {expanded && <PlayerDrawer teamId={expanded} onClose={() => setExpanded(null)} />}
      {showRegister && season?.registration_open && (
        <RegistrationForm season={season} onClose={() => setShowRegister(false)} />
      )}

    </div>
  );
}