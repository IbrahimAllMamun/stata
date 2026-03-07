// src/pages/aspl/AsplPage.tsx
import { useState, useEffect } from 'react';
import { asplApi, AsplTeam, AsplTeamPlayer } from '../../lib/api';
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
            <div className="fixed inset-0 z-40" style={{ background: 'rgba(10,22,40,0.7)', backdropFilter: 'blur(6px)' }} onClick={onClose} />
            <div className="fixed top-0 right-0 bottom-0 w-[420px] z-50 flex flex-col anim-left" style={{ background: 'var(--pitch-mid)', borderLeft: '1px solid var(--border)' }}>
                <div className="flex items-center justify-between px-6 py-4 shrink-0" style={{ borderBottom: '1px solid rgba(245,200,66,0.1)' }}>
                    <div>
                        <p className="text-[10px] tracking-widest" style={{ color: 'var(--muted)', fontFamily: 'kanit' }}>SQUAD</p>
                        <h2 className="text-lg" style={{ color: 'var(--gold)', fontFamily: 'kanit' }}>{team?.team_name ?? '—'}</h2>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10" style={{ color: 'var(--muted)', fontSize: 18 }}>✕</button>
                </div>
                {!loading && (
                    <div className="flex gap-4 px-6 py-3 shrink-0" style={{ borderBottom: '1px solid rgba(245,200,66,0.08)' }}>
                        {[['PLAYERS', players.length, 'var(--white)'], ['BALANCE', `$${team?.balance ?? '—'}`, 'var(--accent)'], ['SPENT', `$${totalSpent}`, 'var(--gold)']].map(([label, val, color]) => (
                            <div key={String(label)}>
                                <p className="text-[9px] tracking-widest" style={{ color: 'var(--muted)', fontFamily: 'kanit' }}>{label}</p>
                                <p className="text-xl" style={{ color: String(color), fontFamily: 'kanit' }}>{val}</p>
                            </div>
                        ))}
                    </div>
                )}
                <div className="flex-1 overflow-y-auto px-4 py-3">
                    {loading ? (
                        <div className="flex items-center justify-center h-full">
                            <p className="text-xs animate-pulse" style={{ color: 'var(--muted)', fontFamily: 'kanit' }}>LOADING…</p>
                        </div>
                    ) : players.length === 0 ? (
                        <div className="flex items-center justify-center h-full">
                            <p className="text-sm" style={{ color: 'var(--muted)', fontFamily: 'fredoka' }}>No players yet</p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-2">
                            {players.map((tp, i) => (
                                <div key={tp.player.sl} className="flex items-center gap-3 px-4 py-3 rounded-xl anim-up"
                                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', animationDelay: `${i * 0.04}s` }}>
                                    <span className="text-sm w-8 text-center" style={{ color: 'var(--muted)', fontFamily: 'kanit' }}>{tp.player.sl}</span>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm truncate" style={{ color: 'var(--white)', fontFamily: 'fredoka' }}>{tp.player.name}</p>
                                        <p className="text-[10px]" style={{ color: 'var(--muted)', fontFamily: 'kanit' }}>Batch {tp.player.batch}</p>
                                    </div>
                                    <span className={`badge text-[10px] px-2 py-0.5 ${posCls(tp.player.playing_position)}`} style={{ fontFamily: 'kanit' }}>
                                        {tp.player.playing_position}
                                    </span>
                                    <span className="text-sm w-14 text-right" style={{ color: 'var(--gold)', fontFamily: 'kanit' }}>${tp.price}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

function TeamCard({ team, onClick }: { team: AsplTeam; onClick: () => void }) {
    const [players, setPlayers] = useState<AsplTeamPlayer[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        asplApi.getTeamPlayersByTeam(team.id).then(setPlayers).catch(console.error).finally(() => setLoading(false));
    }, [team.id]);

    const count = players.length;
    const TARGET = 11;
    const slotsLeft = Math.max(0, TARGET - count - 1);
    const maxBid = count < TARGET ? Math.max(0, team.balance - slotsLeft * 20) : team.balance;
    const pct = Math.max(0, Math.min(100, (team.balance / 1000) * 100));
    const danger = team.balance < 20;

    return (
        <div onClick={onClick} className="glass rounded-2xl p-5 flex flex-col gap-4 cursor-pointer transition-all duration-200 hover:scale-[1.02] relative overflow-hidden"
            style={{ border: danger ? '1px solid rgba(229,62,62,0.4)' : '1px solid var(--border)' }}>
            {danger && <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(circle at top, rgba(229,62,62,0.07), transparent 70%)' }} />}
            <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <img src={`/logo/${team.team_name}.png`} alt={team.team_name} className="w-full h-full object-contain p-1" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                </div>
                <div className="min-w-0">
                    <h2 className="text-base truncate" style={{ color: 'var(--white)', fontFamily: 'kanit' }}>{team.team_name}</h2>
                    {loading ? <p className="text-xs animate-pulse" style={{ color: 'var(--muted)' }}>loading…</p>
                        : <p className="text-xs" style={{ color: 'var(--muted)', fontFamily: 'fredoka' }}>{count} players</p>}
                </div>
            </div>
            {!loading && (
                <div className="grid grid-cols-2 gap-2">
                    {[['BALANCE', `$${team.balance}`, 'var(--accent)'], ['MAX BID', `$${maxBid}`, danger ? '#fca5a5' : 'var(--gold)']].map(([label, val, color]) => (
                        <div key={String(label)} className="rounded-lg px-3 py-2" style={{ background: 'rgba(255,255,255,0.04)' }}>
                            <p className="text-[9px] tracking-widest" style={{ color: 'var(--muted)', fontFamily: 'kanit' }}>{label}</p>
                            <p className="text-lg" style={{ color: String(color), fontFamily: 'kanit' }}>{val}</p>
                        </div>
                    ))}
                </div>
            )}
            <div>
                <div className="progress-track"><div className="progress-fill" style={{ width: `${pct}%` }} /></div>
                <div className="flex justify-between mt-3">
                    <span className="text-[9px] tracking-widest" style={{ color: 'var(--muted)', fontFamily: 'kanit' }}>$0</span>
                    <span className="text-[9px] tracking-widest" style={{ color: 'var(--muted)', fontFamily: 'kanit' }}>$1000</span>
                </div>
            </div>
            <p className="text-[10px] text-center" style={{ color: 'var(--muted)', fontFamily: 'fredoka' }}>Click to view squad</p>
        </div>
    );
}

export default function AsplPage() {
    const [teams, setTeams] = useState<AsplTeam[]>([]);
    const [loading, setLoading] = useState(true);
    const [expanded, setExpanded] = useState<number | null>(null);

    useEffect(() => {
        asplApi.getTeams().then(setTeams).catch(console.error).finally(() => setLoading(false));
    }, []);

    return (
        <div className="aspl-root min-h-screen" style={{ background: 'var(--pitch)' }}>
            {/* Hero */}
            <div className="relative overflow-hidden" style={{ background: 'linear-gradient(135deg, var(--pitch) 0%, var(--pitch-mid) 100%)', borderBottom: '1px solid var(--border)' }}>
                <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: "radial-gradient(circle at 20% 50%, rgba(0,229,160,0.06) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(47,91,234,0.08) 0%, transparent 50%)" }} />
                <div className="relative max-w-7xl mx-auto px-6 py-16 text-center">
                    <div className="inline-block px-4 py-1.5 rounded-full text-xs tracking-widest mb-5" style={{ background: 'rgba(245,200,66,0.1)', border: '1px solid rgba(245,200,66,0.25)', color: 'var(--gold)', fontFamily: 'kanit' }}>
                        ISRT · UNIVERSITY OF DHAKA
                    </div>
                    <h1 className="text-5xl md:text-7xl tracking-widest mb-3 glow-gold" style={{ color: 'var(--gold)', fontFamily: 'kanit' }}>ASPL</h1>
                    <p className="text-lg tracking-widest mb-2" style={{ color: 'var(--white)', fontFamily: 'fredoka' }}>Applied Statistics Premier League</p>
                    <p className="text-sm" style={{ color: 'var(--muted)', fontFamily: 'fredoka' }}>2024 Season · Team Dashboard</p>
                    <div className="flex items-center justify-center gap-8 mt-8">
                        {[['TEAMS', teams.length], ['SEASON', '2024']].map(([label, val]) => (
                            <div key={String(label)} className="text-center">
                                <p className="text-3xl" style={{ color: 'var(--gold)', fontFamily: 'kanit' }}>{val}</p>
                                <p className="text-[10px] tracking-widest" style={{ color: 'var(--muted)', fontFamily: 'kanit' }}>{label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Teams */}
            <div className="max-w-7xl mx-auto px-6 py-12">
                <h2 className="text-xs tracking-widest mb-6" style={{ color: 'var(--muted)', fontFamily: 'kanit' }}>ALL TEAMS</h2>
                {loading ? (
                    <div className="flex items-center justify-center py-24">
                        <p className="text-xs animate-pulse tracking-widest" style={{ color: 'var(--gold)', fontFamily: 'kanit' }}>LOADING TEAMS…</p>
                    </div>
                ) : teams.length === 0 ? (
                    <div className="text-center py-24">
                        <p className="text-sm" style={{ color: 'var(--muted)', fontFamily: 'fredoka' }}>No teams yet</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {teams.map((team, i) => (
                            <div key={team.id} className="anim-up" style={{ animationDelay: `${i * 0.06}s` }}>
                                <TeamCard team={team} onClick={() => setExpanded(expanded === team.id ? null : team.id)} />
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {expanded && <PlayerDrawer teamId={expanded} onClose={() => setExpanded(null)} />}
        </div>
    );
}