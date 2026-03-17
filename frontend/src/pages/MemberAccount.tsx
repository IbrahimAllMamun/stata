// src/pages/MemberAccount.tsx
import { useNavigate, Link } from 'react-router-dom';
import {
  LogOut, RefreshCw, Lock, Mail, Phone,
  Briefcase, Building2, MapPin, Droplets,
  Bell, Calendar, AlertCircle, Edit2,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { imageUrl } from '../lib/api';

function InfoItem({ icon, label, value, color = 'text-[#2F5BEA]' }: {
  icon: React.ReactNode; label: string; value: string; color?: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className={`mt-0.5 flex-shrink-0 ${color}`}>{icon}</div>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">{label}</p>
        <p className="text-sm font-medium text-[#1F2A44] break-all leading-snug">{value}</p>
      </div>
    </div>
  );
}

export default function MemberAccount() {
  const { member, memberLogout } = useAuth();
  const navigate = useNavigate();

  if (!member) { navigate('/login', { replace: true }); return null; }

  const photoSrc = imageUrl(member.photo_url);
  const initials = member.full_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();

  const statusStyle = member.status === 'APPROVED'
    ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
    : member.status === 'PENDING'
      ? 'bg-amber-100 text-amber-700 border-amber-200'
      : 'bg-gray-100 text-gray-500 border-gray-200';

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#EEF2FF] py-6 sm:py-8 px-3 sm:px-4">
      <div className="max-w-4xl mx-auto space-y-4">

        <div className="rounded-3xl bg-[#1F2A44] overflow-hidden relative">

          {/* Subtle pattern ON TOP of gradient */}
          <div className="absolute inset-0 opacity-40 pointer-events-none">
            <div className="absolute top-0 left-0 w-[280px] h-[280px] bg-[#F39C12] rounded-full -translate-x-1/2 -translate-y-1/2 blur-xl" />
            <div className="absolute bottom-0 right-0 w-[280px] h-[280px] bg-[#2F5BEA] rounded-full translate-x-1/2 translate-y-1/2 blur-xl" />
          </div>

          {/* Content */}
          <div className="relative px-5 sm:px-6 md:px-8 py-6 sm:py-8">

            <div className="flex flex-col sm:flex-row sm:items-end items-center gap-6 sm:gap-8 text-center sm:text-left">

              {/* Avatar */}
              <div className="flex-shrink-0">
                {photoSrc ? (
                  <img
                    src={photoSrc}
                    alt={member.full_name}
                    className="w-28 h-28 sm:w-36 sm:h-36 md:w-40 md:h-40 rounded-3xl object-cover border-4 border-white shadow-2xl"
                  />
                ) : (
                  <div className="w-28 h-28 sm:w-36 sm:h-36 md:w-40 md:h-40 rounded-3xl bg-gradient-to-br from-[#2F5BEA] to-[#1F2A44] flex items-center justify-center text-white text-5xl font-black border-4 border-white shadow-2xl">
                    {initials}
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 flex flex-col justify-end items-center sm:items-start">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-white mb-4">
                  {member.full_name}
                </h1>

                <div className="flex gap-3 flex-wrap justify-center sm:justify-start">
                  <span className="text-xs bg-[#2F5BEA]/20 border border-[#2F5BEA]/30 text-[#7BA3F5] text-xs font-bold px-3 py-2 rounded-full">
                    Batch {member.batch}
                  </span>

                  <span className={`text-xs font-semibold px-3 py-2 rounded-full border ${statusStyle}`}>
                    {member.status.charAt(0) + member.status.slice(1).toLowerCase()}
                  </span>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Must change password banner */}
        {member.must_change_password && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm text-amber-700 font-semibold">Please set a password to secure your account.</p>
              <Link to="/change-password" className="text-xs text-amber-600 hover:underline font-medium mt-0.5 inline-block">
                Set password now →
              </Link>
            </div>
          </div>
        )}

        {/* ── Info card ── */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">

          {/* Contact section */}
          <div className="px-5 pt-5 pb-4">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Contact</p>
            <div className="space-y-4">
              <InfoItem icon={<Mail className="w-4 h-4" />} label="Email" value={member.email} color="text-[#2F5BEA]" />
              {member.phone_number && (
                <InfoItem icon={<Phone className="w-4 h-4" />} label="Phone" value={member.phone_number} color="text-[#2ECC71]" />
              )}
              {member.alternative_phone && (
                <InfoItem icon={<Phone className="w-4 h-4" />} label="Alternative Phone" value={member.alternative_phone} color="text-[#2ECC71]" />
              )}
            </div>
          </div>

          {/* Professional section */}
          {(member.job_title || member.organisation || member.organisation_address) && (
            <>
              <div className="mx-5 border-t border-gray-50" />
              <div className="px-5 pt-4 pb-4">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Professional</p>
                <div className="space-y-4">
                  {member.job_title && (
                    <InfoItem icon={<Briefcase className="w-4 h-4" />} label="Job Title" value={member.job_title} color="text-[#F39C12]" />
                  )}
                  {member.organisation && (
                    <InfoItem icon={<Building2 className="w-4 h-4" />} label="Organisation" value={member.organisation} color="text-[#9B59B6]" />
                  )}
                  {member.organisation_address && (
                    <InfoItem icon={<MapPin className="w-4 h-4" />} label="Address" value={member.organisation_address} color="text-[#E74C3C]" />
                  )}
                </div>
              </div>
            </>
          )}

          {/* Personal section */}
          {member.blood_group && (
            <>
              <div className="mx-5 border-t border-gray-50" />
              <div className="px-5 pt-4 pb-4">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Personal</p>
                <div className="space-y-4">
                  <InfoItem icon={<Droplets className="w-4 h-4" />} label="Blood Group" value={member.blood_group} color="text-red-500" />
                </div>
              </div>
            </>
          )}

          {/* Preferences */}
          <div className="mx-5 border-t border-gray-50" />
          <div className="px-5 pt-4 pb-5">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Account</p>
            <div className="space-y-4">
              <InfoItem
                icon={<Bell className="w-4 h-4" />}
                label="Event Notifications"
                value={member.notify_events ? 'Enabled' : 'Disabled'}
                color={member.notify_events ? "text-[#2ECC71]" : "text-gray-400"}
              />
              {member.created_at && (
                <InfoItem
                  icon={<Calendar className="w-4 h-4" />}
                  label="Member Since"
                  value={new Date(member.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                  color="text-[#2F5BEA]"
                />
              )}
            </div>
          </div>
        </div>

        {/* ── Action cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Link to="/update-profile"
            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3 hover:border-[#2F5BEA] hover:shadow-md transition-all group">
            <div className="w-10 h-10 rounded-xl bg-[#2F5BEA]/10 flex items-center justify-center group-hover:bg-[#2F5BEA] transition-colors flex-shrink-0">
              <RefreshCw className="w-4 h-4 text-[#2F5BEA] group-hover:text-white transition-colors" />
            </div>
            <div>
              <p className="text-sm font-bold text-[#1F2A44]">Update Profile</p>
              <p className="text-xs text-gray-400 mt-0.5">Edit info & photo</p>
            </div>
          </Link>
          <Link to="/change-password"
            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3 hover:border-[#1F2A44] hover:shadow-md transition-all group">
            <div className="w-10 h-10 rounded-xl bg-[#1F2A44]/10 flex items-center justify-center group-hover:bg-[#1F2A44] transition-colors flex-shrink-0">
              <Lock className="w-4 h-4 text-[#1F2A44] group-hover:text-white transition-colors" />
            </div>
            <div>
              <p className="text-sm font-bold text-[#1F2A44]">Change Password</p>
              <p className="text-xs text-gray-400 mt-0.5">Update password</p>
            </div>
          </Link>
        </div>

      </div>
    </div>
  );
}