// src/pages/admin/aspl/SeasonForm.tsx
import { useState } from 'react';
import { X, Footprints, CircleDot, AlertTriangle } from 'lucide-react';
import { asplApi, AsplSeason, AsplSport } from '../../../lib/api';

interface Props {
  /** Present for edit, absent for create. */
  season?: AsplSeason;
  onSaved: (s: AsplSeason) => void;
  onClose: () => void;
}

const SPORT_OPTIONS: { value: AsplSport; label: string; desc: string; icon: React.ElementType; positions: string[] }[] = [
  {
    value: 'FOOTBALL', label: 'Football', icon: Footprints,
    desc: 'GK, DEF, MID, FWD and more',
    positions: ['GK', 'LB', 'RB', 'DEF', 'CDM', 'CM', 'MID', 'LW', 'RW', 'CF', 'FWD'],
  },
  {
    value: 'CRICKET', label: 'Cricket', icon: CircleDot,
    desc: 'BAT, BOWL, AR, WK',
    positions: ['BAT', 'BOWL', 'AR', 'WK'],
  },
];

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-[#1F2A44] mb-1.5">{label}</label>
      {children}
      {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
    </div>
  );
}

function NumberInput({ value, onChange, min, max }: { value: number; onChange: (v: number) => void; min?: number; max?: number }) {
  return (
    <input type="number" value={value} min={min} max={max}
      onChange={e => onChange(parseInt(e.target.value) || 0)}
      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-[#1F2A44] focus:outline-none focus:border-[#2F5BEA] focus:ring-1 focus:ring-[#2F5BEA]/20" />
  );
}

function Warning({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-2.5 bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-xl text-xs">
      <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-px" />
      <div className="space-y-1">{children}</div>
    </div>
  );
}

export default function SeasonForm({ season, onSaved, onClose }: Props) {
  const isEdit = !!season;

  const [name, setName] = useState(season?.name ?? '');
  const [sport, setSport] = useState<AsplSport>(season?.sport ?? 'FOOTBALL');
  const [maxSquad, setMaxSquad] = useState(season?.max_squad_size ?? 15);
  const [minSquad, setMinSquad] = useState(season?.min_squad_size ?? 11);
  const [minBid, setMinBid] = useState(season?.min_bid_price ?? 20);
  const [balance, setBalance] = useState(season?.starting_balance ?? 1000);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const selectedSport = SPORT_OPTIONS.find(s => s.value === sport)!;

  // Positions are stored on each registration as plain strings from the sport
  // that was selected at the time, so switching sport strands them: a squad of
  // GK/DEF/MID rows under a cricket season matches none of BAT/BOWL/AR/WK.
  const squadCount = (season?._count?.players ?? 0) + (season?._count?.registrations ?? 0);
  const sportChanged = isEdit && sport !== season!.sport;
  const teamCount = season?._count?.teams ?? 0;

  const handleSubmit = async () => {
    if (!name.trim()) { setError('Season name is required.'); return; }
    if (minSquad > maxSquad) { setError('Min squad size cannot exceed max.'); return; }
    setSubmitting(true);
    setError('');
    try {
      const payload = {
        name: name.trim(),
        sport,
        max_squad_size: maxSquad,
        min_squad_size: minSquad,
        min_bid_price: minBid,
        starting_balance: balance,
      };
      const saved = isEdit
        ? await asplApi.updateSeason(season!.id, payload)
        : await asplApi.createSeason(payload);
      onSaved(saved);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : `Failed to ${isEdit ? 'save' : 'create'} season.`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(4px)' }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-[#1F2A44]">{isEdit ? 'Edit Season' : 'New Season'}</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {isEdit ? `Updating ${season!.name}` : 'Configure your ASPL season settings'}
            </p>
          </div>
          <button onClick={onClose} aria-label="Close" className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">{error}</div>
          )}

          {/* Season name */}
          <Field label="Season Name" hint='e.g. "ASPL 2025" or "Spring League 2025"'>
            <input type="text" value={name} onChange={e => setName(e.target.value)}
              placeholder="ASPL 2025"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-[#1F2A44] focus:outline-none focus:border-[#2F5BEA] focus:ring-1 focus:ring-[#2F5BEA]/20 placeholder:text-gray-300" />
          </Field>

          {/* Sport selector */}
          <Field label="Sport" hint="Determines available playing positions in the registration form">
            <div className="grid grid-cols-2 gap-3">
              {SPORT_OPTIONS.map(opt => {
                const Icon = opt.icon;
                const sel = sport === opt.value;
                return (
                  <button key={opt.value} type="button" onClick={() => setSport(opt.value)}
                    className={`flex flex-col items-start p-4 rounded-xl border-2 text-left transition-all ${sel ? 'border-[#2F5BEA] bg-[#2F5BEA]/5' : 'border-gray-200 hover:border-gray-300'}`}>
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-2 ${sel ? 'bg-[#2F5BEA] text-white' : 'bg-gray-100 text-gray-500'}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <p className={`font-semibold text-sm ${sel ? 'text-[#2F5BEA]' : 'text-[#1F2A44]'}`}>{opt.label}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{opt.desc}</p>
                  </button>
                );
              })}
            </div>

            {/* Position preview */}
            <div className="mt-3 p-3 bg-gray-50 rounded-xl">
              <p className="text-xs text-gray-500 mb-2 font-medium">Positions for {selectedSport.label}</p>
              <div className="flex flex-wrap gap-1.5">
                {selectedSport.positions.map(p => (
                  <span key={p} className="text-xs bg-white border border-gray-200 text-gray-600 px-2 py-0.5 rounded-md font-mono">{p}</span>
                ))}
              </div>
            </div>

            {sportChanged && squadCount > 0 && (
              <div className="mt-3">
                <Warning>
                  <p>
                    <span className="font-semibold">Switching from {season!.sport} to {sport}</span> leaves the{' '}
                    {squadCount} existing player{squadCount > 1 ? 's' : ''} on this season holding{' '}
                    {season!.sport} positions, which are not {sport} positions.
                  </p>
                  <p>Each of them will need their position set again.</p>
                </Warning>
              </div>
            )}
          </Field>

          {/* Squad sizes */}
          <div>
            <p className="text-sm font-semibold text-[#1F2A44] mb-3">Squad Size</p>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Minimum" hint="Minimum players per team">
                <NumberInput value={minSquad} onChange={setMinSquad} min={1} max={maxSquad} />
              </Field>
              <Field label="Maximum" hint="Maximum players per team">
                <NumberInput value={maxSquad} onChange={setMaxSquad} min={minSquad} />
              </Field>
            </div>

            {/* Squad limits are not enforced retroactively, so say so rather than
                letting an admin assume existing squads were re-checked. */}
            {isEdit && teamCount > 0 && (
              (minSquad !== season!.min_squad_size || maxSquad !== season!.max_squad_size) && (
                <div className="mt-3">
                  <Warning>
                    <p>
                      New limits apply to future squad changes only — the {teamCount} existing
                      team{teamCount > 1 ? 's are' : ' is'} not re-checked against them.
                    </p>
                  </Warning>
                </div>
              )
            )}
          </div>

          {/* Financial settings */}
          <div>
            <p className="text-sm font-semibold text-[#1F2A44] mb-3">Financial Settings</p>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Starting Balance ($)" hint="Each team starts with this">
                <NumberInput value={balance} onChange={setBalance} min={100} />
              </Field>
              <Field label="Minimum Bid ($)" hint="Smallest allowed bid per player">
                <NumberInput value={minBid} onChange={setMinBid} min={1} />
              </Field>
            </div>

            {isEdit && balance !== season!.starting_balance && teamCount > 0 && (
              <div className="mt-3">
                <Warning>
                  <p>Changing the starting balance does not refund or re-bill bids already placed.</p>
                </Warning>
              </div>
            )}
          </div>

          {/* Summary */}
          <div className="bg-[#F5F7FA] rounded-xl p-4 text-xs text-gray-500 space-y-1">
            <p className="font-semibold text-[#1F2A44] text-sm mb-2">Summary</p>
            {isEdit
              ? <p>Status stays <span className="font-semibold text-gray-700">{season!.status}</span> — use Activate on the season list to change it</p>
              : <p>Season will be created as <span className="font-semibold text-gray-700">Draft</span> - activate it when ready</p>}
            <p>Each team gets <span className="font-semibold text-gray-700">${balance}</span> to bid, min bid of <span className="font-semibold text-gray-700">${minBid}</span></p>
            <p>Teams must field {minSquad}–{maxSquad} players</p>
            <p>Positions available: {selectedSport.positions.join(', ')}</p>
            {isEdit && (
              <p>
                Player pool: <span className="font-semibold text-gray-700">{season!.total_players}</span>{' '}
                — counted live from registered players, not set here
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
          <button onClick={onClose} disabled={submitting}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-100 transition-colors">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={submitting || !name.trim()}
            className="px-6 py-2.5 rounded-xl text-sm font-semibold bg-[#2F5BEA] hover:bg-[#1a3fc7] text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
            {submitting
              ? <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> {isEdit ? 'Saving…' : 'Creating…'}</>
              : (isEdit ? 'Save Changes' : 'Create Season')}
          </button>
        </div>
      </div>
    </div>
  );
}
