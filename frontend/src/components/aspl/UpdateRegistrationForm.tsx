// src/components/aspl/UpdateRegistrationForm.tsx
import { useState, useRef } from 'react';
import { X, Search, Upload, CheckCircle2, RefreshCw, ChevronDown, User, ArrowLeft, AlertCircle } from 'lucide-react';
import { asplApi, AsplSeason, AsplRegistration } from '../../lib/api';

interface Props {
  season: AsplSeason;
  onClose: () => void;
  /** If provided, skip the lookup step and jump straight to edit */
  prefillEmail?: string;
}

type Step = 'lookup' | 'edit' | 'success';

const INPUT = 'w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]/30 transition-all';
const LABEL = 'block text-[11px] tracking-widest text-white/40 mb-1.5 uppercase';

function StatusPill({ status }: { status: string }) {
  const map: Record<string, { bg: string; text: string; label: string }> = {
    PENDING:  { bg: 'rgba(245,158,11,0.15)',  text: '#fbbf24', label: 'Pending Review' },
    APPROVED: { bg: 'rgba(0,229,160,0.15)',   text: 'var(--accent)', label: 'Approved' },
    REJECTED: { bg: 'rgba(239,68,68,0.15)',   text: '#fca5a5', label: 'Rejected' },
  };
  const s = map[status] ?? map.PENDING;
  return (
    <span className="inline-flex items-center text-[10px] font-bold tracking-wider px-2.5 py-1 rounded-full"
      style={{ background: s.bg, color: s.text, border: `1px solid ${s.text}30` }}>
      {s.label}
    </span>
  );
}

export default function UpdateRegistrationForm({ season, onClose, prefillEmail }: Props) {
  const [step, setStep] = useState<Step>(prefillEmail ? 'lookup' : 'lookup');

  // Lookup step
  const [lookupEmail, setLookupEmail] = useState(prefillEmail ?? '');
  const [looking, setLooking]         = useState(false);
  const [lookupError, setLookupError] = useState('');
  const [existing, setExisting]       = useState<AsplRegistration | null>(null);

  // Edit step
  const [fullName, setFullName]   = useState('');
  const [batch, setBatch]         = useState('');
  const [position, setPosition]   = useState('');
  const [phone, setPhone]         = useState('');
  const [photo, setPhoto]         = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [result, setResult]       = useState<{ message: string; registration: AsplRegistration; updated: boolean } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const positions = asplApi.getPositions(season.sport);

  const handleLookup = async () => {
    const email = lookupEmail.trim().toLowerCase();
    if (!email) { setLookupError('Please enter your email address.'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setLookupError('Please enter a valid email.'); return; }
    setLooking(true); setLookupError('');
    try {
      const reg = await asplApi.lookupRegistration(email, season.id);
      setExisting(reg);
      // Pre-fill form fields
      setFullName(reg.full_name);
      setBatch(String(reg.batch));
      setPosition(reg.playing_position);
      setPhone(reg.phone ?? '');
      if (reg.photo_url) setPhotoPreview(asplApi.imageUrl(reg.photo_url));
      setStep('edit');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'No registration found.';
      setLookupError(msg.includes('404') || msg.toLowerCase().includes('not found')
        ? 'No registration found for that email. Please register first.'
        : msg);
    } finally { setLooking(false); }
  };

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setPhoto(f);
    setPhotoPreview(URL.createObjectURL(f));
  };

  const handleUpdate = async () => {
    if (!fullName.trim() || !batch || !position || !phone.trim()) {
      setFormError('Please fill in all required fields.'); return;
    }
    setFormError(''); setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('season_id', String(season.id));
      fd.append('email', existing!.email);
      fd.append('full_name', fullName.trim());
      fd.append('batch', batch);
      fd.append('playing_position', position);
      fd.append('phone', phone.trim());
      if (photo) fd.append('photo', photo);
      const res = await asplApi.register(fd);
      setResult(res);
      setStep('success');
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Update failed. Please try again.');
    } finally { setSubmitting(false); }
  };

  const photoUrl = photoPreview ?? (existing?.photo_url ? asplApi.imageUrl(existing.photo_url) : null);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: 'rgba(6,12,26,0.85)', backdropFilter: 'blur(8px)' }}>
      <div className="w-full sm:max-w-md max-h-[95vh] overflow-y-auto rounded-t-3xl sm:rounded-2xl"
        style={{ background: 'var(--pitch-mid)', border: '1px solid rgba(255,255,255,0.08)' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-3">
            {step === 'edit' && (
              <button onClick={() => { setStep('lookup'); setExisting(null); setFormError(''); }}
                className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)' }}>
                <ArrowLeft className="w-3.5 h-3.5" />
              </button>
            )}
            <div>
              <p className="text-[10px] tracking-widest text-white/40 mb-0.5" style={{ fontFamily: 'kanit' }}>
                {season.name} · {season.sport}
              </p>
              <h2 className="text-lg font-bold text-white" style={{ fontFamily: 'fredoka' }}>
                {step === 'lookup' ? 'Update Registration' : step === 'edit' ? 'Edit Your Details' : 'Update Received'}
              </h2>
            </div>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors"
            style={{ background: 'rgba(255,255,255,0.06)' }}>
            <X className="w-4 h-4 text-white/60" />
          </button>
        </div>

        {/* ── Step 1: Lookup ─────────────────────────────────────────────── */}
        {step === 'lookup' && (
          <div className="px-6 py-6 space-y-5">
            <div className="rounded-xl px-4 py-3 text-xs leading-relaxed"
              style={{ background: 'rgba(47,91,234,0.12)', border: '1px solid rgba(47,91,234,0.2)', color: 'rgba(200,215,255,0.7)' }}>
              <p className="font-semibold text-white/80 mb-1">How it works</p>
              Enter the email you used to register. We'll find your profile and let you update your details.
            </div>

            {lookupError && (
              <div className="rounded-xl px-4 py-3 text-xs flex items-start gap-2"
                style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#fca5a5' }}>
                <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                {lookupError}
              </div>
            )}

            <div>
              <label className={LABEL}>Your registered email *</label>
              <input type="email" value={lookupEmail} onChange={e => setLookupEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLookup()}
                placeholder="you@example.com" className={INPUT} autoFocus />
            </div>

            <button onClick={handleLookup} disabled={looking}
              className="w-full py-3.5 rounded-xl text-sm font-bold tracking-wider transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ background: 'var(--gold)', color: 'var(--pitch)', fontFamily: 'kanit' }}>
              {looking
                ? <><div className="w-4 h-4 border-2 border-[var(--pitch)]/40 border-t-[var(--pitch)] rounded-full animate-spin" /> LOOKING UP…</>
                : <><Search className="w-4 h-4" /> FIND MY REGISTRATION</>}
            </button>

            <p className="text-[10px] text-center text-white/25 pb-1">
              Don't have a registration yet?{' '}
              <button onClick={onClose} className="underline text-white/40 hover:text-white/60">Register first</button>
            </p>
          </div>
        )}

        {/* ── Step 2: Edit form ──────────────────────────────────────────── */}
        {step === 'edit' && existing && (
          <div className="px-6 py-5 space-y-4">

            {/* Current status banner */}
            <div className="rounded-xl px-4 py-3 flex items-center justify-between"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div>
                <p className="text-[10px] text-white/40 mb-1 tracking-wider" style={{ fontFamily: 'kanit' }}>CURRENT STATUS</p>
                <StatusPill status={existing.status} />
              </div>
              <div className="text-right">
                <p className="text-[10px] text-white/40 mb-1 tracking-wider" style={{ fontFamily: 'kanit' }}>EMAIL</p>
                <p className="text-xs text-white/60 font-medium" style={{ fontFamily: 'fredoka' }}>{existing.email}</p>
              </div>
            </div>

            {existing.status === 'APPROVED' && (
              <div className="rounded-xl px-4 py-3 text-xs leading-relaxed"
                style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', color: '#fcd34d' }}>
                ⚠️ You are already approved as player #{existing.player_sl}. Updating will send your registration for re-approval.
              </div>
            )}

            {formError && (
              <div className="rounded-xl px-4 py-3 text-xs flex items-start gap-2"
                style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#fca5a5' }}>
                <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                {formError}
              </div>
            )}

            {/* Photo */}
            <div className="flex items-center gap-4">
              <div onClick={() => fileRef.current?.click()}
                className="w-20 h-20 rounded-2xl overflow-hidden flex items-center justify-center cursor-pointer flex-shrink-0 relative group"
                style={{ background: 'rgba(255,255,255,0.05)', border: '2px dashed rgba(255,255,255,0.12)' }}>
                {photoUrl
                  ? <img src={photoUrl} alt="preview" className="w-full h-full object-cover" />
                  : <User className="w-7 h-7 text-white/20" />}
                <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"
                  style={{ background: 'rgba(0,0,0,0.6)' }}>
                  <Upload className="w-5 h-5 text-white mb-1" />
                  <span className="text-[10px] text-white/80">{photoUrl ? 'Change' : 'Upload'}</span>
                </div>
              </div>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
              <div>
                <p className="text-sm font-semibold text-white/80 mb-0.5" style={{ fontFamily: 'fredoka' }}>Profile Photo</p>
                <p className="text-xs text-white/30">Optional · JPG, PNG, WebP</p>
                {photoUrl && !photo && (
                  <p className="text-xs mt-1" style={{ color: 'var(--accent)' }}>✓ Photo on file</p>
                )}
              </div>
            </div>

            {/* Full name */}
            <div>
              <label className={LABEL}>Full Name *</label>
              <input type="text" value={fullName} onChange={e => setFullName(e.target.value)}
                placeholder="Your full name" className={INPUT} />
            </div>

            {/* Email (read-only) */}
            <div>
              <label className={LABEL}>Email · cannot be changed</label>
              <input type="email" value={existing.email} readOnly
                className={INPUT + ' cursor-not-allowed'} style={{ opacity: 0.4 }} />
            </div>

            {/* Batch + Position */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={LABEL}>Batch *</label>
                <input type="number" value={batch} onChange={e => setBatch(e.target.value)}
                  placeholder="e.g. 34" className={INPUT} />
              </div>
              <div>
                <label className={LABEL}>Position *</label>
                <div className="relative">
                  <select value={position} onChange={e => setPosition(e.target.value)}
                    className={INPUT + ' appearance-none pr-8 cursor-pointer'}
                    style={{ background: 'rgba(255,255,255,0.05)' }}>
                    <option value="" disabled style={{ background: '#0f172a' }}>Select</option>
                    {positions.map(p => (
                      <option key={p} value={p} style={{ background: '#0f172a' }}>{p}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className={LABEL}>Phone Number *</label>
              <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                placeholder="+880 1XXXXXXXXX" className={INPUT} />
            </div>

            {/* Submit */}
            <button onClick={handleUpdate} disabled={submitting}
              className="w-full py-3.5 rounded-xl text-sm font-bold tracking-wider transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ background: 'var(--gold)', color: 'var(--pitch)', fontFamily: 'kanit' }}>
              {submitting
                ? <><div className="w-4 h-4 border-2 border-[var(--pitch)]/40 border-t-[var(--pitch)] rounded-full animate-spin" /> SAVING…</>
                : <><RefreshCw className="w-4 h-4" /> SAVE CHANGES</>}
            </button>

            <p className="text-[10px] text-center text-white/25 pb-2">
              Your email identifies your registration and cannot be changed.
            </p>
          </div>
        )}

        {/* ── Step 3: Success ────────────────────────────────────────────── */}
        {step === 'success' && result && (
          <div className="px-6 py-8 text-center">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ background: 'rgba(245,200,66,0.15)' }}>
              {result.registration.status === 'APPROVED'
                ? <CheckCircle2 className="w-7 h-7" style={{ color: 'var(--accent)' }} />
                : <RefreshCw className="w-7 h-7" style={{ color: 'var(--gold)' }} />}
            </div>
            <h3 className="text-base font-bold text-white mb-2" style={{ fontFamily: 'fredoka' }}>
              Profile Updated!
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
                ['Name', result.registration.full_name],
                ['Email', result.registration.email],
                ['Batch', String(result.registration.batch)],
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
              className="w-full py-3 rounded-xl text-sm font-bold tracking-wider transition-colors"
              style={{ background: 'var(--gold)', color: 'var(--pitch)', fontFamily: 'kanit' }}>
              DONE
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
