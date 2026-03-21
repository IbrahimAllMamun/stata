// src/pages/SetPassword.tsx
// Handles magic link token from email — sets password and auto-logs in
import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { KeyRound, Lock, CheckCircle, AlertCircle } from 'lucide-react';
import { memberAuthApi, setMemberToken } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';

export default function SetPassword() {
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const navigate = useNavigate();
  const { setMemberUser } = useAuth();

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!token) navigate('/login', { replace: true });
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    setLoading(true);
    const res = await memberAuthApi.setPassword(token, password);
    setLoading(false);
    if (res.success) {
      setMemberToken(res.data.token);
      setMemberUser(res.data.member);
      setDone(true);
      setTimeout(() => navigate('/account'), 2000);
    } else {
      setError(res.message || 'This link is invalid or expired. Please request a new one.');
    }
  };

  const inputCls = 'w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#2F5BEA] focus:border-transparent outline-none transition-all bg-white';

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#F5F7FA] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-[#2F5BEA] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <KeyRound className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-extrabold text-[#1F2A44] mb-1">Set Your Password</h1>
          <p className="text-gray-500 text-sm">Choose a password for your STATA account</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-[#2F5BEA] to-[#2ECC71]" />
          <div className="p-7">
            {done ? (
              <div className="text-center py-4">
                <CheckCircle className="w-12 h-12 text-[#2ECC71] mx-auto mb-3" />
                <h3 className="font-bold text-[#1F2A44] mb-1">Password set!</h3>
                <p className="text-sm text-gray-500">Redirecting to your account…</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 p-3.5 rounded-xl text-sm flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" /> {error}
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">New Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                      required minLength={8} className={inputCls} placeholder="At least 8 characters" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)}
                      required className={inputCls} placeholder="Repeat password" />
                  </div>
                </div>
                <button type="submit" disabled={loading}
                  className="w-full bg-[#2F5BEA] hover:bg-[#1a3fc7] text-white py-3 rounded-xl font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                  {loading
                    ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Setting password…</>
                    : 'Set Password & Sign In'}
                </button>
                <p className="text-center text-xs text-gray-400">
                  Link expired?{' '}
                  <Link to="/login" className="text-[#2F5BEA] font-semibold hover:underline">Request a new one</Link>
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
