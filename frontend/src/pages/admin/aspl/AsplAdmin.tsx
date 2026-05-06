// src/pages/admin/aspl/AsplAdmin.tsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Trophy, Plus, Eye, EyeOff, ToggleLeft, ToggleRight,
  ChevronRight, Footprints, CircleDot, Clock, CheckCircle2,
  PlayCircle, Trash2, Users, Monitor
} from 'lucide-react';
import { asplApi, AsplSeason } from '../../../lib/api';
import SeasonForm from './SeasonForm';

const STATUS_META: Record<string, { label: string; color: string; Icon: React.ElementType }> = {
  DRAFT:     { label: 'Draft',     color: 'bg-gray-100 text-gray-600',  Icon: Clock },
  ACTIVE:    { label: 'Active',    color: 'bg-green-100 text-green-700', Icon: PlayCircle },
  COMPLETED: { label: 'Completed', color: 'bg-blue-100 text-blue-700',   Icon: CheckCircle2 },
};

function StatusBadge({ status }: { status: string }) {
  const { label, color, Icon } = STATUS_META[status] || STATUS_META.DRAFT;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${color}`}>
      <Icon className="w-3 h-3" /> {label}
    </span>
  );
}

export default function AsplAdmin() {
  const [seasons, setSeasons] = useState<AsplSeason[]>([]);
  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    setVisible(asplApi.getSettings().visible);
    load();
  }, []);

  const load = () => {
    setLoading(true);
    asplApi.getSeasons()
      .then(setSeasons)
      .catch(() => setError('Failed to load seasons.'))
      .finally(() => setLoading(false));
  };

  const handleToggle = () => {
    const next = !visible;
    setVisible(next);
    asplApi.saveSettings({ visible: next });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleActivate = async (id: number) => {
    try {
      await asplApi.updateSeason(id, { status: 'ACTIVE' });
      load();
    } catch { setError('Failed to activate season.'); }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this season and all its teams? This cannot be undone.')) return;
    setDeleting(id);
    try {
      await asplApi.deleteSeason(id);
      setSeasons(s => s.filter(x => x.id !== id));
    } catch { setError('Failed to delete season.'); }
    finally { setDeleting(null); }
  };

  const handleCreated = (season: AsplSeason) => {
    setSeasons(s => [season, ...s]);
    setShowForm(false);
  };

  const activeSeason = seasons.find(s => s.status === 'ACTIVE');

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#F5F7FA] py-8 px-4">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-[#1F2A44] flex items-center justify-center">
              <Trophy className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#1F2A44]">ASPL Management</h1>
              <p className="text-sm text-gray-500">Applied Statistics Premier League</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {activeSeason && (
              <Link to="/admin/aspl/slideshow"
                className="flex items-center gap-2 bg-[#1F2A44] hover:bg-[#2F5BEA] text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors">
                <Monitor className="w-4 h-4" /> Open Slideshow
              </Link>
            )}
            <button onClick={() => setShowForm(true)}
              className="flex items-center gap-2 bg-[#2F5BEA] hover:bg-[#1a3fc7] text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors">
              <Plus className="w-4 h-4" /> New Season
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-5 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-center justify-between">
            {error}
            <button onClick={() => setError('')} className="ml-4 text-red-400 hover:text-red-600">✕</button>
          </div>
        )}

        {/* Nav visibility toggle */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${visible ? 'bg-[#2ECC71]' : 'bg-gray-200'}`}>
              {visible ? <Eye className="w-5 h-5 text-white" /> : <EyeOff className="w-5 h-5 text-gray-400" />}
            </div>
            <div>
              <p className="font-semibold text-[#1F2A44] text-sm">ASPL Navigation Button</p>
              <p className="text-xs text-gray-500">{visible ? 'Visible to all visitors' : 'Hidden from public navigation'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {saved && <span className="text-xs text-[#2ECC71] font-medium">Saved</span>}
            <button onClick={handleToggle}>
              {visible
                ? <ToggleRight className="w-10 h-10 text-[#2ECC71] hover:text-green-600 transition-colors" />
                : <ToggleLeft className="w-10 h-10 text-gray-300 hover:text-gray-400 transition-colors" />}
            </button>
          </div>
        </div>

        {/* Season list */}
        <div className="space-y-4">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest px-1">Seasons</h2>

          {loading ? (
            <div className="bg-white rounded-2xl p-12 flex justify-center shadow-sm border border-gray-100">
              <div className="w-7 h-7 border-2 border-[#2F5BEA] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : seasons.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100">
              <Trophy className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No seasons yet</p>
              <p className="text-sm text-gray-400 mt-1">Create your first season to get started</p>
              <button onClick={() => setShowForm(true)}
                className="mt-4 inline-flex items-center gap-2 bg-[#2F5BEA] text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#1a3fc7] transition-colors">
                <Plus className="w-4 h-4" /> New Season
              </button>
            </div>
          ) : seasons.map(season => (
            <div key={season.id}
              className={`bg-white rounded-2xl shadow-sm border transition-all ${season.status === 'ACTIVE' ? 'border-[#2ECC71] ring-1 ring-[#2ECC71]/20' : 'border-gray-100 hover:border-gray-200'}`}>
              <div className="flex items-center gap-4 p-5">

                {/* Sport icon */}
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${season.sport === 'FOOTBALL' ? 'bg-[#2F5BEA]/10 text-[#2F5BEA]' : 'bg-[#F39C12]/10 text-[#F39C12]'}`}>
                  {season.sport === 'FOOTBALL'
                    ? <Footprints className="w-5 h-5" />
                    : <CircleDot className="w-5 h-5" />}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-[#1F2A44] text-base">{season.name}</h3>
                    <StatusBadge status={season.status} />
                    <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{season.sport}</span>
                  </div>
                  <div className="flex items-center gap-4 mt-1.5 text-xs text-gray-500 flex-wrap">
                    <span><span className="font-medium text-[#1F2A44]">{season._count?.teams ?? 0}</span> teams</span>
                    <span><span className="font-medium text-[#1F2A44]">{season.total_players}</span> players</span>
                    {(season._count?.registrations ?? 0) > 0 && (
                      <span className="flex items-center gap-1 text-amber-600 font-semibold">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                        {season._count!.registrations} registration{season._count!.registrations > 1 ? 's' : ''}
                      </span>
                    )}
                    <span>Squad {season.min_squad_size}–{season.max_squad_size}</span>
                    <span>Balance <span className="font-medium text-[#1F2A44]">${season.starting_balance}</span></span>
                    <span>Min bid <span className="font-medium text-[#1F2A44]">${season.min_bid_price}</span></span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {season.status === 'DRAFT' && (
                    <button onClick={() => handleActivate(season.id)}
                      className="flex items-center gap-1.5 text-xs font-semibold text-[#2ECC71] border border-[#2ECC71]/40 hover:bg-green-50 px-3 py-1.5 rounded-lg transition-colors">
                      <PlayCircle className="w-3.5 h-3.5" /> Activate
                    </button>
                  )}
                  <Link to={`/admin/aspl/seasons/${season.id}`}
                    className="flex items-center gap-1.5 text-xs font-semibold text-[#2F5BEA] border border-[#2F5BEA]/20 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors">
                    <Users className="w-3.5 h-3.5" /> Manage
                    <ChevronRight className="w-3 h-3" />
                  </Link>
                  <button onClick={() => handleDelete(season.id)} disabled={deleting === season.id}
                    className="p-1.5 text-gray-300 hover:text-red-400 transition-colors rounded-lg hover:bg-red-50 disabled:opacity-50">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 text-center">
          <Link to="/aspl" className="text-sm text-[#2F5BEA] hover:underline inline-flex items-center gap-1">
            <Eye className="w-3.5 h-3.5" /> View public ASPL page
          </Link>
        </div>
      </div>

      {showForm && <SeasonForm onCreated={handleCreated} onClose={() => setShowForm(false)} />}
    </div>
  );
}
