// src/controllers/admin.controller.js
const prisma = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const login = async (req, res, next) => {
  try {
    const { username, password } = req.body;
    const admin = await prisma.admin.findUnique({ where: { username } });
    if (!admin) return res.status(401).json({ success: false, message: 'Invalid credentials' });
    const valid = await bcrypt.compare(password, admin.password);
    if (!valid) return res.status(401).json({ success: false, message: 'Invalid credentials' });
    const token = jwt.sign(
      { id: admin.id, username: admin.username, role: admin.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
    res.json({ success: true, message: 'Login successful', data: { token, admin: { id: admin.id, username: admin.username, role: admin.role } } });
  } catch (err) { next(err); }
};

const getDashboardStats = async (req, res, next) => {
  try {
    const [totalMembers, pendingMembers, totalCommittees, totalPosts, totalEvents, upcomingEvents, unreadMessages] =
      await Promise.all([
        prisma.member.count({ where: { status: 'APPROVED' } }),
        prisma.member.count({ where: { status: 'PENDING' } }),
        prisma.committee.count(),
        prisma.post.count(),
        prisma.event.count(),
        prisma.event.count({ where: { event_date: { gte: new Date() } } }),
        prisma.contactMessage.count({ where: { status: 'UNREAD' } }),
      ]);
    res.json({ success: true, data: { total_members: totalMembers, pending_members: pendingMembers, total_committees: totalCommittees, total_posts: totalPosts, total_events: totalEvents, upcoming_events: upcomingEvents, past_events: totalEvents - upcomingEvents, unread_messages: unreadMessages } });
  } catch (err) { next(err); }
};

// ── List all admins and moderators ────────────────────────────────────────────
const listAdmins = async (req, res, next) => {
  try {
    const admins = await prisma.admin.findMany({
      select: { id: true, username: true, role: true, created_at: true },
      orderBy: [{ role: 'asc' }, { created_at: 'asc' }],
    });
    res.json({ success: true, data: admins });
  } catch (err) { next(err); }
};

// ── Create admin or moderator ─────────────────────────────────────────────────
const createAccount = async (req, res, next) => {
  try {
    const { username, password, role = 'moderator' } = req.body;

    if (!username?.trim()) return res.status(400).json({ success: false, message: 'Username is required' });
    if (!password || password.length < 8) return res.status(400).json({ success: false, message: 'Password must be at least 8 characters' });
    if (!['admin', 'moderator'].includes(role)) return res.status(400).json({ success: false, message: 'Role must be admin or moderator' });

    const existing = await prisma.admin.findUnique({ where: { username: username.trim() } });
    if (existing) return res.status(409).json({ success: false, message: 'Username already taken' });

    const hashed = await bcrypt.hash(password, 12);
    const account = await prisma.admin.create({
      data: { username: username.trim(), password: hashed, role },
      select: { id: true, username: true, role: true, created_at: true },
    });

    res.status(201).json({ success: true, message: `${role.charAt(0).toUpperCase() + role.slice(1)} "${account.username}" created`, data: account });
  } catch (err) { next(err); }
};

// ── Delete admin or moderator ─────────────────────────────────────────────────
const deleteAccount = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Prevent self-deletion
    if (id === req.admin.id) return res.status(400).json({ success: false, message: 'You cannot delete your own account' });

    const target = await prisma.admin.findUnique({ where: { id } });
    if (!target) return res.status(404).json({ success: false, message: 'Account not found' });

    // Prevent deleting the last admin
    if (target.role === 'admin') {
      const adminCount = await prisma.admin.count({ where: { role: 'admin' } });
      if (adminCount <= 1) return res.status(400).json({ success: false, message: 'Cannot delete the last admin account' });
    }

    await prisma.admin.delete({ where: { id } });
    res.json({ success: true, message: `"${target.username}" deleted` });
  } catch (err) { next(err); }
};

// ── Change password ───────────────────────────────────────────────────────────
const changePassword = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { password } = req.body;

    if (!password || password.length < 8) return res.status(400).json({ success: false, message: 'Password must be at least 8 characters' });

    const target = await prisma.admin.findUnique({ where: { id } });
    if (!target) return res.status(404).json({ success: false, message: 'Account not found' });

    const hashed = await bcrypt.hash(password, 12);
    await prisma.admin.update({ where: { id }, data: { password: hashed } });

    res.json({ success: true, message: `Password updated for "${target.username}"` });
  } catch (err) { next(err); }
};

// ── Legacy: kept for backward compat ─────────────────────────────────────────
const createModerator = async (req, res, next) => {
  req.body.role = 'moderator';
  return createAccount(req, res, next);
};

module.exports = { login, getDashboardStats, listAdmins, createAccount, deleteAccount, changePassword, createModerator };