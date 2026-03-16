// src/pages/admin/ManageAdmins.tsx
// Manage admin/mod roles — all from the Member table
import { useEffect, useState, useCallback } from 'react';
import {
  Shield, Trash2, KeyRound, Crown, Users, RefreshCw,
  AlertTriangle, X, CheckCircle, ChevronDown, Search,
} from 'lucide-react';
import { adminApi, imageUrl } from '../../lib/api';
import { useAuth, MemberUser } from '../../contexts/AuthContext';

type StaffMember = MemberUser & { created_at: string };

type Modal =
  | { type: 'role'; member: StaffMember }
  | { type: 'demote'; member: StaffMember }
  | null;

function Toast({ toast }: { toast: { msg: string; ok: boolean } | null }) {
  if (!toast) return null;
  return (
    <div className={`fixed top-5 right-5 z-50 flex items-center gap-2.5 px-5 py-3.5 rounded-2xl shadow-lg text-sm font-semibold text-white ${toast.ok ? 'bg-[#2ECC71]' : 'bg-[#E74C3C]'}`}>
      {toast.ok ? <CheckCircle className="w-4 h-4" /> : <X className="w-4 h-4" />}
      {toast.msg}
    </div>
  );
}

function RoleBadge({ role }: { role: string }) {
  if (role === 'admin')
    return <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-700 border border-amber-200 text-xs px-2.5 py-0.5 rounded-full font-semibold"><Crown className="w-3 h-3" /> Admin</span>;
  return <span className="inline-flex items-center gap-1 bg-purple-100 text-purple-700 border border-purple-200 text-xs px-2.5 py-0.5 rounded-full font-semibold"><Shield className="w-3 h-3" /> Moderator</span>;
}

// ── Role change modal ─────────────────────────────────────────────────────────
function RoleModal({ member, onClose, onChanged, showToast }: {
  member: StaffMember; onClose: () => void;
  onChanged: () => void; showToast: (m: string, ok?: boolean) => void;
}) {
  const [role, setRole] = useState<'member' | 'mod' | 'admin'>(member.role as any);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (role === member.role) { onClose(); return; }
    setLoading(true);
    try {
      await adminApi.updateMemberRole(member.id, role);
      showToast(`Role updated to ${role}`);
      onChanged(); onClose();
    } catch (err: any) {
      showToast(err.message || 'Failed to update role', false);
    } finally { setLoading(false); }
  };

  const photoSrc = imageUrl(member.photo_url);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(2px)' }}
      onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="bg-gradient-to-r from-[#1F2A44] to-[#2F5BEA] px-6 py-5 flex items-center justify-between">
          <div>
            <h3 className="text-white font-bold text-base">Change Role</h3>
            <p className="text-blue-200 text-xs mt-0.5">Update access level for this member</p>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center">
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Member info */}
        <div className="flex items-center gap-3 px-6 pt-5 pb-3">
          {photoSrc
            ? <img src={photoSrc} alt={member.full_name} className="w-10 h-10 rounded-xl object-cover border border-gray-100" />
            : <div className="w-10 h-10 rounded-xl bg-[#2F5BEA] flex items-center justify-center text-white font-bold">{member.full_name.charAt(0)}</div>
          }
          <div>
            <p className="font-semibold text-[#1F2A44] text-sm">{member.full_name}</p>
            <p className="text-xs text-gray-400">{member.email} · Batch {member.batch}</p>
          </div>
        </div>

        <div className="px-6 pb-4">
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Select Role</label>
          <div className="grid grid-cols-3 gap-3">
            {([
              { value: 'member', label: 'Member', icon: <Users className="w-4 h-4" />, color: 'border-blue-200 bg-blue-50', active: 'border-[#2F5BEA] bg-blue-50', text: 'text-[#2F5BEA]', desc: 'Regular member access' },
              { value: 'mod', label: 'Moderator', icon: <Shield className="w-4 h-4" />, color: 'border-gray-200', active: 'border-purple-400 bg-purple-50', text: 'text-purple-700', desc: 'Manage content' },
              { value: 'admin', label: 'Admin', icon: <Crown className="w-4 h-4" />, color: 'border-gray-200', active: 'border-amber-400 bg-amber-50', text: 'text-amber-700', desc: 'Full access' },
            ] as const).map(opt => (
              <button key={opt.value} onClick={() => setRole(opt.value)}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all ${role === opt.value ? opt.active : 'border-gray-200 hover:border-gray-300'}`}>
                <span className={role === opt.value ? opt.text : 'text-gray-400'}>{opt.icon}</span>
                <span className={`text-xs font-bold ${role === opt.value ? opt.text : 'text-gray-500'}`}>{opt.label}</span>
                <span className="text-[10px] text-gray-400 text-center leading-tight">{opt.desc}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="px-6 pb-6 flex gap-3">
          <button onClick={submit} disabled={loading || role === member.role}
            className="flex-1 flex items-center justify-center gap-2 bg-[#2F5BEA] hover:bg-[#1a3fc7] text-white py-2.5 rounded-xl text-sm font-semibold disabled:opacity-40 transition-colors">
            {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <KeyRound className="w-4 h-4" />}
            {loading ? 'Saving…' : 'Save Role'}
          </button>
          <button onClick={onClose} className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ── Promote member modal (search + promote) ───────────────────────────────────
function PromoteModal({ onClose, onPromoted, showToast }: {
  onClose: () => void; onPromoted: () => void;
  showToast: (m: string, ok?: boolean) => void;
}) {
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'mod' | 'admin'>('mod');
  const [promoting, setPromoting] = useState<string | null>(null);

  const doSearch = async () => {
    if (!search.trim()) return;
    setSearching(true);
    try {
      const res = await adminApi.getMembers({ limit: 10, search });
      // Filter out already-staff members
      setResults((res.data || []).filter((m: any) => m.role === 'member'));
    } catch { showToast('Search failed', false); }
    finally { setSearching(false); }
  };

  const promote = async (memberId: string) => {
    setPromoting(memberId);
    try {
      await adminApi.updateMemberRole(memberId, selectedRole);
      showToast(`Promoted to ${selectedRole}`);
      onPromoted(); onClose();
    } catch (err: any) {
      showToast(err.message || 'Failed to promote', false);
    } finally { setPromoting(null); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(2px)' }}
      onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="bg-gradient-to-r from-[#1F2A44] to-[#2F5BEA] px-6 py-5 flex items-center justify-between">
          <div>
            <h3 className="text-white font-bold text-base">Promote a Member</h3>
            <p className="text-blue-200 text-xs mt-0.5">Search and assign a role</p>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center">
            <X className="w-4 h-4 text-white" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          {/* Role select */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Role to assign</label>
            <div className="grid grid-cols-2 gap-3">
              {(['mod', 'admin'] as const).map(r => (
                <button key={r} onClick={() => setSelectedRole(r)}
                  className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all ${selectedRole === r ? (r === 'admin' ? 'border-amber-400 bg-amber-50' : 'border-purple-400 bg-purple-50') : 'border-gray-200'}`}>
                  {r === 'admin' ? <Crown className={`w-4 h-4 ${selectedRole === r ? 'text-amber-500' : 'text-gray-400'}`} /> : <Shield className={`w-4 h-4 ${selectedRole === r ? 'text-purple-500' : 'text-gray-400'}`} />}
                  <span className={`text-sm font-semibold capitalize ${selectedRole === r ? (r === 'admin' ? 'text-amber-700' : 'text-purple-700') : 'text-gray-500'}`}>{r === 'mod' ? 'Moderator' : 'Admin'}</span>
                </button>
              ))}
            </div>
          </div>
          {/* Search */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Search member</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && doSearch()}
                  placeholder="Name or email…" className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#2F5BEA] outline-none" />
              </div>
              <button onClick={doSearch} disabled={searching}
                className="px-4 py-2 bg-[#2F5BEA] text-white rounded-xl text-sm font-semibold disabled:opacity-50 hover:bg-[#1a3fc7] transition-colors">
                {searching ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Search'}
              </button>
            </div>
          </div>
          {/* Results */}
          {results.length > 0 && (
            <div className="space-y-2 max-h-52 overflow-y-auto">
              {results.map(m => {
                const photoSrc = imageUrl(m.photo_url);
                return (
                  <div key={m.id} className="flex items-center gap-3 p-3 bg-[#F5F7FA] rounded-xl">
                    {photoSrc
                      ? <img src={photoSrc} alt={m.full_name} className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
                      : <div className="w-9 h-9 rounded-full bg-[#2F5BEA] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">{m.full_name.charAt(0)}</div>
                    }
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-[#1F2A44] text-sm truncate">{m.full_name}</p>
                      <p className="text-xs text-gray-400 truncate">{m.email} · Batch {m.batch}</p>
                    </div>
                    <button onClick={() => promote(m.id)} disabled={promoting === m.id}
                      className="text-xs font-semibold bg-[#2F5BEA] text-white px-3 py-1.5 rounded-lg hover:bg-[#1a3fc7] disabled:opacity-50 flex-shrink-0">
                      {promoting === m.id ? '…' : 'Promote'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
          {results.length === 0 && search && !searching && (
            <p className="text-sm text-gray-400 text-center py-3">No eligible members found</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function ManageAdmins() {
  const { isFullAdmin, member: currentMember, loading: authLoading } = useAuth();
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<Modal | { type: 'promote' } | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const showToast = useCallback((msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.listStaff();
      setStaff(res.data as StaffMember[]);
    } catch (err: any) {
      showToast(err.message || 'Failed to load staff', false);
    } finally { setLoading(false); }
  }, [showToast]);

  useEffect(() => { if (!authLoading && isFullAdmin) load(); }, [authLoading, isFullAdmin, load]);

  if (!isFullAdmin) return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-[#F5F7FA]">
      <div className="text-center">
        <Shield className="w-12 h-12 text-gray-200 mx-auto mb-3" />
        <p className="text-gray-500 font-semibold">Admin access required</p>
      </div>
    </div>
  );

  const admins = staff.filter(s => s.role === 'admin');
  const mods = staff.filter(s => s.role === 'mod');

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#F5F7FA] py-8 px-4">
      <Toast toast={toast} />
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#1F2A44]">Staff Management</h1>
            <p className="text-gray-400 text-sm mt-0.5">{admins.length} admin{admins.length !== 1 ? 's' : ''} · {mods.length} moderator{mods.length !== 1 ? 's' : ''}</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={load} disabled={loading} className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-[#2F5BEA] border border-gray-200 rounded-xl px-3 py-2 bg-white transition-colors">
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button onClick={() => setModal({ type: 'promote' })}
              className="flex items-center gap-2 bg-[#2F5BEA] hover:bg-[#1a3fc7] text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-sm">
              <Crown className="w-4 h-4" /> Promote Member
            </button>
          </div>
        </div>

        {/* Info banner */}
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex gap-3">
          <Shield className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-700 space-y-1">
            <p><span className="font-semibold">Admins</span> have full access — members, posts, events, gallery, committee, email campaigns, and staff management.</p>
            <p><span className="font-semibold">Moderators</span> can manage posts, events, members, gallery, and messages — but cannot access settings or staff management.</p>
            <p className="text-xs text-blue-500 mt-1">Roles are assigned per member. Changing a role to "Member" removes their staff access immediately.</p>
          </div>
        </div>

        {loading ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 flex justify-center">
            <div className="w-8 h-8 border-4 border-[#2F5BEA] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Admins */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
                <div className="w-8 h-8 bg-amber-100 rounded-xl flex items-center justify-center">
                  <Crown className="w-4 h-4 text-amber-600" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-[#1F2A44]">Admins</h2>
                  <p className="text-xs text-gray-400">Full system access</p>
                </div>
              </div>
              {admins.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-8">No admins found</p>
              ) : (
                <div className="divide-y divide-gray-50">
                  {admins.map(s => (
                    <StaffRow key={s.id} member={s} currentId={currentMember?.id || ''}
                      onChangeRole={() => setModal({ type: 'role', member: s })} />
                  ))}
                </div>
              )}
            </div>

            {/* Moderators */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
                <div className="w-8 h-8 bg-purple-100 rounded-xl flex items-center justify-center">
                  <Users className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-[#1F2A44]">Moderators</h2>
                  <p className="text-xs text-gray-400">Limited access</p>
                </div>
              </div>
              {mods.length === 0 ? (
                <div className="text-center py-10">
                  <Shield className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                  <p className="text-gray-400 text-sm">No moderators yet</p>
                  <button onClick={() => setModal({ type: 'promote' })} className="mt-3 text-[#2F5BEA] text-sm font-semibold hover:underline">
                    + Promote a member
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {mods.map(s => (
                    <StaffRow key={s.id} member={s} currentId={currentMember?.id || ''}
                      onChangeRole={() => setModal({ type: 'role', member: s })} />
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {modal?.type === 'role' && (
        <RoleModal member={(modal as any).member} onClose={() => setModal(null)} onChanged={load} showToast={showToast} />
      )}
      {modal?.type === 'promote' && (
        <PromoteModal onClose={() => setModal(null)} onPromoted={load} showToast={showToast} />
      )}
    </div>
  );
}

function StaffRow({ member, currentId, onChangeRole }: {
  member: StaffMember; currentId: string; onChangeRole: () => void;
}) {
  const isSelf = member.id === currentId;
  const photoSrc = imageUrl(member.photo_url);
  return (
    <div className="flex items-center gap-4 px-6 py-4">
      {photoSrc
        ? <img src={photoSrc} alt={member.full_name} className="w-10 h-10 rounded-xl object-cover border border-gray-100 flex-shrink-0" />
        : <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0 ${member.role === 'admin' ? 'bg-amber-100 text-amber-700' : 'bg-purple-100 text-purple-700'}`}>
            {member.full_name.charAt(0).toUpperCase()}
          </div>
      }
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-[#1F2A44] text-sm">{member.full_name}</span>
          <RoleBadge role={member.role} />
          {isSelf && <span className="text-xs bg-[#2F5BEA]/10 text-[#2F5BEA] px-2 py-0.5 rounded-full font-medium">You</span>}
        </div>
        <p className="text-xs text-gray-400 mt-0.5">{member.email} · Batch {member.batch}</p>
      </div>
      {!isSelf && (
        <button onClick={onChangeRole} title="Change role"
          className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-[#2F5BEA] border border-gray-200 hover:border-[#2F5BEA] px-3 py-1.5 rounded-lg transition-colors">
          <ChevronDown className="w-3.5 h-3.5" /> Role
        </button>
      )}
    </div>
  );
}
