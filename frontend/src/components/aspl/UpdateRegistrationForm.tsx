// src/components/aspl/UpdateRegistrationForm.tsx
import { useState, useRef } from 'react';
import { X, Search, Upload, CheckCircle2, RefreshCw, ChevronDown, User, ArrowLeft, AlertCircle, Mail, Hash, Phone, Briefcase, Building2 } from 'lucide-react';
import { asplApi, AsplSeason, AsplRegistration } from '../../lib/api';

interface Props {
  season: AsplSeason;
  onClose: () => void;
}

type Step = 'lookup' | 'edit' | 'success';

const INPUT = 'w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]/30 transition-all';
const LABEL = 'block text-[11px] tracking-widest text-white/40 mb-1.5 uppercase';

interface RegWithMember extends AsplRegistration {
  member: { full_name: string; batch: number; phone_number: string; job_title?: string | null; organisation?: string | null } | null;
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, { bg: string; text: string; label: string }> = {
    PENDING:  { bg: 'rgba(245,158,11,0.15)', text: '#fbbf24',        label: 'Pending Review' },
    APPROVED: { bg: 'rgba(0,229,160,0.15)',  text: 'var(--accent)',  label: 'Approved' },
    REJECTED: { bg: 'rgba(239,68,68,0.15)',  text: '#fca5a5',        label: 'Rejected' },
  };
  const s = map[status] ?? map.PENDING;
  return (
    <span className="inline-flex items-center text-[10px] font-bold tracking-wider px-2.5 py-1 rounded-full"
      style={{ background: s.bg, color: s.text, border: `1px solid ${s.text}30` }}>
      {s.label}
    </span>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="text-white/30 flex-shrink-0">{icon}</span>
      <span className="text-[10px] text-white/30 uppercase tracking-wider w-10 flex-shrink-0" style={{ fontFamily: 'kanit' }}>{label}</span>
      <span className="text-sm text-white/70 font-medium truncate" style={{ fontFamily: 'fredoka' }}>{value}</span>
    </div>
  );
}

export default function UpdateRegistrationForm({ season, onClose }: Props) {
  const [step, setStep]             = useState<Step>('lookup');
  const [lookupEmail, setLookupEmail] = useState('');
  const [looking, setLooking]       = useState(false);
  const [lookupError, setLookupError] = useState('');
  const [existing, setExisting]     = useState<RegWithMember | null>(null);

  // Only these two fields can be changed
  const [position, setPosition]     = useState('');
  const [photo, setPhoto]           = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError]   = useState('');
  const [result, setResult]         = useState<{ message: string; registration: AsplRegistration } | null>(null);

  const fileRef  = useRef<HTMLInputElement>(null);
  const positions = asplApi.getPositions(season.sport);

  const handleLookup = async () => {
    const email = lookupEmail.trim().toLowerCase();
    if (!email) { setLookupError('Please enter your email address.'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setLookupError('Please enter a valid email.'); return; }
    setLooking(true); setLookupError('');
    try {
      const reg = await asplApi.lookupRegistration(email, season.id) as RegWithMember;
      setExisting(reg);
      setPosition(reg.playing_position);
      if (reg.photo_url) setPhotoPreview(asplApi.imageUrl(reg.photo_url));
      setStep('edit');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'No registration found.';
      setLookupError(
        msg.includes('404') || msg.toLowerCase().includes('not found')
          ? 'No registration found for that email. Please register first.'
          : msg
      );
    } finally { setLooking(false); }
  };

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    setPhoto(f); setPhotoPreview(URL.createObjectURL(f));
  };

  const handleUpdate = async () => {
    if (!position) { setFormError('Please select a playing position.'); return; }
    setFormError(''); setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('season_id',        String(season.id));
      fd.append('email',            existing!.email);
      fd.append('playing_position', position);
      if (photo) fd.append('photo', photo);
      const res = await asplApi.updatePlayerDetails(fd);
      setResult(res);
      setStep('success');
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Update failed. Please try again.');
    } finally { setSubmitting(false); }
  };

  const photoUrl = photoPreview ?? (existing?.photo_url ? asplApi.imageUrl(existing.photo_url) : null);
  const m = existing?.member;

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
                className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)' }}>
                <ArrowLeft className="w-3.5 h-3.5" />
              </button>
            )}
            <div>
              <p className="text-[10px] tracking-widest text-white/40 mb-0.5" style={{ fontFamily: 'kanit' }}>
                {season.name} · {season.sport}
              </p>
              <h2 className="text-lg font-bold text-white" style={{ fontFamily: 'fredoka' }}>
                {step === 'lookup' ? 'Update Registration' : step === 'edit' ? 'Edit Position & Photo' : 'Update Received'}
              </h2>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.06)' }}>
            <X className="w-4 h-4 text-white/60" />
          </button>
        </div>

        {/* ── Lookup ─────────────────────────────────────────────────────── */}
        {step === 'lookup' && (
          <div className="px-6 py-6 space-y-5">
            <div className="rounded-xl px-4 py-3 text-xs leading-relaxed"
              style={{ background: 'rgba(47,91,234,0.12)', border: '1px solid rgba(47,91,234,0.2)', color: 'rgba(200,215,255,0.7)' }}>
              Enter your STATA email to find your registration. You can update your <strong className="text-white/70">photo</strong> and <strong className="text-white/70">playing position</strong> — all other info comes from your STATA member profile.
            </div>

            {lookupError && (
              <div className="rounded-xl px-4 py-3 text-xs flex items-start gap-2"
                style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#fca5a5' }}>
                <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />{lookupError}
              </div>
            )}

            <div>
              <label className={LABEL}>Your STATA email *</label>
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

        {/* ── Edit ───────────────────────────────────────────────────────── */}
        {step === 'edit' && existing && (
          <div className="px-6 py-5 space-y-4">

            {/* Status banner */}
            <div className="rounded-xl px-4 py-3 flex items-center justify-between"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div>
                <p className="text-[10px] text-white/40 mb-1 tracking-wider" style={{ fontFamily: 'kanit' }}>STATUS</p>
                <StatusPill status={existing.status} />
              </div>
              {existing.player_sl && (
                <div className="text-right">
                  <p className="text-[10px] text-white/40 mb-1 tracking-wider" style={{ fontFamily: 'kanit' }}>PLAYER #</p>
                  <p className="text-lg font-bold" style={{ color: 'var(--gold)', fontFamily: 'kanit' }}>{existing.player_sl}</p>
                </div>
              )}
            </div>

            {existing.status === 'APPROVED' && (
              <div className="rounded-xl px-4 py-3 text-xs leading-relaxed"
                style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', color: '#fcd34d' }}>
                ⚠️ You are approved as player #{existing.player_sl}. Saving changes will send your registration for re-approval.
              </div>
            )}

            {/* Read-only member info card */}
            {m && (
              <div className="rounded-xl overflow-hidden"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div className="px-4 py-2 flex items-center gap-2"
                  style={{ background: 'rgba(47,91,234,0.1)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <div className="w-5 h-5 rounded-full bg-[#2F5BEA] flex items-center justify-center text-white text-[10px] font-bold">
                    {m.full_name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-[10px] font-bold text-white/60 tracking-wide" style={{ fontFamily: 'kanit' }}>
                    STATA MEMBER · READ-ONLY
                  </span>
                </div>
                <div className="px-4 py-3 space-y-2">
                  <InfoRow icon={<User className="w-3.5 h-3.5" />}    label="Name"  value={m.full_name} />
                  <InfoRow icon={<Mail className="w-3.5 h-3.5" />}    label="Email" value={existing.email} />
                  <InfoRow icon={<Hash className="w-3.5 h-3.5" />}    label="Batch" value={`Batch ${m.batch}`} />
                  <InfoRow icon={<Phone className="w-3.5 h-3.5" />}   label="Phone" value={m.phone_number} />
                  {m.job_title    && <InfoRow icon={<Briefcase className="w-3.5 h-3.5" />}  label="Title" value={m.job_title} />}
                  {m.organisation && <InfoRow icon={<Building2 className="w-3.5 h-3.5" />} label="Org"   value={m.organisation} />}
                </div>
                <div className="px-4 py-2" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                  <p className="text-[10px] text-white/20">To change this info, update your STATA member profile at <span className="underline text-white/35">/update-profile</span></p>
                </div>
              </div>
            )}

            {formError && (
              <div className="rounded-xl px-4 py-3 text-xs flex items-start gap-2"
                style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#fca5a5' }}>
                <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />{formError}
              </div>
            )}

            {/* Photo upload */}
            <div>
              <label className={LABEL}>Profile Photo <span className="text-white/20 normal-case">· optional, shown during auction</span></label>
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
                  <p className="text-xs text-white/30 leading-relaxed">JPG, PNG, or WebP<br />Square crop works best</p>
                  {photoUrl && !photo && <p className="text-xs mt-1" style={{ color: 'var(--accent)' }}>✓ Photo on file</p>}
                </div>
              </div>
            </div>

            {/* Playing position — the only editable field */}
            <div>
              <label className={LABEL}>Playing Position *</label>
              <div className="relative">
                <select value={position} onChange={e => { setPosition(e.target.value); setFormError(''); }}
                  className={INPUT + ' appearance-none pr-8 cursor-pointer'}
                  style={{ background: 'rgba(255,255,255,0.05)' }}>
                  <option value="" disabled style={{ background: '#0f172a' }}>Select position</option>
                  {positions.map(p => (
                    <option key={p} value={p} style={{ background: '#0f172a' }}>{p}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
              </div>
            </div>

            <button onClick={handleUpdate} disabled={submitting}
              className="w-full py-3.5 rounded-xl text-sm font-bold tracking-wider transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ background: 'var(--gold)', color: 'var(--pitch)', fontFamily: 'kanit' }}>
              {submitting
                ? <><div className="w-4 h-4 border-2 border-[var(--pitch)]/40 border-t-[var(--pitch)] rounded-full animate-spin" /> SAVING…</>
                : <><RefreshCw className="w-4 h-4" /> SAVE CHANGES</>}
            </button>
          </div>
        )}

        {/* ── Success ────────────────────────────────────────────────────── */}
        {step === 'success' && result && (
          <div className="px-6 py-8 text-center">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ background: 'rgba(245,200,66,0.15)' }}>
              {result.registration.status === 'APPROVED'
                ? <CheckCircle2 className="w-7 h-7" style={{ color: 'var(--accent)' }} />
                : <RefreshCw    className="w-7 h-7" style={{ color: 'var(--gold)' }} />}
            </div>
            <h3 className="text-base font-bold text-white mb-2" style={{ fontFamily: 'fredoka' }}>Registration Updated!</h3>
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
                ['Name',     existing?.member?.full_name ?? '—'],
                ['Email',    result.registration.email],
                ['Batch',    String(existing?.member?.batch ?? '—')],
                ['Position', result.registration.playing_position],
                ['Status',   result.registration.status],
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
              style={{ background: 'var(--gold)', color: 'var(--pitch)', fontFamily: 'kanit' }}>
              DONE
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
