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
    <div className="min-h-[calc(100vh-4rem)] bg-[#EEF2FF] py-8 px-4">
      <div className="max-w-lg mx-auto space-y-4">

        {/* ── Hero card ── */}
        <div className="rounded-3xl overflow-hidden shadow-md">
          {/* Banner */}
          <div className="relative h-36 bg-gradient-to-br from-[#1F2A44] via-[#2F5BEA] to-[#6B8EF5]">
            <div className="absolute inset-0 opacity-20"
              style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.4\'%3E%3Ccircle cx=\'7\' cy=\'7\' r=\'1\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }} />
            {/* Top-right actions */}
            <div className="absolute top-3 right-3 flex gap-2">
              <Link to="/update-profile"
                className="flex items-center gap-1.5 text-xs font-semibold text-white bg-white/15 hover:bg-white/25 backdrop-blur-sm px-3 py-1.5 rounded-lg transition-colors">
                <Edit2 className="w-3 h-3" /> Edit
              </Link>
              <button onClick={() => { memberLogout(); navigate('/'); }}
                className="flex items-center gap-1.5 text-xs font-semibold text-white bg-white/10 hover:bg-red-500/70 backdrop-blur-sm px-3 py-1.5 rounded-lg transition-colors">
                <LogOut className="w-3 h-3" /> Sign Out
              </button>
            </div>
          </div>

          {/* White body */}
          <div className="bg-white px-6 pb-6">
            {/* Avatar + name row */}
            <div className="flex items-end gap-4 -mt-12 mb-5">
              {/* Avatar */}
              <div className="flex-shrink-0">
                {photoSrc
                  ? <img src={photoSrc} alt={member.full_name}
                    className="w-24 h-24 rounded-2xl object-cover border-4 border-white shadow-xl ring-2 ring-[#2F5BEA]/20" />
                  : <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-[#2F5BEA] to-[#1F2A44] flex items-center justify-center text-white text-3xl font-black border-4 border-white shadow-xl">
                    {initials}
                  </div>
                }
              </div>
              {/* Badges */}
              <div className="pb-1 flex flex-wrap gap-1.5">
                <span className="text-xs font-bold bg-[#1F2A44] text-white px-2.5 py-1 rounded-full">
                  Batch {member.batch}
                </span>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${statusStyle}`}>
                  {member.status.charAt(0) + member.status.slice(1).toLowerCase()}
                </span>
              </div>
            </div>

            {/* Name block */}
            <div className="mb-1">
              <h1 className="text-2xl font-black text-[#1F2A44] leading-tight tracking-tight">
                {member.full_name}
              </h1>
              {member.job_title && (
                <p className="text-sm font-semibold text-[#2F5BEA] mt-0.5">{member.job_title}</p>
              )}
              {member.organisation && (
                <p className="text-sm text-gray-500 mt-0.5">{member.organisation}</p>
              )}
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
        <div className="grid grid-cols-2 gap-3">
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