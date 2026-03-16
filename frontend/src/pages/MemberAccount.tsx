// src/pages/MemberAccount.tsx — Profile view
import { useNavigate, Link } from 'react-router-dom';
import { User, Lock, LogOut, RefreshCw, AlertCircle, Crown, Shield, KeyRound } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { imageUrl } from '../lib/api';

export default function MemberAccount() {
  const { member, memberLogout, isFullAdmin, isModerator } = useAuth();
  const navigate = useNavigate();

  if (!member) {
    navigate('/login', { replace: true });
    return null;
  }

  const handleLogout = () => { memberLogout(); navigate('/'); };
  const photoSrc = imageUrl(member.photo_url);

  const roleBadge = isFullAdmin
    ? { label: 'Admin', bg: 'bg-amber-100 text-amber-700 border-amber-200', icon: <Crown className="w-3 h-3" /> }
    : isModerator
    ? { label: 'Moderator', bg: 'bg-purple-100 text-purple-700 border-purple-200', icon: <Shield className="w-3 h-3" /> }
    : null;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#F5F7FA] py-10 px-4">
      <div className="max-w-2xl mx-auto space-y-5">

        {/* Header card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="h-24 bg-gradient-to-r from-[#1F2A44] to-[#2F5BEA]" />
          <div className="px-6 -mt-12 pb-6 flex items-end gap-4">
            {photoSrc
              ? <img src={photoSrc} alt={member.full_name} className="w-20 h-20 rounded-2xl object-cover border-4 border-white shadow-md flex-shrink-0" />
              : <div className="w-20 h-20 rounded-2xl bg-[#2F5BEA] flex items-center justify-center text-white text-3xl font-bold border-4 border-white shadow-md flex-shrink-0">
                  {member.full_name.charAt(0).toUpperCase()}
                </div>
            }
            <div className="pb-1 min-w-0 flex-1">
              <h1 className="text-xl font-extrabold text-[#1F2A44] truncate">{member.full_name}</h1>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className="bg-[#1F2A44] text-white text-xs px-2.5 py-0.5 rounded-full font-medium">Batch {member.batch}</span>
                {roleBadge && (
                  <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full font-semibold border ${roleBadge.bg}`}>
                    {roleBadge.icon} {roleBadge.label}
                  </span>
                )}
              </div>
            </div>
            <button onClick={handleLogout}
              className="flex items-center gap-1.5 border border-red-100 hover:border-red-300 text-red-500 hover:text-red-600 px-3 py-2 rounded-xl text-xs font-semibold transition-colors flex-shrink-0 pb-1">
              <LogOut className="w-3.5 h-3.5" /> Sign Out
            </button>
          </div>
        </div>

        {/* Must change password banner */}
        {member.must_change_password && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm text-amber-700 font-medium">Please set a new password before continuing.</p>
              <Link to="/change-password" className="text-xs text-amber-600 font-semibold hover:underline mt-1 inline-block">
                Set password now →
              </Link>
            </div>
          </div>
        )}

        {/* Profile info */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex items-center gap-3 px-6 py-4 bg-[#2F5BEA] text-white">
            <User className="w-5 h-5" />
            <h2 className="font-semibold">Account Details</h2>
          </div>
          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { label: 'Email', value: member.email },
              { label: 'Status', value: member.status },
              { label: 'Role', value: member.role.charAt(0).toUpperCase() + member.role.slice(1) },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-0.5">{label}</p>
                <p className="text-sm font-semibold text-[#1F2A44]">{value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link to="/update-profile"
            className="flex items-center gap-3 bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:border-[#2F5BEA] hover:shadow-md transition-all group">
            <div className="w-10 h-10 rounded-xl bg-[#2F5BEA]/10 flex items-center justify-center group-hover:bg-[#2F5BEA] transition-colors">
              <RefreshCw className="w-5 h-5 text-[#2F5BEA] group-hover:text-white transition-colors" />
            </div>
            <div>
              <p className="font-semibold text-[#1F2A44] text-sm">Update Profile</p>
              <p className="text-xs text-gray-400">Edit your info and photo</p>
            </div>
          </Link>

          <Link to="/change-password"
            className="flex items-center gap-3 bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:border-[#1F2A44] hover:shadow-md transition-all group">
            <div className="w-10 h-10 rounded-xl bg-[#1F2A44]/10 flex items-center justify-center group-hover:bg-[#1F2A44] transition-colors">
              <Lock className="w-5 h-5 text-[#1F2A44] group-hover:text-white transition-colors" />
            </div>
            <div>
              <p className="font-semibold text-[#1F2A44] text-sm">Change Password</p>
              <p className="text-xs text-gray-400">Update your login password</p>
            </div>
          </Link>
        </div>

      </div>
    </div>
  );
}
