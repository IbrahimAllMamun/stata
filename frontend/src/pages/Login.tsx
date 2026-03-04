// src/pages/Login.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, Lock, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setLoading(true);
    const { error } = await login(username, password);
    if (error) { setError(error.message || 'Invalid credentials'); setLoading(false); } else navigate('/admin');
  };
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#F5F7FA] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-[#1F2A44] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg"><LogIn className="w-8 h-8 text-white" /></div>
          <h1 className="text-3xl font-extrabold text-[#1F2A44] mb-1">Admin Login</h1>
          <p className="text-gray-500 text-sm">Sign in to manage STATA content</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-[#2F5BEA] to-[#F39C12]" />
          <div className="p-8">
            {error && <div className="mb-5 bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-sm">{error}</div>}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Username</label>
                <div className="relative"><User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><input type="text" value={username} onChange={e => setUsername(e.target.value)} required className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#2F5BEA] focus:border-transparent outline-none transition-all" placeholder="admin" /></div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                <div className="relative"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><input type="password" value={password} onChange={e => setPassword(e.target.value)} required className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#2F5BEA] focus:border-transparent outline-none transition-all" placeholder="••••••••" /></div>
              </div>
              <button type="submit" disabled={loading} className="w-full bg-[#2F5BEA] hover:bg-[#1a3fc7] text-white py-3 rounded-xl font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm mt-2">
                {loading ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Signing in...</> : 'Sign In'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
