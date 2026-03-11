// src/pages/UpdateProfile.tsx
import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, User, Briefcase, Bell, CheckCircle, Home, ArrowLeft, AlertCircle, RefreshCw, Camera, X } from 'lucide-react';
import { api, imageUrl, Member } from '../lib/api';

type Step = 'lookup' | 'edit' | 'success';

interface FullMember extends Member {
  status: string;
  photo_url?: string | null;
}

interface FormState {
  batch: string;
  full_name: string;
  phone_number: string;
  alternative_phone: string;
  job_title: string;
  organisation: string;
  organisation_address: string;
  notify_events: '' | 'true' | 'false';
  blood_group: string;
}

const inputCls = (err: boolean) =>
  `w-full px-4 py-3 border rounded-lg outline-none transition-all text-sm ${err
    ? 'border-red-400 bg-red-50 focus:ring-2 focus:ring-red-300'
    : 'border-gray-200 focus:ring-2 focus:ring-[#2F5BEA] focus:border-transparent'}`;

const radioCls = (selected: boolean) =>
  `flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${selected
    ? 'border-[#2F5BEA] bg-blue-50'
    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`;

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  PENDING: { bg: 'bg-amber-50', text: 'text-amber-700', label: 'Pending Approval' },
  APPROVED: { bg: 'bg-green-50', text: 'text-green-700', label: 'Approved Member' },
  ARCHIVED: { bg: 'bg-gray-100', text: 'text-gray-500', label: 'Archived' },
};

export default function UpdateProfile() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('lookup');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Lookup
  const [lookupEmail, setLookupEmail] = useState('');
  const [looking, setLooking] = useState(false);
  const [lookupError, setLookupError] = useState('');
  const [member, setMember] = useState<FullMember | null>(null);

  // Photo
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoSaving, setPhotoSaving] = useState(false);
  const [photoSaved, setPhotoSaved] = useState(false);

  // Edit form
  const [form, setForm] = useState<FormState>({
    batch: '', full_name: '', phone_number: '', alternative_phone: '',
    job_title: '', organisation: '', organisation_address: '', notify_events: '', blood_group: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saveResult, setSaveResult] = useState<{ full_name: string; status: string } | null>(null);

  const set = (field: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm(f => ({ ...f, [field]: e.target.value }));
      setErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
    };

  // ── Lookup ──────────────────────────────────────────────────────────────────
  const handleLookup = async () => {
    const email = lookupEmail.trim();
    if (!email) { setLookupError('Please enter your email address.'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setLookupError('Please enter a valid email address.'); return; }
    setLooking(true); setLookupError('');
    try {
      const res = await api.lookupMember(email);
      const m = res.data as FullMember;
      setMember(m);
      // Pre-load existing photo preview
      const existingSrc = imageUrl(m.photo_url);
      if (existingSrc) setPhotoPreview(existingSrc);
      setForm({
        batch: String(m.batch), full_name: m.full_name, phone_number: m.phone_number,
        alternative_phone: m.alternative_phone ?? '', job_title: m.job_title ?? '',
        organisation: m.organisation ?? '', organisation_address: m.organisation_address ?? '',
        notify_events: m.notify_events ? 'true' : 'false',
        blood_group: m.blood_group ?? '',
      });
      setStep('edit');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Something went wrong.';
      setLookupError(msg.includes('404') || msg.toLowerCase().includes('not found')
        ? 'No member found with that email. Please register first.'
        : msg);
    } finally { setLooking(false); }
  };

  // ── Photo pick ───────────────────────────────────────────────────────────────
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhoto(file);
    setPhotoSaved(false);
    const reader = new FileReader();
    reader.onload = () => setPhotoPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handlePhotoSave = async () => {
    if (!photo || !member) return;
    setPhotoSaving(true);
    try {
      await api.updateMemberPhoto(member.email, photo);
      setPhotoSaved(true);
      setPhoto(null);
    } catch (err: unknown) {
      setErrors(prev => ({ ...prev, photo: err instanceof Error ? err.message : 'Photo upload failed.' }));
    } finally { setPhotoSaving(false); }
  };

  // ── Validate ─────────────────────────────────────────────────────────────────
  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!form.batch || isNaN(Number(form.batch)) || Number(form.batch) < 1) e.batch = 'Valid batch number is required';
    if (!form.full_name.trim()) e.full_name = 'Full name is required';
    if (!form.phone_number.trim()) e.phone_number = 'Phone number is required';
    if (!form.notify_events) e.notify_events = 'Please select a notification preference';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ── Save profile ─────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!validate() || !member) return;
    setSaving(true);
    try {
      const res = await api.updateMember({
        email: member.email, batch: parseInt(form.batch), full_name: form.full_name.trim(),
        phone_number: form.phone_number.trim(), notify_events: form.notify_events === 'true',
        alternative_phone: form.alternative_phone || undefined, job_title: form.job_title || undefined,
        organisation: form.organisation || undefined, organisation_address: form.organisation_address || undefined,
        blood_group: form.blood_group || null,
      });
      setSaveResult(res.data);
      setStep('success');
    } catch (err: unknown) {
      setErrors({ general: err instanceof Error ? err.message : 'Update failed. Please try again.' });
    } finally { setSaving(false); }
  };

  const statusStyle = member ? (STATUS_STYLES[member.status] ?? STATUS_STYLES.PENDING) : null;

  // ── Success ──────────────────────────────────────────────────────────────────
  if (step === 'success' && saveResult) return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 bg-[#F5F7FA]">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="h-1.5 bg-gradient-to-r from-[#2F5BEA] via-[#F39C12] to-[#2ECC71]" />
        <div className="p-8 text-center">
          <div className="w-20 h-20 bg-[#2ECC71]/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-[#2ECC71]" />
          </div>
          <h2 className="text-2xl font-extrabold text-[#1F2A44] mb-2">Profile Updated!</h2>
          <p className="text-gray-500 text-sm mb-6">Your information has been submitted for review.</p>
          <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left space-y-2">
            {[['Name', saveResult.full_name], ['Email', member!.email], ['Status', STATUS_STYLES[saveResult.status]?.label ?? saveResult.status]].map(([k, v]) => (
              <div key={k} className="flex justify-between text-sm">
                <span className="text-gray-400 font-medium">{k}</span>
                <span className="text-[#1F2A44] font-semibold">{v}</span>
              </div>
            ))}
          </div>
          <button onClick={() => navigate('/')}
            className="w-full flex items-center justify-center gap-2 bg-[#2F5BEA] hover:bg-[#1a3fc7] text-white px-6 py-3 rounded-xl font-semibold transition-colors text-sm">
            <Home className="w-4 h-4" /> Back to Home
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#F5F7FA] py-12 px-4">
      <div className="max-w-2xl mx-auto">

        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-[#1F2A44] rounded-full flex items-center justify-center mx-auto mb-4">
            <RefreshCw className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-[#1F2A44]">Update Profile</h1>
          <p className="text-gray-500 mt-1">Update your STATA member information</p>
        </div>

        {/* ── Lookup ── */}
        {step === 'lookup' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="flex items-center gap-3 px-6 py-4 bg-[#2F5BEA] text-white">
              <Search className="w-5 h-5" />
              <h2 className="font-semibold">Find Your Profile</h2>
            </div>
            <div className="p-6 space-y-5">
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-700 leading-relaxed">
                Enter the email address you used when registering. We'll look up your profile so you can update your details.
              </div>
              {lookupError && (
                <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" /><span>{lookupError}</span>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Registered Email Address <span className="text-red-500">*</span></label>
                <input type="email" value={lookupEmail} onChange={e => { setLookupEmail(e.target.value); setLookupError(''); }}
                  onKeyDown={e => e.key === 'Enter' && handleLookup()} placeholder="you@example.com" className={inputCls(!!lookupError)} autoFocus />
              </div>
              <button onClick={handleLookup} disabled={looking}
                className="w-full py-3.5 rounded-xl font-semibold text-white transition-all text-sm bg-[#2F5BEA] hover:bg-[#1a3fc7] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                {looking ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Looking up…</> : <><Search className="w-4 h-4" /> Find My Profile</>}
              </button>
              <p className="text-center text-sm text-gray-400">Not a member yet?{' '}<a href="/register" className="text-[#2F5BEA] font-medium hover:underline">Register here</a></p>
            </div>
          </div>
        )}

        {/* ── Edit ── */}
        {step === 'edit' && member && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <button onClick={() => { setStep('lookup'); setMember(null); setErrors({}); setPhoto(null); setPhotoPreview(null); setPhotoSaved(false); }}
                className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#1F2A44] transition-colors font-medium">
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              {statusStyle && <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${statusStyle.bg} ${statusStyle.text}`}>{statusStyle.label}</span>}
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#2F5BEA]/10 flex items-center justify-center flex-shrink-0"><User className="w-4 h-4 text-[#2F5BEA]" /></div>
              <div><p className="text-xs text-gray-400 mb-0.5">Editing profile for</p><p className="text-sm font-semibold text-[#1F2A44]">{member.email}</p></div>
              <span className="ml-auto text-xs text-gray-400 bg-gray-200 px-2 py-1 rounded-md">Email locked</span>
            </div>

            {errors.general && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />{errors.general}
              </div>
            )}

            {/* ── Profile Photo ── */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="flex items-center gap-3 px-6 py-4 bg-[#1F2A44] text-white">
                <Camera className="w-5 h-5" />
                <h2 className="font-semibold">Profile Photo</h2>
                <span className="ml-auto text-xs opacity-70">Applied immediately</span>
              </div>
              <div className="p-6">
                <div className="flex items-center gap-5">
                  {/* Preview */}
                  <div className="relative flex-shrink-0">
                    {photoPreview
                      ? <img src={photoPreview} alt="Preview" className="w-24 h-24 rounded-xl object-cover border-2 border-white shadow ring-2 ring-[#2F5BEA]/30" />
                      : <div className="w-24 h-24 rounded-xl bg-gray-100 border-2 border-dashed border-gray-300 flex flex-col items-center justify-center gap-1">
                        <Camera className="w-6 h-6 text-gray-300" />
                        <span className="text-[10px] text-gray-400">No photo</span>
                      </div>
                    }
                    {photoPreview && (
                      <button onClick={() => { setPhoto(null); setPhotoPreview(imageUrl(member.photo_url)); setPhotoSaved(false); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                        className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors">
                        <X className="w-3 h-3 text-white" />
                      </button>
                    )}
                  </div>

                  <div className="flex-1 space-y-3">
                    <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
                    <button onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:border-[#2F5BEA] hover:text-[#2F5BEA] transition-colors bg-white">
                      <Camera className="w-4 h-4" /> {photoPreview ? 'Change Photo' : 'Upload Photo'}
                    </button>

                    {photo && !photoSaved && (
                      <button onClick={handlePhotoSave} disabled={photoSaving}
                        className="flex items-center gap-2 px-4 py-2 bg-[#2F5BEA] hover:bg-[#1a3fc7] text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-60">
                        {photoSaving ? <><span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving…</> : <><CheckCircle className="w-3.5 h-3.5" /> Save Photo</>}
                      </button>
                    )}

                    {photoSaved && <p className="text-sm text-green-600 font-medium flex items-center gap-1.5"><CheckCircle className="w-4 h-4" /> Photo saved!</p>}
                    {errors.photo && <p className="text-xs text-red-500">{errors.photo}</p>}

                    <p className="text-xs text-gray-400">JPG, PNG, WEBP or HEIC · Max 15MB · Changes apply immediately</p>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Personal Information ── */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="flex items-center gap-3 px-6 py-4 bg-[#2F5BEA] text-white">
                <User className="w-5 h-5" /><h2 className="font-semibold">Personal Information</h2>
              </div>
              <div className="p-6 space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Batch <span className="text-red-500">*</span></label>
                  <input type="number" value={form.batch} onChange={set('batch')} placeholder="e.g. 26" min="1" max="999" className={inputCls(!!errors.batch)} />
                  {errors.batch && <p className="mt-1 text-xs text-red-500">{errors.batch}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name <span className="text-red-500">*</span></label>
                  <input type="text" value={form.full_name} onChange={set('full_name')} placeholder="Your full name" className={inputCls(!!errors.full_name)} />
                  {errors.full_name && <p className="mt-1 text-xs text-red-500">{errors.full_name}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
                  <input type="email" value={member.email} readOnly className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-400 cursor-not-allowed" />
                  <p className="mt-1 text-xs text-gray-400">Email cannot be changed</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone Number <span className="text-red-500">*</span></label>
                    <input type="tel" value={form.phone_number} onChange={set('phone_number')} placeholder="+8801XXXXXXXXX" className={inputCls(!!errors.phone_number)} />
                    {errors.phone_number && <p className="mt-1 text-xs text-red-500">{errors.phone_number}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Alternative Phone <span className="text-gray-400 font-normal text-xs">(optional)</span></label>
                    <input type="tel" value={form.alternative_phone} onChange={set('alternative_phone')} placeholder="+8801XXXXXXXXX" className={inputCls(false)} />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Blood Group <span className="text-gray-400 font-normal text-xs">(optional)</span></label>
                <select value={form.blood_group} onChange={e => setForm(f => ({ ...f, blood_group: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg outline-none text-sm focus:ring-2 focus:ring-[#2F5BEA] focus:border-transparent bg-white">
                  <option value="">- Select blood group -</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </select>
              </div>
            </div>

            {/* ── Job Details ── */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="flex items-center gap-3 px-6 py-4 bg-[#1F2A44] text-white">
                <Briefcase className="w-5 h-5" /><h2 className="font-semibold">Job Related Information</h2>
              </div>
              <div className="p-6 space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Title</label>
                  <input type="text" value={form.job_title} onChange={set('job_title')} placeholder="e.g. Data Scientist" className={inputCls(false)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Organisation</label>
                  <input type="text" value={form.organisation} onChange={set('organisation')} placeholder="e.g. Bangladesh Bank" className={inputCls(false)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Address</label>
                  <input type="text" value={form.organisation_address} onChange={set('organisation_address')} placeholder="Address" className={inputCls(false)} />
                </div>
              </div>
            </div>

            {/* ── Notifications ── */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="flex items-center gap-3 px-6 py-4 bg-[#F39C12] text-white">
                <Bell className="w-5 h-5" /><h2 className="font-semibold">Event Notifications</h2>
                <span className="ml-auto text-xs opacity-80">* Required</span>
              </div>
              <div className="p-6 space-y-3">
                <label className={radioCls(form.notify_events === 'true')}>
                  <input type="radio" name="notify_events" checked={form.notify_events === 'true'}
                    onChange={() => { setForm(f => ({ ...f, notify_events: 'true' })); setErrors(p => { const n = { ...p }; delete n.notify_events; return n; }); }}
                    className="w-4 h-4 accent-[#2F5BEA] mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-[#1F2A44] text-sm">I want to be notified about every Events of STATA</p>
                    <p className="text-xs text-gray-400 mt-0.5">Receive updates about upcoming events and activities</p>
                  </div>
                </label>
                <label className={radioCls(form.notify_events === 'false')}>
                  <input type="radio" name="notify_events" checked={form.notify_events === 'false'}
                    onChange={() => { setForm(f => ({ ...f, notify_events: 'false' })); setErrors(p => { const n = { ...p }; delete n.notify_events; return n; }); }}
                    className="w-4 h-4 accent-[#2F5BEA] mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-[#1F2A44] text-sm">I don't want to be notified</p>
                    <p className="text-xs text-gray-400 mt-0.5">You can change this preference at any time</p>
                  </div>
                </label>
                {errors.notify_events && <p className="text-xs text-red-500 mt-1">{errors.notify_events}</p>}
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-700">
              <strong>Note:</strong> Profile field changes are reviewed by an admin before going live. Photo changes apply immediately.
            </div>

            <button onClick={handleSave} disabled={saving}
              className="w-full py-3.5 rounded-xl font-semibold text-white transition-all text-base bg-[#2F5BEA] hover:bg-[#1a3fc7] shadow-md hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2">
              {saving ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving…</> : 'Submit Profile Changes'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
