// src/pages/admin/Settings.tsx - Committee Management
import { useEffect, useState } from 'react';
import { Crown, Plus, Trash2, Users, X, CheckCircle, UserPlus, Shield, Star } from 'lucide-react';
import { adminApi, api, Member, Committee, imageUrl } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';

const EMPTY_FORM = { committee_id: '', member_id: '', position: '' as '' | 'PRESIDENT' | 'GENERAL_SECRETARY' };

export default function AdminSettings() {
  const { isAdmin } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [committees, setCommittees] = useState<Committee[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY_FORM);
  const [newYear, setNewYear] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [creatingYear, setCreatingYear] = useState(false);
  const [modForm, setModForm] = useState({ username: '', password: '' });
  const [creatingMod, setCreatingMod] = useState(false);
  const [deletingMemberId, setDeletingMemberId] = useState<string | null>(null);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  const load = async () => {
    try {
      const [mem, com] = await Promise.all([api.getMembers({ limit: 500 }), api.getCommittees()]);
      setMembers(mem.data);
      setCommittees(com.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (isAdmin) load(); }, [isAdmin]);

  const handleCreateYear = async () => {
    if (!newYear || isNaN(Number(newYear))) return showToast('Enter a valid year', false);
    setCreatingYear(true);
    try {
      await adminApi.createCommittee(parseInt(newYear));
      setNewYear('');
      showToast(`Committee ${newYear} created`);
      load();
    } catch (err: any) {
      showToast(err.message || 'Failed to create committee', false);
    } finally {
      setCreatingYear(false);
    }
  };

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.committee_id || !form.member_id || !form.position) {
      showToast('All fields are required', false);
      return;
    }
    setSubmitting(true);
    try {
      await adminApi.assignCommitteeMember({
        committee_id: form.committee_id,
        member_id: form.member_id,
        position: form.position,
      });
      setForm(EMPTY_FORM);
      showToast('Member assigned successfully');
      load();
    } catch (err: any) {
      showToast(err.message || 'Failed to assign member', false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCommittee = async (id: string, year: number) => {
    if (!confirm(`Delete committee ${year} and all its members?`)) return;
    try {
      await adminApi.deleteCommittee(id);
      showToast(`Committee ${year} deleted`);
      load();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete', false);
    }
  };

  const handleDeleteCommitteeMember = async (committeeMemberId: string, name: string) => {
    if (!confirm(`Remove ${name} from this committee?`)) return;
    setDeletingMemberId(committeeMemberId);
    try {
      await adminApi.deleteCommitteeMember(committeeMemberId);
      showToast(`${name} removed`);
      load();
    } catch (err: any) {
      showToast(err.message || 'Failed to remove', false);
    } finally {
      setDeletingMemberId(null);
    }
  };

  if (!isAdmin) return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
      <p className="text-gray-500">Access denied</p>
    </div>
  );

  const sortedCommittees = [...committees].sort((a, b) => b.acting_year - a.acting_year);
  const currentYear = sortedCommittees.length > 0 ? sortedCommittees[0].acting_year : null;

  // Selected member preview for assign form
  const selectedMember = members.find(m => m.id === form.member_id);

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#F5F7FA] py-8 px-4">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-white text-sm font-medium transition-all
          ${toast.ok ? 'bg-[#2ECC71]' : 'bg-[#E74C3C]'}`}>
          {toast.ok ? <CheckCircle className="w-4 h-4" /> : <X className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      <div className="max-w-5xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-[#1F2A44]">Committee Settings</h1>
          <p className="text-gray-500 text-sm mt-1">Manage committee years and assign president / general secretary</p>
        </div>

        {/* ── Create new committee year ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-[#1F2A44] mb-4 flex items-center gap-2">
            <Plus className="w-5 h-5 text-[#2F5BEA]" />
            Create Committee Year
          </h2>
          <div className="flex gap-3">
            <input
              type="number"
              placeholder="e.g. 2025"
              min="1990" max="2100"
              value={newYear}
              onChange={e => setNewYear(e.target.value)}
              className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#2F5BEA] outline-none"
            />
            <button
              onClick={handleCreateYear}
              disabled={creatingYear}
              className="bg-[#2F5BEA] text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#1a3fc7] transition-colors disabled:opacity-50"
            >
              {creatingYear ? 'Creating...' : 'Create'}
            </button>
          </div>
        </div>

        {/* ── Assign member form ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-[#1F2A44] mb-5 flex items-center gap-2">
            <Crown className="w-5 h-5 text-[#F39C12]" />
            Assign President / General Secretary
          </h2>

          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block w-6 h-6 border-4 border-[#2F5BEA] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <form onSubmit={handleAssign} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* Committee year */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Acting Year <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={form.committee_id}
                    onChange={e => setForm(f => ({ ...f, committee_id: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#2F5BEA] outline-none bg-white"
                  >
                    <option value="">- Select year -</option>
                    {sortedCommittees.map(c => (
                      <option key={c.id} value={c.id}>
                        {`${c.acting_year}-${c.acting_year + 1}`}{c.acting_year === currentYear ? ' ★' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Position */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Position <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={form.position}
                    onChange={e => setForm(f => ({ ...f, position: e.target.value as any }))}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#2F5BEA] outline-none bg-white"
                  >
                    <option value="">- Select position -</option>
                    <option value="PRESIDENT">President</option>
                    <option value="GENERAL_SECRETARY">General Secretary</option>
                  </select>
                </div>

                {/* Member */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Member <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={form.member_id}
                    onChange={e => setForm(f => ({ ...f, member_id: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#2F5BEA] outline-none bg-white"
                  >
                    <option value="">- Select member -</option>
                    {[...members]
                      .sort((a, b) => a.batch !== b.batch ? a.batch - b.batch : a.full_name.localeCompare(b.full_name))
                      .map(m => (
                        <option key={m.id} value={m.id}>
                          {m.full_name} — Batch {m.batch}
                        </option>
                      ))
                    }
                  </select>
                </div>
              </div>

              {/* Selected member preview */}
              {selectedMember && (
                <div className="flex items-center gap-3 bg-[#F5F7FA] rounded-xl p-3 border border-gray-100">
                  {imageUrl(selectedMember.photo_url)
                    ? <img src={imageUrl(selectedMember.photo_url)!} className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm" alt={selectedMember.full_name} />
                    : <div className="w-10 h-10 rounded-full bg-[#2F5BEA] flex items-center justify-center text-white text-sm font-bold">{selectedMember.full_name.charAt(0)}</div>
                  }
                  <div>
                    <p className="text-sm font-semibold text-[#1F2A44]">{selectedMember.full_name}</p>
                    <p className="text-xs text-gray-400">Batch {selectedMember.batch}{selectedMember.job_title ? ` · ${selectedMember.job_title}` : ''}</p>
                  </div>
                </div>
              )}

              <button type="submit" disabled={submitting}
                className="bg-[#F39C12] hover:bg-[#e08e0b] text-white px-6 py-2.5 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 flex items-center gap-2">
                <Crown className="w-4 h-4" />
                {submitting ? 'Assigning...' : 'Assign to Committee'}
              </button>
            </form>
          )}
        </div>

        {/* ── Existing committees ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-[#1F2A44] mb-5 flex items-center gap-2">
            <Users className="w-5 h-5 text-[#2ECC71]" />
            Existing Committees
          </h2>
          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block w-6 h-6 border-4 border-[#2F5BEA] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : sortedCommittees.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-6">No committees yet</p>
          ) : (
            <div className="space-y-4">
              {sortedCommittees.map(c => (
                <div key={c.id} className={`border rounded-xl p-4 ${c.acting_year === currentYear ? 'border-[#2F5BEA] bg-blue-50' : 'border-gray-100'}`}>
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-sm font-bold ${c.acting_year === currentYear ? 'text-[#2F5BEA]' : 'text-[#1F2A44]'}`}>
                      {c.acting_year}{c.acting_year === currentYear ? ' ★ Current' : ''}
                    </span>
                    <button onClick={() => handleDeleteCommittee(c.id, c.acting_year)}
                      className="text-gray-300 hover:text-red-500 transition-colors p-1" title="Delete entire committee year">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <MiniCard
                      person={c.president} role="President" color="amber"
                      deletingId={deletingMemberId}
                      onDelete={c.president ? () => handleDeleteCommitteeMember(c.president!.committee_member_id, c.president!.full_name) : undefined}
                    />
                    <MiniCard
                      person={c.general_secretary} role="General Secretary" color="blue"
                      deletingId={deletingMemberId}
                      onDelete={c.general_secretary ? () => handleDeleteCommitteeMember(c.general_secretary!.committee_member_id, c.general_secretary!.full_name) : undefined}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MiniCard({ person, role, color, onDelete, deletingId }: {
  person: any; role: string; color: 'amber' | 'blue';
  onDelete?: () => void; deletingId: string | null;
}) {
  const colorMap = { amber: 'bg-amber-100 text-amber-700', blue: 'bg-blue-100 text-blue-700' };
  const icon = color === 'amber' ? <Crown className="w-3 h-3" /> : <Star className="w-3 h-3" />;

  if (!person) return (
    <div className="border border-dashed border-gray-200 rounded-lg p-3 text-center text-xs text-gray-400">
      No {role}
    </div>
  );

  const photoSrc = imageUrl(person.photo_url) || null;
  const isDeleting = deletingId === person.committee_member_id;

  return (
    <div className="border border-gray-100 rounded-lg p-3 flex items-center gap-2 bg-white">
      {photoSrc
        ? <img src={photoSrc} className="w-9 h-9 rounded-full object-cover flex-shrink-0 border-2 border-gray-100" />
        : <div className="w-9 h-9 rounded-full bg-[#2F5BEA] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">{person.full_name.charAt(0)}</div>
      }
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold text-[#1F2A44] truncate">{person.full_name}</p>
        <span className={`inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded ${colorMap[color]}`}>
          {icon} {role}
        </span>
      </div>
      {onDelete && (
        <button
          onClick={onDelete}
          disabled={isDeleting}
          title={`Remove ${person.full_name}`}
          className="flex-shrink-0 w-6 h-6 flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors disabled:opacity-50"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}