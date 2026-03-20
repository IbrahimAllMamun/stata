/**
 * initialPassword.controller.js
 *
 * Manages sending initial passwords to legacy members (members who registered
 * before the password system existed and still have password = null).
 *
 * Endpoints:
 *  GET  /admin/initial-passwords/status    – list members without password + dispatch status
 *  POST /admin/initial-passwords/send-all  – generate + send to ALL who never received
 *  POST /admin/initial-passwords/send/:id  – send/resend to ONE member
 */

const prisma = require('../config/database');
const bcrypt = require('bcryptjs');
const { sendBulkEmail } = require('../utils/emailService');

// ── Generate Isrt@XXXX ────────────────────────────────────────────────────────
function generateInitialPassword() {
  const digits = String(Math.floor(1000 + Math.random() * 9000));
  return `Isrt@${digits}`;
}

// ── Email HTML ────────────────────────────────────────────────────────────────
function buildInitialPasswordEmailHtml(name, password) {
  const siteUrl = process.env.FRONTEND_URL || 'https://stataisrt.org';
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f5f7fa;font-family:system-ui,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f7fa;padding:32px 16px">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0"
           style="max-width:600px;width:100%;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">
      <!-- Header -->
      <tr>
        <td style="background:linear-gradient(135deg,#1F2A44,#2F5BEA);padding:28px 32px;text-align:center">
          <img src="${siteUrl}/logoFull.png" alt="STATA" width="200"
               style="display:block;margin:0 auto"/>
        </td>
      </tr>
      <!-- Body -->
      <tr>
        <td style="padding:36px 32px">
          <p style="margin:0 0 6px;font-size:20px;font-weight:800;color:#1F2A44">
            Your STATA Login Password
          </p>
          <p style="margin:0 0 20px;color:#374151;font-size:15px">
            Hi <strong>${name}</strong>,
          </p>
          <p style="margin:0 0 16px;color:#374151;line-height:1.75;font-size:14px">
            STATA now has a member portal where you can log in, update your profile,
            submit posts, and stay connected with your fellow alumni. We've generated
            an <strong>initial password</strong> for your account so you can get started right away.
          </p>

          <!-- Password box -->
          <div style="background:#F0F4FF;border:2px dashed #2F5BEA;border-radius:14px;
                      padding:22px 28px;text-align:center;margin:28px 0">
            <p style="margin:0 0 8px;font-size:11px;color:#6B7280;text-transform:uppercase;
                      letter-spacing:0.08em;font-weight:700">Your Initial Password</p>
            <p style="margin:0;font-size:32px;font-weight:800;color:#1F2A44;
                      letter-spacing:0.1em;font-family:monospace">${password}</p>
          </div>

          <!-- Warning banner -->
          <div style="background:#FFFBEB;border:1px solid #FCD34D;border-radius:10px;
                      padding:14px 18px;margin:0 0 24px">
            <p style="margin:0;font-size:13px;color:#92400E;line-height:1.7">
              ⚠️ <strong>We recommend changing this password after your first login.</strong><br>
              Go to <em>My Account → Change Password</em> once you're signed in.
              You are not required to do it immediately, but it's a good practice.
            </p>
          </div>

          <p style="margin:0 0 16px;color:#374151;line-height:1.75;font-size:14px">
            To sign in, click the button below or visit
            <a href="${siteUrl}/login" style="color:#2F5BEA;font-weight:600">${siteUrl}/login</a>
            and use your registered email address with the password above.
          </p>

          <!-- CTA Button -->
          <div style="text-align:center;margin:28px 0">
            <a href="${siteUrl}/login"
               style="background:#2F5BEA;color:#fff;padding:14px 36px;border-radius:12px;
                      text-decoration:none;font-weight:700;font-size:15px;display:inline-block;
                      box-shadow:0 4px 12px rgba(47,91,234,0.35)">
              Sign In to STATA
            </a>
          </div>

          <!-- Spam note -->
          <div style="background:#F9FAFB;border:1px solid #E5E7EB;border-radius:10px;
                      padding:14px 18px;margin:0 0 8px">
            <p style="margin:0;font-size:13px;color:#6B7280;line-height:1.7">
              📬 <strong>Can't find this email?</strong> Check your <strong>spam</strong> or
              <strong>junk folder</strong> — it may have been filtered there. Mark it as
              "Not Spam" to receive future STATA emails in your inbox.
            </p>
          </div>

          <p style="margin:16px 0 0;font-size:13px;color:#9CA3AF;line-height:1.7">
            If you have trouble signing in, contact us at
            <a href="mailto:info@stataisrt.org" style="color:#2F5BEA">info@stataisrt.org</a>.
          </p>
        </td>
      </tr>
      <!-- Footer -->
      <tr>
        <td style="padding:16px 32px;background:#F9FAFB;border-top:1px solid #E5E7EB">
          <p style="margin:0;font-size:11px;color:#9CA3AF;text-align:center;line-height:1.6">
            You are receiving this email because you are a registered member of<br>
            <strong>STATA — Sylhet Telecommunication Alumni &amp; Telecom Association</strong>
          </p>
        </td>
      </tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;
}

function buildInitialPasswordEmailText(name, password) {
  const siteUrl = process.env.FRONTEND_URL || 'https://stataisrt.org';
  return `Hi ${name},

STATA now has a member portal! We've generated an initial password for your account.

Your Initial Password:  ${password}

Please change this password after your first login:
  My Account → Change Password

Sign in at: ${siteUrl}/login

If you don't see this email in your inbox, please check your spam / junk folder.

Questions? Contact us at info@stataisrt.org

— STATA`;
}

// ── GET /admin/initial-passwords/status ──────────────────────────────────────
const getStatus = async (req, res, next) => {
  try {
    const members = await prisma.member.findMany({
      where: { status: 'APPROVED', password: null },
      select: {
        id: true,
        full_name: true,
        email: true,
        batch: true,
        created_at: true,
        initial_password_dispatch: {
          select: {
            sent_at: true,
            delivered: true,
            last_error: true,
            updated_at: true,
          },
        },
      },
      orderBy: [{ batch: 'asc' }, { full_name: 'asc' }],
    });

    const data = members.map(m => ({
      id: m.id,
      full_name: m.full_name,
      email: m.email,
      batch: m.batch,
      created_at: m.created_at,
      dispatch: m.initial_password_dispatch || null,
    }));

    const total = data.length;
    const sent = data.filter(m => m.dispatch?.delivered).length;
    const failed = data.filter(m => m.dispatch && !m.dispatch.delivered).length;
    const pending = data.filter(m => !m.dispatch).length;

    res.json({
      success: true,
      data: {
        members: data,
        summary: { total, sent, failed, pending },
      },
    });
  } catch (err) { next(err); }
};

// ── Shared: dispatch password to a single member ──────────────────────────────
async function dispatchPasswordToMember(member) {
  // Get or create a dispatch record; reuse existing password if present
  let dispatch = await prisma.initialPasswordDispatch.findUnique({
    where: { member_id: member.id },
  });

  const plainPassword = dispatch?.password || generateInitialPassword();

  if (!dispatch) {
    dispatch = await prisma.initialPasswordDispatch.create({
      data: { member_id: member.id, password: plainPassword, delivered: false },
    });
  }

  // Always (re-)hash and save password — ensures it's set on member
  const hashed = await bcrypt.hash(plainPassword, 12);
  await prisma.member.update({
    where: { id: member.id },
    data: { password: hashed },
  });

  try {
    await sendBulkEmail({
      recipients: [member.email],
      subject: 'Your STATA Login Password',
      htmlBody: buildInitialPasswordEmailHtml(member.full_name, plainPassword),
      textBody: buildInitialPasswordEmailText(member.full_name, plainPassword),
    });

    await prisma.initialPasswordDispatch.update({
      where: { id: dispatch.id },
      data: { delivered: true, sent_at: new Date(), last_error: null },
    });

    return { success: true };
  } catch (err) {
    await prisma.initialPasswordDispatch.update({
      where: { id: dispatch.id },
      data: { delivered: false, sent_at: new Date(), last_error: err.message },
    });
    // Revert password on member since email failed
    await prisma.member.update({
      where: { id: member.id },
      data: { password: null },
    });
    return { success: false, error: err.message };
  }
}

// ── POST /admin/initial-passwords/send-all ────────────────────────────────────
const sendAll = async (req, res, next) => {
  try {
    const members = await prisma.member.findMany({
      where: {
        status: 'APPROVED',
        password: null,
        OR: [
          { initial_password_dispatch: null },
          { initial_password_dispatch: { delivered: false } },
        ],
      },
      select: { id: true, full_name: true, email: true },
    });

    if (members.length === 0) {
      return res.json({
        success: true,
        message: 'All eligible members have already been sent their initial password.',
        data: { queued: 0 },
      });
    }

    // Respond immediately so the admin isn't left waiting
    res.json({
      success: true,
      message: `Sending initial passwords to ${members.length} member${members.length !== 1 ? 's' : ''}…`,
      data: { queued: members.length },
    });

    // Background processing
    (async () => {
      let sent = 0, failed = 0;
      for (const member of members) {
        const result = await dispatchPasswordToMember(member);
        if (result.success) sent++; else failed++;
      }
      console.log(`[InitialPassword] Bulk complete — sent: ${sent}, failed: ${failed}`);
    })();
  } catch (err) { next(err); }
};

// ── POST /admin/initial-passwords/send/:id ────────────────────────────────────
const sendOne = async (req, res, next) => {
  try {
    const { id } = req.params;

    const member = await prisma.member.findUnique({
      where: { id },
      select: { id: true, full_name: true, email: true, status: true, password: true },
    });

    if (!member) return res.status(404).json({ success: false, message: 'Member not found.' });
    if (member.status !== 'APPROVED')
      return res.status(400).json({ success: false, message: 'Member must be approved to receive a password email.' });

    const result = await dispatchPasswordToMember(member);

    if (result.success) {
      res.json({ success: true, message: `Initial password sent to ${member.email}.` });
    } else {
      res.status(500).json({ success: false, message: `Failed to send email: ${result.error}` });
    }
  } catch (err) { next(err); }
};

module.exports = { getStatus, sendAll, sendOne };
