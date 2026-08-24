// src/controllers/admin.controller.js
const prisma = require('../config/database');

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

module.exports = { getDashboardStats };
