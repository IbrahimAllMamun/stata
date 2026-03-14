/**
 * email.controller.js
 *
 * Endpoints:
 *  POST   /admin/email/send              – send bulk campaign
 *  GET    /admin/email/campaigns         – list past campaigns
 *  GET    /admin/email/preview-recipients
 *  GET    /admin/email/verify-smtp
 *  POST   /admin/email/send-individual   – send single email from info@
 *  GET    /admin/email/inbox             – fetch inbox of info@
 */

const prisma = require('../config/database');
const { sendBulkEmail, sendIndividualEmail, verifySmtpConnection, fetchInbox } = require('../utils/emailService');

// ── Recipient filters ─────────────────────────────────────────────────────────
const FILTERS = {
  ALL_APPROVED: { status: 'APPROVED' },
  ALL_NOTIFIABLE: { status: 'APPROVED', notify_events: true },
};

async function getRecipients(filter) {
  const where = FILTERS[filter] || FILTERS.ALL_NOTIFIABLE;
  return prisma.member.findMany({ where, select: { email: true, full_name: true } });
}

// ── Preview recipients ────────────────────────────────────────────────────────
const previewRecipients = async (req, res, next) => {
  try {
    const filter = req.query.filter || 'ALL_NOTIFIABLE';
    if (!FILTERS[filter]) return res.status(400).json({ success: false, message: 'Invalid filter' });
    const members = await getRecipients(filter);
    res.json({
      success: true,
      data: {
        count: members.length,
        filter,
        sample: members.slice(0, 10).map(m => ({ email: m.email, name: m.full_name })),
      },
    });
  } catch (err) { next(err); }
};

// ── Send bulk campaign ────────────────────────────────────────────────────────
const sendCampaign = async (req, res, next) => {
  try {
    const { subject, html_body, text_body, recipient_filter = 'ALL_NOTIFIABLE' } = req.body;
    if (!subject?.trim()) return res.status(400).json({ success: false, message: 'Subject is required' });
    if (!html_body?.trim()) return res.status(400).json({ success: false, message: 'Email body is required' });
    if (!FILTERS[recipient_filter]) return res.status(400).json({ success: false, message: 'Invalid recipient filter' });

    const members = await getRecipients(recipient_filter);
    if (members.length === 0) return res.status(400).json({ success: false, message: 'No recipients match the selected filter' });

    const campaign = await prisma.emailCampaign.create({
      data: {
        subject: subject.trim(),
        html_body,
        text_body: text_body?.trim() || '',
        recipient_filter,
        status: 'DRAFT',
        created_by: req.admin.id,
      },
    });

    res.json({
      success: true,
      message: `Sending to ${members.length} recipient${members.length !== 1 ? 's' : ''}…`,
      data: { campaign_id: campaign.id, recipient_count: members.length },
    });

    sendBulkEmail({
      recipients: members.map(m => m.email),
      subject: subject.trim(),
      htmlBody: html_body,
      textBody: text_body?.trim() || '',
    })
      .then(async ({ sent, failed }) => {
        await prisma.emailCampaign.update({
          where: { id: campaign.id },
          data: {
            status: failed > 0 && sent === 0 ? 'FAILED' : 'SENT',
            sent_count: sent,
            failed_count: failed,
            sent_at: new Date(),
          },
        });
      })
      .catch(async (err) => {
        console.error('[EmailCampaign] Fatal send error:', err.message);
        await prisma.emailCampaign.update({ where: { id: campaign.id }, data: { status: 'FAILED' } });
      });
  } catch (err) { next(err); }
};

// ── List campaigns ────────────────────────────────────────────────────────────
const getCampaigns = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page || '1'));
    const limit = Math.min(50, parseInt(req.query.limit || '20'));
    const [campaigns, total] = await Promise.all([
      prisma.emailCampaign.findMany({
        orderBy: { created_at: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: { admin: { select: { username: true } } },
      }),
      prisma.emailCampaign.count(),
    ]);
    res.json({ success: true, data: campaigns, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } });
  } catch (err) { next(err); }
};

// ── Verify SMTP ───────────────────────────────────────────────────────────────
const verifySMTP = async (req, res, next) => {
  try {
    await verifySmtpConnection();
    res.json({ success: true, message: 'SMTP connection verified successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: `SMTP error: ${err.message}` });
  }
};

// ── Send individual email from info@ ─────────────────────────────────────────
const sendIndividual = async (req, res, next) => {
  try {
    const { to, subject, body, reply_to_message_id } = req.body;
    if (!to?.trim()) return res.status(400).json({ success: false, message: 'Recipient email is required' });
    if (!subject?.trim()) return res.status(400).json({ success: false, message: 'Subject is required' });
    if (!body?.trim()) return res.status(400).json({ success: false, message: 'Body is required' });

    await sendIndividualEmail({ to: to.trim(), subject: subject.trim(), body: body.trim(), replyToMessageId: reply_to_message_id });
    res.json({ success: true, message: `Email sent to ${to.trim()}` });
  } catch (err) { next(err); }
};

// ── Fetch inbox ───────────────────────────────────────────────────────────────
const getInbox = async (req, res, next) => {
  try {
    const limit = Math.min(50, parseInt(req.query.limit || '30'));
    const folder = req.query.folder || 'INBOX';
    const emails = await fetchInbox({ limit, folder });
    res.json({ success: true, data: emails });
  } catch (err) {
    res.status(500).json({ success: false, message: `Inbox fetch failed: ${err.message}` });
  }
};

// ── Inbox unread count (fast IMAP STATUS check) ───────────────────────────────
const getInboxUnreadCount = async (req, res) => {
  try {
    let Imap;
    try { Imap = require('imap'); } catch {
      return res.json({ success: true, data: { count: 0 } });
    }
    const infoEmail = process.env.INFO_EMAIL;
    const infoPass = process.env.INFO_EMAIL_PASS;
    const imapHost = process.env.IMAP_HOST;
    const imapPort = parseInt(process.env.IMAP_PORT || '993');

    if (!infoEmail || !infoPass || !imapHost) {
      return res.json({ success: true, data: { count: 0 } });
    }

    const count = await new Promise((resolve) => {
      const imap = new Imap({
        user: infoEmail, password: infoPass,
        host: imapHost, port: imapPort, tls: true,
        tlsOptions: { rejectUnauthorized: false },
        connTimeout: 6000, authTimeout: 4000,
      });
      imap.once('ready', () => {
        imap.status('INBOX', (err, box) => {
          imap.end();
          if (err || !box) return resolve(0);
          resolve(box.messages.unseen || 0);
        });
      });
      imap.once('error', () => resolve(0));
      imap.connect();
    });

    res.json({ success: true, data: { count } });
  } catch {
    res.json({ success: true, data: { count: 0 } });
  }
};

module.exports = { sendCampaign, getCampaigns, previewRecipients, verifySMTP, sendIndividual, getInbox, getInboxUnreadCount };