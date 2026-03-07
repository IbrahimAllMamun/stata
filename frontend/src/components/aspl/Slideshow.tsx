// src/components/aspl/Slideshow.tsx
import { useState, useEffect, useRef } from 'react';
import { asplApi, AsplPlayer, AsplTeam } from '../../lib/api';
import LogoLoaderFull from '../LogoLoaderFull';

const TICKER_ITEMS = [
  'ASPL 2024 · Applied Statistics Premier League',
  'ISRT · University of Dhaka',
  'Live Auction in Progress',
];

const posCls = (p: string) => {
  const u = p?.toUpperCase() || '';
  if (u === 'GK') return 'pos-GK';
  if (['LB', 'RB', 'DEF'].includes(u)) return 'pos-DEF';
  if (['CDM', 'CM', 'MID'].includes(u)) return 'pos-MID';
  if (['LW', 'RW'].includes(u)) return 'pos-LW';
  if (['CF', 'FWD'].includes(u)) return 'pos-FWD';
  return 'pos-MID';
};

const Hint = ({ keys, label }: { keys: string[]; label: string }) => (
  <span className="flex items-center gap-1 text-[11px]" style={{ color: 'var(--muted)' }}>
    {keys.map(k => <kbd key={k} className="kbd">{k}</kbd>)}
    <span className="ml-1">{label}</span>
  </span>
);

// ── BidPanel ─────────────────────────────────────────────────────────────────
function BidPanel({ player, onSold }: { player: AsplPlayer | null; onSold: () => void }) {
  const [teams, setTeams] = useState<AsplTeam[]>([]);
  const [teamCounts, setTeamCounts] = useState<Record<number, number>>({});
  const [selected, setSelected] = useState<AsplTeam | null>(null);
  const [price, setPrice] = useState('');
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<'success' | 'error' | null>(null);
  const [msg, setMsg] = useState('');
  const [localSold, setLocalSold] = useState(false);

  useEffect(() => {
    asplApi.getTeams().then(ts => {
      setTeams(ts);
      Promise.all(ts.map(t =>
        asplApi.getTeamPlayersByTeam(t.id)
          .then(rows => [t.id, rows.length] as [number, number])
          .catch(() => [t.id, 0] as [number, number])
      )).then(entries => setTeamCounts(Object.fromEntries(entries)));
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  useEffect(() => { setSelected(null); setPrice(''); setStatus(null); setLocalSold(false); }, [player?.sl]);

  const TARGET = 11;
  const calcMax = (t: AsplTeam) => {
    const cnt = teamCounts[t.id] ?? 0;
    const slots = Math.max(0, TARGET - cnt - 1);
    return cnt < TARGET ? Math.max(0, t.balance - slots * 20) : t.balance;
  };

  const priceNum = parseInt(price, 10);
  const maxBid = selected ? calcMax(selected) : null;
  const overMax = !isNaN(priceNum) && maxBid !== null && priceNum > maxBid;
  const soldOut = localSold || !!player?.status;
  const canSubmit = !soldOut && selected && !isNaN(priceNum) && priceNum > 0 && !overMax;

  const handleSubmit = async () => {
    if (!canSubmit || !player || !selected) return;
    try {
      await asplApi.createTeamPlayer(player.sl, selected.id, priceNum);
      setStatus('success');
      setMsg(`${player.name} sold to ${selected.team_name} for $${priceNum}`);
      setPrice(''); setSelected(null); setLocalSold(true);
      onSold();
    } catch (err: unknown) {
      setStatus('error');
      setMsg(err instanceof Error ? err.message : 'Something went wrong.');
    }
  };

  if (loading) return (
    <div className="glass rounded-2xl p-6 w-full flex items-center justify-center h-48">
      <span className="text-xs animate-pulse" style={{ color: 'var(--muted)', fontFamily: 'kanit' }}>LOADING…</span>
    </div>
  );

  return (
    <div className="glass rounded-2xl p-6 w-full flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-xs tracking-widest" style={{ color: 'var(--gold)', fontFamily: 'kanit' }}>BID PANEL</p>
        {soldOut && (
          <span className="text-[10px] tracking-widest px-3 py-1 rounded"
            style={{ background: 'rgba(229,62,62,0.15)', color: '#fca5a5', border: '1px solid rgba(229,62,62,0.4)', fontFamily: 'kanit' }}>
            SOLD
          </span>
        )}
      </div>
      {player && <p className="text-lg leading-tight" style={{ color: 'var(--white)', fontFamily: 'fredoka' }}>{player.name}</p>}
      <div className="flex flex-col gap-1">
        <label className="text-[10px] tracking-widest" style={{ color: 'var(--muted)', fontFamily: 'kanit' }}>SELECT TEAM</label>
        <div className="grid grid-cols-2 gap-2">
          {teams.map(team => {
            const mb = calcMax(team);
            const sel = selected?.id === team.id;
            return (
              <button key={team.id} disabled={soldOut}
                onClick={() => { setSelected(sel ? null : team); setPrice(''); setStatus(null); }}
                className="flex flex-col items-start px-3 py-2 rounded-xl text-sm transition-all w-full"
                style={{
                  background: sel ? 'rgba(245,200,66,0.15)' : 'rgba(255,255,255,0.04)',
                  border: sel ? '1px solid rgba(245,200,66,0.5)' : '1px solid rgba(255,255,255,0.06)',
                  color: 'var(--white)', opacity: soldOut ? 0.4 : 1, fontFamily: 'fredoka',
                }}>
                <span className="text-xs leading-tight truncate w-full">{team.team_name}</span>
                <div className="flex items-center justify-between w-full mt-1">
                  <span className="text-sm" style={{ color: 'var(--accent)', fontFamily: 'kanit' }}>${team.balance}</span>
                  <span className="text-xs" style={{ color: 'var(--muted)', fontFamily: 'kanit' }}>max ${mb}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <label className="text-[10px] tracking-widest" style={{ color: 'var(--muted)', fontFamily: 'kanit' }}>PRICE</label>
          {maxBid !== null && (
            <span className="text-[10px]" style={{ color: overMax ? '#fca5a5' : 'var(--muted)', fontFamily: 'kanit' }}>max ${maxBid}</span>
          )}
        </div>
        <input type="number" min={1} max={maxBid ?? undefined} disabled={soldOut}
          className="rounded-lg px-4 py-2 text-xl outline-none w-full"
          style={{
            background: 'rgba(255,255,255,0.05)', fontFamily: 'kanit',
            border: overMax ? '1px solid rgba(229,62,62,0.7)' : '1px solid rgba(245,200,66,0.25)',
            color: overMax ? '#fca5a5' : 'var(--white)',
          }}
          placeholder="Enter amount" value={price}
          onChange={e => { setPrice(e.target.value); setStatus(null); }} />
        {overMax && <p className="text-[10px]" style={{ color: '#fca5a5', fontFamily: 'kanit' }}>Exceeds max bid of ${maxBid}</p>}
      </div>
      <button disabled={!canSubmit} onClick={handleSubmit}
        className="w-full py-3 rounded-xl text-sm tracking-widest transition-all"
        style={{
          fontFamily: 'kanit',
          background: canSubmit ? 'var(--gold)' : 'rgba(255,255,255,0.06)',
          color: canSubmit ? 'var(--pitch)' : 'var(--muted)',
          cursor: canSubmit ? 'pointer' : 'not-allowed',
        }}>
        CONFIRM BID
      </button>
      {status && (
        <p className="text-xs text-center" style={{ color: status === 'success' ? 'var(--accent)' : '#fca5a5', fontFamily: 'fredoka' }}>
          {msg}
        </p>
      )}
    </div>
  );
}

// ── RandomPopup ───────────────────────────────────────────────────────────────
function RandomPopup({ visible, onClose, playerSL, loading: loadingRandom }: {
  visible: boolean; onClose: () => void; playerSL: number; loading: boolean;
}) {
  const [displayed, setDisplayed] = useState(playerSL);
  const [settled, setSettled] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) onClose(); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [onClose]);

  useEffect(() => {
    if (visible && settled) { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }
  }, [visible, settled, onClose]);

  useEffect(() => {
    if (!visible) { setSettled(false); return; }
    setSettled(false);
    const interval = setInterval(() => setDisplayed(Math.floor(Math.random() * 69) + 1), 80);
    const stop = setTimeout(() => { clearInterval(interval); setDisplayed(playerSL); setSettled(true); }, loadingRandom ? 1400 : 1000);
    return () => { clearInterval(interval); clearTimeout(stop); };
  }, [visible, playerSL, loadingRandom]);

  if (!visible) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(10,22,40,0.9)', backdropFilter: 'blur(18px)' }}>
      <div ref={ref} className="flex flex-col items-center gap-4">
        <p className="text-xs tracking-widest" style={{ color: 'var(--muted)', fontFamily: 'kanit' }}>RANDOM PLAYER</p>
        <div className="relative flex items-center justify-center" style={{ width: 260, height: 260 }}>
          <div className="absolute inset-0 rounded-full" style={{
            border: '3px solid var(--gold)',
            boxShadow: settled ? '0 0 60px rgba(245,200,66,0.4)' : '0 0 20px rgba(245,200,66,0.15)',
            transition: 'box-shadow 0.5s ease',
          }} />
          <span className="glow-gold" style={{
            fontFamily: 'kanit', fontSize: 'clamp(5rem,10vw,8rem)',
            color: settled ? 'var(--gold)' : 'rgba(245,200,66,0.5)',
            transition: 'color 0.4s ease', lineHeight: 1,
          }}>{displayed}</span>
        </div>
        {settled && <p className="text-lg anim-up" style={{ color: 'var(--white)', fontFamily: 'fredoka' }}>Player #{playerSL} selected</p>}
        <p className="text-xs" style={{ color: 'var(--muted)' }}>Click outside or wait to dismiss</p>
      </div>
    </div>
  );
}

// ── Main Slideshow ─────────────────────────────────────────────────────────────
export default function Slideshow() {
  const [players, setPlayers] = useState<AsplPlayer[]>([]);
  const [currentSL, setCurrentSL] = useState(1);
  const [player, setPlayer] = useState<AsplPlayer | null>(null);
  const [animKey, setAnimKey] = useState(0);
  const [isSold, setIsSold] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [randomVisible, setRandomVisible] = useState(false);
  const [randomSL, setRandomSL] = useState(0);
  const [loadingRandom, setLoadingRandom] = useState(false);
  const [loadingPlayers, setLoadingPlayers] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    asplApi.getPlayers().then(ps => {
      setPlayers(ps);
      if (ps.length) setCurrentSL(ps[0].sl);
    }).catch(console.error).finally(() => setLoadingPlayers(false));
  }, []);

  useEffect(() => {
    if (!players.length) return;
    asplApi.getPlayerBySL(currentSL).then(p => { setPlayer(p); setIsSold(false); setAnimKey(k => k + 1); }).catch(console.error);
  }, [currentSL, players.length]);

  const totalPlayers = players.length || 1;

  useEffect(() => {
    const go = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.altKey && e.code === 'KeyR') {
        e.preventDefault();
        setRandomVisible(true); setLoadingRandom(true);
        asplApi.getRandomPlayer().then(p => { setRandomSL(p.sl); setCurrentSL(p.sl); }).catch(console.error).finally(() => setLoadingRandom(false));
        return;
      }
      if (e.ctrlKey && e.altKey) return;
      if (e.ctrlKey && e.code === 'Space') { e.preventDefault(); setSearchOpen(v => !v); if (!searchOpen) setTimeout(() => inputRef.current?.focus(), 50); return; }
      if (e.code === 'ArrowLeft') { e.preventDefault(); setCurrentSL(s => s > 1 ? s - 1 : totalPlayers); }
      if (e.code === 'ArrowRight') { e.preventDefault(); setCurrentSL(s => s < totalPlayers ? s + 1 : 1); }
      if (e.code === 'Enter' && searchOpen) {
        e.preventDefault();
        const n = parseInt(inputValue, 10);
        if (!isNaN(n) && n > 0) { setCurrentSL(n); setInputValue(''); setSearchOpen(false); }
      }
      if (e.code === 'Escape') setSearchOpen(false);
    };
    window.addEventListener('keydown', go);
    return () => window.removeEventListener('keydown', go);
  }, [inputValue, searchOpen, totalPlayers]);

  if (loadingPlayers) return (
    <div className="fixed inset-0 pitch-bg flex items-center justify-center aspl-root">
      <div className="glass rounded-2xl px-10 py-8 flex flex-col items-center gap-4">
        <p className="text-xl tracking-widest animate-pulse" style={{ color: 'var(--gold)', fontFamily: 'kanit' }}>LOADING AUCTION…</p>
        <div className="flex gap-1">
          {[0, 1, 2, 3].map(i => (
            <div key={i} className="w-2 h-2 rounded-full" style={{ background: 'var(--gold)', opacity: 0.8, animation: `aspl-fadein 1.2s ease-in-out ${i * 0.2}s infinite` }} />
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 pitch-bg flex flex-col aspl-root" style={{ paddingBottom: '28px' }}>

      {/* TOP BAR */}
      <header className="flex items-center justify-between px-8 pt-5 pb-3 shrink-0">
        <div key={animKey + 'sl'} className="anim-right">
          <div className="flex items-center gap-3">
            <div className="relative w-16 h-16 rounded-full flex items-center justify-center text-3xl"
              style={{ background: 'var(--pitch-light)', border: '2px solid var(--gold)', boxShadow: '0 0 18px rgba(245,200,66,0.3)', animation: 'aspl-pulse-ring 2s infinite', fontFamily: 'kanit' }}>
              <span style={{ color: 'var(--gold)' }}>{player?.sl ?? '—'}</span>
            </div>
            <div>
              <p className="text-[10px] tracking-widest" style={{ color: 'var(--muted)', fontFamily: 'kanit' }}>PLAYER NO.</p>
              <p className="text-xs" style={{ color: 'var(--muted)', fontFamily: 'fredoka' }}>{currentSL} / {totalPlayers}</p>
            </div>
          </div>
        </div>
        <div className="text-center">
          <h1 className="text-3xl glow-gold tracking-widest" style={{ color: 'var(--gold)', fontFamily: 'kanit' }}>ASPL · 2024</h1>
          <p className="text-xs tracking-widest" style={{ color: 'var(--muted)', fontFamily: 'fredoka' }}>APPLIED STATISTICS PREMIER LEAGUE</p>
        </div>
        <div className="glass rounded-xl px-4 py-2 flex items-center gap-2">
          <LogoLoaderFull size={28} scheme="dark" />
        </div>
      </header>

      {/* MAIN */}
      <main className="flex flex-1 min-h-0 gap-0 px-8 pb-2">
        {/* LEFT */}
        <section key={animKey + 'info'} className="w-72 shrink-0 flex flex-col justify-center gap-5 anim-right delay-1">
          {player && (
            <>
              <div className={`badge text-sm px-4 py-1 self-start ${posCls(player.playing_position)}`} style={{ fontFamily: 'kanit', letterSpacing: '0.1em' }}>
                {player.playing_position}
              </div>
              <h2 className="leading-tight" style={{ fontFamily: 'kanit', fontSize: 'clamp(1.8rem,3vw,2.8rem)', color: 'var(--white)', lineHeight: 1.1 }}>
                {player.name}
              </h2>
              <div className="glass rounded-xl px-5 py-3 flex flex-col gap-1 self-start">
                <span className="text-[10px] tracking-widest" style={{ color: 'var(--muted)', fontFamily: 'kanit' }}>BATCH</span>
                <span className="text-2xl" style={{ color: 'var(--accent)', fontFamily: 'kanit' }}>{player.batch}</span>
              </div>
              {(isSold || player.status) ? (
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ background: 'var(--red)', boxShadow: '0 0 6px var(--red)' }} />
                  <span className="text-sm tracking-widest" style={{ color: 'var(--red)', fontFamily: 'kanit' }}>SOLD</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ background: 'var(--accent)', boxShadow: '0 0 6px var(--accent)' }} />
                  <span className="text-sm tracking-widest" style={{ color: 'var(--accent)', fontFamily: 'kanit' }}>AVAILABLE</span>
                </div>
              )}
            </>
          )}
          <div className="flex flex-col gap-2 mt-auto">
            <Hint keys={['←', '→']} label="navigate" />
            <Hint keys={['Ctrl', 'Space']} label="search" />
            <Hint keys={['Ctrl', 'Alt', 'R']} label="random" />
          </div>
        </section>

        {/* CENTER */}
        <section className="flex-1 flex items-center justify-center relative">
          {player && (
            <div key={animKey + 'img'} className="relative anim-fade">
              <div className="absolute inset-0 rounded-full" style={{ background: 'radial-gradient(circle, rgba(245,200,66,0.12) 0%, transparent 70%)', transform: 'scale(1.3)' }} />
              <div className="relative overflow-hidden" style={{ width: 'clamp(220px,28vw,360px)', aspectRatio: '1/1', borderRadius: '50%', border: '4px solid var(--gold)', boxShadow: '0 0 40px rgba(245,200,66,0.3)' }}>
                <img src={`/images/${player.sl}.jpg`} alt={player.name} className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                {(isSold || player.status) && <div className="sold-stamp"><span className="sold-stamp-text">SOLD</span></div>}
              </div>
              <div className="absolute -bottom-2 -right-2 w-12 h-12 rounded-full text-xl flex items-center justify-center" style={{ background: 'var(--gold)', color: 'var(--pitch)', fontFamily: 'kanit', boxShadow: '0 0 16px rgba(245,200,66,0.5)' }}>
                {player.sl}
              </div>
            </div>
          )}
        </section>

        {/* RIGHT */}
        <section key={animKey + 'form'} className="w-80 shrink-0 flex items-center justify-center anim-left delay-2">
          <BidPanel player={player} onSold={() => setIsSold(true)} />
        </section>
      </main>

      {/* SEARCH MODAL */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(10,22,40,0.85)', backdropFilter: 'blur(12px)' }}>
          <div className="glass rounded-2xl p-6 flex flex-col gap-3 anim-up" style={{ minWidth: 360 }}>
            <p className="text-xs tracking-widest" style={{ color: 'var(--muted)', fontFamily: 'kanit' }}>JUMP TO PLAYER</p>
            <div className="flex gap-2">
              <input ref={inputRef} type="number" min={1} max={totalPlayers}
                className="flex-1 rounded-lg px-4 py-3 text-2xl outline-none"
                style={{ background: 'var(--pitch-light)', border: '2px solid var(--gold)', color: 'var(--white)', fontFamily: 'kanit' }}
                placeholder={`1 – ${totalPlayers}`} value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                onKeyDown={e => { if (e.code === 'Enter') { const n = parseInt(inputValue, 10); if (!isNaN(n) && n > 0) { setCurrentSL(n); setInputValue(''); setSearchOpen(false); } } }}
              />
              <button onClick={() => { const n = parseInt(inputValue, 10); if (!isNaN(n) && n > 0) { setCurrentSL(n); setInputValue(''); setSearchOpen(false); } }}
                className="px-5 rounded-lg text-sm tracking-widest transition-opacity hover:opacity-80"
                style={{ background: 'var(--gold)', color: 'var(--pitch)', fontFamily: 'kanit' }}>
                GO
              </button>
            </div>
            <p className="text-xs" style={{ color: 'var(--muted)' }}>Press <kbd className="kbd">Esc</kbd> to close</p>
          </div>
        </div>
      )}

      {/* TICKER */}
      <div className="fixed bottom-0 left-0 right-0 z-50 h-7 flex items-center overflow-hidden" style={{ background: 'linear-gradient(90deg, var(--pitch-mid), rgba(13,31,60,0.98))' }}>
        <div className="shrink-0 px-3 h-full flex items-center text-xs tracking-widest" style={{ background: 'var(--gold)', color: 'var(--pitch)', fontFamily: 'kanit' }}>LIVE</div>
        <div className="ticker-wrap flex-1 h-full flex items-center">
          <div className="ticker-inner text-xs px-8" style={{ color: 'var(--muted)', fontFamily: 'fredoka' }}>
            {TICKER_ITEMS.join('  ·  ')}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{TICKER_ITEMS.join('  ·  ')}
          </div>
        </div>
      </div>

      <RandomPopup visible={randomVisible} onClose={() => setRandomVisible(false)} playerSL={randomSL} loading={loadingRandom} />
    </div>
  );
}