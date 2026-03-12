// src/controllers/admin.controller.js
const prisma = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const login = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    const admin = await prisma.admin.findUnique({ where: { username } });
    if (!admin) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const valid = await bcrypt.compare(password, admin.password);
    if (!valid) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: admin.id, username: admin.username, role: admin.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        admin: { id: admin.id, username: admin.username, role: admin.role },
      },
    });
  } catch (err) {
    next(err);
  }
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

    res.json({
      success: true,
      data: {
        total_members: totalMembers,
        pending_members: pendingMembers,
        total_committees: totalCommittees,
        total_posts: totalPosts,
        total_events: totalEvents,
        upcoming_events: upcomingEvents,
        past_events: totalEvents - upcomingEvents,
        unread_messages: unreadMessages,
      },
    });
  } catch (err) {
    next(err);
  }
};

// Admin only: create a moderator account
const createModerator = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username and password are required' });
    }
    if (password.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters' });
    }

    const existing = await prisma.admin.findUnique({ where: { username } });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Username already taken' });
    }

    const hashed = await bcrypt.hash(password, 12);
    const moderator = await prisma.admin.create({
      data: { username, password: hashed, role: 'moderator' },
    });

    res.status(201).json({
      success: true,
      message: 'Moderator created',
      data: { id: moderator.id, username: moderator.username, role: moderator.role },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { login, getDashboardStats, createModerator };