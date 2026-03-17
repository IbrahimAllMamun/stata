// src/components/aspl/RegistrationForm.tsx
import { useState, useEffect, useRef } from 'react';
import { X, Upload, CheckCircle2, ChevronDown, User, ArrowRight, AlertCircle, UserPlus, Briefcase, Building2, Phone, Mail, Hash, RefreshCw } from 'lucide-react';
import { asplApi, AsplSeason, AsplRegistration, imageUrl } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';

interface Props {
  season: AsplSeason;
  onClose: () => void;
}

type Step = 'form' | 'success';

const INPUT = 'w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]/30 transition-all';
const LABEL = 'block text-[11px] tracking-widest text-white/40 mb-1.5 uppercase';

export default function RegistrationForm({ season, onClose }: Props) {
  const { member: loggedInMember, isMember } = useAuth();

  // If not logged in, show login prompt
  if (!isMember || !loggedInMember) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: 'rgba(6,12,26,0.85)', backdropFilter: 'blur(8px)' }}
        onClick={onClose}>
        <div className="w-full max-w-sm rounded-2xl p-8 text-center"
          style={{ background: 'var(--pitch-mid)', border: '1px solid rgba(255,255,255,0.1)' }}
          onClick={e => e.stopPropagation()}>
          <div className="w-14 h-14 rounded-full bg-[#2F5BEA]/20 flex items-center justify-center mx-auto mb-4">
            <UserPlus className="w-7 h-7 text-[#2F5BEA]" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2" style={{ fontFamily: 'fredoka' }}>Sign In Required</h3>
          <p className="text-sm mb-6" style={{ color: 'var(--muted)' }}>You must be a logged-in STATA member to register for ASPL.</p>
          <div className="flex gap-3">
            <a href="/login" className="flex-1 bg-[#2F5BEA] hover:bg-[#1a3fc7] text-white py-2.5 rounded-xl text-sm font-semibold transition-colors text-center">Sign In</a>
            <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors text-center" style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--muted)' }}>Cancel</button>
          </div>
        </div>
      </div>
    );
  }

  // Logged-in member flow
  const [step, setStep] = useState<Step>('form');

  // Check existing reg on mount for logged-in members
  const [position, setPosition] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [result, setResult] = useState<{ message: string; registration: AsplRegistration; member: { full_name: string; batch: number }; updated: boolean } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Member info from logged-in user
  const [existingReg, setExistingReg] = useState<AsplRegistration | null>(null);

  const positions = asplApi.getPositions(season.sport);

  // Auto-load existing registration and member photo
  useEffect(() => {
    if (!loggedInMember) return;

    // Set photo preview from profile
    const src = imageUrl(loggedInMember.photo_url);
    if (src) setPhotoPreview(src);

    // Check existing registration
    asplApi.lookupRegistration(loggedInMember.email, season.id).then(res => {
      if (res.found && res.data) {
        setExistingReg(res.data);
        if (res.data.playing_position) setPosition(res.data.playing_position);
      }
    }).catch(() => { });
  }, [loggedInMember]);
  const isUpdate = !!existingReg;

  const resetForm = () => {
    setPosition('');
    setPhoto(null);
    if (loggedInMember?.photo_url) {
      const src = imageUrl(loggedInMember.photo_url);
      if (src) setPhotoPreview(src);
    } else {
      setPhotoPreview(null);
    }
    setFormError('');
  };

  // ── Step 2: submit ─────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!position) { setFormError('Please select your playing position.'); return; }
    if (!loggedInMember?.photo_url && !photo) {
      setFormError('A profile photo is required for ASPL registration. Please upload a photo.');
      return;
    }
    setFormError(''); setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('season_id', String(season.id));
      fd.append('email', loggedInMember!.email);
      fd.append('playing_position', position);
      if (photo) fd.append('photo', photo);

      let res;
      if (isUpdate) {
        // Use update endpoint - only sends position/photo changes
        res = await asplApi.updatePlayerDetails(fd);
        setResult({ ...res, member: { full_name: loggedInMember!.full_name, batch: loggedInMember!.batch }, updated: true });
      } else {
        res = await asplApi.register(fd);
        setResult({ ...res, member: { full_name: loggedInMember!.full_name, batch: loggedInMember!.batch }, updated: false });
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
              {step === 'form' ? (isUpdate ? 'Update Registration' : 'Confirm & Register') :
                isUpdate ? 'Registration Updated' : 'Registration Received'}
            </h2>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors"
            style={{ background: 'rgba(255,255,255,0.06)' }}>
            <X className="w-4 h-4 text-white/60" />
          </button>
        </div>

        {/* ── Step 1: Form (register or update) ───────────────────────────── */}
        {step === 'form' && (
          <div className="px-6 py-5 space-y-4">

            {/* Existing registration banner */}
            {isUpdate && (
              <div className="rounded-xl px-4 py-3 text-xs leading-relaxed flex items-start gap-2"
                style={{ background: 'rgba(47,91,234,0.12)', border: '1px solid rgba(47,91,234,0.2)', color: 'rgba(200,215,255,0.8)' }}>
                <RefreshCw className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                You already have a registration for this season. Your position and photo are pre-filled - update them below.
              </div>
            )}

            {/* Member info card */}
            <div className="rounded-xl overflow-hidden"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="px-4 py-2.5 flex items-center gap-2"
                style={{ background: 'rgba(47,91,234,0.15)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="w-6 h-6 rounded-full bg-[#2F5BEA] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                  {loggedInMember!.full_name.charAt(0).toUpperCase()}
                </div>
                <span className="text-xs font-bold text-white/80 tracking-wide" style={{ fontFamily: 'kanit' }}>
                  STATA MEMBER VERIFIED
                </span>
                <span className={`ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full ${loggedInMember!.status === 'APPROVED' ? 'bg-green-500/20 text-green-400' : 'bg-amber-500/20 text-amber-400'}`}>
                  {loggedInMember!.status}
                </span>
              </div>
              <div className="px-4 py-3 space-y-2.5">
                <InfoRow icon={<User className="w-3.5 h-3.5" />} label="Name" value={loggedInMember!.full_name} />
                <InfoRow icon={<Mail className="w-3.5 h-3.5" />} label="Email" value={loggedInMember!.email} />
                <InfoRow icon={<Hash className="w-3.5 h-3.5" />} label="Batch" value={`Batch ${loggedInMember!.batch}`} />
                <InfoRow icon={<Phone className="w-3.5 h-3.5" />} label="Phone" value={loggedInMember!.phone_number || '-'} />
                {loggedInMember!.job_title && <InfoRow icon={<Briefcase className="w-3.5 h-3.5" />} label="Title" value={loggedInMember!.job_title} />}
                {loggedInMember!.organisation && <InfoRow icon={<Building2 className="w-3.5 h-3.5" />} label="Org" value={loggedInMember!.organisation} />}
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
                Profile Photo{' '}
                {loggedInMember?.photo_url
                  ? <span className="text-white/20 normal-case">· shown during auction · current photo loaded</span>
                  : <span className="text-red-400/80 normal-case">· required for ASPL registration</span>}
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
                  {loggedInMember?.photo_url && !photo && (
                    <><br /><span className="text-white/20">Leave empty to keep current photo</span></>
                  )}
                  {!loggedInMember?.photo_url && (
                    <><br /><span className="text-red-400/60">Photo is required to register</span></>
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

        {/* ── Step 2: Success ──────────────────────────────────────────────── */}
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