// src/pages/Login.tsx — Unified login for all roles (member / mod / admin)
import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { LogIn, Lock, Mail, AlertCircle, KeyRound, CheckCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { memberAuthApi } from '../lib/api';

type Screen = 'login' | 'forgot';

export default function Login() {
  const [screen, setScreen] = useState<Screen>('login');

  // Login
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [needsSetup, setNeedsSetup] = useState(false);
  const [loading, setLoading] = useState(false);

  // Forgot / first-time
  const [setupEmail, setSetupEmail] = useState('');
  const [setupSent, setSetupSent] = useState(false);
  const [setupLoading, setSetupLoading] = useState(false);
  const [setupError, setSetupError] = useState('');

  const { memberLogin, isLoggedIn, isAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoggedIn) navigate(isAdmin ? '/admin/dashboard' : '/account', { replace: true });
  }, [isLoggedIn]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setNeedsSetup(false); setLoading(true);
    const { error: err, needsSetup: ns } = await memberLogin(email, password);
    setLoading(false);
    if (err) {
      setError(err);
      if (ns) setNeedsSetup(true);
    } else {
      navigate('/account');
    }
  };

  const handleRequestSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setSetupError('');
    const emailToCheck = setupEmail.trim().toLowerCase();

    // Show success screen immediately (regardless of whether email exists)
    // This prevents email enumeration attacks
    setSetupLoading(true);
    setSetupSent(true);

    // Send the request in background (no need to wait)
    memberAuthApi.requestSetup(emailToCheck).catch(err => {
      console.error('Setup request failed:', err);
    });

    setSetupLoading(false);
  };

  const inputCls = 'w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#2F5BEA] focus:border-transparent outline-none transition-all bg-white';

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#F5F7FA] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">

        <div className="text-center mb-7">
          <div className="w-16 h-16 bg-[#1F2A44] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <LogIn className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold text-[#1F2A44] mb-1">Sign In</h1>
          <p className="text-gray-500 text-sm">Welcome back to STATA</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-[#2F5BEA] via-[#F39C12] to-[#2ECC71]" />
          <div className="p-7">

            {/* ── Login screen ── */}
            {screen === 'login' && (
              <form onSubmit={handleLogin} className="space-y-4">
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 p-3.5 rounded-xl text-sm flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <div>
                      {error}
                      {needsSetup && (
                        <button type="button"
                          onClick={() => { setScreen('forgot'); setSetupEmail(email); }}
                          className="block mt-1 text-[#2F5BEA] font-semibold hover:underline text-xs">
                          Get a setup link →
                        </button>
                      )}
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                      required autoFocus className={inputCls} placeholder="your@email.com" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                      required className={inputCls} placeholder="••••••••" />
                  </div>
                </div>

                <button type="button" onClick={() => setScreen('forgot')}
                  className="text-xs text-[#2F5BEA] hover:underline font-medium">
                  Forgot password / First time login?
                </button>

                <button type="submit" disabled={loading}
                  className="w-full bg-[#2F5BEA] hover:bg-[#1a3fc7] text-white py-3 rounded-xl font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm mt-1">
                  {loading
                    ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Signing in…</>
                    : 'Sign In'}
                </button>

                <p className="text-center text-xs text-gray-400 pt-1">
                  Not a member yet?{' '}
                  <Link to="/signup" className="text-[#2F5BEA] font-semibold hover:underline">Sign Up</Link>
                </p>
              </form>
            )}

            {/* ── Forgot / first-time screen ── */}
            {screen === 'forgot' && (
              <div>
                <button onClick={() => setScreen('login')}
                  className="text-xs text-gray-400 hover:text-gray-600 mb-5 flex items-center gap-1">
                  ← Back to sign in
                </button>

                {setupSent ? (
                  <div className="text-center py-4">
                    <div className="w-14 h-14 bg-[#2ECC71]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="w-7 h-7 text-[#2ECC71]" />
                    </div>
                    <h3 className="font-bold text-[#1F2A44] mb-2">Check your email</h3>
                    <p className="text-sm text-gray-500 mb-3">
                      If <strong>{setupEmail}</strong> is a registered approved member, you'll receive a setup link shortly. It expires in 24 hours.
                    </p>
                    <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg p-3 mb-5">
                      💡 <strong>Didn't receive it?</strong> Check your spam or junk folder. If still not found, please contact us.
                    </p>
                    <button onClick={() => { setSetupSent(false); setScreen('login'); }}
                      className="mt-4 text-sm text-[#2F5BEA] hover:underline font-medium">
                      Back to sign in
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleRequestSetup} className="space-y-4">
                    <div className="text-center mb-4">
                      <KeyRound className="w-10 h-10 text-[#2F5BEA] mx-auto mb-2" />
                      <h3 className="font-bold text-[#1F2A44]">Get a login link</h3>
                      <p className="text-xs text-gray-500 mt-1">
                        Enter your registered email and we'll send you a link to set your password.
                      </p>
                    </div>
                    {setupError && (
                      <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-sm">{setupError}</div>
                    )}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Registered Email</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input type="email" value={setupEmail} onChange={e => setSetupEmail(e.target.value)}
                          required autoFocus className={inputCls} placeholder="your@email.com" />
                      </div>
                    </div>
                    <button type="submit" disabled={setupLoading}
                      className="w-full bg-[#2F5BEA] hover:bg-[#1a3fc7] text-white py-3 rounded-xl font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                      {setupLoading
                        ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Sending…</>
                        : 'Send Setup Link'}
                    </button>
                  </form>
                )}
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}