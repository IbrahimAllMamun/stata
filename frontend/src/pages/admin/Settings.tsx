// src/pages/admin/Settings.tsx - Committee Management
import { useEffect, useState } from 'react';
import { Crown, Plus, Trash2, Upload, Users, X, CheckCircle } from 'lucide-react';
import { adminApi, api, Member, Committee, imageUrl } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';

const EMPTY_FORM = { committee_id: '', member_id: '', position: '' as '' | 'PRESIDENT' | 'GENERAL_SECRETARY', acting_year: '', image: null as File | null };

export default function AdminSettings() {
  const { isAdmin } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [committees, setCommittees] = useState<Committee[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY_FORM);
  const [newYear, setNewYear] = useState('');
  const [preview, setPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [creatingYear, setCreatingYear] = useState(false);

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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setForm(f => ({ ...f, image: file }));
    setPreview(URL.createObjectURL(file));
  };

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
    if (!form.committee_id || !form.member_id || !form.position || !form.image) {
      showToast('All fields including photo are required', false);
      return;
    }
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('committee_id', form.committee_id);
      fd.append('member_id', form.member_id);
      fd.append('position', form.position);
      fd.append('image', form.image);
      await adminApi.assignCommitteeMember(fd);
      setForm(EMPTY_FORM);
      setPreview(null);
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

  if (!isAdmin) return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
      <p className="text-gray-500">Access denied</p>
    </div>
  );

  const sortedCommittees = [...committees].sort((a, b) => b.acting_year - a.acting_year);
  const currentYear = sortedCommittees.length > 0 ? sortedCommittees[0].acting_year : null;

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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Committee year dropdown */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Committee Acting Year <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={form.committee_id}
                    onChange={e => setForm(f => ({ ...f, committee_id: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#2F5BEA] outline-none bg-white"
                  >
                    <option value="">- Select year -</option>
                    {sortedCommittees.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.acting_year === currentYear ? `${c.acting_year} - ${c.acting_year + 1} (Current)` : `${c.acting_year} - ${c.acting_year + 1}`}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Position dropdown */}
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
              </div>

              {/* Member dropdown */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Select Member <span className="text-red-500">*</span>
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
                        {m.full_name} - Batch {m.batch}
                        {m.organisation ? ` (${m.organisation})` : ''}
                      </option>
                    ))
                  }
                </select>
              </div>

              {/* Photo upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Photo <span className="text-red-500">*</span>
                </label>
                <div className="flex items-start gap-4">
                  <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center hover:border-[#2F5BEA] transition-colors flex-1 cursor-pointer">
                    <input type="file" accept="image/jpeg,image/jpg,image/png,image/webp" onChange={handleImageChange} className="hidden" id="cm_image" />
                    <label htmlFor="cm_image" className="cursor-pointer flex flex-col items-center gap-1">
                      <Upload className="w-6 h-6 text-gray-400" />
                      <span className="text-xs text-gray-500">Click to upload (jpg, png, webp - max 2MB)</span>
                    </label>
                  </div>
                  {preview && (
                    <div className="relative">
                      <img src={preview} alt="Preview" className="w-16 h-16 rounded-full object-cover border-2 border-gray-200" />
                      <button type="button" onClick={() => { setPreview(null); setForm(f => ({ ...f, image: null })); }}
                        className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

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
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-bold ${c.acting_year === currentYear ? 'text-[#2F5BEA]' : 'text-[#1F2A44]'}`}>
                        {c.acting_year === currentYear ? `${c.acting_year} - ${c.acting_year + 1} (Current Committee)` : `${c.acting_year} - ${c.acting_year + 1}`}
                      </span>
                    </div>
                    <button onClick={() => handleDeleteCommittee(c.id, c.acting_year)}
                      className="text-gray-400 hover:text-red-500 transition-colors p-1">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <MiniCard person={c.president} role="President" color="amber" />
                    <MiniCard person={c.general_secretary} role="General Secretary" color="blue" />
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

function MiniCard({ person, role, color }: { person: any; role: string; color: 'amber' | 'blue' }) {
  const colorMap = { amber: 'bg-amber-100 text-amber-700', blue: 'bg-blue-100 text-blue-700' };
  if (!person) return (
    <div className="border border-dashed border-gray-200 rounded-lg p-3 text-center text-xs text-gray-400">
      No {role}
    </div>
  );
  const imgSrc = imageUrl(person.image_url);
  return (
    <div className="border border-gray-100 rounded-lg p-3 flex items-center gap-2 bg-white">
      {imgSrc
        ? <img src={imgSrc} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
        : <div className="w-8 h-8 rounded-full bg-[#2F5BEA] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">{person.full_name.charAt(0)}</div>
      }
      <div className="min-w-0">
        <p className="text-xs font-semibold text-[#1F2A44] truncate">{person.full_name}</p>
        <span className={`text-xs px-1.5 py-0.5 rounded ${colorMap[color]}`}>{role}</span>
      </div>
    </div>
  );
}
