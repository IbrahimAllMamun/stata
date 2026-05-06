// src/pages/admin/ManageAdmins.tsx
import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import ReactDOM from 'react-dom';
import {
  Shield, Trash2, Crown, Users, RefreshCw,
  X, CheckCircle, ChevronDown, Search,
  SortAsc, SortDesc, Filter, AlertTriangle,
} from 'lucide-react';
import { adminApi, imageUrl } from '../../lib/api';
import { useAuth, MemberUser } from '../../contexts/AuthContext';

type Role = 'member' | 'mod' | 'admin';
type AnyMember = MemberUser & { created_at: string };

// ── Toast ─────────────────────────────────────────────────────────────────────
function Toast({ toast }: { toast: { msg: string; ok: boolean } | null }) {
  if (!toast) return null;
  return (
    <div className={`fixed top-5 right-5 z-50 flex items-center gap-2.5 px-5 py-3.5 rounded-2xl shadow-lg text-sm font-semibold text-white transition-all ${toast.ok ? 'bg-[#2ECC71]' : 'bg-[#E74C3C]'}`}>
      {toast.ok ? <CheckCircle className="w-4 h-4" /> : <X className="w-4 h-4" />}
      {toast.msg}
    </div>
  );
}

// ── Role badge (display only) ─────────────────────────────────────────────────
function RoleBadge({ role }: { role: Role }) {
  if (role === 'admin')
    return <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-700 border border-amber-200 text-xs px-2.5 py-0.5 rounded-full font-semibold"><Crown className="w-3 h-3" /> Admin</span>;
  if (role === 'mod')
    return <span className="inline-flex items-center gap-1 bg-purple-100 text-purple-700 border border-purple-200 text-xs px-2.5 py-0.5 rounded-full font-semibold"><Shield className="w-3 h-3" /> Mod</span>;
  return <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-600 border border-blue-100 text-xs px-2.5 py-0.5 rounded-full font-semibold"><Users className="w-3 h-3" /> Member</span>;
}

// ── Inline role dropdown (portal-based to escape overflow-hidden) ─────────────
function RoleDropdown({ memberId, current, isSelf, onChange }: {
  memberId: string;
  current: Role;
  isSelf: boolean;
  onChange: (id: string, role: Role) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Position the portal menu relative to the button, flipping up if near bottom
  const openMenu = () => {
    if (!btnRef.current) return;
    const r = btnRef.current.getBoundingClientRect();
    const menuH = 120; // approx height of 3 options
    const spaceBelow = window.innerHeight - r.bottom;
    const showAbove = spaceBelow < menuH + 8;
    setMenuStyle({
      position: 'fixed',
      right: window.innerWidth - r.right,
      ...(showAbove ? { bottom: window.innerHeight - r.top + 4 } : { top: r.bottom + 4 }),
      width: 160,
      zIndex: 9999,
    });
    setOpen(true);
  };

  // Close on outside click or scroll
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (
        menuRef.current && !menuRef.current.contains(e.target as Node) &&
        btnRef.current && !btnRef.current.contains(e.target as Node)
      ) setOpen(false);
    };
    const onScroll = () => setOpen(false);
    document.addEventListener('mousedown', close);
    document.addEventListener('scroll', onScroll, true);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('scroll', onScroll, true);
    };
  }, [open]);

  const roles: { value: Role; label: string; icon: React.ReactNode; color: string; bg: string }[] = [
    { value: 'member', label: 'Member', icon: <Users className="w-3.5 h-3.5" />, color: 'text-blue-600', bg: 'hover:bg-blue-50' },
    { value: 'mod', label: 'Moderator', icon: <Shield className="w-3.5 h-3.5" />, color: 'text-purple-600', bg: 'hover:bg-purple-50' },
    { value: 'admin', label: 'Admin', icon: <Crown className="w-3.5 h-3.5" />, color: 'text-amber-600', bg: 'hover:bg-amber-50' },
  ];

  const select = async (role: Role) => {
    if (role === current) { setOpen(false); return; }
    setOpen(false);
    setSaving(true);
    await onChange(memberId, role);
    setSaving(false);
  };

  if (isSelf) return <RoleBadge role={current} />;

  const menu = open ? ReactDOM.createPortal(
    <div
      ref={menuRef}
      style={menuStyle}
      className="bg-white border border-gray-200 rounded-xl shadow-2xl overflow-hidden"
    >
      {roles.map(r => (
        <button
          key={r.value}
          onClick={() => select(r.value)}
          className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-left text-xs font-semibold transition-colors ${r.color} ${r.bg} ${r.value === current ? 'bg-gray-50' : ''}`}
        >
          {r.icon} {r.label}
          {r.value === current && <CheckCircle className="w-3 h-3 ml-auto opacity-50" />}
        </button>
      ))}
    </div>,
    document.body
  ) : null;

  return (
    <>
      <button
        ref={btnRef}
        onClick={openMenu}
        disabled={saving}
        className="flex items-center gap-2 px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-semibold text-gray-600 hover:border-[#2F5BEA] hover:text-[#2F5BEA] bg-white transition-colors disabled:opacity-50"
      >
        {saving
          ? <><span className="w-3 h-3 border-2 border-gray-300 border-t-[#2F5BEA] rounded-full animate-spin" /> Saving…</>
          : <><RoleBadge role={current} /><ChevronDown className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} /></>
        }
      </button>
      {menu}
    </>
  );
}

// ── Delete confirm button (two-click safety) ──────────────────────────────────
function DeleteButton({ memberId, memberName, onDelete }: {
  memberId: string;
  memberName: string;
  onDelete: (id: string) => Promise<void>;
}) {
  const [confirm, setConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  const handleFirst = () => {
    setConfirm(true);
    timerRef.current = setTimeout(() => setConfirm(false), 3000);
  };

  const handleConfirm = async () => {
    clearTimeout(timerRef.current);
    setDeleting(true);
    await onDelete(memberId);
    setDeleting(false);
    setConfirm(false);
  };

  if (deleting)
    return <span className="w-3.5 h-3.5 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />;

  if (confirm)
    return (
      <button
        onClick={handleConfirm}
        className="flex items-center gap-1 px-2.5 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-semibold rounded-lg transition-colors"
        title={`Confirm permanent delete of ${memberName}`}
      >
        <AlertTriangle className="w-3 h-3" /> Confirm
      </button>
    );

  return (
    <button
      onClick={handleFirst}
      className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
      title={`Delete ${memberName}`}
    >
      <Trash2 className="w-4 h-4" />
    </button>
  );
}

// ── Shared member row ─────────────────────────────────────────────────────────
function MemberRow({ member, currentId, onRoleChange, onDelete }: {
  member: AnyMember;
  currentId: string;
  onRoleChange: (id: string, role: Role) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const isSelf = member.id === currentId;
  const photo = imageUrl(member.photo_url);
  const avatarBg =
    member.role === 'admin' ? 'bg-amber-100 text-amber-700'
      : member.role === 'mod' ? 'bg-purple-100 text-purple-700'
        : 'bg-[#2F5BEA] text-white';

  return (
    <div className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50/60 transition-colors">
      {photo
        ? <img src={photo} alt={member.full_name} className="w-9 h-9 rounded-xl object-cover border border-gray-100 flex-shrink-0" />
        : <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0 ${avatarBg}`}>
          {member.full_name.charAt(0).toUpperCase()}
        </div>
      }
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="font-semibold text-[#1F2A44] text-sm truncate">{member.full_name}</span>
          {isSelf && <span className="text-[10px] bg-[#2F5BEA]/10 text-[#2F5BEA] px-1.5 py-0.5 rounded-full font-semibold flex-shrink-0">You</span>}
        </div>
        <p className="text-xs text-gray-400 truncate">{member.email} · Batch {member.batch}</p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <RoleDropdown memberId={member.id} current={(member.role || 'member') as Role} isSelf={isSelf} onChange={onRoleChange} />
        {!isSelf && <DeleteButton memberId={member.id} memberName={member.full_name} onDelete={onDelete} />}
      </div>
    </div>
  );
}

// ── Section wrapper ───────────────────────────────────────────────────────────
function Section({ icon, title, subtitle, children }: {
  icon: React.ReactNode; title: string; subtitle: string; children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center">{icon}</div>
        <div>
          <h2 className="text-sm font-bold text-[#1F2A44]">{title}</h2>
          <p className="text-xs text-gray-400">{subtitle}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function ManageAdmins() {
  const { isFullAdmin, member: currentMember, loading: authLoading } = useAuth();
  const [allMembers, setAllMembers] = useState<AnyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const [memberSearch, setMemberSearch] = useState('');
  const [memberBatch, setMemberBatch] = useState('');
  const [memberSort, setMemberSort] = useState<'asc' | 'desc'>('asc');

  const showToast = useCallback((msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      let page = 1;
      let all: AnyMember[] = [];
      while (true) {
        const res = await adminApi.getMembersByStatus('APPROVED', { limit: 100, page });
        all = [...all, ...(res.data || [])];
        if (!res.pagination?.hasNext) break;
        page++;
      }
      setAllMembers(all as AnyMember[]);
    } catch (err: any) {
      showToast(err.message || 'Failed to load members', false);
    } finally { setLoading(false); }
  }, [showToast]);

  useEffect(() => { if (!authLoading && isFullAdmin) loadAll(); }, [authLoading, isFullAdmin, loadAll]);

  // Optimistic role update — update UI immediately, revert on error
  const handleRoleChange = useCallback(async (id: string, role: Role) => {
    const prev = allMembers.find(m => m.id === id)?.role as Role | undefined;
    setAllMembers(ms => ms.map(m => m.id === id ? { ...m, role } : m));
    try {
      await adminApi.updateMemberRole(id, role);
      showToast(`Role updated to ${role}`);
    } catch (err: any) {
      if (prev) setAllMembers(ms => ms.map(m => m.id === id ? { ...m, role: prev } : m));
      showToast(err.message || 'Failed to update role', false);
    }
  }, [allMembers, showToast]);

  // Optimistic delete
  const handleDelete = useCallback(async (id: string) => {
    const backup = allMembers.find(m => m.id === id);
    setAllMembers(ms => ms.filter(m => m.id !== id));
    try {
      await adminApi.deleteMember(id);
      showToast('Member permanently deleted');
    } catch (err: any) {
      if (backup) setAllMembers(ms => [...ms, backup]);
      showToast(err.message || 'Failed to delete', false);
    }
  }, [allMembers, showToast]);

  if (!isFullAdmin) return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-[#F5F7FA]">
      <div className="text-center">
        <Shield className="w-12 h-12 text-gray-200 mx-auto mb-3" />
        <p className="text-gray-500 font-semibold">Admin access required</p>
      </div>
    </div>
  );

  const admins = allMembers.filter(m => m.role === 'admin');
  const mods = allMembers.filter(m => m.role === 'mod');
  const members = allMembers.filter(m => !m.role || m.role === 'member');

  const memberBatches = useMemo(
    () => [...new Set(members.map(m => m.batch))].sort((a, b) => a - b),
    [members]
  );

  const visibleMembers = useMemo(() => {
    let list = [...members];
    if (memberBatch) list = list.filter(m => String(m.batch) === memberBatch);
    if (memberSearch.trim()) {
      const q = memberSearch.toLowerCase();
      list = list.filter(m =>
        m.full_name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q)
      );
    }
    list.sort((a, b) => {
      const cmp = a.full_name.localeCompare(b.full_name);
      return memberSort === 'asc' ? cmp : -cmp;
    });
    return list;
  }, [members, memberBatch, memberSearch, memberSort]);

  const currentId = currentMember?.id || '';

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#F5F7FA] py-8 px-4">
      <Toast toast={toast} />
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#1F2A44]">Staff Management</h1>
            <p className="text-gray-400 text-sm mt-0.5">
              {admins.length} admin{admins.length !== 1 ? 's' : ''} · {mods.length} moderator{mods.length !== 1 ? 's' : ''} · {members.length} member{members.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button onClick={loadAll} disabled={loading}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#2F5BEA] border border-gray-200 rounded-xl px-3 py-2 bg-white transition-colors shadow-sm">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>

        {/* Info banner */}
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex gap-3">
          <Shield className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-700 space-y-1">
            <p><span className="font-semibold">Admins</span> have full access — members, posts, events, gallery, committee, email campaigns, and staff management.</p>
            <p><span className="font-semibold">Moderators</span> can manage posts, events, members, gallery, and messages — but cannot access settings or staff management.</p>
            <p className="text-xs text-blue-500 mt-1">Use the role dropdown on any row to change roles instantly. Changes take effect immediately. The <span className="font-semibold">delete button</span> permanently removes a member from the database.</p>
          </div>
        </div>

        {loading ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 flex justify-center">
            <div className="w-8 h-8 border-4 border-[#2F5BEA] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* ── Admins ── */}
            <Section
              icon={<Crown className="w-4 h-4 text-amber-600" />}
              title={`Admins (${admins.length})`}
              subtitle="Full system access"
            >
              {admins.length === 0
                ? <p className="text-gray-400 text-sm text-center py-8">No admins — promote a member below</p>
                : <div className="divide-y divide-gray-50">
                  {admins.map(m => (
                    <MemberRow key={m.id} member={m} currentId={currentId}
                      onRoleChange={handleRoleChange} onDelete={handleDelete} />
                  ))}
                </div>
              }
            </Section>

            {/* ── Moderators ── */}
            <Section
              icon={<Shield className="w-4 h-4 text-purple-600" />}
              title={`Moderators (${mods.length})`}
              subtitle="Limited access"
            >
              {mods.length === 0
                ? <p className="text-gray-400 text-sm text-center py-8">No moderators — promote a member below</p>
                : <div className="divide-y divide-gray-50">
                  {mods.map(m => (
                    <MemberRow key={m.id} member={m} currentId={currentId}
                      onRoleChange={handleRoleChange} onDelete={handleDelete} />
                  ))}
                </div>
              }
            </Section>

            {/* ── All Members ── */}
            <Section
              icon={<Users className="w-4 h-4 text-[#2F5BEA]" />}
              title={`Members (${members.length})`}
              subtitle="Regular access — use the role dropdown to promote any member"
            >
              {/* Toolbar */}
              <div className="px-5 py-3 border-b border-gray-50 space-y-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search by name or email…"
                    value={memberSearch}
                    onChange={e => setMemberSearch(e.target.value)}
                    className="w-full pl-8 pr-8 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#2F5BEA] focus:border-transparent outline-none"
                  />
                  {memberSearch && (
                    <button onClick={() => setMemberSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
                    <select
                      value={memberBatch}
                      onChange={e => setMemberBatch(e.target.value)}
                      className="w-full appearance-none pl-7 pr-6 py-2 border border-gray-200 rounded-xl text-xs font-medium text-gray-600 focus:ring-2 focus:ring-[#2F5BEA] outline-none bg-white"
                    >
                      <option value="">All Batches</option>
                      {memberBatches.map(b => <option key={b} value={String(b)}>Batch {b}</option>)}
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
                  </div>

                  <button
                    onClick={() => setMemberSort(d => d === 'asc' ? 'desc' : 'asc')}
                    className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-xl text-xs font-semibold text-gray-600 hover:border-[#2F5BEA] hover:text-[#2F5BEA] bg-white transition-colors whitespace-nowrap"
                  >
                    {memberSort === 'asc'
                      ? <><SortAsc className="w-3.5 h-3.5" /> A → Z</>
                      : <><SortDesc className="w-3.5 h-3.5" /> Z → A</>}
                  </button>
                </div>

                {(memberBatch || memberSearch) && (
                  <div className="flex flex-wrap gap-1.5 items-center">
                    <span className="text-[10px] text-gray-400 font-medium">Filtered:</span>
                    {memberBatch && (
                      <span className="flex items-center gap-1 bg-[#2F5BEA]/10 text-[#2F5BEA] text-[11px] font-semibold px-2 py-0.5 rounded-full">
                        Batch {memberBatch}
                        <button onClick={() => setMemberBatch('')}><X className="w-2.5 h-2.5" /></button>
                      </span>
                    )}
                    {memberSearch && (
                      <span className="flex items-center gap-1 bg-[#2F5BEA]/10 text-[#2F5BEA] text-[11px] font-semibold px-2 py-0.5 rounded-full">
                        "{memberSearch}"
                        <button onClick={() => setMemberSearch('')}><X className="w-2.5 h-2.5" /></button>
                      </span>
                    )}
                    <button onClick={() => { setMemberBatch(''); setMemberSearch(''); }} className="text-[11px] text-gray-400 hover:text-gray-600 underline">Clear all</button>
                  </div>
                )}
              </div>

              {visibleMembers.length === 0
                ? <div className="py-10 text-center text-gray-400">
                  <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No members match your filters</p>
                </div>
                : <>
                  <div className="divide-y divide-gray-50">
                    {visibleMembers.map(m => (
                      <MemberRow key={m.id} member={m} currentId={currentId}
                        onRoleChange={handleRoleChange} onDelete={handleDelete} />
                    ))}
                  </div>
                  <div className="px-5 py-2.5 bg-[#F5F7FA] border-t border-gray-100 text-xs text-gray-400 font-medium">
                    {visibleMembers.length} of {members.length} member{members.length !== 1 ? 's' : ''} shown
                  </div>
                </>
              }
            </Section>
          </>
        )}
      </div>
    </div>
  );
}