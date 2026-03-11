// src/pages/admin/EmailCampaigns.tsx
import { useEffect, useState, useCallback } from 'react';
import {
  Mail, Send, Users, Clock, CheckCircle2, XCircle,
  ChevronDown, Eye, AlertCircle, Wifi, WifiOff,
  RefreshCw, Filter,
} from 'lucide-react';
import { adminApi } from '../../lib/api';
import MarkdownEditor from '../../components/MarkdownEditor';

// ── Types ────────────────────────────────────────────────────────────────────
type RecipientFilter = 'ALL_NOTIFIABLE' | 'ALL_APPROVED';
type CampaignStatus = 'DRAFT' | 'SENT' | 'FAILED';

interface Campaign {
  id: string;
  subject: string;
  html_body: string;
  text_body: string;
  recipient_filter: RecipientFilter;
  status: CampaignStatus;
  sent_count: number;
  failed_count: number;
  sent_at: string | null;
  created_at: string;
  admin: { username: string };
}

interface RecipientPreview {
  count: number;
  filter: string;
  sample: { email: string; name: string }[];
}

// ── Markdown → email-safe HTML ───────────────────────────────────────────────
// All styles are inline because email clients strip <style> tags.
function markdownToEmailHtml(md: string): string {
  const lines = md.split('\n');
  const out: string[] = [];
  let i = 0;

  const inline = (text: string) =>
    text
      .replace(/\*\*(.+?)\*\*/g, '<strong style="font-weight:700">$1</strong>')
      .replace(/\*(.+?)\*/g, '<em style="font-style:italic">$1</em>')
      .replace(/`([^`]+)`/g, '<code style="background:#f3f4f6;padding:2px 6px;border-radius:4px;font-family:monospace;font-size:0.9em">$1</code>')
      .replace(/~~(.+?)~~/g, '<del>$1</del>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" style="color:#2F5BEA;text-decoration:underline">$1</a>');

  while (i < lines.length) {
    const line = lines[i];

    if (line.trim() === '') { i++; continue; }

    const h = line.match(/^(#{1,6})\s+(.+)$/);
    if (h) {
      const level = h[1].length;
      const sizes: Record<number, string> = { 1: '28px', 2: '22px', 3: '18px', 4: '16px', 5: '14px', 6: '13px' };
      out.push(`<h${level} style="font-size:${sizes[level]};font-weight:700;color:#1F2A44;margin:24px 0 8px">${inline(h[2])}</h${level}>`);
      i++; continue;
    }

    if (/^[-*_]{3,}$/.test(line.trim())) {
      out.push('<hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0" />');
      i++; continue;
    }

    if (line.startsWith('> ')) {
      const qLines: string[] = [];
      while (i < lines.length && lines[i].startsWith('> ')) { qLines.push(lines[i].slice(2)); i++; }
      out.push(`<blockquote style="border-left:4px solid #2F5BEA;padding:8px 16px;margin:16px 0;color:#4b5563;background:#f0f4ff;border-radius:0 8px 8px 0">${qLines.map(l => `<p style="margin:4px 0">${inline(l)}</p>`).join('')}</blockquote>`);
      continue;
    }

    if (/^[-*+]\s/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*+]\s/.test(lines[i])) {
        items.push(`<li style="margin:4px 0;padding-left:4px">${inline(lines[i].replace(/^[-*+]\s/, ''))}</li>`);
        i++;
      }
      out.push(`<ul style="margin:12px 0;padding-left:20px;color:#374151">${items.join('')}</ul>`);
      continue;
    }

    if (/^\d+\.\s/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        items.push(`<li style="margin:4px 0;padding-left:4px">${inline(lines[i].replace(/^\d+\.\s/, ''))}</li>`);
        i++;
      }
      out.push(`<ol style="margin:12px 0;padding-left:20px;color:#374151">${items.join('')}</ol>`);
      continue;
    }

    // Paragraph
    const paraLines: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() !== '' &&
      !lines[i].match(/^#{1,6}\s/) &&
      !lines[i].startsWith('> ') &&
      !lines[i].startsWith('```') &&
      !/^[-*+]\s/.test(lines[i]) &&
      !/^\d+\.\s/.test(lines[i]) &&
      !/^[-*_]{3,}$/.test(lines[i].trim())
    ) { paraLines.push(lines[i]); i++; }

    if (paraLines.length > 0) {
      out.push(`<p style="margin:12px 0;color:#374151;line-height:1.7">${paraLines.map(l => inline(l)).join('<br />')}</p>`);
    } else {
      out.push(`<p style="margin:12px 0;color:#374151;line-height:1.7">${inline(line)}</p>`);
      i++;
    }
  }

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f7fa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f7fa;padding:32px 16px">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06)">
        <tr><td style="background:linear-gradient(135deg,#1F2A44,#2F5BEA);padding:28px 32px;text-align:center">
          <img src="${import.meta.env.VITE_FRONTEND_URL || window.location.origin}/logoFull.png" alt="STATA" width="200" height="67" style="display:block;margin:0 auto" />
        </td></tr>
        <tr><td style="padding:32px">
          ${out.join('\n')}
        </td></tr>
        <tr><td style="padding:20px 32px;background:#f9fafb;border-top:1px solid #e5e7eb">
          <p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.6">
            You received this email as a member of STATA.<br>
            To stop receiving these emails, update your notification preference in your member profile.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function markdownToPlainText(md: string): string {
  return md
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/~~(.+?)~~/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/^[-*+]\s/gm, '• ')
    .replace(/^>\s/gm, '  ')
    .replace(/^[-*_]{3,}$/gm, '─────────────────')
    .trim();
}

// ── FILTER labels ─────────────────────────────────────────────────────────────
const FILTER_LABELS: Record<RecipientFilter, string> = {
  ALL_NOTIFIABLE: 'Subscribed members only (notify_events = Yes)',
  ALL_APPROVED: 'All approved members',
};

// ── Status badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: CampaignStatus }) {
  const map: Record<CampaignStatus, string> = {
    DRAFT: 'bg-gray-100 text-gray-600 border-gray-200',
    SENT: 'bg-green-100 text-green-700 border-green-200',
    FAILED: 'bg-red-100 text-red-700 border-red-200',
  };
  const icons: Record<CampaignStatus, React.ReactNode> = {
    DRAFT: <Clock className="w-3 h-3" />,
    SENT: <CheckCircle2 className="w-3 h-3" />,
    FAILED: <XCircle className="w-3 h-3" />,
  };
  return (
    <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-semibold border ${map[status]}`}>
      {icons[status]} {status}
    </span>
  );
}

// ── Campaign history card ─────────────────────────────────────────────────────
function CampaignCard({ c }: { c: Campaign }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="flex items-start gap-4 px-5 py-4">
        <div className="w-10 h-10 rounded-xl bg-[#2F5BEA]/10 flex items-center justify-center flex-shrink-0">
          <Mail className="w-5 h-5 text-[#2F5BEA]" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <p className="font-semibold text-[#1F2A44] truncate">{c.subject}</p>
            <StatusBadge status={c.status} />
          </div>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <span className="text-xs text-gray-400">
              {c.sent_at
                ? new Date(c.sent_at).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                : new Date(c.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
            <span className="text-xs text-gray-300">·</span>
            <span className="text-xs text-gray-400">by {c.admin.username}</span>
            {c.status === 'SENT' && (
              <>
                <span className="text-xs text-gray-300">·</span>
                <span className="text-xs text-green-600 font-semibold">{c.sent_count} sent</span>
                {c.failed_count > 0 && <span className="text-xs text-red-500 font-semibold">{c.failed_count} failed</span>}
              </>
            )}
            <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{FILTER_LABELS[c.recipient_filter]}</span>
          </div>
        </div>
      </div>
      <div className="px-5 pb-4">
        <button
          onClick={() => setExpanded(v => !v)}
          className="flex items-center gap-1 text-xs text-[#2F5BEA] hover:text-[#1a3fc7] font-semibold transition-colors"
        >
          <Eye className="w-3.5 h-3.5" />
          {expanded ? 'Hide' : 'Preview'} email
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </button>
        {expanded && (
          <div className="mt-3 border border-gray-200 rounded-xl overflow-hidden">
            <div className="bg-gray-50 px-3 py-1.5 border-b border-gray-200 text-xs text-gray-400 font-medium">Rendered Email</div>
            <div className="p-1 bg-gray-100">
              <iframe srcDoc={c.html_body} title="Email preview" className="w-full rounded-lg bg-white" style={{ height: '400px', border: 'none' }} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function EmailCampaigns() {
  const [tab, setTab] = useState<'compose' | 'history'>('compose');
  const [subject, setSubject] = useState('');
  const [markdownBody, setMarkdownBody] = useState('');
  const [filter, setFilter] = useState<RecipientFilter>('ALL_NOTIFIABLE');
  const [preview, setPreview] = useState<RecipientPreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [smtpStatus, setSmtpStatus] = useState<'unknown' | 'ok' | 'error'>('unknown');
  const [smtpChecking, setSmtpChecking] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 4000);
  };

  const loadPreview = useCallback(async (f: RecipientFilter) => {
    setPreviewLoading(true);
    try { const res = await adminApi.previewEmailRecipients(f); setPreview(res.data); }
    catch { setPreview(null); }
    finally { setPreviewLoading(false); }
  }, []);

  useEffect(() => { loadPreview(filter); }, [filter, loadPreview]);

  const loadHistory = async () => {
    setHistoryLoading(true);
    try { const res = await adminApi.getEmailCampaigns(); setCampaigns(res.data as Campaign[]); }
    catch { showToast('Failed to load campaign history', false); }
    finally { setHistoryLoading(false); }
  };

  useEffect(() => { if (tab === 'history') loadHistory(); }, [tab]);

  const checkSmtp = async () => {
    setSmtpChecking(true);
    try { await adminApi.verifySmtp(); setSmtpStatus('ok'); showToast('SMTP connected successfully ✓'); }
    catch (err: unknown) { setSmtpStatus('error'); showToast(err instanceof Error ? err.message : 'SMTP check failed', false); }
    finally { setSmtpChecking(false); }
  };

  const handleSend = async () => {
    if (!subject.trim() || !markdownBody.trim()) { showToast('Subject and body are required', false); return; }
    setSending(true);
    setConfirmOpen(false);
    try {
      const res = await adminApi.sendEmailCampaign({
        subject,
        html_body: markdownToEmailHtml(markdownBody),
        text_body: markdownToPlainText(markdownBody),
        recipient_filter: filter,
      });
      showToast(res.message || 'Email campaign queued!');
      setSubject(''); setMarkdownBody(''); setFilter('ALL_NOTIFIABLE');
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Send failed', false);
    } finally { setSending(false); }
  };

  const canSend = subject.trim().length > 0 && markdownBody.trim().length > 0 && !sending;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#F5F7FA] py-8 px-4">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold text-[#1F2A44] mb-1">Email Campaigns</h1>
            <p className="text-gray-500 text-sm">Compose in Markdown and send to members in one click</p>
          </div>
          <button
            onClick={checkSmtp}
            disabled={smtpChecking}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all shadow-sm ${smtpStatus === 'ok' ? 'bg-green-50 border-green-200 text-green-700' :
                smtpStatus === 'error' ? 'bg-red-50 border-red-200 text-red-600' :
                  'bg-white border-gray-200 text-gray-600 hover:border-[#2F5BEA] hover:text-[#2F5BEA]'
              }`}
          >
            {smtpChecking
              ? <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              : smtpStatus === 'error' ? <WifiOff className="w-4 h-4" /> : <Wifi className="w-4 h-4" />
            }
            {smtpStatus === 'ok' ? 'SMTP OK' : smtpStatus === 'error' ? 'SMTP Error' : 'Test SMTP'}
          </button>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6">
          <div className="flex border-b border-gray-100">
            {([
              { key: 'compose', label: 'Compose', icon: Mail },
              { key: 'history', label: 'Campaign History', icon: Clock },
            ] as const).map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`flex items-center gap-2 flex-1 py-3.5 text-sm font-semibold border-b-2 transition-colors ${tab === key ? 'border-[#2F5BEA] text-[#2F5BEA]' : 'border-transparent text-gray-400 hover:text-gray-600'
                  }`}
              >
                <Icon className="w-4 h-4" /> {label}
              </button>
            ))}
          </div>

          {tab === 'compose' && (
            <div className="p-6 space-y-6">

              {/* Recipients */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  <Filter className="w-3.5 h-3.5 inline mr-1" /> Recipients
                </label>
                <div className="relative">
                  <select
                    value={filter}
                    onChange={e => setFilter(e.target.value as RecipientFilter)}
                    className="w-full appearance-none px-4 py-3 border border-gray-200 rounded-xl text-sm text-[#1F2A44] focus:ring-2 focus:ring-[#2F5BEA] focus:border-transparent outline-none bg-white pr-10"
                  >
                    <option value="ALL_NOTIFIABLE">Subscribed members only (notify_events = Yes)</option>
                    <option value="ALL_APPROVED">All approved members</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
                <div className="mt-2">
                  {previewLoading ? (
                    <div className="flex items-center gap-1.5 text-xs text-gray-400">
                      <div className="w-3.5 h-3.5 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" /> Counting…
                    </div>
                  ) : preview ? (
                    <div className="text-xs text-gray-500">
                      <span className="inline-flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-[#2F5BEA]" />
                        <span className="font-semibold text-[#2F5BEA]">{preview.count}</span> recipient{preview.count !== 1 ? 's' : ''} will receive this email
                      </span>
                      {preview.sample.length > 0 && (
                        <span className="text-gray-400 ml-1">
                          — e.g. {preview.sample.slice(0, 3).map(s => s.name).join(', ')}
                          {preview.count > 3 ? ` +${preview.count - 3} more` : ''}
                        </span>
                      )}
                    </div>
                  ) : null}
                </div>
              </div>

              {/* Subject */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Subject Line</label>
                <input
                  type="text"
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  placeholder="e.g. STATA Annual Reunion 2026 — Save the Date!"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#2F5BEA] focus:border-transparent outline-none"
                />
                <p className="mt-1 text-xs text-gray-400">Keep under 60 characters for best mobile display</p>
              </div>

              {/* Markdown editor */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Email Body</label>
                <MarkdownEditor
                  value={markdownBody}
                  onChange={setMarkdownBody}
                  placeholder={`Dear STATA members,\n\nWe are thrilled to announce our **Annual Reunion 2026**!\n\n## Event Details\n\n- **Date:** 15 April 2026\n- **Venue:** STATA Hall, Dhaka\n- **Time:** 6:00 PM onwards\n\nWe look forward to seeing you there.\n\nBest regards,\nSTATA Committee`}
                  minRows={16}
                />
                <p className="mt-2 text-xs text-gray-400">
                  Markdown is automatically converted to a styled HTML email with STATA branding. A plain-text fallback is also sent.
                </p>
              </div>

              {/* Anti-spam notice */}
              <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-xl p-4">
                <AlertCircle className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-blue-700">
                  <p className="font-semibold mb-0.5">Deliverability best practices applied automatically</p>
                  <p>Sent in batches · List-Unsubscribe headers · Bulk precedence · Plain-text fallback</p>
                </div>
              </div>

              {/* Send */}
              <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
                <button
                  onClick={() => setConfirmOpen(true)}
                  disabled={!canSend}
                  className="flex items-center gap-2 bg-[#2F5BEA] hover:bg-[#1a3fc7] text-white px-6 py-3 rounded-xl text-sm font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
                >
                  {sending
                    ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Sending…</>
                    : <><Send className="w-4 h-4" /> Send Campaign</>
                  }
                </button>
                {preview && (
                  <span className="text-sm text-gray-400">
                    Will reach <span className="font-semibold text-[#1F2A44]">{preview.count}</span> member{preview.count !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
            </div>
          )}

          {tab === 'history' && (
            <div className="p-6">
              <div className="flex items-center justify-between mb-5">
                <p className="text-sm text-gray-500">{campaigns.length} campaign{campaigns.length !== 1 ? 's' : ''}</p>
                <button onClick={loadHistory} disabled={historyLoading} className="flex items-center gap-1.5 text-sm text-[#2F5BEA] font-semibold">
                  <RefreshCw className={`w-4 h-4 ${historyLoading ? 'animate-spin' : ''}`} /> Refresh
                </button>
              </div>
              {historyLoading ? (
                <div className="text-center py-16"><div className="inline-block w-8 h-8 border-4 border-[#2F5BEA] border-t-transparent rounded-full animate-spin" /></div>
              ) : campaigns.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                  <Mail className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm font-medium">No campaigns sent yet</p>
                  <p className="text-xs mt-1">Use the Compose tab to send your first email</p>
                </div>
              ) : (
                <div className="space-y-4">{campaigns.map(c => <CampaignCard key={c.id} c={c} />)}</div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Confirm dialog */}
      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(2px)' }} onClick={() => setConfirmOpen(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-12 bg-[#2F5BEA]/10 rounded-2xl flex items-center justify-center mb-4">
              <Send className="w-6 h-6 text-[#2F5BEA]" />
            </div>
            <h3 className="text-lg font-bold text-[#1F2A44] mb-1">Send this campaign?</h3>
            <p className="text-sm text-gray-500 mb-1">Subject: <span className="font-semibold text-[#1F2A44]">{subject}</span></p>
            {preview && (
              <p className="text-sm text-gray-500 mb-5">
                Recipients: <span className="font-semibold text-[#1F2A44]">{preview.count} member{preview.count !== 1 ? 's' : ''}</span> ({FILTER_LABELS[filter]})
              </p>
            )}
            <div className="flex gap-3">
              <button onClick={handleSend} className="flex-1 flex items-center justify-center gap-2 bg-[#2F5BEA] hover:bg-[#1a3fc7] text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors">
                <Send className="w-4 h-4" /> Yes, send now
              </button>
              <button onClick={() => setConfirmOpen(false)} className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className={`fixed bottom-6 right-6 px-5 py-3 rounded-xl shadow-lg text-white text-sm font-medium z-50 ${toast.ok ? 'bg-[#2ECC71]' : 'bg-red-500'}`}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}
