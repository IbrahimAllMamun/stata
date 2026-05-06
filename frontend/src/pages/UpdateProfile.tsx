// src/pages/UpdateProfile.tsx
import { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Briefcase, Bell, CheckCircle, Home, ArrowLeft, AlertCircle, RefreshCw, Camera, X } from 'lucide-react';
import { api, imageUrl, Member } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';

type Step = 'edit' | 'success';

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
  const { member: authMember } = useAuth();
  const [step, setStep] = useState<Step>('edit');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Photo
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoSaving, setPhotoSaving] = useState(false);
  const [photoSaved, setPhotoSaved] = useState(false);

  // Edit form
  const [memberEmail, setMemberEmail] = useState<string>('');
  const [memberStatus, setMemberStatus] = useState<string>('');
  const [form, setForm] = useState<FormState>({
    batch: '', full_name: '', phone_number: '', alternative_phone: '',
    job_title: '', organisation: '', organisation_address: '', notify_events: '', blood_group: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saveResult, setSaveResult] = useState<{ full_name: string; status: string } | null>(null);

  // ── Initialize with logged-in user data ───────────────────────────────────────
  useEffect(() => {
    if (!authMember) {
      navigate('/login', { replace: true });
      return;
    }

    // Automatically load the current user's profile
    const initializeForm = async () => {
      try {
        setIsLoading(true);
        const res = await api.lookupMember(authMember.email);
        const m = res.data as Member & { status: string };

        setMemberEmail(m.email);
        setMemberStatus(m.status);

        // Pre-load existing photo preview
        const existingSrc = imageUrl(m.photo_url);
        if (existingSrc) setPhotoPreview(existingSrc);

        // Populate form with user's current data
        setForm({
          batch: String(m.batch),
          full_name: m.full_name,
          phone_number: m.phone_number || '',
          alternative_phone: m.alternative_phone ?? '',
          job_title: m.job_title ?? '',
          organisation: m.organisation ?? '',
          organisation_address: m.organisation_address ?? '',
          notify_events: m.notify_events ? 'true' : 'false',
          blood_group: m.blood_group ?? '',
        });
      } catch (err) {
        console.error('Failed to load profile:', err);
        // Fallback to auth member data if lookup fails
        setMemberEmail(authMember.email);
        setMemberStatus(authMember.status || 'PENDING');
        setForm({
          batch: String(authMember.batch),
          full_name: authMember.full_name,
          phone_number: authMember.phone_number || '',
          alternative_phone: authMember.alternative_phone ?? '',
          job_title: authMember.job_title ?? '',
          organisation: authMember.organisation ?? '',
          organisation_address: authMember.organisation_address ?? '',
          notify_events: authMember.notify_events ? 'true' : 'false',
          blood_group: authMember.blood_group ?? '',
        });
        if (authMember.photo_url) {
          setPhotoPreview(imageUrl(authMember.photo_url));
        }
      } finally {
        setIsLoading(false);
      }
    };

    initializeForm();
  }, [authMember, navigate]);

  const set = (field: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm(f => ({ ...f, [field]: e.target.value }));
      setErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
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
    if (!photo || !memberEmail) return;
    setPhotoSaving(true);
    try {
      await api.updateMemberPhoto(memberEmail, photo);
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
    if (!validate() || !memberEmail) return;
    setSaving(true);
    try {
      const res = await api.updateMember({
        email: memberEmail,
        batch: parseInt(form.batch),
        full_name: form.full_name.trim(),
        phone_number: form.phone_number.trim(),
        alternative_phone: form.alternative_phone.trim() || undefined,
        job_title: form.job_title.trim() || undefined,
        organisation: form.organisation.trim() || undefined,
        organisation_address: form.organisation_address.trim() || undefined,
        notify_events: form.notify_events === 'true',
        blood_group: form.blood_group || undefined,
      });
      setSaveResult({ full_name: form.full_name, status: res.data?.status ?? 'PENDING' });
      setStep('success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Something went wrong.';
      setErrors(prev => ({ ...prev, _form: msg }));
    } finally { setSaving(false); }
  };

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#EEF2FF] py-8 px-4">
      <div className="max-w-2xl mx-auto">

        {/* Loading state */}
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-[#2F5BEA]/20 border-t-[#2F5BEA] rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-600 font-medium">Loading your profile...</p>
            </div>
          </div>
        )}

        {!isLoading && step === 'edit' && (
          <>
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
              <button onClick={() => navigate('/member-account')}
                className="flex items-center gap-2 text-gray-600 hover:text-[#2F5BEA] transition-colors font-medium">
                <ArrowLeft className="w-4 h-4" /> Back to Profile
              </button>
            </div>

            {/* Form sections */}
            <div className="space-y-6">

              {/* Status card */}
              {memberStatus && (
                <div className={`rounded-2xl border-2 p-4 flex items-start gap-3 ${STATUS_STYLES[memberStatus]?.bg ?? 'bg-gray-50'}`}>
                  <AlertCircle className={`w-5 h-5 mt-0.5 flex-shrink-0 ${STATUS_STYLES[memberStatus]?.text ?? 'text-gray-500'}`} />
                  <div>
                    <p className={`font-semibold text-sm ${STATUS_STYLES[memberStatus]?.text ?? 'text-gray-500'}`}>
                      {STATUS_STYLES[memberStatus]?.label ?? memberStatus}
                    </p>
                    {memberStatus === 'PENDING' && (
                      <p className="text-xs text-gray-600 mt-0.5">Your updates will be reviewed by an admin before going live.</p>
                    )}
                  </div>
                </div>
              )}

              {errors._form && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-red-700">{errors._form}</p>
                </div>
              )}

              {/* Photo upload */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden p-6">
                <h3 className="font-semibold text-[#1F2A44] mb-4 flex items-center gap-2">
                  <RefreshCw className="w-4 h-4" /> Profile Photo
                </h3>
                <div className="flex gap-6">
                  <div className="flex-shrink-0">
                    {photoPreview ? (
                      <div className="relative">
                        <img src={photoPreview} alt="Preview"
                          className="w-24 h-24 rounded-2xl object-cover border-4 border-[#2F5BEA]/20" />
                        {photo && (
                          <button onClick={() => { setPhoto(null); setPhotoPreview(imageUrl(authMember?.photo_url)); }}
                            className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors">
                            <X className="w-3 h-3 text-white" />
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-[#2F5BEA] to-[#1F2A44] flex items-center justify-center text-white font-bold text-xl border-4 border-[#2F5BEA]/20">
                        {form.full_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
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

                    {photoSaved && <p className="text-sm text-green-600 font-medium flex items-center gap-1.5"><CheckCircle className="w-4 h-4" /> Photo updated successfully.</p>}
                    {errors.photo && <p className="text-xs text-red-500">{errors.photo}</p>}

                    <p className="text-xs text-gray-400">JPG, PNG, WEBP or HEIC · Max 15MB · Changes apply immediately</p>
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
                    <input type="email" value={memberEmail} readOnly className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-400 cursor-not-allowed" />
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
          </>
        )}

        {step === 'success' && saveResult && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-[#1F2A44] mb-2">Profile Updated!</h2>
            <p className="text-gray-600 mb-6">
              Thanks, <strong>{saveResult.full_name}</strong>. Your profile changes have been submitted for review.
            </p>
            {saveResult.status === 'PENDING' && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 inline-block">
                <p className="text-sm text-amber-700">
                  Your updates will be reviewed by an admin and go live soon.
                </p>
              </div>
            )}
            <button onClick={() => navigate('/member-account')}
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#2F5BEA] text-white rounded-lg font-semibold hover:bg-[#1a3fc7] transition-colors">
              <Home className="w-4 h-4" /> Back to Account
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
