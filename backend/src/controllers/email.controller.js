/**
 * email.controller.js
 *
 * Endpoints:
 *  POST   /admin/email/send        – compose & send immediately
 *  GET    /admin/email/campaigns   – list past campaigns
 *  GET    /admin/email/preview-recipients – count / list who would receive
 *  GET    /admin/email/verify-smtp – test SMTP connectivity
 */

const prisma = require('../config/database');
const { sendBulkEmail, verifySmtpConnection } = require('../utils/emailService');

// ── Recipient filters ─────────────────────────────────────────────────────────
//  ALL_APPROVED     – every approved member
//  ALL_NOTIFIABLE   – approved members with notify_events = true
const FILTERS = {
  ALL_APPROVED:   { status: 'APPROVED' },
  ALL_NOTIFIABLE: { status: 'APPROVED', notify_events: true },
};

async function getRecipients(filter) {
  const where = FILTERS[filter] || FILTERS.ALL_NOTIFIABLE;
  const members = await prisma.member.findMany({
    where,
    select: { email: true, full_name: true },
  });
  return members;
}

// ── Preview recipients (GET /admin/email/preview-recipients) ──────────────────
const previewRecipients = async (req, res, next) => {
  try {
    const filter = req.query.filter || 'ALL_NOTIFIABLE';
    if (!FILTERS[filter]) {
      return res.status(400).json({ success: false, message: 'Invalid filter' });
    }
    const members = await getRecipients(filter);
    res.json({
      success: true,
      data: {
        count: members.length,
        filter,
        // return first 10 as sample so admin can see who will get the email
        sample: members.slice(0, 10).map(m => ({ email: m.email, name: m.full_name })),
      },
    });
  } catch (err) {
    next(err);
  }
};

// ── Send campaign (POST /admin/email/send) ────────────────────────────────────
const sendCampaign = async (req, res, next) => {
  try {
    const { subject, html_body, text_body, recipient_filter = 'ALL_NOTIFIABLE' } = req.body;

    if (!subject?.trim()) {
      return res.status(400).json({ success: false, message: 'Subject is required' });
    }
    if (!html_body?.trim()) {
      return res.status(400).json({ success: false, message: 'Email body is required' });
    }
    if (!FILTERS[recipient_filter]) {
      return res.status(400).json({ success: false, message: 'Invalid recipient filter' });
    }

    const plainText = text_body?.trim() || stripHtml(html_body);

    const members = await getRecipients(recipient_filter);
    if (members.length === 0) {
      return res.status(400).json({ success: false, message: 'No recipients match the selected filter' });
    }

    // Create a campaign record (DRAFT) before sending so we have an ID
    const campaign = await prisma.emailCampaign.create({
      data: {
        subject: subject.trim(),
        html_body,
        text_body: plainText,
        recipient_filter,
        status: 'DRAFT',
        created_by: req.admin.id,
      },
    });

    // Respond early — let the send happen async so the HTTP request doesn't time out
    res.json({
      success: true,
      message: `Sending to ${members.length} recipient${members.length !== 1 ? 's' : ''}…`,
      data: { campaign_id: campaign.id, recipient_count: members.length },
    });

    // ── Fire-and-forget send ──────────────────────────────────────────────────
    const emails = members.map(m => m.email);

    sendBulkEmail({
      recipients: emails,
      subject: subject.trim(),
      htmlBody: html_body,
      textBody: plainText,
    })
      .then(async ({ sent, failed }) => {
        await prisma.emailCampaign.update({
          where: { id: campaign.id },
          data: {
            status:      failed > 0 && sent === 0 ? 'FAILED' : 'SENT',
            sent_count:  sent,
            failed_count: failed,
            sent_at:     new Date(),
          },
        });
      })
      .catch(async (err) => {
        console.error('[EmailCampaign] Fatal send error:', err.message);
        await prisma.emailCampaign.update({
          where: { id: campaign.id },
          data: { status: 'FAILED' },
        });
      });
  } catch (err) {
    next(err);
  }
};

// ── List campaigns (GET /admin/email/campaigns) ───────────────────────────────
const getCampaigns = async (req, res, next) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page  || '1'));
    const limit = Math.min(50, parseInt(req.query.limit || '20'));
    const skip  = (page - 1) * limit;

    const [campaigns, total] = await Promise.all([
      prisma.emailCampaign.findMany({
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
        include: { admin: { select: { username: true } } },
      }),
      prisma.emailCampaign.count(),
    ]);

    res.json({
      success: true,
      data: campaigns,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
};

// ── Verify SMTP (GET /admin/email/verify-smtp) ────────────────────────────────
const verifySMTP = async (req, res, next) => {
  try {
    await verifySmtpConnection();
    res.json({ success: true, message: 'SMTP connection verified successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: `SMTP error: ${err.message}` });
  }
};

// ── Utility: naive HTML → plain text ─────────────────────────────────────────
function stripHtml(html) {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

module.exports = { sendCampaign, getCampaigns, previewRecipients, verifySMTP };
