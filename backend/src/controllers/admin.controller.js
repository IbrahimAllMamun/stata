// src/controllers/admin.controller.js
const prisma = require('../config/database');
const bcrypt = require('bcrypt');
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
    const [totalMembers, totalCommittees, totalPosts, totalEvents, upcomingEvents] =
      await Promise.all([
        prisma.member.count(),
        prisma.committee.count(),
        prisma.post.count(),
        prisma.event.count(),
        prisma.event.count({ where: { event_date: { gte: new Date() } } }),
      ]);

    res.json({
      success: true,
      data: {
        total_members: totalMembers,
        total_committees: totalCommittees,
        total_posts: totalPosts,
        total_events: totalEvents,
        upcoming_events: upcomingEvents,
        past_events: totalEvents - upcomingEvents,
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { login, getDashboardStats };
