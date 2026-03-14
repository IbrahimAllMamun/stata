// src/pages/admin/Communications.tsx
// Unified page: Contact Messages + Email Campaigns + Individual Email + Inbox

import { useEffect, useState, useCallback } from 'react';
import {
  Mail, MailOpen, Archive, Trash2, X, RefreshCw, Search,
  Inbox, Clock, Star, Hash, Briefcase, Send, Users,
  CheckCircle2, XCircle, ChevronDown, Eye, AlertCircle,
  Wifi, WifiOff, Filter, MessageSquare, Megaphone,
  AtSign, Reply, ChevronRight, Loader2,
} from 'lucide-react';
import { adminApi, ContactMessage } from '../../lib/api';
import MarkdownEditor from '../../components/MarkdownEditor';

// ─── Types ────────────────────────────────────────────────────────────────────
type Section = 'messages' | 'inbox' | 'sent' | 'compose_individual' | 'campaigns' | 'compose_bulk';
type TabStatus = 'UNREAD' | 'READ' | 'ARCHIVED';
type RecipientFilter = 'ALL_NOTIFIABLE' | 'ALL_APPROVED';
type CampaignStatus = 'DRAFT' | 'SENT' | 'FAILED';

interface Campaign {
  id: string; subject: string; html_body: string; text_body: string;
  recipient_filter: RecipientFilter; status: CampaignStatus;
  sent_count: number; failed_count: number; sent_at: string | null;
  created_at: string; admin: { username: string };
}
interface InboxEmail {
  id: string | null; from: string; to: string; subject: string;
  date: string | null; text: string; html: string | null; snippet: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function TimeAgo({ date }: { date: string }) {
  const diff = (Date.now() - new Date(date).getTime()) / 1000;
  if (diff < 60) return <span>just now</span>;
  if (diff < 3600) return <span>{Math.floor(diff / 60)}m ago</span>;
  if (diff < 86400) return <span>{Math.floor(diff / 3600)}h ago</span>;
  return <span>{new Date(date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}</span>;
}

function Toast({ toast }: { toast: { msg: string; ok: boolean } | null }) {
  if (!toast) return null;
  return (
    <div className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl shadow-lg text-white text-sm font-medium flex items-center gap-2 ${toast.ok ? 'bg-[#2ECC71]' : 'bg-red-500'}`}>
      {toast.ok ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
      {toast.msg}
    </div>
  );
}

const FILTER_LABELS: Record<RecipientFilter, string> = {
  ALL_NOTIFIABLE: 'Subscribed members (notify_events = Yes)',
  ALL_APPROVED: 'All approved members',
};

// ─── Markdown → Email HTML ────────────────────────────────────────────────────
function markdownToEmailHtml(md: string): string {
  const lines = md.split('\n');
  const out: string[] = [];
  let i = 0;
  const inline = (t: string) => t
    .replace(/\*\*(.+?)\*\*/g, '<strong style="font-weight:700">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em style="font-style:italic">$1</em>')
    .replace(/`([^`]+)`/g, '<code style="background:#f3f4f6;padding:2px 6px;border-radius:4px;font-family:monospace">$1</code>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" style="color:#2F5BEA;text-decoration:underline">$1</a>');
  while (i < lines.length) {
    const line = lines[i];
    if (line.trim() === '') { i++; continue; }
    const h = line.match(/^(#{1,6})\s+(.+)$/);
    if (h) { const sz = ['28px', '22px', '18px', '16px', '14px', '13px'][h[1].length - 1]; out.push(`<h${h[1].length} style="font-size:${sz};font-weight:700;color:#1F2A44;margin:24px 0 8px">${inline(h[2])}</h${h[1].length}>`); i++; continue; }
    if (/^[-*+]\s/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*+]\s/.test(lines[i])) { items.push(`<li style="margin:4px 0">${inline(lines[i].replace(/^[-*+]\s/, ''))}</li>`); i++; }
      out.push(`<ul style="margin:12px 0;padding-left:20px">${items.join('')}</ul>`); continue;
    }
    const para: string[] = [];
    while (i < lines.length && lines[i].trim() !== '' && !lines[i].match(/^#{1,6}\s/) && !/^[-*+]\s/.test(lines[i])) { para.push(lines[i]); i++; }
    if (para.length) out.push(`<p style="margin:12px 0;color:#374151;line-height:1.7">${para.map(l => inline(l)).join('<br />')}</p>`);
    else { out.push(`<p style="margin:12px 0;color:#374151;line-height:1.7">${inline(line)}</p>`); i++; }
  }
  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="margin:0;padding:0;background:#f5f7fa;font-family:system-ui,sans-serif"><table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f7fa;padding:32px 16px"><tr><td align="center"><table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#fff;border-radius:16px;overflow:hidden"><tr><td style="background:linear-gradient(135deg,#1F2A44,#2F5BEA);padding:28px 32px;text-align:center"><img src="${import.meta.env.VITE_FRONTEND_URL || window.location.origin}/logoFull.png" alt="STATA" width="200" style="display:block;margin:0 auto"/></td></tr><tr><td style="padding:32px">${out.join('\n')}</td></tr><tr><td style="padding:20px 32px;background:#f9fafb;border-top:1px solid #e5e7eb"><p style="margin:0;font-size:12px;color:#9ca3af">You received this email as a member of STATA.</p></td></tr></table></td></tr></table></body></html>`;
}
function markdownToPlain(md: string) {
  return md.replace(/^#{1,6}\s+/gm, '').replace(/\*\*(.+?)\*\*/g, '$1').replace(/\*(.+?)\*/g, '$1').replace(/`([^`]+)`/g, '$1').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').replace(/^[-*+]\s/gm, '• ').trim();
}

// ─── Contact Message Modal ────────────────────────────────────────────────────
function MessageModal({ msg, onClose, onAction, onToggleFeatured, onReply }: {
  msg: ContactMessage; onClose: () => void;
  onAction: (id: string, a: 'READ' | 'UNREAD' | 'ARCHIVED' | 'DELETE') => Promise<void>;
  onToggleFeatured: (id: string) => Promise<void>;
  onReply: (email: string, subject: string) => void;
}) {
  const [loading, setLoading] = useState(false);
  const handle = async (a: 'READ' | 'UNREAD' | 'ARCHIVED' | 'DELETE') => { setLoading(true); try { await onAction(msg.id, a); } finally { setLoading(false); onClose(); } };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4" style={{ backgroundColor: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(2px)' }} onClick={onClose}>
      <div className="bg-white sm:rounded-2xl shadow-2xl w-full sm:max-w-lg overflow-hidden h-full sm:h-auto max-h-full sm:max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="bg-gradient-to-r from-[#1F2A44] to-[#2F5BEA] px-6 py-4 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-white font-bold text-base truncate">{msg.subject}</p>
            <p className="text-blue-200 text-xs mt-1">{msg.name} · {msg.email}</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button onClick={() => { setLoading(true); onToggleFeatured(msg.id).finally(() => { setLoading(false); onClose(); }); }} disabled={loading}
              className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${msg.featured ? 'bg-[#F39C12] text-white' : 'bg-white/20 hover:bg-[#F39C12] text-white'}`}>
              <Star className="w-3.5 h-3.5" fill={msg.featured ? 'currentColor' : 'none'} />
            </button>
            <button onClick={onClose} className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors">
              <X className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
        <div className="px-6 pt-4 pb-3 border-b border-gray-100 flex flex-wrap gap-3 text-xs text-gray-500">
          <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{new Date(msg.created_at).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}</span>
          {msg.batch && <span className="flex items-center gap-1 bg-[#2F5BEA]/10 text-[#2F5BEA] font-semibold px-2 py-0.5 rounded-full"><Hash className="w-3 h-3" />Batch {msg.batch}</span>}
          {msg.designation && <span className="flex items-center gap-1 bg-gray-100 text-gray-600 font-medium px-2 py-0.5 rounded-full"><Briefcase className="w-3 h-3" />{msg.designation}</span>}
        </div>
        <div className="px-6 py-5">
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{msg.message}</p>
        </div>
        <div className="px-6 pb-5 pt-2 border-t border-gray-100 flex flex-wrap gap-2">
          <button onClick={() => { onClose(); onReply(msg.email, `Re: ${msg.subject}`); }}
            className="flex items-center gap-1.5 bg-[#1F2A44] hover:bg-[#2F5BEA] text-white px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors">
            <Reply className="w-3.5 h-3.5" /> Reply via info@
          </button>
          {msg.status !== 'READ' && <button disabled={loading} onClick={() => handle('READ')} className="flex items-center gap-1.5 bg-[#2F5BEA] hover:bg-[#1a3fc7] text-white px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors"><MailOpen className="w-3.5 h-3.5" />Mark Read</button>}
          {msg.status !== 'ARCHIVED' && <button disabled={loading} onClick={() => handle('ARCHIVED')} className="flex items-center gap-1.5 bg-amber-100 hover:bg-amber-200 text-amber-700 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors"><Archive className="w-3.5 h-3.5" />Archive</button>}
          <button disabled={loading} onClick={() => handle('DELETE')} className="flex items-center gap-1.5 bg-red-50 hover:bg-red-100 text-red-600 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors ml-auto"><Trash2 className="w-3.5 h-3.5" />Delete</button>
        </div>
      </div>
    </div>
  );
}

// ─── Inbox Email Modal ────────────────────────────────────────────────────────
function InboxEmailModal({ email, onClose, onReply, showReply = true }: {
  email: InboxEmail; onClose: () => void;
  onReply: (to: string, subject: string, replyToId: string | null) => void;
  showReply?: boolean;
}) {
  const [showHtml, setShowHtml] = useState(false);
  const fromEmail = email.from.match(/<(.+?)>/)?.[1] || email.from;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4" style={{ backgroundColor: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(2px)' }} onClick={onClose}>
      <div className="bg-white sm:rounded-2xl shadow-2xl w-full sm:max-w-2xl h-full sm:max-h-[85vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="bg-gradient-to-r from-[#1F2A44] to-[#2F5BEA] px-6 py-4 flex items-start justify-between gap-4 flex-shrink-0">
          <div className="min-w-0">
            <p className="text-white font-bold text-base truncate">{email.subject}</p>
            <p className="text-blue-200 text-xs mt-1">{email.from}</p>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center flex-shrink-0">
            <X className="w-4 h-4 text-white" />
          </button>
        </div>
        <div className="px-6 pt-3 pb-2 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
          <span className="text-xs text-gray-400 flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{email.date ? new Date(email.date).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }) : 'Unknown date'}</span>
          {email.html && (
            <button onClick={() => setShowHtml(v => !v)} className="text-xs text-[#2F5BEA] font-semibold flex items-center gap-1">
              <Eye className="w-3.5 h-3.5" /> {showHtml ? 'Plain text' : 'View HTML'}
            </button>
          )}
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {showHtml && email.html
            ? <iframe srcDoc={email.html} className="w-full rounded-lg border border-gray-100" style={{ height: '400px', border: 'none' }} title="email" />
            : <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{email.text || '(no content)'}</p>
          }
        </div>
        <div className="px-6 py-4 border-t border-gray-100 flex-shrink-0">
          {showReply && (
            <button onClick={() => { onClose(); onReply(fromEmail, `Re: ${email.subject}`, email.id); }}
              className="flex items-center gap-2 bg-[#1F2A44] hover:bg-[#2F5BEA] text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors">
              <Reply className="w-4 h-4" /> Reply
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Communications() {
  const [section, setSection] = useState<Section>('messages');
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  // Pre-fill state for compose_individual (used when replying from messages/inbox)
  const [replyTo, setReplyTo] = useState('');
  const [replySubject, setReplySubject] = useState('');
  const [replyToMessageId, setReplyToMessageId] = useState<string | null>(null);

  const showToast = (msg: string, ok = true) => { setToast({ msg, ok }); setTimeout(() => setToast(null), 3500); };

  const goReply = (email: string, subject: string, msgId: string | null = null) => {
    setReplyTo(email);
    setReplySubject(subject);
    setReplyToMessageId(msgId);
    setSection('compose_individual');
  };

  const navItems: { key: Section; label: string; icon: typeof Mail; color: string }[] = [
    { key: 'messages', label: 'Contact Messages', icon: MessageSquare, color: 'text-[#2F5BEA]' },
    { key: 'inbox', label: 'Inbox (info@)', icon: Inbox, color: 'text-[#9B59B6]' },
    { key: 'sent', label: 'Sent (info@)', icon: Send, color: 'text-[#2ECC71]' },
    { key: 'compose_individual', label: 'Send Email', icon: AtSign, color: 'text-[#1F2A44]' },
    { key: 'campaigns', label: 'Campaigns', icon: Megaphone, color: 'text-[#F39C12]' },
    { key: 'compose_bulk', label: 'New Campaign', icon: Mail, color: 'text-[#E74C3C]' },
  ];

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#F5F7FA]">

      {/* ── Mobile tab bar ── */}
      <div className="lg:hidden bg-white border-b border-gray-100 shadow-sm sticky top-16 z-30">
        <div className="flex overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {navItems.map(({ key, label, icon: Icon, color }) => (
            <button key={key} onClick={() => setSection(key)}
              className={`flex-shrink-0 flex flex-col items-center gap-1 px-4 py-2.5 text-xs font-medium border-b-2 transition-colors ${section === key ? `border-current ${color}` : 'border-transparent text-gray-400'}`}>
              <Icon className="w-4 h-4" />
              <span className="whitespace-nowrap">{label.split(' ')[0]}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 lg:py-8 lg:flex lg:gap-6">

        {/* ── Desktop sidebar ── */}
        <aside className="hidden lg:block w-52 flex-shrink-0">
          <div className="sticky top-24 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <h1 className="text-sm font-bold text-[#1F2A44]">Communications</h1>
              <p className="text-xs text-gray-400 mt-0.5">All in one place</p>
            </div>
            <nav className="p-2 space-y-0.5">
              {navItems.map(({ key, label, icon: Icon, color }) => (
                <button key={key} onClick={() => setSection(key)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left ${section === key ? 'bg-[#F5F7FA] text-[#1F2A44]' : 'text-gray-500 hover:bg-gray-50 hover:text-[#1F2A44]'}`}>
                  <Icon className={`w-4 h-4 flex-shrink-0 ${section === key ? color : ''}`} />
                  <span className="truncate">{label}</span>
                  {section === key && <ChevronRight className="w-3 h-3 ml-auto flex-shrink-0 text-gray-400" />}
                </button>
              ))}
            </nav>
            <div className="px-4 py-3 border-t border-gray-100">
              <p className="text-xs text-gray-400 leading-relaxed">
                <span className="font-semibold text-gray-500">no-reply@</span> for bulk<br />
                <span className="font-semibold text-gray-500">info@</span> for direct email
              </p>
            </div>
          </div>
        </aside>

        {/* ── Content ── */}
        <div className="flex-1 min-w-0">
          {section === 'messages' && <MessagesSection showToast={showToast} onReply={goReply} />}
          {section === 'inbox' && <InboxSection showToast={showToast} onReply={goReply} folder="INBOX" title="Inbox — info@stataisrt.org" subtitle="Incoming emails to info@" />}
          {section === 'sent' && <InboxSection showToast={showToast} onReply={goReply} folder="INBOX.Sent" title="Sent — info@stataisrt.org" subtitle="Emails sent from info@" />}
          {section === 'compose_individual' && <ComposeIndividualSection showToast={showToast} defaultTo={replyTo} defaultSubject={replySubject} defaultReplyToId={replyToMessageId} />}
          {section === 'campaigns' && <CampaignsSection showToast={showToast} />}
          {section === 'compose_bulk' && <ComposeBulkSection showToast={showToast} />}
        </div>
      </div>
      <Toast toast={toast} />
    </div>
  );
}

// ─── Messages Section ─────────────────────────────────────────────────────────
function MessagesSection({ showToast, onReply }: { showToast: (m: string, ok?: boolean) => void; onReply: (e: string, s: string) => void }) {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabStatus>('UNREAD');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<ContactMessage | null>(null);
  const [counts, setCounts] = useState<Record<TabStatus, number>>({ UNREAD: 0, READ: 0, ARCHIVED: 0 });

  const loadCounts = useCallback(async () => {
    try {
      const [u, r, a] = await Promise.all([
        adminApi.getMessages({ status: 'UNREAD', limit: 1 }),
        adminApi.getMessages({ status: 'READ', limit: 1 }),
        adminApi.getMessages({ status: 'ARCHIVED', limit: 1 }),
      ]);
      setCounts({ UNREAD: u.pagination.total, READ: r.pagination.total, ARCHIVED: a.pagination.total });
    } catch { }
  }, []);

  const load = useCallback(async (status: TabStatus) => {
    setLoading(true);
    try { const res = await adminApi.getMessages({ status, limit: 50 }); setMessages(res.data); }
    catch { showToast('Failed to load messages', false); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(tab); }, [tab]);
  useEffect(() => { loadCounts(); }, []);

  const handleAction = async (id: string, action: 'READ' | 'UNREAD' | 'ARCHIVED' | 'DELETE') => {
    try {
      if (action === 'DELETE') { await adminApi.deleteMessage(id); showToast('Deleted'); }
      else { await adminApi.updateMessageStatus(id, action); showToast(`Marked ${action.toLowerCase()}`); }
      await Promise.all([load(tab), loadCounts()]);
    } catch (err: any) { showToast(err.message || 'Failed', false); }
  };

  const handleToggleFeatured = async (id: string) => {
    try {
      const res = await adminApi.toggleFeatured(id);
      showToast(res.data.featured ? '⭐ Featured as speech' : 'Removed from speeches');
      setMessages(prev => prev.map(m => m.id === id ? { ...m, featured: res.data.featured } : m));
    } catch (err: any) { showToast(err.message || 'Failed', false); }
  };

  const openMessage = async (msg: ContactMessage) => {
    setSelected(msg);
    if (msg.status === 'UNREAD') {
      try {
        await adminApi.updateMessageStatus(msg.id, 'READ');
        setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, status: 'READ' } : m));
        setCounts(prev => ({ ...prev, UNREAD: Math.max(0, prev.UNREAD - 1), READ: prev.READ + 1 }));
      } catch { }
    }
  };

  const filtered = messages.filter(m => !search || m.name.toLowerCase().includes(search.toLowerCase()) || m.email.toLowerCase().includes(search.toLowerCase()) || m.subject.toLowerCase().includes(search.toLowerCase()));
  const tabs: { key: TabStatus; label: string; icon: typeof Mail }[] = [
    { key: 'UNREAD', label: 'Unread', icon: Mail },
    { key: 'READ', label: 'Read', icon: MailOpen },
    { key: 'ARCHIVED', label: 'Archived', icon: Archive },
  ];
  const tabColors: Record<TabStatus, string> = { UNREAD: 'border-[#2F5BEA] text-[#2F5BEA]', READ: 'border-[#2ECC71] text-[#2ECC71]', ARCHIVED: 'border-gray-400 text-gray-500' };

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#1F2A44]">Contact Messages</h2>
          <p className="text-gray-400 text-xs mt-0.5">Submissions from the contact form</p>
        </div>
        <button onClick={() => { load(tab); loadCounts(); }} className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-[#2F5BEA] border border-gray-200 rounded-xl px-3 py-2 bg-white transition-colors">
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex border-b border-gray-100">
          {tabs.map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => { setTab(key); setSearch(''); }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-sm font-semibold border-b-2 transition-colors ${tab === key ? tabColors[key] : 'border-transparent text-gray-400 hover:text-gray-600'}`}>
              <Icon className="w-3.5 h-3.5" /> {label}
              {counts[key] > 0 && <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${key === 'UNREAD' ? 'bg-[#2F5BEA] text-white' : 'bg-gray-100 text-gray-500'}`}>{counts[key]}</span>}
            </button>
          ))}
        </div>
        <div className="p-3 border-b border-gray-50">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input type="text" placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-8 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#2F5BEA] outline-none" />
          </div>
        </div>
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-[#2F5BEA]" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-400"><Inbox className="w-8 h-8 mx-auto mb-2 opacity-40" /><p className="text-sm">No {tab.toLowerCase()} messages</p></div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filtered.map(msg => (
              <div key={msg.id} onClick={() => openMessage(msg)}
                className={`flex items-start gap-3 px-4 py-3.5 cursor-pointer transition-colors hover:bg-[#F5F7FA] group ${msg.status === 'UNREAD' ? 'bg-blue-50/30' : ''}`}>
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0 ${msg.status === 'UNREAD' ? 'bg-[#2F5BEA] text-white' : 'bg-gray-100 text-gray-500'}`}>
                  {msg.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <span className={`text-sm font-semibold truncate ${msg.status === 'UNREAD' ? 'text-[#1F2A44]' : 'text-gray-600'}`}>{msg.name}</span>
                    <span className="text-xs text-gray-400 flex-shrink-0"><TimeAgo date={msg.created_at} /></span>
                  </div>
                  <p className={`text-xs truncate mb-0.5 ${msg.status === 'UNREAD' ? 'text-[#2F5BEA] font-semibold' : 'text-gray-500'}`}>{msg.subject}</p>
                  <p className="text-xs text-gray-400 truncate">{msg.message}</p>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 flex-shrink-0" onClick={e => e.stopPropagation()}>
                  <button onClick={() => handleToggleFeatured(msg.id)} className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors ${msg.featured ? 'bg-amber-100 text-amber-500' : 'bg-gray-50 hover:bg-amber-50 text-gray-300 hover:text-amber-400'}`}>
                    <Star className="w-3 h-3" fill={msg.featured ? 'currentColor' : 'none'} />
                  </button>
                  <button onClick={() => handleAction(msg.id, 'DELETE')} className="w-6 h-6 rounded-lg bg-red-50 hover:bg-red-100 text-red-500 flex items-center justify-center">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {selected && <MessageModal msg={selected} onClose={() => setSelected(null)} onAction={handleAction} onToggleFeatured={handleToggleFeatured} onReply={onReply} />}
    </div>
  );
}

// ─── Inbox Section ────────────────────────────────────────────────────────────
function InboxSection({ showToast, onReply, folder = 'INBOX', title, subtitle }: {
  showToast: (m: string, ok?: boolean) => void;
  onReply: (e: string, s: string, id: string | null) => void;
  folder?: string;
  title?: string;
  subtitle?: string;
}) {
  const [emails, setEmails] = useState<InboxEmail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<InboxEmail | null>(null);
  const [search, setSearch] = useState('');

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/admin/email/inbox?folder=${encodeURIComponent(folder)}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('stata_token')}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to load');
      setEmails(data.data);
    } catch (err: any) {
      setError(err.message || 'Failed to load');
      showToast(err.message || 'Failed to load', false);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const filtered = emails.filter(e => !search || e.from.toLowerCase().includes(search.toLowerCase()) || e.subject.toLowerCase().includes(search.toLowerCase()) || e.snippet.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#1F2A44]">{title || 'Inbox — info@stataisrt.org'}</h2>
          <p className="text-gray-400 text-xs mt-0.5">{subtitle || 'Incoming emails to info@'}</p>
        </div>
        <button onClick={load} disabled={loading} className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-[#2F5BEA] border border-gray-200 rounded-xl px-3 py-2 bg-white transition-colors">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-3 border-b border-gray-50">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input type="text" placeholder={`Search ${folder === 'INBOX' ? 'inbox' : 'sent'}…`} value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-8 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#9B59B6] outline-none" />
          </div>
        </div>
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-[#9B59B6]" />
            <p className="text-xs text-gray-400">Connecting to mailbox…</p>
          </div>
        ) : error ? (
          <div className="text-center py-12 px-6">
            <WifiOff className="w-8 h-8 mx-auto mb-3 text-red-300" />
            <p className="text-sm font-semibold text-red-500 mb-1">Could not connect to inbox</p>
            <p className="text-xs text-gray-400 mb-4">{error}</p>
            <div className="text-xs text-gray-400 bg-gray-50 rounded-xl p-3 text-left space-y-1">
              <p className="font-semibold text-gray-500 mb-1">Make sure these are set in .env:</p>
              <p><code className="bg-gray-200 px-1 rounded">INFO_EMAIL=info@stataisrt.org</code></p>
              <p><code className="bg-gray-200 px-1 rounded">INFO_EMAIL_PASS=your_password</code></p>
              <p><code className="bg-gray-200 px-1 rounded">IMAP_HOST=stataisrt.org</code></p>
              <p><code className="bg-gray-200 px-1 rounded">IMAP_PORT=993</code></p>
              <p className="mt-2 font-semibold text-gray-500">And install IMAP packages on server:</p>
              <p><code className="bg-gray-200 px-1 rounded">npm install imap mailparser</code></p>
            </div>
            <button onClick={load} className="mt-4 flex items-center gap-2 mx-auto text-sm text-[#9B59B6] font-semibold hover:underline">
              <RefreshCw className="w-3.5 h-3.5" /> Retry
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Inbox className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">Inbox is empty</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filtered.map((email, idx) => (
              <div key={email.id || idx} onClick={() => setSelected(email)}
                className="flex items-start gap-3 px-4 py-3.5 cursor-pointer hover:bg-[#F5F7FA] transition-colors group">
                <div className="w-8 h-8 rounded-xl bg-[#9B59B6]/10 flex items-center justify-center text-xs font-bold text-[#9B59B6] flex-shrink-0">
                  {(email.from.match(/^([A-Za-z])/) || ['?'])[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <span className="text-sm font-semibold text-[#1F2A44] truncate">{email.from.replace(/<[^>]+>/, '').trim() || email.from}</span>
                    <span className="text-xs text-gray-400 flex-shrink-0">{email.date ? <TimeAgo date={email.date} /> : '—'}</span>
                  </div>
                  <p className="text-xs text-[#2F5BEA] font-medium truncate mb-0.5">{email.subject}</p>
                  <p className="text-xs text-gray-400 truncate">{email.snippet}</p>
                </div>
                <button onClick={e => { e.stopPropagation(); const from = email.from.match(/<(.+?)>/)?.[1] || email.from; onReply(from, `Re: ${email.subject}`, email.id); }}
                  className={`w-7 h-7 rounded-lg bg-[#2F5BEA]/10 text-[#2F5BEA] flex items-center justify-center flex-shrink-0 transition-all hover:bg-[#2F5BEA] hover:text-white ${folder === 'INBOX.Sent' ? 'hidden' : 'opacity-0 group-hover:opacity-100'}`}>
                  <Reply className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      {selected && <InboxEmailModal email={selected} onClose={() => setSelected(null)} onReply={onReply} showReply={folder !== 'INBOX.Sent'} />}
    </div>
  );
}

// ─── Compose Individual ───────────────────────────────────────────────────────
function ComposeIndividualSection({ showToast, defaultTo, defaultSubject, defaultReplyToId }: {
  showToast: (m: string, ok?: boolean) => void;
  defaultTo?: string; defaultSubject?: string; defaultReplyToId?: string | null;
}) {
  const [to, setTo] = useState(defaultTo || '');
  const [subject, setSubject] = useState(defaultSubject || '');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [smtpOk, setSmtpOk] = useState<'unknown' | 'ok' | 'error'>('unknown');
  const [smtpChecking, setSmtpChecking] = useState(false);

  useEffect(() => { if (defaultTo) setTo(defaultTo); }, [defaultTo]);
  useEffect(() => { if (defaultSubject) setSubject(defaultSubject); }, [defaultSubject]);

  const checkSmtp = async () => {
    setSmtpChecking(true);
    try { await adminApi.verifySmtp(); setSmtpOk('ok'); showToast('SMTP OK ✓'); }
    catch (err: any) { setSmtpOk('error'); showToast(err.message || 'SMTP failed', false); }
    finally { setSmtpChecking(false); }
  };

  const send = async () => {
    if (!to.trim()) { showToast('Recipient email is required', false); return; }
    if (!subject.trim()) { showToast('Subject is required', false); return; }
    if (!body.trim()) { showToast('Body is required', false); return; }
    setSending(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/admin/email/send-individual`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('stata_token')}` },
        body: JSON.stringify({ to: to.trim(), subject: subject.trim(), body: body.trim(), reply_to_message_id: defaultReplyToId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Send failed');
      showToast(`Sent to ${to.trim()}`);
      setTo(''); setSubject(''); setBody('');
    } catch (err: any) {
      showToast(err.message || 'Send failed', false);
    } finally { setSending(false); }
  };

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#1F2A44]">Send Email</h2>
          <p className="text-gray-400 text-xs mt-0.5">Send from <span className="font-semibold">info@stataisrt.org</span></p>
        </div>
        <button onClick={checkSmtp} disabled={smtpChecking}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${smtpOk === 'ok' ? 'bg-green-50 border-green-200 text-green-700' : smtpOk === 'error' ? 'bg-red-50 border-red-200 text-red-600' : 'bg-white border-gray-200 text-gray-600 hover:border-[#2ECC71]'}`}>
          {smtpChecking ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : smtpOk === 'error' ? <WifiOff className="w-3.5 h-3.5" /> : <Wifi className="w-3.5 h-3.5" />}
          {smtpOk === 'ok' ? 'SMTP OK' : smtpOk === 'error' ? 'SMTP Error' : 'Test SMTP'}
        </button>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">To</label>
          <input type="email" value={to} onChange={e => setTo(e.target.value)} placeholder="recipient@example.com"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#2ECC71] focus:border-transparent outline-none" />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Subject</label>
          <input type="text" value={subject} onChange={e => setSubject(e.target.value)} placeholder="Email subject…"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#2ECC71] focus:border-transparent outline-none" />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Message</label>
          <textarea value={body} onChange={e => setBody(e.target.value)} rows={10} placeholder="Write your message…"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#2ECC71] focus:border-transparent outline-none resize-none font-mono" />
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2 border-t border-gray-100">
          <p className="text-xs text-gray-400 flex items-center gap-1.5">
            <AtSign className="w-3.5 h-3.5" /> Sent from info@stataisrt.org
          </p>
          <button onClick={send} disabled={sending || !to || !subject || !body}
            className="flex items-center gap-2 bg-[#2ECC71] hover:bg-[#27ae60] text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-40">
            {sending ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending…</> : <><Send className="w-4 h-4" /> Send Email</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Campaigns History ────────────────────────────────────────────────────────
function CampaignsSection({ showToast }: { showToast: (m: string, ok?: boolean) => void }) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try { const res = await adminApi.getEmailCampaigns(); setCampaigns(res.data as Campaign[]); }
    catch { showToast('Failed to load campaigns', false); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const statusMap: Record<CampaignStatus, string> = {
    DRAFT: 'bg-gray-100 text-gray-600', SENT: 'bg-green-100 text-green-700', FAILED: 'bg-red-100 text-red-700',
  };
  const statusIcon: Record<CampaignStatus, React.ReactNode> = {
    DRAFT: <Clock className="w-3 h-3" />, SENT: <CheckCircle2 className="w-3 h-3" />, FAILED: <XCircle className="w-3 h-3" />,
  };

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#1F2A44]">Campaign History</h2>
          <p className="text-gray-400 text-xs mt-0.5">{campaigns.length} campaigns sent</p>
        </div>
        <button onClick={load} disabled={loading} className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-[#F39C12] border border-gray-200 rounded-xl px-3 py-2 bg-white transition-colors">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-[#F39C12]" /></div>
      ) : campaigns.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 text-center py-16 text-gray-400">
          <Megaphone className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No campaigns yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {campaigns.map(c => (
            <div key={c.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="flex items-start gap-3 px-4 py-3.5 sm:gap-4 sm:px-5 sm:py-4">
                <div className="w-9 h-9 rounded-xl bg-[#F39C12]/10 flex items-center justify-center flex-shrink-0">
                  <Megaphone className="w-4 h-4 text-[#F39C12]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <p className="font-semibold text-[#1F2A44] truncate text-sm">{c.subject}</p>
                    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-semibold ${statusMap[c.status]}`}>
                      {statusIcon[c.status]} {c.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 flex-wrap text-xs text-gray-400">
                    <span>{c.sent_at ? new Date(c.sent_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : new Date(c.created_at).toLocaleDateString()}</span>
                    <span>·</span><span>by {c.admin.username}</span>
                    {c.status === 'SENT' && <><span>·</span><span className="text-green-600 font-semibold">{c.sent_count} sent</span>{c.failed_count > 0 && <span className="text-red-500 font-semibold">{c.failed_count} failed</span>}</>}
                    <span className="bg-gray-100 px-2 py-0.5 rounded-full">{FILTER_LABELS[c.recipient_filter]}</span>
                  </div>
                </div>
              </div>
              <div className="px-5 pb-4">
                <button onClick={() => setExpanded(expanded === c.id ? null : c.id)} className="flex items-center gap-1 text-xs text-[#2F5BEA] font-semibold">
                  <Eye className="w-3.5 h-3.5" /> {expanded === c.id ? 'Hide' : 'Preview'}
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${expanded === c.id ? 'rotate-180' : ''}`} />
                </button>
                {expanded === c.id && (
                  <div className="mt-3 border border-gray-200 rounded-xl overflow-hidden">
                    <iframe srcDoc={c.html_body} title="preview" className="w-full rounded-lg" style={{ height: '360px', border: 'none' }} />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Compose Bulk ─────────────────────────────────────────────────────────────
function ComposeBulkSection({ showToast }: { showToast: (m: string, ok?: boolean) => void }) {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [filter, setFilter] = useState<RecipientFilter>('ALL_NOTIFIABLE');
  const [preview, setPreview] = useState<{ count: number; sample: { name: string }[] } | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [smtpOk, setSmtpOk] = useState<'unknown' | 'ok' | 'error'>('unknown');
  const [smtpChecking, setSmtpChecking] = useState(false);
  const [confirm, setConfirm] = useState(false);

  const loadPreview = useCallback(async (f: RecipientFilter) => {
    setPreviewLoading(true);
    try { const res = await adminApi.previewEmailRecipients(f); setPreview(res.data); }
    catch { setPreview(null); }
    finally { setPreviewLoading(false); }
  }, []);

  useEffect(() => { loadPreview(filter); }, [filter]);

  const checkSmtp = async () => {
    setSmtpChecking(true);
    try { await adminApi.verifySmtp(); setSmtpOk('ok'); showToast('SMTP OK ✓'); }
    catch (err: any) { setSmtpOk('error'); showToast(err.message || 'SMTP failed', false); }
    finally { setSmtpChecking(false); }
  };

  const send = async () => {
    setConfirm(false); setSending(true);
    try {
      const res = await adminApi.sendEmailCampaign({
        subject, html_body: markdownToEmailHtml(body), text_body: markdownToPlain(body), recipient_filter: filter,
      });
      showToast(res.message || 'Campaign sent!');
      setSubject(''); setBody('');
    } catch (err: any) {
      showToast(err.message || 'Send failed', false);
    } finally { setSending(false); }
  };

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#1F2A44]">New Campaign</h2>
          <p className="text-gray-400 text-xs mt-0.5">Sent from <span className="font-semibold">no-reply@stataisrt.org</span></p>
        </div>
        <button onClick={checkSmtp} disabled={smtpChecking}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${smtpOk === 'ok' ? 'bg-green-50 border-green-200 text-green-700' : smtpOk === 'error' ? 'bg-red-50 border-red-200 text-red-600' : 'bg-white border-gray-200 text-gray-600 hover:border-[#2F5BEA]'}`}>
          {smtpChecking ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : smtpOk === 'error' ? <WifiOff className="w-3.5 h-3.5" /> : <Wifi className="w-3.5 h-3.5" />}
          {smtpOk === 'ok' ? 'SMTP OK' : smtpOk === 'error' ? 'SMTP Error' : 'Test SMTP'}
        </button>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
        {/* Recipients */}
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2"><Filter className="w-3 h-3 inline mr-1" />Recipients</label>
          <select value={filter} onChange={e => setFilter(e.target.value as RecipientFilter)}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#E74C3C] outline-none bg-white">
            <option value="ALL_NOTIFIABLE">Subscribed members only</option>
            <option value="ALL_APPROVED">All approved members</option>
          </select>
          <div className="mt-1.5 text-xs text-gray-400 flex items-center gap-1.5">
            {previewLoading ? <><Loader2 className="w-3 h-3 animate-spin" /> Counting…</> :
              preview ? <><Users className="w-3 h-3 text-[#2F5BEA]" /><span className="text-[#2F5BEA] font-semibold">{preview.count}</span> recipients — e.g. {preview.sample.slice(0, 3).map(s => s.name).join(', ')}{preview.count > 3 ? ` +${preview.count - 3} more` : ''}</> : null}
          </div>
        </div>
        {/* Subject */}
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Subject</label>
          <input type="text" value={subject} onChange={e => setSubject(e.target.value)} placeholder="Campaign subject…"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#E74C3C] focus:border-transparent outline-none" />
        </div>
        {/* Body */}
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Body (Markdown)</label>
          <MarkdownEditor value={body} onChange={setBody} placeholder="Write your message in Markdown…" minRows={14} />
          <p className="mt-1.5 text-xs text-gray-400">Markdown is converted to styled HTML. Plain text fallback also sent.</p>
        </div>
        {/* Anti-spam */}
        <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-xl p-3">
          <AlertCircle className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-blue-700">Sent in batches · List-Unsubscribe headers · Bulk precedence · Plain-text fallback</p>
        </div>
        {/* Send */}
        <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
          <button onClick={() => setConfirm(true)} disabled={!subject.trim() || !body.trim() || sending}
            className="flex items-center gap-2 bg-[#E74C3C] hover:bg-[#c0392b] text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-40">
            {sending ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending…</> : <><Send className="w-4 h-4" /> Send Campaign</>}
          </button>
          {preview && <span className="text-xs text-gray-400">Will reach <span className="font-semibold text-[#1F2A44]">{preview.count}</span> members</span>}
        </div>
      </div>

      {/* Confirm dialog */}
      {confirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4" style={{ backgroundColor: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(2px)' }} onClick={() => setConfirm(false)}>
          <div className="bg-white sm:rounded-2xl shadow-2xl w-full sm:max-w-sm p-5 sm:p-6 m-4 sm:m-0" onClick={e => e.stopPropagation()}>
            <div className="w-10 h-10 bg-[#E74C3C]/10 rounded-2xl flex items-center justify-center mb-4"><Send className="w-5 h-5 text-[#E74C3C]" /></div>
            <h3 className="text-lg font-bold text-[#1F2A44] mb-1">Send campaign?</h3>
            <p className="text-sm text-gray-500 mb-1">Subject: <span className="font-semibold text-[#1F2A44]">{subject}</span></p>
            {preview && <p className="text-sm text-gray-500 mb-4">To: <span className="font-semibold text-[#1F2A44]">{preview.count} members</span></p>}
            <div className="flex gap-3">
              <button onClick={send} className="flex-1 flex items-center justify-center gap-2 bg-[#E74C3C] hover:bg-[#c0392b] text-white px-4 py-2.5 rounded-xl text-sm font-semibold">
                <Send className="w-4 h-4" /> Yes, send
              </button>
              <button onClick={() => setConfirm(false)} className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}