// src/pages/ChangePassword.tsx
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, CheckCircle, AlertCircle, ArrowLeft, KeyRound } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { memberAuthApi } from '../lib/api';

export default function ChangePassword() {
  const { member } = useAuth();
  const navigate = useNavigate();

  const [curPwd, setCurPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!member) {
    navigate('/login', { replace: true });
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (newPwd.length < 8) { setError('New password must be at least 8 characters.'); return; }
    if (newPwd !== confirmPwd) { setError('Passwords do not match.'); return; }
    setLoading(true);
    const res = await memberAuthApi.changePassword(member.has_password ? curPwd : undefined, newPwd);
    setLoading(false);
    if (res.success) {
      setSuccess(true);
      setCurPwd(''); setNewPwd(''); setConfirmPwd('');
    } else {
      setError(res.message || 'Failed to change password.');
    }
  };

  const inputCls = 'w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#2F5BEA] focus:border-transparent outline-none transition-all bg-white';

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#F5F7FA] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">

        <div className="text-center mb-7">
          <div className="w-16 h-16 bg-[#1F2A44] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-extrabold text-[#1F2A44] mb-1">Change Password</h1>
          <p className="text-gray-500 text-sm">Update your STATA account password</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-[#1F2A44] to-[#2F5BEA]" />
          <div className="p-7">

            {success ? (
              <div className="text-center py-4">
                <CheckCircle className="w-12 h-12 text-[#2ECC71] mx-auto mb-3" />
                <h3 className="font-bold text-[#1F2A44] mb-1">Password changed!</h3>
                <p className="text-sm text-gray-500 mb-5">Your password has been updated successfully.</p>
                <Link to="/account"
                  className="inline-flex items-center gap-2 bg-[#2F5BEA] hover:bg-[#1a3fc7] text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors">
                  <ArrowLeft className="w-4 h-4" /> Back to Account
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 p-3.5 rounded-xl text-sm flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" /> {error}
                  </div>
                )}

                {member.has_password && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Current Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input type="password" value={curPwd} onChange={e => setCurPwd(e.target.value)}
                        required className={inputCls} placeholder="Your current password" />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">New Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input type="password" value={newPwd} onChange={e => setNewPwd(e.target.value)}
                      required minLength={8} className={inputCls} placeholder="At least 8 characters" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm New Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input type="password" value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)}
                      required className={inputCls} placeholder="Repeat new password" />
                  </div>
                </div>

                {/* Forgot password link */}
                <div className="flex items-center justify-between pt-1">
                  <Link to="/login"
                    onClick={() => { /* trigger forgot screen */ }}
                    className="text-xs text-[#2F5BEA] hover:underline font-medium flex items-center gap-1">
                    <KeyRound className="w-3 h-3" /> Forgot password?
                  </Link>
                </div>

                <button type="submit" disabled={loading}
                  className="w-full bg-[#2F5BEA] hover:bg-[#1a3fc7] text-white py-3 rounded-xl font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                  {loading
                    ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving…</>
                    : 'Change Password'}
                </button>

                <Link to="/account"
                  className="flex items-center justify-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors mt-1">
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to Account
                </Link>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
