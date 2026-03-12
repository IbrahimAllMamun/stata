// src/pages/Signup.tsx - Member Registration with email-first flow + optional profile photo
import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, CheckCircle, User, Briefcase, Bell, Clock, Home, Search, AlertCircle, RefreshCw, Upload, Camera } from 'lucide-react';
import { api, imageUrl } from '../lib/api';

interface FormState {
  batch: string; full_name: string; email: string; phone_number: string;
  alternative_phone: string; job_title: string; organisation: string;
  organisation_address: string; notify_events: '' | 'true' | 'false'; blood_group: string;
}

const INITIAL: FormState = {
  batch: '', full_name: '', email: '', phone_number: '',
  alternative_phone: '', job_title: '', organisation: '',
  organisation_address: '', notify_events: '', blood_group: '',
};

const inputCls = (err: boolean) =>
  `w-full px-4 py-3 border rounded-lg outline-none transition-all text-sm ${err
    ? 'border-red-400 bg-red-50 focus:ring-2 focus:ring-red-300'
    : 'border-gray-200 focus:ring-2 focus:ring-[#2F5BEA] focus:border-transparent'}`;

const radioCls = (selected: boolean) =>
  `flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${selected
    ? 'border-[#2F5BEA] bg-blue-50'
    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`;

type Mode = 'email-check' | 'register' | 'update';

export default function Register() {
  const navigate = useNavigate();

  const [mode, setMode] = useState<Mode>('email-check');
  const [checkEmail, setCheckEmail] = useState('');
  const [checking, setChecking] = useState(false);
  const [checkErr, setCheckErr] = useState('');

  const [form, setForm] = useState<FormState>(INITIAL);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<'registered' | 'updated' | ''>('');

  // Photo state
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [existingPhotoUrl, setExistingPhotoUrl] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const set = (field: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm(f => ({ ...f, [field]: e.target.value }));
      setErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
    };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    setPhoto(f);
    setPhotoPreview(URL.createObjectURL(f));
  };

  // ── Email check ────────────────────────────────────────────────────────────
  const handleEmailCheck = async () => {
    const trimmed = checkEmail.trim().toLowerCase();
    if (!trimmed) { setCheckErr('Please enter your email address.'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) { setCheckErr('Please enter a valid email.'); return; }
    setChecking(true); setCheckErr('');
    try {
      const res = await api.lookupMember(trimmed);

      // Not found → registration form
      if (res.notFound || !res.data) {
        setForm({ ...INITIAL, email: trimmed });
        setMode('register');
        return;
      }

      const m = res.data;
      if (m.status === 'ARCHIVED') {
        setCheckErr('Your account has been archived. Please contact an admin.');
        return;
      }
      setForm({
        batch: String(m.batch ?? ''),
        full_name: m.full_name ?? '',
        email: m.email ?? '',
        phone_number: m.phone_number ?? '',
        alternative_phone: m.alternative_phone ?? '',
        job_title: m.job_title ?? '',
        organisation: m.organisation ?? '',
        organisation_address: m.organisation_address ?? '',
        notify_events: m.notify_events === true ? 'true' : m.notify_events === false ? 'false' : '',
        blood_group: m.blood_group ?? '',
      });
      if (m.photo_url) {
        setExistingPhotoUrl(imageUrl(m.photo_url) ?? null);
        setPhotoPreview(imageUrl(m.photo_url) ?? null);
      }
      setMode('update');
    } catch (err: any) {
      setCheckErr(err?.message || 'Something went wrong. Please try again.');
    } finally { setChecking(false); }
  };

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!form.batch || isNaN(Number(form.batch)) || Number(form.batch) < 1) e.batch = 'Valid batch number is required';
    if (!form.full_name.trim()) e.full_name = 'Full name is required';
    if (!form.email.trim()) e.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Invalid email format';
    if (!form.phone_number.trim()) e.phone_number = 'Phone number is required';
    if (!form.notify_events) e.notify_events = 'Please select a notification preference';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const canSubmit = form.notify_events !== '' && !loading;

  // Build FormData for register (multipart)
  const buildFormData = () => {
    const fd = new FormData();
    fd.append('batch', form.batch);
    fd.append('full_name', form.full_name.trim());
    fd.append('email', form.email.trim().toLowerCase());
    fd.append('phone_number', form.phone_number.trim());
    fd.append('notify_events', String(form.notify_events === 'true'));
    if (form.alternative_phone) fd.append('alternative_phone', form.alternative_phone);
    if (form.job_title) fd.append('job_title', form.job_title);
    if (form.organisation) fd.append('organisation', form.organisation);
    if (form.organisation_address) fd.append('organisation_address', form.organisation_address);
    if (form.blood_group) fd.append('blood_group', form.blood_group);
    if (photo) fd.append('photo', photo);
    return fd;
  };

  // ── Register ───────────────────────────────────────────────────────────────
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await api.registerWithPhoto(buildFormData());
      setSuccess('registered');
    } catch (err: any) {
      const msg = (err.message || '').toLowerCase();
      if (msg.includes('already registered') || msg.includes('already exists') || msg.includes('duplicate') || msg.includes('unique')) {
        setErrors({ email: 'This email is already registered' });
      } else {
        setErrors({ general: err.message || 'Registration failed. Please try again.' });
      }
    } finally { setLoading(false); }
  };

  // ── Update ─────────────────────────────────────────────────────────────────
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      // If a new photo was selected, upload it first (direct update, no approval queue)
      if (photo) {
        await api.updateMemberPhoto(form.email.trim().toLowerCase(), photo);
      }
      await api.updateMember({
        email: form.email.trim().toLowerCase(),
        batch: parseInt(form.batch),
        full_name: form.full_name.trim(),
        phone_number: form.phone_number.trim(),
        notify_events: form.notify_events === 'true',
        alternative_phone: form.alternative_phone || undefined,
        job_title: form.job_title || undefined,
        organisation: form.organisation || undefined,
        organisation_address: form.organisation_address || undefined,
        blood_group: form.blood_group || null,
      });
      setSuccess('updated');
    } catch (err: any) {
      setErrors({ general: err.message || 'Update failed. Please try again.' });
    } finally { setLoading(false); }
  };

  // ── Success screen ─────────────────────────────────────────────────────────
  if (success) return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 bg-[#F5F7FA]">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="h-1.5 bg-gradient-to-r from-[#2F5BEA] via-[#F39C12] to-[#2ECC71]" />
        <div className="p-8 text-center">
          <div className="relative inline-flex mb-6">
            <div className="w-20 h-20 bg-[#2ECC71]/10 rounded-full flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-[#2ECC71]" />
            </div>
            {success === 'registered' && (
              <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center border-2 border-white">
                <Clock className="w-4 h-4 text-amber-500" />
              </div>
            )}
          </div>
          <h2 className="text-2xl font-extrabold text-[#1F2A44] mb-2">
            {success === 'registered' ? 'Registration Received!' : 'Information Updated!'}
          </h2>
          <p className="text-gray-500 text-sm mb-6">
            {success === 'registered'
              ? 'Your application has been submitted successfully.'
              : 'Your update request has been submitted and is pending admin review.'}
          </p>
          {success === 'registered' && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 text-left">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">Pending Approval</span>
              </div>
              <p className="text-sm text-amber-700 leading-relaxed">
                Your membership is under review. You will be notified once approved. This usually takes 1–3 business days.
              </p>
            </div>
          )}
          <button onClick={() => navigate('/')}
            className="w-full flex items-center justify-center gap-2 bg-[#2F5BEA] hover:bg-[#1a3fc7] text-white px-6 py-3 rounded-xl font-semibold transition-colors text-sm">
            <Home className="w-4 h-4" /> Back to Home
          </button>
        </div>
      </div>
    </div>
  );

  // ── Email check ────────────────────────────────────────────────────────────
  if (mode === 'email-check') return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 bg-[#F5F7FA]">
      <div className="max-w-sm w-full bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="h-1.5 bg-gradient-to-r from-[#2F5BEA] via-[#F39C12] to-[#2ECC71]" />
        <div className="p-8">
          <div className="w-14 h-14 bg-[#2F5BEA] rounded-full flex items-center justify-center mx-auto mb-5">
            <UserPlus className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-[#1F2A44] text-center mb-1">Join STATA</h1>
          <p className="text-gray-400 text-sm text-center mb-7">Enter your email to get started</p>

          {checkErr && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm mb-4">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" /> {checkErr}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
              <input type="email" value={checkEmail}
                onChange={e => { setCheckEmail(e.target.value); setCheckErr(''); }}
                onKeyDown={e => e.key === 'Enter' && handleEmailCheck()}
                placeholder="example@isrt.ac.bd" autoFocus className={inputCls(!!checkErr)} />
            </div>
            <button onClick={handleEmailCheck} disabled={checking}
              className="w-full flex items-center justify-center gap-2 bg-[#2F5BEA] hover:bg-[#1a3fc7] disabled:opacity-60 text-white px-6 py-3 rounded-xl font-semibold transition-colors text-sm">
              {checking
                ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Checking…</>
                : <><Search className="w-4 h-4" /> Continue</>}
            </button>
          </div>
          <p className="text-center text-xs text-gray-400 mt-5">
            Already a member? We'll pre-fill your information.
          </p>
        </div>
      </div>
    </div>
  );

  const isUpdate = mode === 'update';

  // ── Photo upload widget ────────────────────────────────────────────────────
  const PhotoUpload = () => (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-[#2F5BEA]/80 to-[#1F2A44] text-white">
        <Camera className="w-5 h-5" />
        <h2 className="font-semibold">Profile Photo</h2>
        <span className="ml-auto text-xs opacity-70">Optional</span>
      </div>
      <div className="p-6 flex items-center gap-6">
        {/* Avatar preview */}
        <div
          onClick={() => fileRef.current?.click()}
          className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-dashed border-gray-200 flex items-center justify-center cursor-pointer relative group flex-shrink-0 hover:border-[#2F5BEA] transition-colors"
        >
          {photoPreview
            ? <img src={photoPreview} alt="preview" className="w-full h-full object-cover" />
            : <User className="w-8 h-8 text-gray-300" />}
          <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-xl">
            <Upload className="w-5 h-5 text-white mb-1" />
            <span className="text-[10px] text-white font-medium">{photoPreview ? 'Change' : 'Upload'}</span>
          </div>
        </div>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
        <div>
          <p className="text-sm font-medium text-gray-700 mb-1">
            {isUpdate && existingPhotoUrl ? 'Update your photo' : 'Add a profile photo'}
          </p>
          <p className="text-xs text-gray-400 leading-relaxed mb-3">
            JPG, PNG, or WebP. Square crop works best.
            {isUpdate && existingPhotoUrl && <><br /><span className="text-gray-300">Current photo loaded - leave empty to keep it.</span></>}
          </p>
          <button type="button" onClick={() => fileRef.current?.click()}
            className="text-xs text-[#2F5BEA] hover:underline font-medium flex items-center gap-1">
            <Upload className="w-3 h-3" /> {photoPreview ? 'Change photo' : 'Choose photo'}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#F5F7FA] py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${isUpdate ? 'bg-[#1F2A44]' : 'bg-[#2F5BEA]'}`}>
            {isUpdate ? <RefreshCw className="w-8 h-8 text-white" /> : <UserPlus className="w-8 h-8 text-white" />}
          </div>
          <h1 className="text-3xl font-bold text-[#1F2A44]">
            {isUpdate ? 'Update Your Information' : 'Join STATA'}
          </h1>
          <p className="text-gray-500 mt-1">
            {isUpdate ? `Updating profile for ${form.email}` : 'Register as a STATA member'}
          </p>
          {isUpdate && (
            <button
              onClick={() => { setMode('email-check'); setCheckEmail(''); setForm(INITIAL); setErrors({}); setPhoto(null); setPhotoPreview(null); setExistingPhotoUrl(null); }}
              className="mt-2 text-xs text-[#2F5BEA] hover:underline">
              ← Use a different email
            </button>
          )}
        </div>

        <form onSubmit={isUpdate ? handleUpdate : handleRegister} noValidate className="space-y-6">
          {errors.general && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg text-sm">{errors.general}</div>
          )}

          {isUpdate && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-700">
              ℹ️ Your information has been pre-filled. Make any changes and click <strong>Update Information</strong>.
              Updates are reviewed by an admin before being applied. Profile photo changes apply immediately.
            </div>
          )}

          {/* Profile Photo */}
          <PhotoUpload />

          {/* Personal Information */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="flex items-center gap-3 px-6 py-4 bg-[#2F5BEA] text-white">
              <User className="w-5 h-5" />
              <h2 className="font-semibold">Personal Information</h2>
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
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address <span className="text-red-500">*</span></label>
                <input type="email" value={form.email} onChange={set('email')} placeholder="example@isrt.ac.bd"
                  className={inputCls(!!errors.email)} readOnly={isUpdate}
                  style={isUpdate ? { backgroundColor: '#F9FAFB', color: '#6B7280', cursor: 'not-allowed' } : {}} />
                {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
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

          {/* Job Details */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="flex items-center gap-3 px-6 py-4 bg-[#1F2A44] text-white">
              <Briefcase className="w-5 h-5" />
              <h2 className="font-semibold">Job Related Information</h2>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Title</label>
                <input type="text" value={form.job_title} onChange={set('job_title')} placeholder="e.g. Data Scientist, Statistician" className={inputCls(false)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Organisation</label>
                <input type="text" value={form.organisation} onChange={set('organisation')} placeholder="e.g. Bangladesh Bank, Pathao" className={inputCls(false)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Address</label>
                <input type="text" value={form.organisation_address} onChange={set('organisation_address')} placeholder="Address" className={inputCls(false)} />
              </div>
            </div>
          </div>

          {/* Notification Preference */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="flex items-center gap-3 px-6 py-4 bg-[#F39C12] text-white">
              <Bell className="w-5 h-5" />
              <h2 className="font-semibold">Event Notifications</h2>
              <span className="ml-auto text-xs opacity-80">* Required</span>
            </div>
            <div className="p-6 space-y-3">
              <label className={radioCls(form.notify_events === 'true')}>
                <input type="radio" name="notify_events" checked={form.notify_events === 'true'}
                  onChange={() => setForm(f => ({ ...f, notify_events: 'true' }))} className="w-4 h-4 accent-[#2F5BEA] mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-[#1F2A44] text-sm">I want to be notified about every Events of STATA</p>
                  <p className="text-xs text-gray-400 mt-0.5">Receive updates about upcoming events and activities</p>
                </div>
              </label>
              <label className={radioCls(form.notify_events === 'false')}>
                <input type="radio" name="notify_events" checked={form.notify_events === 'false'}
                  onChange={() => setForm(f => ({ ...f, notify_events: 'false' }))} className="w-4 h-4 accent-[#2F5BEA] mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-[#1F2A44] text-sm">I don't want to be notified</p>
                  <p className="text-xs text-gray-400 mt-0.5">You can change this preference at any time</p>
                </div>
              </label>
              {errors.notify_events && <p className="mt-1 text-xs text-red-500">{errors.notify_events}</p>}
            </div>
          </div>

          <button type="submit" disabled={!canSubmit}
            className={`w-full py-3.5 rounded-xl font-semibold text-white transition-all text-base
              ${canSubmit
                ? isUpdate
                  ? 'bg-[#1F2A44] hover:bg-[#111827] shadow-md hover:shadow-lg cursor-pointer'
                  : 'bg-[#2F5BEA] hover:bg-[#1a3fc7] shadow-md hover:shadow-lg cursor-pointer'
                : 'bg-gray-300 cursor-not-allowed opacity-70'}`}>
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                {isUpdate ? 'Updating...' : 'Registering...'}
              </span>
            ) : !form.notify_events
              ? 'Select a notification preference to continue'
              : isUpdate ? 'Update Information' : 'Complete Registration'
            }
          </button>
        </form>
      </div>
    </div>
  );
}