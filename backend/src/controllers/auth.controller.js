// src/controllers/auth.controller.js
// Unified member auth: login, magic-link setup, set/change password, role management
const prisma = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sendBulkEmail } = require('../utils/emailService');

const FRONTEND_URL = process.env.FRONTEND_URL || 'https://stataisrt.org';
const TOKEN_EXPIRES_HOURS = 24;

// ── helpers ────────────────────────────────────────────────────────────────────

function signToken(member) {
  return jwt.sign(
    {
      id: member.id,
      email: member.email,
      role: member.role,      // "member" | "mod" | "admin"
      status: member.status,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

// FIXED: Added missing fields that frontend expects
function memberPublic(m) {
  return {
    id: m.id,
    email: m.email,
    full_name: m.full_name,
    batch: m.batch,
    photo_url: m.photo_url,
    status: m.status,
    role: m.role,
    must_change_password: m.must_change_password,
    has_password: !!m.password,
    // ── Profile fields (for MemberAccount.tsx) ────
    phone_number: m.phone_number,
    alternative_phone: m.alternative_phone,
    job_title: m.job_title,
    organisation: m.organisation,
    organisation_address: m.organisation_address,
    notify_events: m.notify_events,
    blood_group: m.blood_group,
    created_at: m.created_at,
  };
}

// ── POST /api/auth/login ───────────────────────────────────────────────────────
const memberLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ success: false, message: 'Email and password are required.' });

    const member = await prisma.member.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!member)
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });

    if (member.status === 'PENDING')
      return res.status(403).json({
        success: false,
        message: 'Your membership is pending approval. Please wait for admin approval.',
      });

    if (member.status === 'ARCHIVED')
      return res.status(403).json({
        success: false,
        message: 'Your account has been archived. Please contact an admin.',
      });

    if (!member.password)
      return res.status(401).json({
        success: false,
        message: 'You have not set a password yet. Use "Forgot Password / First Time Login" to get a setup link.',
        needsSetup: true,
      });

    const valid = await bcrypt.compare(password, member.password);
    if (!valid)
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });

    const token = signToken(member);
    res.json({
      success: true,
      message: 'Login successful.',
      data: { token, member: memberPublic(member) },
    });
  } catch (err) { next(err); }
};

// ── POST /api/auth/request-setup ──────────────────────────────────────────────
const requestSetup = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email)
      return res.status(400).json({ success: false, message: 'Email is required.' });

    const member = await prisma.member.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    // Always 200 — don't leak whether email is registered
    if (!member || member.status === 'PENDING' || member.status === 'ARCHIVED') {
      return res.json({
        success: true,
        message: 'If this email belongs to an approved member, a setup link has been sent.',
      });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + TOKEN_EXPIRES_HOURS * 60 * 60 * 1000);

    await prisma.member.update({
      where: { id: member.id },
      data: { reset_token: token, reset_token_expires: expires },
    });

    const link = `${FRONTEND_URL}/set-password?token=${token}`;
    const isFirstTime = !member.password;

    await sendBulkEmail({
      recipients: [member.email],
      subject: isFirstTime ? 'Set up your STATA account password' : 'Reset your STATA password',
      htmlBody: buildEmailHtml(member.full_name, link, isFirstTime, false),
      textBody: buildEmailText(member.full_name, link, isFirstTime),
    });

    res.json({ success: true, message: 'If this email belongs to an approved member, a setup link has been sent.' });
  } catch (err) { next(err); }
};

// ── POST /api/auth/set-password ───────────────────────────────────────────────
const setPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;
    if (!token || !password)
      return res.status(400).json({ success: false, message: 'Token and password are required.' });
    if (password.length < 8)
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters.' });

    const member = await prisma.member.findFirst({
      where: { reset_token: token, reset_token_expires: { gt: new Date() } },
    });

    if (!member)
      return res.status(400).json({
        success: false,
        message: 'This link is invalid or has expired. Please request a new one.',
      });

    const hashed = await bcrypt.hash(password, 12);
    const updated = await prisma.member.update({
      where: { id: member.id },
      data: { password: hashed, reset_token: null, reset_token_expires: null, must_change_password: false },
    });

    const jwtToken = signToken(updated);
    res.json({
      success: true,
      message: 'Password set successfully. You are now logged in.',
      data: { token: jwtToken, member: memberPublic(updated) },
    });
  } catch (err) { next(err); }
};

// ── POST /api/auth/change-password ────────────────────────────────────────────
const changePassword = async (req, res, next) => {
  try {
    const { current_password, new_password } = req.body;
    if (!new_password || new_password.length < 8)
      return res.status(400).json({ success: false, message: 'New password must be at least 8 characters.' });

    const member = await prisma.member.findUnique({ where: { id: req.member.id } });
    if (!member) return res.status(404).json({ success: false, message: 'Member not found.' });

    if (member.password) {
      if (!current_password)
        return res.status(400).json({ success: false, message: 'Current password is required.' });
      const valid = await bcrypt.compare(current_password, member.password);
      if (!valid)
        return res.status(401).json({ success: false, message: 'Current password is incorrect.' });
    }

    const hashed = await bcrypt.hash(new_password, 12);
    await prisma.member.update({
      where: { id: member.id },
      data: { password: hashed, must_change_password: false },
    });

    res.json({ success: true, message: 'Password changed successfully.' });
  } catch (err) { next(err); }
};

// ── GET /api/auth/me ──────────────────────────────────────────────────────────
const getMe = async (req, res, next) => {
  try {
    const member = await prisma.member.findUnique({
      where: { id: req.member.id },
      select: {
        id: true, email: true, full_name: true, batch: true,
        photo_url: true, status: true, role: true,
        must_change_password: true, password: true,
        phone_number: true, alternative_phone: true,
        job_title: true, organisation: true,
        organisation_address: true, notify_events: true,
        blood_group: true, created_at: true,
      },
    });
    if (!member) return res.status(404).json({ success: false, message: 'Member not found.' });
    res.json({ success: true, data: memberPublic(member) });
  } catch (err) { next(err); }
};

// ── Admin: POST /api/admin/members/:id/send-setup-email ───────────────────────
const adminSendSetupEmail = async (req, res, next) => {
  try {
    const { id } = req.params;
    const member = await prisma.member.findUnique({ where: { id } });
    if (!member) return res.status(404).json({ success: false, message: 'Member not found.' });
    if (member.status !== 'APPROVED')
      return res.status(400).json({ success: false, message: 'Member must be approved before sending setup email.' });

    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + TOKEN_EXPIRES_HOURS * 60 * 60 * 1000);

    await prisma.member.update({
      where: { id: member.id },
      data: { reset_token: token, reset_token_expires: expires },
    });

    const link = `${FRONTEND_URL}/set-password?token=${token}`;
    const isFirstTime = !member.password;

    await sendBulkEmail({
      recipients: [member.email],
      subject: isFirstTime ? 'Your STATA account is approved — set your password' : 'Reset your STATA password',
      htmlBody: buildEmailHtml(member.full_name, link, isFirstTime, true),
      textBody: buildEmailText(member.full_name, link, isFirstTime),
    });

    res.json({ success: true, message: `Setup email sent to ${member.email}.` });
  } catch (err) { next(err); }
};

// ── Admin: PATCH /api/admin/members/:id/role ──────────────────────────────────
const updateMemberRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!['member', 'mod', 'admin'].includes(role))
      return res.status(400).json({ success: false, message: 'Role must be member, mod, or admin.' });

    // Only admins can promote/demote
    if (req.member.role !== 'admin')
      return res.status(403).json({ success: false, message: 'Only admins can change roles.' });

    // Prevent self-demotion from admin
    if (id === req.member.id && role !== 'admin')
      return res.status(400).json({ success: false, message: 'You cannot change your own admin role.' });

    const target = await prisma.member.findUnique({ where: { id } });
    if (!target) return res.status(404).json({ success: false, message: 'Member not found.' });

    // Prevent removing the last admin
    if (target.role === 'admin' && role !== 'admin') {
      const adminCount = await prisma.member.count({ where: { role: 'admin' } });
      if (adminCount <= 1)
        return res.status(400).json({ success: false, message: 'Cannot demote the last admin.' });
    }

    const updated = await prisma.member.update({
      where: { id },
      data: { role },
      select: { id: true, full_name: true, email: true, role: true },
    });

    res.json({ success: true, message: `Role updated to ${role}.`, data: updated });
  } catch (err) { next(err); }
};

// ── Admin: GET /api/admin/staff ───────────────────────────────────────────────
// List all admins and mods from the member table
const listStaff = async (req, res, next) => {
  try {
    const staff = await prisma.member.findMany({
      where: { role: { in: ['admin', 'mod'] } },
      select: {
        id: true, full_name: true, email: true, batch: true,
        photo_url: true, role: true, status: true, created_at: true,
        password: true,
      },
      orderBy: [{ role: 'asc' }, { full_name: 'asc' }],
    });
    const mapped = staff.map(m => ({ ...m, has_password: !!m.password, password: undefined }));
    res.json({ success: true, data: mapped });
  } catch (err) { next(err); }
};

// ── Email templates ───────────────────────────────────────────────────────────
function buildEmailHtml(name, link, isFirstTime, fromAdmin) {
  const heading = isFirstTime
    ? (fromAdmin ? 'Your STATA membership has been approved!' : 'Welcome to STATA!')
    : 'Reset your STATA password';
  const body = isFirstTime
    ? 'Click the button below to set up your account password and get started.'
    : 'We received a request to reset your STATA account password. Click below to set a new one.';
  const btn = isFirstTime ? 'Set Up My Password' : 'Reset My Password';

  return `
    <div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;color:#1F2A44">
      <div style="background:linear-gradient(135deg,#1F2A44,#2F5BEA);padding:32px;border-radius:16px 16px 0 0;text-align:center">
        <h1 style="color:#fff;margin:0;font-size:24px;font-weight:800">STATA</h1>
        <p style="color:rgba(255,255,255,0.7);margin:4px 0 0;font-size:13px">Alumni Association</p>
      </div>
      <div style="background:#fff;padding:32px;border:1px solid #E5E7EB;border-top:none;border-radius:0 0 16px 16px">
        <p style="margin:0 0 8px;font-size:18px;font-weight:700">${heading}</p>
        <p style="margin:0 0 16px">Hi <strong>${name}</strong>,</p>
        <p style="margin:0 0 24px;color:#6B7280">${body}</p>
        <div style="text-align:center;margin:32px 0">
          <a href="${link}" style="background:#2F5BEA;color:#fff;padding:14px 32px;border-radius:12px;text-decoration:none;font-weight:700;font-size:15px;display:inline-block">${btn}</a>
        </div>
        <p style="color:#9CA3AF;font-size:12px;text-align:center">This link expires in ${TOKEN_EXPIRES_HOURS} hours. If you did not request this, ignore this email.</p>
        <p style="color:#9CA3AF;font-size:11px;text-align:center;word-break:break-all;margin-top:8px">${link}</p>
      </div>
    </div>`;
}

function buildEmailText(name, link, isFirstTime) {
  return `Hi ${name},\n\n${isFirstTime ? 'Set up your STATA account password' : 'Reset your STATA password'} using this link:\n\n${link}\n\nThis link expires in ${TOKEN_EXPIRES_HOURS} hours.\n\n— STATA`;
}

module.exports = {
  memberLogin, requestSetup, setPassword,
  changePassword, getMe,
  adminSendSetupEmail, updateMemberRole, listStaff,
};
