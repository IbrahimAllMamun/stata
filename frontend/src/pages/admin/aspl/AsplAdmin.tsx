// src/pages/admin/aspl/AsplAdmin.tsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Trophy, Monitor, Users, ToggleLeft, ToggleRight, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { asplApi, AsplPlayer, AsplTeam } from '../../../lib/api';

export default function AsplAdmin() {
  const [visible, setVisible] = useState(false);
  const [players, setPlayers] = useState<AsplPlayer[]>([]);
  const [teams, setTeams] = useState<AsplTeam[]>([]);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const settings = asplApi.getSettings();
    setVisible(settings.visible);
    Promise.all([asplApi.getPlayers(), asplApi.getTeams()])
      .then(([ps, ts]) => { setPlayers(ps); setTeams(ts); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleToggle = () => {
    const next = !visible;
    setVisible(next);
    asplApi.saveSettings({ visible: next });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const soldCount = players.filter(p => p.status).length;
  const availableCount = players.filter(p => !p.status).length;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#F5F7FA] py-8 px-4">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-[#1F2A44] flex items-center justify-center">
              <Trophy className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#1F2A44]">ASPL Management</h1>
              <p className="text-sm text-gray-500">Applied Statistics Premier League · 2024</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        {!loading && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Total Players', value: players.length, color: 'bg-[#1F2A44]' },
              { label: 'Sold', value: soldCount, color: 'bg-[#E74C3C]' },
              { label: 'Available', value: availableCount, color: 'bg-[#2ECC71]' },
              { label: 'Teams', value: teams.length, color: 'bg-[#F39C12]' },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                <div className={`w-9 h-9 ${color} rounded-lg flex items-center justify-center mb-3`}>
                  <Trophy className="w-4 h-4 text-white" />
                </div>
                <div className="text-2xl font-bold text-[#1F2A44]">{value}</div>
                <div className="text-xs text-gray-500 mt-0.5">{label}</div>
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

          {/* Visibility Toggle */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${visible ? 'bg-[#2ECC71]' : 'bg-gray-200'}`}>
                {visible ? <Eye className="w-6 h-6 text-white" /> : <EyeOff className="w-6 h-6 text-gray-500" />}
              </div>
              <div>
                <h2 className="font-bold text-[#1F2A44]">Navigation Visibility</h2>
                <p className="text-xs text-gray-500">Show or hide the ASPL button in the public nav</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-[#F5F7FA] mb-4">
              <div>
                <p className="font-semibold text-[#1F2A44] text-sm">ASPL Button</p>
                <p className="text-xs text-gray-500">{visible ? 'Visible to all visitors' : 'Hidden from navigation'}</p>
              </div>
              <button onClick={handleToggle} className="transition-transform hover:scale-105">
                {visible
                  ? <ToggleRight className="w-10 h-10 text-[#2ECC71]" />
                  : <ToggleLeft className="w-10 h-10 text-gray-400" />}
              </button>
            </div>

            {saved && (
              <div className="flex items-center gap-2 text-[#2ECC71] text-sm font-medium">
                <span className="w-2 h-2 rounded-full bg-[#2ECC71]" />
                Saved
              </div>
            )}

            <div className={`mt-3 px-3 py-2 rounded-lg text-xs font-medium ${visible ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-500'}`}>
              {visible ? '✓ ASPL link is live in navigation' : '○ ASPL link is currently hidden'}
            </div>
          </div>

          {/* Slideshow Link */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-[#1F2A44] flex items-center justify-center">
                <Monitor className="w-6 h-6 text-yellow-400" />
              </div>
              <div>
                <h2 className="font-bold text-[#1F2A44]">Auction Slideshow</h2>
                <p className="text-xs text-gray-500">Live player auction display</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-5">
              Opens the full-screen auction interface. Use keyboard shortcuts to navigate players and run the live auction.
            </p>
            <div className="flex flex-col gap-2 mb-4 text-xs text-gray-500">
              {[['← →', 'Navigate players'], ['Ctrl + Space', 'Search by number'], ['Ctrl + Alt + R', 'Random player']].map(([key, desc]) => (
                <div key={key} className="flex items-center gap-2">
                  <kbd className="bg-gray-100 border border-gray-200 px-2 py-0.5 rounded text-gray-700 font-mono text-[10px]">{key}</kbd>
                  <span>{desc}</span>
                </div>
              ))}
            </div>
            <Link to="/admin/aspl/slideshow"
              className="flex items-center justify-center gap-2 bg-[#1F2A44] hover:bg-[#2F5BEA] text-white px-5 py-3 rounded-xl text-sm font-semibold transition-colors w-full">
              <Monitor className="w-4 h-4" /> Open Slideshow <ArrowRight className="w-4 h-4 ml-auto" />
            </Link>
          </div>

          {/* Teams quick view */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 md:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#F39C12] flex items-center justify-center">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="font-bold text-[#1F2A44]">Teams</h2>
                  <p className="text-xs text-gray-500">Current balances</p>
                </div>
              </div>
              <Link to="/aspl" className="text-xs text-[#2F5BEA] hover:underline flex items-center gap-1">
                Public view <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            {loading ? (
              <div className="py-4 flex justify-center"><div className="w-6 h-6 border-2 border-[#2F5BEA] border-t-transparent rounded-full animate-spin" /></div>
            ) : teams.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">No teams found. Add teams via the database.</p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {teams.map(team => {
                  const pct = Math.max(0, Math.min(100, (team.balance / 1000) * 100));
                  return (
                    <div key={team.id} className="p-4 rounded-xl bg-[#F5F7FA] border border-gray-100">
                      <div className="flex items-center gap-2 mb-2">
                        <img src={`/logo/${team.team_name}.png`} alt={team.team_name} className="w-8 h-8 object-contain rounded"
                          onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                        <p className="font-semibold text-sm text-[#1F2A44] truncate">{team.team_name}</p>
                      </div>
                      <p className="text-lg font-bold text-[#2F5BEA]">${team.balance}</p>
                      <div className="mt-2 h-1.5 rounded-full bg-gray-200 overflow-hidden">
                        <div className="h-full rounded-full bg-gradient-to-r from-[#2F5BEA] to-[#2ECC71] transition-all" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
