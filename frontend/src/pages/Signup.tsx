// src/pages/Signup.tsx — Member Registration
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, CheckCircle, User, Briefcase, Bell } from 'lucide-react';
import { api } from '../lib/api';

interface FormState {
  batch: string; full_name: string; email: string; phone_number: string;
  alternative_phone: string; job_title: string; organisation: string;
  organisation_address: string; notify_events: '' | 'true' | 'false';
}

const INITIAL: FormState = {
  batch: '', full_name: '', email: '', phone_number: '',
  alternative_phone: '', job_title: '', organisation: '',
  organisation_address: '', notify_events: '',
};

const inputCls = (err: boolean) =>
  `w-full px-4 py-3 border rounded-lg outline-none transition-all text-sm ${err
    ? 'border-red-400 bg-red-50 focus:ring-2 focus:ring-red-300'
    : 'border-gray-200 focus:ring-2 focus:ring-[#2F5BEA] focus:border-transparent'}`;

const radioCls = (selected: boolean) =>
  `flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${selected
    ? 'border-[#2F5BEA] bg-blue-50'
    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`;

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState<FormState>(INITIAL);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [emailTaken, setEmailTaken] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');

  const set = (field: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm(f => ({ ...f, [field]: e.target.value }));
      if (field === 'email') setEmailTaken(false);
      setErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
    };

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!form.batch || isNaN(Number(form.batch))) e.batch = 'Valid batch year is required';
    if (!form.full_name.trim()) e.full_name = 'Full name is required';
    if (!form.email.trim()) e.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Invalid email format';
    if (!form.phone_number.trim()) e.phone_number = 'Phone number is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const canSubmit = form.notify_events !== '' && !loading;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await api.register({
        batch: parseInt(form.batch),
        full_name: form.full_name.trim(),
        email: form.email.trim().toLowerCase(),
        phone_number: form.phone_number.trim(),
        notify_events: form.notify_events === 'true',
        alternative_phone: form.alternative_phone || undefined,
        job_title: form.job_title || undefined,
        organisation: form.organisation || undefined,
        organisation_address: form.organisation_address || undefined,
      });
      setSuccess(res.data.id);
    } catch (err: any) {
      if (err.message?.toLowerCase().includes('email')) {
        setEmailTaken(true);
        setErrors({ email: 'This email is already registered' });
      } else {
        setErrors({ general: err.message || 'Registration failed. Please try again.' });
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 bg-[#F5F7FA]">
      <div className="max-w-md w-full text-center bg-white p-10 rounded-2xl shadow-lg">
        <div className="w-20 h-20 bg-[#2ECC71] rounded-full flex items-center justify-center mx-auto mb-5">
          <CheckCircle className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-[#1F2A44] mb-2">Registration Successful!</h2>
        <p className="text-gray-500 text-sm mb-1">Your member ID</p>
        <p className="font-mono text-xs bg-gray-100 rounded px-3 py-2 text-gray-700 mb-6 break-all">{success}</p>
        <button onClick={() => navigate('/')} className="bg-[#2F5BEA] text-white px-8 py-3 rounded-lg font-semibold hover:bg-[#F39C12] transition-colors">
          Back to Home
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#F5F7FA] py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-[#2F5BEA] rounded-full flex items-center justify-center mx-auto mb-4">
            <UserPlus className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-[#1F2A44]">Join STATA</h1>
          <p className="text-gray-500 mt-1">Register as a STATA member</p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-6">
          {errors.general && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg text-sm">{errors.general}</div>
          )}

          {/* Personal Information */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="flex items-center gap-3 px-6 py-4 bg-[#2F5BEA] text-white">
              <User className="w-5 h-5" />
              <h2 className="font-semibold">Personal Information</h2>
              <span className="ml-auto text-xs opacity-80">* Required</span>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Batch <span className="text-red-500">*</span></label>
                <input type="number" value={form.batch} onChange={set('batch')} placeholder="e.g. 2018" min="1990" max="2100" className={inputCls(!!errors.batch)} />
                {errors.batch && <p className="mt-1 text-xs text-red-500">{errors.batch}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name <span className="text-red-500">*</span></label>
                <input type="text" value={form.full_name} onChange={set('full_name')} placeholder="Your full name" className={inputCls(!!errors.full_name)} />
                {errors.full_name && <p className="mt-1 text-xs text-red-500">{errors.full_name}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address <span className="text-red-500">*</span></label>
                <input type="email" value={form.email} onChange={set('email')} placeholder="your@email.com" className={inputCls(!!errors.email || emailTaken)} />
                {(errors.email || emailTaken) && <p className="mt-1 text-xs text-red-500">{errors.email || 'This email is already registered'}</p>}
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
          </div>

          {/* Job Details */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="flex items-center gap-3 px-6 py-4 bg-[#1F2A44] text-white">
              <Briefcase className="w-5 h-5" />
              <h2 className="font-semibold">Job Details</h2>
              <span className="ml-auto text-xs opacity-60">Optional</span>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Title</label>
                <input type="text" value={form.job_title} onChange={set('job_title')} placeholder="e.g. Software Engineer, Statistician" className={inputCls(false)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Organisation</label>
                <input type="text" value={form.organisation} onChange={set('organisation')} placeholder="e.g. Bangladesh Bank" className={inputCls(false)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Address</label>
                <input type="text" value={form.organisation_address} onChange={set('organisation_address')} placeholder="City, Country" className={inputCls(false)} />
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
              <p className="text-sm text-gray-500 mb-4">You must select one option to proceed.</p>
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
            </div>
          </div>

          {/* Submit */}
          <button type="submit" disabled={!canSubmit}
            className={`w-full py-3.5 rounded-xl font-semibold text-white transition-all text-base
              ${canSubmit ? 'bg-[#2F5BEA] hover:bg-[#1a3fc7] shadow-md hover:shadow-lg cursor-pointer' : 'bg-gray-300 cursor-not-allowed opacity-70'}`}>
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Registering...
              </span>
            ) : !form.notify_events
              ? 'Select a notification preference to continue'
              : 'Complete Registration'
            }
          </button>
        </form>
      </div>
    </div>
  );
}
