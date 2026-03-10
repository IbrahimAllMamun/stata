// src/components/aspl/RegistrationForm.tsx
import { useState, useRef } from 'react';
import { X, Upload, CheckCircle2, ChevronDown, User, Search, ArrowRight, AlertCircle, UserPlus, Briefcase, Building2, Phone, Mail, Hash, RefreshCw } from 'lucide-react';
import { api, asplApi, AsplSeason, AsplRegistration } from '../../lib/api';

interface Props {
  season: AsplSeason;
  onClose: () => void;
}

type Step = 'email' | 'form' | 'not-found' | 'success';

const INPUT = 'w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]/30 transition-all';
const LABEL = 'block text-[11px] tracking-widest text-white/40 mb-1.5 uppercase';

interface FoundMember {
  id: string; full_name: string; email: string; batch: number;
  phone_number: string; job_title?: string | null;
  organisation?: string | null; status: string;
}

export default function RegistrationForm({ season, onClose }: Props) {
  const [step, setStep] = useState<Step>('email');

  // Email lookup
  const [email, setEmail] = useState('');
  const [looking, setLooking] = useState(false);
  const [lookupErr, setLookupErr] = useState('');
  const [member, setMember] = useState<FoundMember | null>(null);

  // Whether this member already has a registration this season
  const [existingReg, setExistingReg] = useState<AsplRegistration | null>(null);

  // Photo + position
  const [position, setPosition] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [result, setResult] = useState<{ message: string; registration: AsplRegistration; member: { full_name: string; batch: number }; updated: boolean } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const positions = asplApi.getPositions(season.sport);
  const isUpdate = !!existingReg;

  const resetToEmail = () => {
    setStep('email');
    setMember(null);
    setExistingReg(null);
    setPosition('');
    setPhoto(null);
    setPhotoPreview(null);
    setFormError('');
    setLookupErr('');
  };

  // ── Step 1: look up email ──────────────────────────────────────────────────
  const handleLookup = async () => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) { setLookupErr('Please enter your email address.'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) { setLookupErr('Please enter a valid email address.'); return; }
    setLooking(true); setLookupErr('');
    try {
      const res = await api.lookupMember(trimmed);
      const m = res.data as FoundMember;
      if (m.status === 'ARCHIVED') {
        setLookupErr('Your account has been archived. Please contact an admin.');
        return;
      }
      setMember(m);

      // Check if already registered for this season
      let existing: AsplRegistration | null = null;
      try {
        existing = await asplApi.lookupRegistration(trimmed, season.id) as any;
        // Pre-fill position from existing registration
        if (existing?.playing_position) setPosition(existing.playing_position);
        // Pre-fill photo preview if they have one
        if (existing?.photo_url) {
          const base = (import.meta.env.VITE_API_URL || 'http://localhost:3000/api').replace('/api', '');
          setPhotoPreview(base + existing.photo_url);
        }
      } catch {
        // No existing registration — that's fine
        existing = null;
      }
      setExistingReg(existing);
      setStep('form');
    } catch (err: unknown) {
      const msg = (err instanceof Error ? err.message : '').toLowerCase();
      if (msg.includes('404') || msg.includes('not found') || msg.includes('no member') || msg.includes('member not found')) {
        setStep('not-found');
      } else {
        setLookupErr(msg || 'Something went wrong. Please try again.');
      }
    } finally { setLooking(false); }
  };

  // ── Step 2: submit ─────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!position) { setFormError('Please select your playing position.'); return; }
    setFormError(''); setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('season_id', String(season.id));
      fd.append('email', member!.email);
      fd.append('playing_position', position);
      if (photo) fd.append('photo', photo);

      let res;
      if (isUpdate) {
        // Use update endpoint — only sends position/photo changes
        res = await asplApi.updatePlayerDetails(fd);
        setResult({ ...res, member: { full_name: member!.full_name, batch: member!.batch }, updated: true });
      } else {
        res = await asplApi.register(fd);
        setResult({ ...res, updated: false });
      }
      setStep('success');
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Submission failed. Please try again.');
    } finally { setSubmitting(false); }
  };

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    setPhoto(f); setPhotoPreview(URL.createObjectURL(f));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: 'rgba(6,12,26,0.85)', backdropFilter: 'blur(8px)' }}>
      <div className="w-full sm:max-w-md max-h-[95vh] overflow-y-auto rounded-t-3xl sm:rounded-2xl"
        style={{ background: 'var(--pitch-mid)', border: '1px solid rgba(255,255,255,0.08)' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div>
            <p className="text-[10px] tracking-widest text-white/40 mb-0.5" style={{ fontFamily: 'kanit' }}>
              {season.name} · {season.sport}
            </p>
            <h2 className="text-lg font-bold text-white" style={{ fontFamily: 'fredoka' }}>
              {step === 'email' ? 'Player Registration' :
                step === 'form' ? (isUpdate ? 'Update Registration' : 'Confirm & Register') :
                  step === 'not-found' ? 'Member Not Found' :
                    isUpdate ? 'Registration Updated' : 'Registration Received'}
            </h2>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors"
            style={{ background: 'rgba(255,255,255,0.06)' }}>
            <X className="w-4 h-4 text-white/60" />
          </button>
        </div>

        {/* ── Step 1: Email lookup ─────────────────────────────────────────── */}
        {step === 'email' && (
          <div className="px-6 py-6 space-y-5">
            <div className="rounded-xl px-4 py-3 text-xs leading-relaxed"
              style={{ background: 'rgba(47,91,234,0.12)', border: '1px solid rgba(47,91,234,0.2)', color: 'rgba(200,215,255,0.7)' }}>
              Enter your STATA email to register or update your existing registration.
            </div>

            {lookupErr && (
              <div className="rounded-xl px-4 py-3 text-xs flex items-start gap-2"
                style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#fca5a5' }}>
                <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />{lookupErr}
              </div>
            )}

            <div>
              <label className={LABEL}>STATA Member Email *</label>
              <input type="email" value={email}
                onChange={e => { setEmail(e.target.value); setLookupErr(''); }}
                onKeyDown={e => e.key === 'Enter' && handleLookup()}
                placeholder="example@isrt.ac.bd" className={INPUT} autoFocus />
            </div>

            <button onClick={handleLookup} disabled={looking}
              className="w-full py-3.5 rounded-xl text-sm font-bold tracking-wider transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ background: 'var(--accent)', color: 'var(--pitch)', fontFamily: 'kanit' }}>
              {looking
                ? <><div className="w-4 h-4 border-2 border-[var(--pitch)]/40 border-t-[var(--pitch)] rounded-full animate-spin" /> LOOKING UP…</>
                : <><Search className="w-4 h-4" /> CONTINUE</>}
            </button>

            <p className="text-[10px] text-center text-white/25 pb-1">
              Not a STATA member yet?{' '}
              <a href="/register" target="_blank" rel="noopener noreferrer"
                className="underline text-white/50 hover:text-white/80">Register here first</a>
            </p>
          </div>
        )}

        {/* ── Step 2: Form (register or update) ───────────────────────────── */}
        {step === 'form' && member && (
          <div className="px-6 py-5 space-y-4">

            {/* Existing registration banner */}
            {isUpdate && (
              <div className="rounded-xl px-4 py-3 text-xs leading-relaxed flex items-start gap-2"
                style={{ background: 'rgba(47,91,234,0.12)', border: '1px solid rgba(47,91,234,0.2)', color: 'rgba(200,215,255,0.8)' }}>
                <RefreshCw className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                You already have a registration for this season. Your position and photo are pre-filled — update them below.
              </div>
            )}

            {/* Member info card */}
            <div className="rounded-xl overflow-hidden"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="px-4 py-2.5 flex items-center gap-2"
                style={{ background: 'rgba(47,91,234,0.15)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="w-6 h-6 rounded-full bg-[#2F5BEA] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                  {member.full_name.charAt(0).toUpperCase()}
                </div>
                <span className="text-xs font-bold text-white/80 tracking-wide" style={{ fontFamily: 'kanit' }}>
                  STATA MEMBER VERIFIED
                </span>
                <span className={`ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full ${member.status === 'APPROVED' ? 'bg-green-500/20 text-green-400' : 'bg-amber-500/20 text-amber-400'}`}>
                  {member.status}
                </span>
              </div>
              <div className="px-4 py-3 space-y-2.5">
                <InfoRow icon={<User className="w-3.5 h-3.5" />} label="Name" value={member.full_name} />
                <InfoRow icon={<Mail className="w-3.5 h-3.5" />} label="Email" value={member.email} />
                <InfoRow icon={<Hash className="w-3.5 h-3.5" />} label="Batch" value={`Batch ${member.batch}`} />
                <InfoRow icon={<Phone className="w-3.5 h-3.5" />} label="Phone" value={member.phone_number} />
                {member.job_title && <InfoRow icon={<Briefcase className="w-3.5 h-3.5" />} label="Title" value={member.job_title} />}
                {member.organisation && <InfoRow icon={<Building2 className="w-3.5 h-3.5" />} label="Org" value={member.organisation} />}
              </div>
              <div className="px-4 py-2" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <p className="text-[10px] text-white/25">
                  Wrong account?{' '}
                  <button onClick={resetToEmail} className="underline text-white/40 hover:text-white/60">
                    Use a different email
                  </button>
                </p>
              </div>
            </div>

            {formError && (
              <div className="rounded-xl px-4 py-3 text-xs flex items-start gap-2"
                style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#fca5a5' }}>
                <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />{formError}
              </div>
            )}

            {/* Photo upload */}
            <div>
              <label className={LABEL}>
                Profile Photo <span className="text-white/20 normal-case">· shown during auction</span>
                {isUpdate && photoPreview && <span className="text-[var(--accent)]/60 normal-case"> · current photo loaded</span>}
              </label>
              <div className="flex items-center gap-4">
                <div onClick={() => fileRef.current?.click()}
                  className="w-20 h-20 rounded-2xl overflow-hidden flex items-center justify-center cursor-pointer flex-shrink-0 relative group"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '2px dashed rgba(255,255,255,0.12)' }}>
                  {photoPreview
                    ? <img src={photoPreview} alt="preview" className="w-full h-full object-cover" />
                    : <User className="w-7 h-7 text-white/20" />}
                  <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"
                    style={{ background: 'rgba(0,0,0,0.6)' }}>
                    <Upload className="w-5 h-5 text-white mb-1" />
                    <span className="text-[10px] text-white/80">{photo ? 'Change' : 'Upload'}</span>
                  </div>
                </div>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
                <p className="text-xs text-white/30 leading-relaxed">
                  JPG, PNG, or WebP<br />
                  Square crop works best
                  {isUpdate && !photo && existingReg?.photo_url && (
                    <><br /><span className="text-white/20">Leave empty to keep current photo</span></>
                  )}
                </p>
              </div>
            </div>

            {/* Playing position */}
            <div>
              <label className={LABEL}>Playing Position *</label>
              <div className="relative">
                <select value={position} onChange={e => { setPosition(e.target.value); setFormError(''); }}
                  className={INPUT + ' appearance-none pr-8 cursor-pointer'}
                  style={{ background: 'rgba(255,255,255,0.05)' }}>
                  <option value="" disabled style={{ background: '#0f172a' }}>Select your position</option>
                  {positions.map(p => (
                    <option key={p} value={p} style={{ background: '#0f172a' }}>{p}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
              </div>
            </div>

            {/* Submit */}
            <button onClick={handleSubmit} disabled={submitting}
              className="w-full py-3.5 rounded-xl text-sm font-bold tracking-wider transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ background: 'var(--accent)', color: 'var(--pitch)', fontFamily: 'kanit' }}>
              {submitting
                ? <><div className="w-4 h-4 border-2 border-[var(--pitch)]/40 border-t-[var(--pitch)] rounded-full animate-spin" /> {isUpdate ? 'UPDATING…' : 'SUBMITTING…'}</>
                : isUpdate
                  ? <><RefreshCw className="w-4 h-4" /> UPDATE REGISTRATION</>
                  : 'REGISTER NOW'}
            </button>
          </div>
        )}

        {/* ── Step 3: Not a member ─────────────────────────────────────────── */}
        {step === 'not-found' && (
          <div className="px-6 py-8 text-center">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.2)' }}>
              <AlertCircle className="w-7 h-7 text-red-400" />
            </div>
            <h3 className="text-base font-bold text-white mb-2" style={{ fontFamily: 'fredoka' }}>
              Not a STATA Member
            </h3>
            <p className="text-sm text-white/50 mb-2 leading-relaxed">No STATA membership found for</p>
            <p className="text-sm font-semibold mb-6 px-4 py-2 rounded-xl inline-block"
              style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--accent)' }}>
              {email}
            </p>
            <p className="text-sm text-white/50 mb-6 leading-relaxed">
              ASPL registration is only open to registered STATA members.
            </p>
            <div className="space-y-3">
              <a href="/register" target="_blank" rel="noopener noreferrer"
                className="w-full py-3.5 rounded-xl text-sm font-bold tracking-wider flex items-center justify-center gap-2 transition-all hover:opacity-90"
                style={{ background: 'var(--accent)', color: 'var(--pitch)', fontFamily: 'kanit' }}>
                <UserPlus className="w-4 h-4" /> JOIN STATA NOW <ArrowRight className="w-4 h-4" />
              </a>
              <button onClick={resetToEmail}
                className="w-full py-3 rounded-xl text-sm font-semibold transition-colors"
                style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)' }}>
                Try a different email
              </button>
            </div>
            <p className="text-[10px] text-white/25 mt-4">
              Already registered? Your membership may still be pending approval.
            </p>
          </div>
        )}

        {/* ── Step 4: Success ──────────────────────────────────────────────── */}
        {step === 'success' && result && (
          <div className="px-6 py-8 text-center">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ background: result.updated ? 'rgba(47,91,234,0.15)' : 'rgba(0,229,160,0.15)' }}>
              <CheckCircle2 className="w-7 h-7" style={{ color: 'var(--accent)' }} />
            </div>
            <h3 className="text-base font-bold text-white mb-2" style={{ fontFamily: 'fredoka' }}>
              {result.updated ? 'Registration Updated!' : "You're Registered!"}
            </h3>
            <p className="text-sm text-white/50 mb-6 leading-relaxed">{result.message}</p>

            {result.registration.conflict_note && (
              <div className="rounded-xl px-4 py-3 mb-5 text-left text-xs leading-relaxed"
                style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', color: '#fcd34d' }}>
                ⚠️ {result.registration.conflict_note}
              </div>
            )}

            <div className="rounded-xl px-4 py-3 mb-6 text-left space-y-2"
              style={{ background: 'rgba(255,255,255,0.04)' }}>
              {[
                ['Name', result.member.full_name],
                ['Email', result.registration.email],
                ['Batch', String(result.member.batch)],
                ['Position', result.registration.playing_position],
                ['Status', result.registration.status],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between text-xs">
                  <span className="text-white/40 tracking-wide" style={{ fontFamily: 'kanit' }}>{k}</span>
                  <span className={`font-medium ${v === 'PENDING' ? 'text-amber-400' : v === 'APPROVED' ? 'text-green-400' : 'text-white/70'}`}
                    style={{ fontFamily: 'fredoka' }}>{v}</span>
                </div>
              ))}
            </div>

            <button onClick={onClose}
              className="w-full py-3 rounded-xl text-sm font-bold tracking-wider"
              style={{ background: 'var(--accent)', color: 'var(--pitch)', fontFamily: 'kanit' }}>
              DONE
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="text-white/30 flex-shrink-0">{icon}</span>
      <span className="text-[10px] text-white/30 uppercase tracking-wider w-10 flex-shrink-0"
        style={{ fontFamily: 'kanit' }}>{label}</span>
      <span className="text-sm text-white/80 font-medium truncate" style={{ fontFamily: 'fredoka' }}>{value}</span>
    </div>
  );
}