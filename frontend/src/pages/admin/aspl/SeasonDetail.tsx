// src/pages/admin/aspl/SeasonDetail.tsx
import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft, Plus, Trash2, Upload, X, Edit2, Check,
  Footprints, CircleDot, Users, DollarSign, ShieldCheck,
  PlayCircle, Clock, CheckCircle2, AlertTriangle, XCircle,
  ClipboardList, ChevronDown, ChevronUp, Mail, Phone, Calendar,
  ToggleLeft, ToggleRight, UserPlus
} from 'lucide-react';
import { asplApi, AsplSeason, AsplTeam, AsplRegistration } from '../../../lib/api';

const STATUS_META: Record<string, { label: string; color: string; Icon: React.ElementType }> = {
  DRAFT:     { label: 'Draft',     color: 'bg-gray-100 text-gray-600',  Icon: Clock },
  ACTIVE:    { label: 'Active',    color: 'bg-green-100 text-green-700', Icon: PlayCircle },
  COMPLETED: { label: 'Completed', color: 'bg-blue-100 text-blue-700',   Icon: CheckCircle2 },
};

// ── Team Form (inline) ────────────────────────────────────────────────────────
function TeamForm({
  seasonId, startingBalance, onSaved, onClose, editing,
}: {
  seasonId: number;
  startingBalance: number;
  onSaved: (team: AsplTeam) => void;
  onClose: () => void;
  editing?: AsplTeam | null;
}) {
  const [ownerName, setOwnerName] = useState(editing?.owner_name ?? '');
  const [teamName, setTeamName]   = useState(editing?.team_name ?? '');
  const [color, setColor]         = useState(editing?.color ?? '#2F5BEA');
  const [logoFile, setLogoFile]   = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(
    editing?.logo_url ? asplApi.imageUrl(editing.logo_url) : null
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async () => {
    if (!ownerName.trim() || !teamName.trim()) { setError('Owner name and team name are required.'); return; }
    setSubmitting(true);
    setError('');
    try {
      const fd = new FormData();
      fd.append('season_id', String(seasonId));
      fd.append('owner_name', ownerName.trim());
      fd.append('team_name', teamName.trim());
      fd.append('color', color);
      if (logoFile) fd.append('logo', logoFile);

      const team = editing
        ? await asplApi.updateTeam(editing.id, fd)
        : await asplApi.createTeam(fd);
      onSaved(team);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save team.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-[#F5F7FA] rounded-2xl p-5 border-2 border-[#2F5BEA]/20">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-[#1F2A44] text-sm">{editing ? 'Edit Team' : 'Add Team'}</h3>
        <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-200 transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      {error && <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-3 py-2.5 rounded-xl text-xs">{error}</div>}

      <div className="space-y-4">
        {/* Logo upload */}
        <div className="flex items-center gap-4">
          <div
            onClick={() => fileRef.current?.click()}
            className="w-16 h-16 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-[#2F5BEA] transition-colors overflow-hidden relative group"
            style={{ background: logoPreview ? 'transparent' : undefined }}>
            {logoPreview
              ? <img src={logoPreview} alt="logo" className="w-full h-full object-cover" />
              : <Upload className="w-5 h-5 text-gray-300 group-hover:text-[#2F5BEA] transition-colors" />}
            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-xl">
              <Upload className="w-4 h-4 text-white" />
            </div>
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
          <div className="flex-1">
            <p className="text-xs font-semibold text-[#1F2A44] mb-1">Team Logo</p>
            <p className="text-xs text-gray-400">Click to upload · PNG, JPG, WebP</p>
          </div>
          {/* Color picker */}
          <div className="flex flex-col items-center gap-1">
            <label className="text-[10px] text-gray-400 font-medium">Color</label>
            <input type="color" value={color} onChange={e => setColor(e.target.value)}
              className="w-10 h-10 rounded-lg cursor-pointer border border-gray-200 p-0.5" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Owner Name *</label>
            <input type="text" value={ownerName} onChange={e => setOwnerName(e.target.value)}
              placeholder="e.g. Rahim"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#2F5BEA] focus:ring-1 focus:ring-[#2F5BEA]/20 placeholder:text-gray-300 bg-white" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Team Name *</label>
            <input type="text" value={teamName} onChange={e => setTeamName(e.target.value)}
              placeholder="e.g. Thunder FC"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#2F5BEA] focus:ring-1 focus:ring-[#2F5BEA]/20 placeholder:text-gray-300 bg-white" />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <button onClick={onClose} disabled={submitting}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-200 transition-colors">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={submitting || !ownerName.trim() || !teamName.trim()}
            className="px-5 py-2 rounded-xl text-sm font-semibold bg-[#2F5BEA] hover:bg-[#1a3fc7] text-white transition-colors disabled:opacity-50 flex items-center gap-2">
            {submitting
              ? <><div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Saving…</>
              : <><Check className="w-3.5 h-3.5" /> {editing ? 'Save Changes' : 'Add Team'}</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Team Card ─────────────────────────────────────────────────────────────────
function TeamCard({ team, balance, onEdit, onDelete }: {
  team: AsplTeam; balance: number; onEdit: () => void; onDelete: () => void;
}) {
  const logoUrl = asplApi.imageUrl(team.logo_url);
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-4 hover:border-gray-200 transition-all group">
      {/* Logo / color swatch */}
      <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center"
        style={{ background: logoUrl ? undefined : team.color + '22', border: `2px solid ${team.color}33` }}>
        {logoUrl
          ? <img src={logoUrl} alt={team.team_name} className="w-full h-full object-contain p-1" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          : <span className="text-xl font-bold" style={{ color: team.color }}>{team.team_name[0]}</span>}
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-bold text-[#1F2A44] text-sm truncate">{team.team_name}</p>
        <p className="text-xs text-gray-400 mt-0.5">Owner: <span className="text-gray-600 font-medium">{team.owner_name}</span></p>
        <div className="flex items-center gap-1 mt-1">
          <div className="w-2 h-2 rounded-full" style={{ background: team.color }} />
          <span className="text-[10px] text-gray-400 font-mono">{team.color}</span>
        </div>
      </div>

      <div className="flex flex-col items-end gap-2">
        <div className="text-right">
          <p className="text-xs text-gray-400">Starting balance</p>
          <p className="font-bold text-[#2F5BEA]">${balance}</p>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={onEdit} className="p-1.5 rounded-lg text-gray-400 hover:text-[#2F5BEA] hover:bg-blue-50 transition-colors">
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button onClick={onDelete} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function SeasonDetail() {
  const { id } = useParams<{ id: string }>();
  const [season, setSeason] = useState<AsplSeason | null>(null);
  const [teams, setTeams] = useState<AsplTeam[]>([]);
  const [registrations, setRegistrations] = useState<AsplRegistration[]>([]);
  const [regFilter, setRegFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING');
  const [actionNote, setActionNote] = useState<Record<number, string>>({});
  const [actioning, setActioning] = useState<number | null>(null);
  const [regExpanded, setRegExpanded] = useState<number | null>(null);
  const [togglingReg, setTogglingReg] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTeam, setEditingTeam] = useState<AsplTeam | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [error, setError] = useState('');

  useEffect(() => { load(); }, [id]);

  const load = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [s, ts, regs] = await Promise.all([
        asplApi.getSeasonById(parseInt(id)),
        asplApi.getTeams(parseInt(id)),
        asplApi.getRegistrations(parseInt(id)),
      ]);
      setSeason(s);
      setTeams(ts);
      setRegistrations(regs);
    } catch { setError('Failed to load season.'); }
    finally { setLoading(false); }
  };

  const handleApprove = async (reg: AsplRegistration) => {
    setActioning(reg.id);
    try {
      await asplApi.approveRegistration(reg.id, actionNote[reg.id]);
      setRegistrations(rs => rs.map(r => r.id === reg.id ? { ...r, status: 'APPROVED', conflict_note: null } : r));
      setRegExpanded(null);
    } catch { setError('Failed to approve registration.'); }
    finally { setActioning(null); }
  };

  const handleReject = async (reg: AsplRegistration) => {
    setActioning(reg.id);
    try {
      await asplApi.rejectRegistration(reg.id, actionNote[reg.id]);
      setRegistrations(rs => rs.map(r => r.id === reg.id ? { ...r, status: 'REJECTED', conflict_note: null } : r));
      setRegExpanded(null);
    } catch { setError('Failed to reject registration.'); }
    finally { setActioning(null); }
  };

  const handleDeleteReg = async (id: number) => {
    if (!window.confirm('Delete this registration?')) return;
    try {
      await asplApi.deleteRegistration(id);
      setRegistrations(rs => rs.filter(r => r.id !== id));
    } catch { setError('Failed to delete registration.'); }
  };

  const handleTeamSaved = (team: AsplTeam) => {
    setTeams(ts => {
      const idx = ts.findIndex(t => t.id === team.id);
      return idx >= 0 ? ts.map(t => t.id === team.id ? team : t) : [...ts, team];
    });
    setShowForm(false);
    setEditingTeam(null);
  };

  const handleDeleteTeam = async (teamId: number) => {
    if (!window.confirm('Remove this team?')) return;
    setDeleting(teamId);
    try {
      await asplApi.deleteTeam(teamId);
      setTeams(ts => ts.filter(t => t.id !== teamId));
    } catch { setError('Failed to delete team.'); }
    finally { setDeleting(null); }
  };

  const handleActivate = async () => {
    if (!season) return;
    try {
      const updated = await asplApi.updateSeason(season.id, { status: 'ACTIVE' });
      setSeason(updated);
    } catch { setError('Failed to activate season.'); }
  };

  const handleToggleRegistration = async () => {
    if (!season) return;
    setTogglingReg(true);
    try {
      const updated = await asplApi.updateSeason(season.id, { registration_open: !season.registration_open });
      setSeason(updated);
    } catch { setError('Failed to update registration setting.'); }
    finally { setTogglingReg(false); }
  };

  if (loading) return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#F5F7FA] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-[#2F5BEA] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!season) return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#F5F7FA] flex items-center justify-center">
      <div className="text-center">
        <p className="text-gray-500 font-medium">Season not found</p>
        <Link to="/admin/aspl" className="text-[#2F5BEA] text-sm hover:underline mt-2 inline-block">← Back</Link>
      </div>
    </div>
  );

  const { label: statusLabel, color: statusColor, Icon: StatusIcon } = STATUS_META[season.status] || STATUS_META.DRAFT;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#F5F7FA] py-8 px-4">
      <div className="max-w-4xl mx-auto">

        {/* Back + header */}
        <Link to="/admin/aspl" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#2F5BEA] transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" /> All Seasons
        </Link>

        {error && (
          <div className="mb-5 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-center justify-between">
            {error} <button onClick={() => setError('')} className="ml-4 text-red-400 hover:text-red-600">✕</button>
          </div>
        )}

        {/* Season header card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${season.sport === 'FOOTBALL' ? 'bg-[#2F5BEA]/10 text-[#2F5BEA]' : 'bg-[#F39C12]/10 text-[#F39C12]'}`}>
                {season.sport === 'FOOTBALL' ? <Footprints className="w-7 h-7" /> : <CircleDot className="w-7 h-7" />}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl font-bold text-[#1F2A44]">{season.name}</h1>
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${statusColor}`}>
                    <StatusIcon className="w-3 h-3" /> {statusLabel}
                  </span>
                </div>
                <p className="text-sm text-gray-400 mt-0.5">{season.sport} · Created {new Date(season.created_at).toLocaleDateString()}</p>
              </div>
            </div>
            {season.status === 'DRAFT' && (
              <button onClick={handleActivate}
                className="flex items-center gap-2 bg-[#2ECC71] hover:bg-[#27ae60] text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors flex-shrink-0">
                <PlayCircle className="w-4 h-4" /> Activate Season
              </button>
            )}
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
            {[
              { icon: Users,       label: 'Teams',           value: teams.length },
              { icon: ShieldCheck, label: 'Player Pool',     value: season.total_players },
              { icon: DollarSign,  label: 'Starting Balance',value: `$${season.starting_balance}` },
              { icon: DollarSign,  label: 'Min Bid',         value: `$${season.min_bid_price}` },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="bg-[#F5F7FA] rounded-xl p-3 text-center">
                <Icon className="w-4 h-4 text-gray-400 mx-auto mb-1" />
                <p className="font-bold text-[#1F2A44]">{value}</p>
                <p className="text-xs text-gray-400">{label}</p>
              </div>
            ))}
          </div>

          {/* Config pills */}
          <div className="flex flex-wrap gap-2 mt-4">
            {[
              `Squad: ${season.min_squad_size}–${season.max_squad_size} players`,
              `Positions: ${asplApi.getPositions(season.sport).join(', ')}`,
            ].map(pill => (
              <span key={pill} className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full">{pill}</span>
            ))}
          </div>

          {/* Registration toggle */}
          <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${season.registration_open ? 'bg-[#2ECC71]/15 text-[#2ECC71]' : 'bg-gray-100 text-gray-400'}`}>
                <UserPlus className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#1F2A44]">Player Registration</p>
                <p className="text-xs text-gray-400">
                  {season.registration_open ? 'Registration button visible on public page' : 'Registration button hidden from public'}
                </p>
              </div>
            </div>
            <button onClick={handleToggleRegistration} disabled={togglingReg}
              className="flex items-center gap-2 transition-opacity disabled:opacity-50">
              <span className={`text-xs font-semibold ${season.registration_open ? 'text-[#2ECC71]' : 'text-gray-400'}`}>
                {season.registration_open ? 'Open' : 'Closed'}
              </span>
              {season.registration_open
                ? <ToggleRight className="w-10 h-10 text-[#2ECC71] hover:text-green-600 transition-colors" />
                : <ToggleLeft className="w-10 h-10 text-gray-300 hover:text-gray-400 transition-colors" />}
            </button>
          </div>
        </div>

        {/* Teams section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-[#1F2A44]">Teams <span className="text-gray-400 font-normal ml-1">({teams.length})</span></h2>
            {!showForm && !editingTeam && (
              <button onClick={() => setShowForm(true)}
                className="flex items-center gap-1.5 bg-[#2F5BEA] hover:bg-[#1a3fc7] text-white px-3.5 py-2 rounded-xl text-sm font-semibold transition-colors">
                <Plus className="w-4 h-4" /> Add Team
              </button>
            )}
          </div>

          <div className="space-y-3">
            {/* Inline add form */}
            {showForm && !editingTeam && (
              <TeamForm
                seasonId={season.id}
                startingBalance={season.starting_balance}
                onSaved={handleTeamSaved}
                onClose={() => setShowForm(false)}
              />
            )}

            {teams.length === 0 && !showForm ? (
              <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-10 text-center">
                <Users className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                <p className="text-gray-500 font-medium text-sm">No teams yet</p>
                <p className="text-xs text-gray-400 mt-1 mb-4">Add teams with their owner, name, logo and color</p>
                <button onClick={() => setShowForm(true)}
                  className="inline-flex items-center gap-2 bg-[#2F5BEA] text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-[#1a3fc7] transition-colors">
                  <Plus className="w-4 h-4" /> Add First Team
                </button>
              </div>
            ) : (
              teams.map(team => (
                <div key={team.id}>
                  {editingTeam?.id === team.id ? (
                    <TeamForm
                      seasonId={season.id}
                      startingBalance={season.starting_balance}
                      editing={team}
                      onSaved={handleTeamSaved}
                      onClose={() => setEditingTeam(null)}
                    />
                  ) : (
                    <TeamCard
                      team={team}
                      balance={season.starting_balance}
                      onEdit={() => { setShowForm(false); setEditingTeam(team); }}
                      onDelete={() => handleDeleteTeam(team.id)}
                    />
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* ── Registrations ─────────────────────────────────────────────── */}
        {(() => {
          const pending   = registrations.filter(r => r.status === 'PENDING');
          const conflicts = pending.filter(r => r.conflict_note);
          const filtered  = regFilter === 'ALL' ? registrations : registrations.filter(r => r.status === regFilter);

          return (
            <div className="mt-8">
              <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-[#1F2A44]">Registrations</h2>
                  {conflicts.length > 0 && (
                    <span className="flex items-center gap-1 text-xs font-semibold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                      <AlertTriangle className="w-3 h-3" /> {conflicts.length} conflict{conflicts.length > 1 ? 's' : ''}
                    </span>
                  )}
                  {pending.length > 0 && (
                    <span className="text-xs font-semibold text-[#2F5BEA] bg-blue-50 px-2 py-0.5 rounded-full">
                      {pending.length} pending
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
                  {(['PENDING', 'APPROVED', 'REJECTED', 'ALL'] as const).map(f => (
                    <button key={f} onClick={() => setRegFilter(f)}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${regFilter === f ? 'bg-white text-[#1F2A44] shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>
                      {f === 'ALL' ? 'All' : f.charAt(0) + f.slice(1).toLowerCase()}
                      <span className="ml-1 opacity-60">({f === 'ALL' ? registrations.length : registrations.filter(r => r.status === f).length})</span>
                    </button>
                  ))}
                </div>
              </div>

              {filtered.length === 0 ? (
                <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-8 text-center">
                  <ClipboardList className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">No {regFilter.toLowerCase()} registrations</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filtered.map(reg => {
                    const isExpanded = regExpanded === reg.id;
                    const isConflict = !!reg.conflict_note;
                    const photoUrl = asplApi.imageUrl(reg.photo_url);
                    return (
                      <div key={reg.id}
                        className={`bg-white rounded-2xl border transition-all ${isConflict ? 'border-amber-200 ring-1 ring-amber-100' : 'border-gray-100'}`}>
                        <div className="flex items-center gap-3 p-4 cursor-pointer"
                          onClick={() => setRegExpanded(isExpanded ? null : reg.id)}>
                          <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100 flex items-center justify-center">
                            {photoUrl
                              ? <img src={photoUrl} alt={reg.member?.full_name ?? reg.email} className="w-full h-full object-cover" />
                              : <span className="text-sm font-bold text-gray-400">{(reg.member?.full_name ?? reg.email)[0].toUpperCase()}</span>}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-semibold text-[#1F2A44] text-sm">{reg.member?.full_name ?? reg.email}</p>
                              {isConflict && <AlertTriangle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />}
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                reg.status === 'PENDING'  ? 'bg-amber-50 text-amber-600' :
                                reg.status === 'APPROVED' ? 'bg-green-50 text-green-600' :
                                'bg-red-50 text-red-500'}`}>{reg.status}</span>
                            </div>
                            <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-400">
                              <span>Batch {reg.member?.batch ?? '—'}</span>
                              <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">{reg.playing_position}</span>
                              <span className="truncate">{reg.email}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {reg.status === 'PENDING' && (
                              <>
                                <button onClick={e => { e.stopPropagation(); handleApprove(reg); }} disabled={actioning === reg.id}
                                  className="flex items-center gap-1 text-xs font-semibold text-green-600 border border-green-200 hover:bg-green-50 px-2.5 py-1 rounded-lg transition-colors disabled:opacity-50">
                                  <Check className="w-3 h-3" /> Approve
                                </button>
                                <button onClick={e => { e.stopPropagation(); handleReject(reg); }} disabled={actioning === reg.id}
                                  className="flex items-center gap-1 text-xs font-semibold text-red-500 border border-red-200 hover:bg-red-50 px-2.5 py-1 rounded-lg transition-colors disabled:opacity-50">
                                  <X className="w-3 h-3" /> Reject
                                </button>
                              </>
                            )}
                            {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-300" /> : <ChevronDown className="w-4 h-4 text-gray-300" />}
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="px-4 pb-4 border-t border-gray-50 pt-3 space-y-3">
                            {isConflict && (
                              <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5 text-xs text-amber-700">
                                ⚠️ <span className="font-semibold">Conflict: </span>{reg.conflict_note}
                              </div>
                            )}
                            {reg.admin_note && (
                              <div className="bg-gray-50 border border-gray-100 rounded-xl px-3 py-2.5 text-xs text-gray-600">
                                📝 <span className="font-semibold">Note: </span>{reg.admin_note}
                              </div>
                            )}
                            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs text-gray-500">
                              <span className="flex items-center gap-1.5"><Mail className="w-3 h-3 text-gray-300" />{reg.email}</span>
                              <span className="flex items-center gap-1.5"><Phone className="w-3 h-3 text-gray-300" />{reg.member?.phone_number ?? '—'}</span>
                              <span className="flex items-center gap-1.5"><Calendar className="w-3 h-3 text-gray-300" />Batch {reg.member?.batch ?? '—'}</span>
                              <span className="flex items-center gap-1.5"><Users className="w-3 h-3 text-gray-300" />{reg.playing_position}</span>
                            </div>
                            <p className="text-[10px] text-gray-400">
                              Submitted {new Date(reg.created_at).toLocaleString()}
                              {reg.player_sl && <span className="ml-2 text-[#2F5BEA] font-semibold">→ Player #{reg.player_sl}</span>}
                            </p>
                            {reg.status === 'PENDING' && (
                              <div className="space-y-2 pt-1">
                                <input type="text"
                                  value={actionNote[reg.id] ?? ''}
                                  onChange={e => setActionNote(n => ({ ...n, [reg.id]: e.target.value }))}
                                  placeholder="Optional note to attach…"
                                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#2F5BEA]"
                                />
                                <div className="flex gap-2">
                                  <button onClick={() => handleApprove(reg)} disabled={actioning === reg.id}
                                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold text-white bg-green-500 hover:bg-green-600 transition-colors disabled:opacity-50">
                                    {actioning === reg.id
                                      ? <div className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                      : <CheckCircle2 className="w-3.5 h-3.5" />} Approve
                                  </button>
                                  <button onClick={() => handleReject(reg)} disabled={actioning === reg.id}
                                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold text-white bg-red-500 hover:bg-red-600 transition-colors disabled:opacity-50">
                                    <XCircle className="w-3.5 h-3.5" /> Reject
                                  </button>
                                  <button onClick={() => handleDeleteReg(reg.id)}
                                    className="px-3 py-2 rounded-xl text-xs text-gray-400 hover:text-red-500 hover:bg-red-50 border border-gray-100 transition-colors">
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            )}
                            {reg.status !== 'PENDING' && (
                              <button onClick={() => handleDeleteReg(reg.id)}
                                className="text-xs text-gray-400 hover:text-red-500 transition-colors flex items-center gap-1">
                                <Trash2 className="w-3 h-3" /> Delete record
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })()}

      </div>
    </div>
  );
}
