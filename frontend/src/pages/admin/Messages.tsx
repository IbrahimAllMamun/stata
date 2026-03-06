// src/pages/admin/Messages.tsx
import { useEffect, useState, useCallback } from 'react';
import {
  Mail, MailOpen, Archive, Trash2, X, RefreshCw,
  Search, Inbox, Clock, Star, Hash, Briefcase,
} from 'lucide-react';
import { adminApi, ContactMessage } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';

type TabStatus = 'UNREAD' | 'READ' | 'ARCHIVED';

function TimeAgo({ date }: { date: string }) {
  const d = new Date(date);
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return <span>just now</span>;
  if (diff < 3600) return <span>{Math.floor(diff / 60)}m ago</span>;
  if (diff < 86400) return <span>{Math.floor(diff / 3600)}h ago</span>;
  return <span>{d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</span>;
}

function MessageModal({ msg, onClose, onAction, onToggleFeatured }: {
  msg: ContactMessage;
  onClose: () => void;
  onAction: (id: string, action: 'READ' | 'UNREAD' | 'ARCHIVED' | 'DELETE') => Promise<void>;
  onToggleFeatured: (id: string) => Promise<void>;
}) {
  const [loading, setLoading] = useState(false);

  const handle = async (action: 'READ' | 'UNREAD' | 'ARCHIVED' | 'DELETE') => {
    setLoading(true);
    try { await onAction(msg.id, action); } finally { setLoading(false); onClose(); }
  };

  const handleFeature = async () => {
    setLoading(true);
    try { await onToggleFeatured(msg.id); onClose(); } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(2px)' }}
      onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="bg-gradient-to-r from-[#1F2A44] to-[#2F5BEA] px-6 py-4 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-white font-bold text-base leading-tight truncate">{msg.subject}</p>
            <p className="text-blue-200 text-xs mt-1">{msg.name} · {msg.email}</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Featured star */}
            <button onClick={handleFeature} disabled={loading} title={msg.featured ? 'Remove from speeches' : 'Feature as speech'}
              className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${
                msg.featured ? 'bg-[#F39C12] text-white' : 'bg-white/20 hover:bg-[#F39C12] text-white'
              }`}>
              <Star className="w-3.5 h-3.5" fill={msg.featured ? 'currentColor' : 'none'} />
            </button>
            <button onClick={onClose} className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors">
              <X className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>

        {/* Sender meta */}
        <div className="px-6 pt-4 pb-3 border-b border-gray-100 flex flex-wrap gap-3 text-xs text-gray-500">
          <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />
            {new Date(msg.created_at).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
          </span>
          {msg.batch && (
            <span className="flex items-center gap-1 bg-[#2F5BEA]/10 text-[#2F5BEA] font-semibold px-2 py-0.5 rounded-full">
              <Hash className="w-3 h-3" /> Batch {msg.batch}
            </span>
          )}
          {msg.designation && (
            <span className="flex items-center gap-1 bg-gray-100 text-gray-600 font-medium px-2 py-0.5 rounded-full">
              <Briefcase className="w-3 h-3" /> {msg.designation}
            </span>
          )}
          {msg.featured && (
            <span className="flex items-center gap-1 bg-amber-100 text-amber-700 font-semibold px-2 py-0.5 rounded-full">
              <Star className="w-3 h-3" fill="currentColor" /> Featured Speech
            </span>
          )}
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{msg.message}</p>
        </div>

        {/* Actions */}
        <div className="px-6 pb-5 pt-2 border-t border-gray-100 flex flex-wrap gap-2">
          {msg.status !== 'READ' && (
            <button disabled={loading} onClick={() => handle('READ')}
              className="flex items-center gap-1.5 bg-[#2F5BEA] hover:bg-[#1a3fc7] text-white px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50">
              <MailOpen className="w-3.5 h-3.5" /> Mark Read
            </button>
          )}
          {msg.status !== 'UNREAD' && (
            <button disabled={loading} onClick={() => handle('UNREAD')}
              className="flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50">
              <Mail className="w-3.5 h-3.5" /> Mark Unread
            </button>
          )}
          {msg.status !== 'ARCHIVED' && (
            <button disabled={loading} onClick={() => handle('ARCHIVED')}
              className="flex items-center gap-1.5 bg-amber-100 hover:bg-amber-200 text-amber-700 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50">
              <Archive className="w-3.5 h-3.5" /> Archive
            </button>
          )}
          <button disabled={loading} onClick={() => handle('DELETE')}
            className="flex items-center gap-1.5 bg-red-50 hover:bg-red-100 text-red-600 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 ml-auto">
            <Trash2 className="w-3.5 h-3.5" /> Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Messages() {
  const { isAdmin, loading: authLoading } = useAuth();
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabStatus>('UNREAD');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<ContactMessage | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [counts, setCounts] = useState<Record<TabStatus, number>>({ UNREAD: 0, READ: 0, ARCHIVED: 0 });

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  const loadCounts = useCallback(async () => {
    try {
      const [u, r, a] = await Promise.all([
        adminApi.getMessages({ status: 'UNREAD', limit: 1 }),
        adminApi.getMessages({ status: 'READ', limit: 1 }),
        adminApi.getMessages({ status: 'ARCHIVED', limit: 1 }),
      ]);
      setCounts({ UNREAD: u.pagination.total, READ: r.pagination.total, ARCHIVED: a.pagination.total });
    } catch {}
  }, []);

  const load = useCallback(async (status: TabStatus) => {
    setLoading(true);
    try {
      const res = await adminApi.getMessages({ status, limit: 50 });
      setMessages(res.data);
    } catch {
      showToast('Failed to load messages', false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(tab); }, [tab]);
  useEffect(() => { loadCounts(); }, []);

  const handleAction = async (id: string, action: 'READ' | 'UNREAD' | 'ARCHIVED' | 'DELETE') => {
    try {
      if (action === 'DELETE') {
        await adminApi.deleteMessage(id);
        showToast('Message deleted');
      } else {
        await adminApi.updateMessageStatus(id, action);
        showToast(`Marked as ${action.toLowerCase()}`);
      }
      await Promise.all([load(tab), loadCounts()]);
    } catch (err: any) {
      showToast(err.message || 'Action failed', false);
    }
  };

  const handleToggleFeatured = async (id: string) => {
    try {
      const res = await adminApi.toggleFeatured(id);
      showToast(res.data.featured ? '⭐ Featured as speech' : 'Removed from speeches');
      setMessages(prev => prev.map(m => m.id === id ? { ...m, featured: res.data.featured } : m));
    } catch (err: any) {
      showToast(err.message || 'Failed to update', false);
    }
  };

  const openMessage = async (msg: ContactMessage) => {
    setSelected(msg);
    // Auto-mark as read when opened
    if (msg.status === 'UNREAD') {
      try {
        await adminApi.updateMessageStatus(msg.id, 'READ');
        setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, status: 'READ' } : m));
        setCounts(prev => ({ ...prev, UNREAD: Math.max(0, prev.UNREAD - 1), READ: prev.READ + 1 }));
      } catch {}
    }
  };

  const filtered = messages.filter(m =>
    !search ||
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.email.toLowerCase().includes(search.toLowerCase()) ||
    m.subject.toLowerCase().includes(search.toLowerCase())
  );

  const tabs: { key: TabStatus; label: string; color: string; icon: typeof Mail }[] = [
    { key: 'UNREAD',   label: 'Unread',   color: 'border-[#2F5BEA] text-[#2F5BEA]', icon: Mail },
    { key: 'READ',     label: 'Read',     color: 'border-[#2ECC71] text-[#2ECC71]', icon: MailOpen },
    { key: 'ARCHIVED', label: 'Archived', color: 'border-gray-400 text-gray-500',   icon: Archive },
  ];

  if (authLoading) return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-[#F5F7FA]">
      <div className="w-8 h-8 border-4 border-[#2F5BEA] border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (!isAdmin) return null;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#F5F7FA] py-8 px-4">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#1F2A44] mb-1">Messages</h1>
            <p className="text-gray-500 text-sm">Contact form submissions from visitors</p>
          </div>
          <button onClick={() => { load(tab); loadCounts(); }}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-[#2F5BEA] transition-colors border border-gray-200 rounded-xl px-3 py-2 bg-white hover:border-[#2F5BEA]">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>

        {/* Tabs + content */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-gray-100">
            {tabs.map(({ key, label, color, icon: Icon }) => (
              <button key={key} onClick={() => { setTab(key); setSearch(''); }}
                className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-semibold border-b-2 transition-colors ${
                  tab === key ? color : 'border-transparent text-gray-400 hover:text-gray-600'
                }`}>
                <Icon className="w-4 h-4" />
                {label}
                {counts[key] > 0 && (
                  <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${
                    key === 'UNREAD' ? 'bg-[#2F5BEA] text-white' : 'bg-gray-100 text-gray-500'
                  }`}>{counts[key]}</span>
                )}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="p-4 border-b border-gray-50">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="text" placeholder="Search by name, email or subject…"
                value={search} onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#2F5BEA] focus:border-transparent outline-none" />
            </div>
          </div>

          {/* List */}
          {loading ? (
            <div className="text-center py-16">
              <div className="inline-block w-8 h-8 border-4 border-[#2F5BEA] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <Inbox className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm">No {tab.toLowerCase()} messages</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {filtered.map(msg => (
                <div key={msg.id}
                  onClick={() => openMessage(msg)}
                  className={`flex items-start gap-4 px-5 py-4 cursor-pointer transition-colors hover:bg-[#F5F7FA] group ${
                    msg.status === 'UNREAD' ? 'bg-blue-50/30' : ''
                  }`}>
                  {/* Avatar */}
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                    msg.status === 'UNREAD' ? 'bg-[#2F5BEA] text-white' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {msg.name.charAt(0).toUpperCase()}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <span className={`text-sm font-semibold truncate ${msg.status === 'UNREAD' ? 'text-[#1F2A44]' : 'text-gray-600'}`}>
                        {msg.name}
                      </span>
                      <span className="text-xs text-gray-400 flex-shrink-0 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <TimeAgo date={msg.created_at} />
                      </span>
                    </div>
                    <p className={`text-xs mb-1 truncate ${msg.status === 'UNREAD' ? 'text-[#2F5BEA] font-semibold' : 'text-gray-500'}`}>
                      {msg.subject}
                    </p>
                    <p className="text-xs text-gray-400 truncate">{msg.message}</p>
                  </div>

                  {/* Quick actions on hover */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                    onClick={e => e.stopPropagation()}>
                    {/* Feature star */}
                    <button title={msg.featured ? 'Remove from speeches' : 'Feature as speech'}
                      onClick={() => handleToggleFeatured(msg.id)}
                      className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                        msg.featured ? 'bg-amber-100 text-amber-500' : 'bg-gray-50 hover:bg-amber-50 text-gray-300 hover:text-amber-400'
                      }`}>
                      <Star className="w-3.5 h-3.5" fill={msg.featured ? 'currentColor' : 'none'} />
                    </button>
                    {msg.status !== 'ARCHIVED' && (
                      <button title="Archive"
                        onClick={() => handleAction(msg.id, 'ARCHIVED')}
                        className="w-7 h-7 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-600 flex items-center justify-center transition-colors">
                        <Archive className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button title="Delete"
                      onClick={() => handleAction(msg.id, 'DELETE')}
                      className="w-7 h-7 rounded-lg bg-red-50 hover:bg-red-100 text-red-500 flex items-center justify-center transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Message modal */}
      {selected && (
        <MessageModal msg={selected} onClose={() => setSelected(null)} onAction={handleAction} onToggleFeatured={handleToggleFeatured} />
      )}

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-medium text-white flex items-center gap-2 ${
          toast.ok ? 'bg-[#2ECC71]' : 'bg-[#E74C3C]'
        }`}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}
