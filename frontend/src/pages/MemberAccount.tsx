// src/pages/MemberAccount.tsx — Member dashboard: profile view + change password
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Lock, LogOut, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { memberAuthApi, imageUrl } from '../lib/api';

export default function MemberAccount() {
  const { member, memberLogout } = useAuth();
  const navigate = useNavigate();

  const [curPwd, setCurPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [pwdError, setPwdError] = useState('');
  const [pwdSuccess, setPwdSuccess] = useState('');
  const [pwdLoading, setPwdLoading] = useState(false);

  if (!member) {
    navigate('/login', { replace: true });
    return null;
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdError(''); setPwdSuccess('');
    if (newPwd.length < 8) { setPwdError('New password must be at least 8 characters.'); return; }
    if (newPwd !== confirmPwd) { setPwdError('Passwords do not match.'); return; }
    setPwdLoading(true);
    const res = await memberAuthApi.changePassword(member.has_password ? curPwd : undefined, newPwd);
    setPwdLoading(false);
    if (res.success) {
      setPwdSuccess('Password changed successfully.');
      setCurPwd(''); setNewPwd(''); setConfirmPwd('');
    } else {
      setPwdError(res.message || 'Failed to change password.');
    }
  };

  const handleLogout = () => { memberLogout(); navigate('/'); };

  const photoSrc = imageUrl(member.photo_url);
  const inputCls = 'w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#2F5BEA] focus:border-transparent outline-none transition-all bg-white';

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#F5F7FA] py-10 px-4">
      <div className="max-w-2xl mx-auto space-y-6">

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
            <div className="pb-1 min-w-0">
              <h1 className="text-xl font-extrabold text-[#1F2A44] truncate">{member.full_name}</h1>
              <span className="bg-[#1F2A44] text-white text-xs px-2.5 py-0.5 rounded-full font-medium">Batch {member.batch}</span>
            </div>
            <div className="ml-auto pb-1 flex gap-2 flex-shrink-0">
              <Link to="/update-profile"
                className="flex items-center gap-1.5 border border-gray-200 hover:border-[#2F5BEA] text-gray-600 hover:text-[#2F5BEA] px-3 py-2 rounded-xl text-xs font-semibold transition-colors">
                <RefreshCw className="w-3.5 h-3.5" /> Update Info
              </Link>
              <button onClick={handleLogout}
                className="flex items-center gap-1.5 border border-red-100 hover:border-red-300 text-red-500 hover:text-red-600 px-3 py-2 rounded-xl text-xs font-semibold transition-colors">
                <LogOut className="w-3.5 h-3.5" /> Sign Out
              </button>
            </div>
          </div>
        </div>

        {/* Must change password banner */}
        {member.must_change_password && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-amber-700 font-medium">Please set a new password before continuing.</p>
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
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-0.5">{label}</p>
                <p className="text-sm font-semibold text-[#1F2A44]">{value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Change password */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex items-center gap-3 px-6 py-4 bg-[#1F2A44] text-white">
            <Lock className="w-5 h-5" />
            <h2 className="font-semibold">Change Password</h2>
          </div>
          <form onSubmit={handleChangePassword} className="p-6 space-y-4">
            {pwdError && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-3.5 rounded-xl text-sm flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" /> {pwdError}
              </div>
            )}
            {pwdSuccess && (
              <div className="bg-green-50 border border-green-200 text-green-700 p-3.5 rounded-xl text-sm flex items-center gap-2">
                <CheckCircle className="w-4 h-4 flex-shrink-0" /> {pwdSuccess}
              </div>
            )}
            {member.has_password && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Current Password</label>
                <input type="password" value={curPwd} onChange={e => setCurPwd(e.target.value)}
                  required className={inputCls} placeholder="Your current password" />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">New Password</label>
              <input type="password" value={newPwd} onChange={e => setNewPwd(e.target.value)}
                required minLength={8} className={inputCls} placeholder="At least 8 characters" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm New Password</label>
              <input type="password" value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)}
                required className={inputCls} placeholder="Repeat new password" />
            </div>
            <button type="submit" disabled={pwdLoading}
              className="bg-[#2F5BEA] hover:bg-[#1a3fc7] text-white px-6 py-2.5 rounded-xl font-semibold text-sm transition-colors disabled:opacity-50 flex items-center gap-2">
              {pwdLoading
                ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving…</>
                : 'Change Password'}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
