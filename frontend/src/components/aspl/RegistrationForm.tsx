// src/components/aspl/RegistrationForm.tsx
import { useState, useRef } from 'react';
import { X, Upload, CheckCircle2, RefreshCw, ChevronDown, User } from 'lucide-react';
import { asplApi, AsplSeason, AsplRegistration } from '../../lib/api';

interface Props {
  season: AsplSeason;
  onClose: () => void;
}

type Step = 'form' | 'success';

const INPUT = 'w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]/30 transition-all';
const LABEL = 'block text-[11px] tracking-widest text-white/40 mb-1.5 uppercase';

export default function RegistrationForm({ season, onClose }: Props) {
  const [step, setStep] = useState<Step>('form');
  const [result, setResult] = useState<{ message: string; registration: AsplRegistration; updated: boolean } | null>(null);

  // Form state
  const [fullName, setFullName] = useState('');
  const [email, setEmail]       = useState('');
  const [batch, setBatch]       = useState('');
  const [position, setPosition] = useState('');
  const [phone, setPhone]       = useState('');
  const [photo, setPhoto]       = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]       = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const positions = asplApi.getPositions(season.sport);

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setPhoto(f);
    setPhotoPreview(URL.createObjectURL(f));
  };

  const handleSubmit = async () => {
    if (!fullName.trim() || !email.trim() || !batch || !position || !phone.trim()) {
      setError('Please fill in all required fields.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('season_id', String(season.id));
      fd.append('email', email.trim());
      fd.append('full_name', fullName.trim());
      fd.append('batch', batch);
      fd.append('playing_position', position);
      fd.append('phone', phone.trim());
      if (photo) fd.append('photo', photo);

      const res = await asplApi.register(fd);
      setResult(res);
      setStep('success');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Registration failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
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
              {step === 'success' ? 'Registration Received' : 'Register as Player'}
            </h2>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors"
            style={{ background: 'rgba(255,255,255,0.06)' }}>
            <X className="w-4 h-4 text-white/60" />
          </button>
        </div>

        {step === 'success' && result ? (
          // ── Success screen ──────────────────────────────────────────────────
          <div className="px-6 py-8 text-center">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ background: result.updated ? 'rgba(47,91,234,0.15)' : 'rgba(0,229,160,0.15)' }}>
              {result.updated
                ? <RefreshCw className="w-7 h-7" style={{ color: 'var(--accent)' }} />
                : <CheckCircle2 className="w-7 h-7" style={{ color: 'var(--accent)' }} />}
            </div>
            <h3 className="text-base font-bold text-white mb-2" style={{ fontFamily: 'fredoka' }}>
              {result.updated ? 'Profile Updated!' : 'You\'re Registered!'}
            </h3>
            <p className="text-sm text-white/50 mb-6 leading-relaxed">{result.message}</p>

            {result.registration.conflict_note && (
              <div className="rounded-xl px-4 py-3 mb-5 text-left text-xs text-amber-300/80 leading-relaxed"
                style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)' }}>
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
              style={{ background: 'var(--accent)', color: 'var(--pitch)', fontFamily: 'kanit' }}>
              DONE
            </button>
          </div>
        ) : (
          // ── Registration form ───────────────────────────────────────────────
          <div className="px-6 py-5 space-y-4">

            {error && (
              <div className="rounded-xl px-4 py-3 text-xs text-red-300"
                style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
                {error}
              </div>
            )}

            {/* Photo upload */}
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
                  <span className="text-[10px] text-white/80">Upload</span>
                </div>
              </div>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
              <div>
                <p className="text-sm font-semibold text-white/80 mb-0.5" style={{ fontFamily: 'fredoka' }}>
                  Profile Photo
                </p>
                <p className="text-xs text-white/30">Optional · JPG, PNG, WebP</p>
                <p className="text-xs text-white/30">Shown during auction slideshow</p>
              </div>
            </div>

            {/* Full name */}
            <div>
              <label className={LABEL}>Full Name *</label>
              <input type="text" value={fullName} onChange={e => setFullName(e.target.value)}
                placeholder="Your full name" className={INPUT} />
            </div>

            {/* Email */}
            <div>
              <label className={LABEL}>Email *</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com" className={INPUT} />
              <p className="text-[10px] text-white/25 mt-1">Used to identify your registration — you can update using same email</p>
            </div>

            {/* Batch + Position row */}
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
            <button onClick={handleSubmit} disabled={submitting}
              className="w-full py-3.5 rounded-xl text-sm font-bold tracking-wider transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ background: 'var(--accent)', color: 'var(--pitch)', fontFamily: 'kanit' }}>
              {submitting
                ? <><div className="w-4 h-4 border-2 border-[var(--pitch)]/40 border-t-[var(--pitch)] rounded-full animate-spin" /> SUBMITTING…</>
                : 'REGISTER NOW'}
            </button>

            <p className="text-[10px] text-center text-white/25 pb-2">
              Already registered? Submit with the same email to update your details.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
