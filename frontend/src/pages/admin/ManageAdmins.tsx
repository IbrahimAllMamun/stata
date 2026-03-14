// src/pages/admin/ManageAdmins.tsx
import { useEffect, useState, useCallback } from 'react';
import {
    Shield, UserPlus, Trash2, KeyRound, Eye, EyeOff,
    CheckCircle, X, Crown, Users, RefreshCw, AlertTriangle,
} from 'lucide-react';
import { adminApi } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';

interface Account {
    id: string;
    username: string;
    role: 'admin' | 'moderator';
    created_at: string;
}

type Modal =
    | { type: 'create' }
    | { type: 'delete'; account: Account }
    | { type: 'password'; account: Account }
    | null;

function Toast({ toast }: { toast: { msg: string; ok: boolean } | null }) {
    if (!toast) return null;
    return (
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-2.5 px-5 py-3.5 rounded-2xl shadow-lg text-sm font-semibold text-white transition-all ${toast.ok ? 'bg-[#2ECC71]' : 'bg-[#E74C3C]'}`}>
            {toast.ok ? <CheckCircle className="w-4 h-4" /> : <X className="w-4 h-4" />}
            {toast.msg}
        </div>
    );
}

function RoleBadge({ role }: { role: string }) {
    return role === 'admin'
        ? <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-700 border border-amber-200 text-xs px-2.5 py-0.5 rounded-full font-semibold"><Crown className="w-3 h-3" /> Admin</span>
        : <span className="inline-flex items-center gap-1 bg-purple-100 text-purple-700 border border-purple-200 text-xs px-2.5 py-0.5 rounded-full font-semibold"><Shield className="w-3 h-3" /> Moderator</span>;
}

// ── Create account modal ──────────────────────────────────────────────────────
function CreateModal({ onClose, onCreated, showToast }: {
    onClose: () => void;
    onCreated: () => void;
    showToast: (m: string, ok?: boolean) => void;
}) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState<'moderator' | 'admin'>('moderator');
    const [showPass, setShowPass] = useState(false);
    const [loading, setLoading] = useState(false);

    const passwordStrength = (p: string) => {
        if (p.length < 8) return { label: 'Too short', color: 'bg-red-400', width: '20%' };
        if (p.length < 10 || !/[0-9]/.test(p)) return { label: 'Weak', color: 'bg-orange-400', width: '40%' };
        if (!/[^a-zA-Z0-9]/.test(p)) return { label: 'Fair', color: 'bg-yellow-400', width: '65%' };
        return { label: 'Strong', color: 'bg-[#2ECC71]', width: '100%' };
    };
    const strength = password ? passwordStrength(password) : null;

    const submit = async () => {
        if (!username.trim()) { showToast('Username is required', false); return; }
        if (password.length < 8) { showToast('Password must be at least 8 characters', false); return; }
        setLoading(true);
        try {
            const res = await adminApi.createAccount(username.trim(), password, role);
            showToast(res.message || 'Account created');
            onCreated();
            onClose();
        } catch (err: any) {
            showToast(err.message || 'Failed to create account', false);
        } finally { setLoading(false); }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backgroundColor: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(2px)' }}
            onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="bg-gradient-to-r from-[#1F2A44] to-[#2F5BEA] px-6 py-5 flex items-center justify-between">
                    <div>
                        <h3 className="text-white font-bold text-base">Create Account</h3>
                        <p className="text-blue-200 text-xs mt-0.5">Add a new admin or moderator</p>
                    </div>
                    <button onClick={onClose} className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center">
                        <X className="w-4 h-4 text-white" />
                    </button>
                </div>
                <div className="p-6 space-y-5">
                    {/* Role */}
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Role</label>
                        <div className="grid grid-cols-2 gap-3">
                            {(['moderator', 'admin'] as const).map(r => (
                                <button key={r} onClick={() => setRole(r)}
                                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${role === r ? (r === 'admin' ? 'border-amber-400 bg-amber-50' : 'border-[#9B59B6] bg-purple-50') : 'border-gray-200 hover:border-gray-300'}`}>
                                    {r === 'admin' ? <Crown className={`w-5 h-5 ${role === r ? 'text-amber-500' : 'text-gray-400'}`} /> : <Shield className={`w-5 h-5 ${role === r ? 'text-[#9B59B6]' : 'text-gray-400'}`} />}
                                    <span className={`text-sm font-semibold capitalize ${role === r ? (r === 'admin' ? 'text-amber-700' : 'text-[#9B59B6]') : 'text-gray-500'}`}>{r}</span>
                                    <p className="text-xs text-gray-400 text-center leading-tight">
                                        {r === 'admin' ? 'Full access including settings' : 'Posts, events & members only'}
                                    </p>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Username */}
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Username</label>
                        <input type="text" value={username} onChange={e => setUsername(e.target.value)}
                            placeholder="e.g. john_mod" autoComplete="off"
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#2F5BEA] outline-none" />
                    </div>

                    {/* Password */}
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Password</label>
                        <div className="relative">
                            <input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                                placeholder="Min. 8 characters" autoComplete="new-password"
                                className="w-full px-4 py-2.5 pr-10 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#2F5BEA] outline-none" />
                            <button type="button" onClick={() => setShowPass(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                        {strength && (
                            <div className="mt-2">
                                <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                                    <div className={`h-full ${strength.color} transition-all`} style={{ width: strength.width }} />
                                </div>
                                <p className="text-xs text-gray-400 mt-1">{strength.label}</p>
                            </div>
                        )}
                    </div>
                </div>
                <div className="px-6 pb-6 flex gap-3">
                    <button onClick={submit} disabled={loading || !username || password.length < 8}
                        className="flex-1 flex items-center justify-center gap-2 bg-[#2F5BEA] hover:bg-[#1a3fc7] text-white py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-40">
                        {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <UserPlus className="w-4 h-4" />}
                        {loading ? 'Creating…' : 'Create Account'}
                    </button>
                    <button onClick={onClose} className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
                </div>
            </div>
        </div>
    );
}

// ── Change password modal ─────────────────────────────────────────────────────
function ChangePasswordModal({ account, onClose, showToast }: {
    account: Account; onClose: () => void;
    showToast: (m: string, ok?: boolean) => void;
}) {
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [showPass, setShowPass] = useState(false);
    const [loading, setLoading] = useState(false);

    const submit = async () => {
        if (password.length < 8) { showToast('Password must be at least 8 characters', false); return; }
        if (password !== confirm) { showToast('Passwords do not match', false); return; }
        setLoading(true);
        try {
            const res = await adminApi.changePassword(account.id, password);
            showToast(res.message || 'Password updated');
            onClose();
        } catch (err: any) {
            showToast(err.message || 'Failed to update password', false);
        } finally { setLoading(false); }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backgroundColor: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(2px)' }} onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="bg-gradient-to-r from-[#1F2A44] to-[#9B59B6] px-6 py-4 flex items-center justify-between">
                    <div>
                        <h3 className="text-white font-bold text-sm">Change Password</h3>
                        <p className="text-purple-200 text-xs mt-0.5">@{account.username}</p>
                    </div>
                    <button onClick={onClose} className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center">
                        <X className="w-4 h-4 text-white" />
                    </button>
                </div>
                <div className="p-6 space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">New Password</label>
                        <div className="relative">
                            <input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                                placeholder="Min. 8 characters" autoComplete="new-password"
                                className="w-full px-4 py-2.5 pr-10 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#9B59B6] outline-none" />
                            <button type="button" onClick={() => setShowPass(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Confirm</label>
                        <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)}
                            placeholder="Repeat password"
                            className={`w-full px-4 py-2.5 border rounded-xl text-sm focus:ring-2 outline-none ${confirm && confirm !== password ? 'border-red-300 focus:ring-red-300' : 'border-gray-200 focus:ring-[#9B59B6]'}`} />
                        {confirm && confirm !== password && <p className="text-xs text-red-500 mt-1">Passwords do not match</p>}
                    </div>
                    <div className="flex gap-3 pt-1">
                        <button onClick={submit} disabled={loading || password.length < 8 || password !== confirm}
                            className="flex-1 flex items-center justify-center gap-2 bg-[#9B59B6] hover:bg-[#8E44AD] text-white py-2.5 rounded-xl text-sm font-semibold disabled:opacity-40">
                            {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <KeyRound className="w-4 h-4" />}
                            {loading ? 'Saving…' : 'Update Password'}
                        </button>
                        <button onClick={onClose} className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ── Delete confirm modal ──────────────────────────────────────────────────────
function DeleteModal({ account, onClose, onDeleted, showToast }: {
    account: Account; onClose: () => void;
    onDeleted: () => void;
    showToast: (m: string, ok?: boolean) => void;
}) {
    const [loading, setLoading] = useState(false);

    const submit = async () => {
        setLoading(true);
        try {
            const res = await adminApi.deleteAccount(account.id);
            showToast(res.message || 'Account deleted');
            onDeleted();
            onClose();
        } catch (err: any) {
            showToast(err.message || 'Failed to delete', false);
        } finally { setLoading(false); }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backgroundColor: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(2px)' }} onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
                <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center mb-4">
                    <AlertTriangle className="w-6 h-6 text-red-500" />
                </div>
                <h3 className="text-lg font-bold text-[#1F2A44] mb-1">Delete account?</h3>
                <p className="text-sm text-gray-500 mb-1">
                    You are about to delete <span className="font-semibold text-[#1F2A44]">@{account.username}</span>
                </p>
                <p className="text-xs text-gray-400 mb-5">This action cannot be undone. The account will lose all access immediately.</p>
                <div className="flex gap-3">
                    <button onClick={submit} disabled={loading}
                        className="flex-1 flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50">
                        {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Trash2 className="w-4 h-4" />}
                        {loading ? 'Deleting…' : 'Yes, delete'}
                    </button>
                    <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
                </div>
            </div>
        </div>
    );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function ManageAdmins() {
    const { isFullAdmin, admin: currentAdmin, loading: authLoading } = useAuth();
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState<Modal>(null);
    const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

    const showToast = useCallback((msg: string, ok = true) => {
        setToast({ msg, ok });
        setTimeout(() => setToast(null), 3500);
    }, []);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await adminApi.listAccounts();
            setAccounts(res.data as Account[]);
        } catch (err: any) {
            showToast(err.message || 'Failed to load accounts', false);
        } finally { setLoading(false); }
    }, [showToast]);

    useEffect(() => { if (!authLoading && isFullAdmin) load(); }, [authLoading, isFullAdmin, load]);

    if (!isFullAdmin) return (
        <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-[#F5F7FA]">
            <div className="text-center">
                <Shield className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                <p className="text-gray-500 font-semibold">Admin access required</p>
            </div>
        </div>
    );

    const admins = accounts.filter(a => a.role === 'admin');
    const mods = accounts.filter(a => a.role === 'moderator');

    return (
        <div className="min-h-[calc(100vh-4rem)] bg-[#F5F7FA] py-8 px-4">
            <Toast toast={toast} />

            <div className="max-w-4xl mx-auto space-y-6">

                {/* Header */}
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-[#1F2A44]">Account Management</h1>
                        <p className="text-gray-400 text-sm mt-0.5">{admins.length} admin{admins.length !== 1 ? 's' : ''} · {mods.length} moderator{mods.length !== 1 ? 's' : ''}</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={load} disabled={loading} className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-[#2F5BEA] border border-gray-200 rounded-xl px-3 py-2 bg-white transition-colors">
                            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                        </button>
                        <button onClick={() => setModal({ type: 'create' })}
                            className="flex items-center gap-2 bg-[#2F5BEA] hover:bg-[#1a3fc7] text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-sm">
                            <UserPlus className="w-4 h-4" /> New Account
                        </button>
                    </div>
                </div>

                {/* Info banner */}
                <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex gap-3">
                    <Shield className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-700 space-y-1">
                        <p><span className="font-semibold">Admins</span> have full access — members, posts, events, gallery, committee settings, email, and account management.</p>
                        <p><span className="font-semibold">Moderators</span> can manage posts, events, members, gallery, and messages — but cannot access settings or account management.</p>
                    </div>
                </div>

                {loading ? (
                    <div className="bg-white rounded-2xl border border-gray-100 p-12 flex justify-center">
                        <div className="w-8 h-8 border-4 border-[#2F5BEA] border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : (
                    <>
                        {/* Admins */}
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
                                <div className="w-8 h-8 bg-amber-100 rounded-xl flex items-center justify-center">
                                    <Crown className="w-4 h-4 text-amber-600" />
                                </div>
                                <div>
                                    <h2 className="text-sm font-bold text-[#1F2A44]">Admins</h2>
                                    <p className="text-xs text-gray-400">Full system access</p>
                                </div>
                            </div>
                            {admins.length === 0 ? (
                                <p className="text-gray-400 text-sm text-center py-8">No admins found</p>
                            ) : (
                                <div className="divide-y divide-gray-50">
                                    {admins.map(acc => (
                                        <AccountRow key={acc.id} account={acc} currentId={currentAdmin?.id || ''} onPassword={() => setModal({ type: 'password', account: acc })} onDelete={() => setModal({ type: 'delete', account: acc })} />
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Moderators */}
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
                                <div className="w-8 h-8 bg-purple-100 rounded-xl flex items-center justify-center">
                                    <Users className="w-4 h-4 text-purple-600" />
                                </div>
                                <div>
                                    <h2 className="text-sm font-bold text-[#1F2A44]">Moderators</h2>
                                    <p className="text-xs text-gray-400">Limited access</p>
                                </div>
                            </div>
                            {mods.length === 0 ? (
                                <div className="text-center py-10">
                                    <Shield className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                                    <p className="text-gray-400 text-sm">No moderators yet</p>
                                    <button onClick={() => setModal({ type: 'create' })} className="mt-3 text-[#2F5BEA] text-sm font-semibold hover:underline">
                                        + Add moderator
                                    </button>
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-50">
                                    {mods.map(acc => (
                                        <AccountRow key={acc.id} account={acc} currentId={currentAdmin?.id || ''} onPassword={() => setModal({ type: 'password', account: acc })} onDelete={() => setModal({ type: 'delete', account: acc })} />
                                    ))}
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>

            {/* Modals */}
            {modal?.type === 'create' && <CreateModal onClose={() => setModal(null)} onCreated={load} showToast={showToast} />}
            {modal?.type === 'password' && <ChangePasswordModal account={modal.account} onClose={() => setModal(null)} showToast={showToast} />}
            {modal?.type === 'delete' && <DeleteModal account={modal.account} onClose={() => setModal(null)} onDeleted={load} showToast={showToast} />}
        </div>
    );
}

// ── Account row ───────────────────────────────────────────────────────────────
function AccountRow({ account, currentId, onPassword, onDelete }: {
    account: Account; currentId: string;
    onPassword: () => void; onDelete: () => void;
}) {
    const isSelf = account.id === currentId;
    return (
        <div className="flex items-center gap-4 px-6 py-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0 ${account.role === 'admin' ? 'bg-amber-100 text-amber-700' : 'bg-purple-100 text-purple-700'}`}>
                {account.username.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-[#1F2A44] text-sm">@{account.username}</span>
                    <RoleBadge role={account.role} />
                    {isSelf && <span className="text-xs bg-[#2F5BEA]/10 text-[#2F5BEA] px-2 py-0.5 rounded-full font-medium">You</span>}
                </div>
                <p className="text-xs text-gray-400 mt-0.5">
                    Created {new Date(account.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
                <button onClick={onPassword} title="Change password"
                    className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-[#9B59B6] border border-gray-200 hover:border-[#9B59B6] px-3 py-1.5 rounded-lg transition-colors">
                    <KeyRound className="w-3.5 h-3.5" /> Password
                </button>
                {!isSelf && (
                    <button onClick={onDelete} title="Delete account"
                        className="w-8 h-8 flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4" />
                    </button>
                )}
            </div>
        </div>
    );
}