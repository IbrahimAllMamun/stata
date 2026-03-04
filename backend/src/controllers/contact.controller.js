// src/controllers/contact.controller.js
const prisma = require('../config/database');
const { paginate, paginatedResponse } = require('../utils/helpers');

// ─── Public ───────────────────────────────────────────────────────────────────

// POST /api/contact — submit a message
const submitMessage = async (req, res, next) => {
  try {
    const { name, email, subject, message } = req.body;

    const msg = await prisma.contactMessage.create({
      data: { name: name.trim(), email: email.trim().toLowerCase(), subject: subject.trim(), message: message.trim() },
    });

    res.status(201).json({ success: true, message: 'Message sent successfully', data: { id: msg.id } });
  } catch (err) {
    next(err);
  }
};

// ─── Admin ────────────────────────────────────────────────────────────────────

// GET /api/admin/messages?status=UNREAD&page=1&limit=20
const getMessages = async (req, res, next) => {
  try {
    const { status } = req.query;
    const { page, limit, skip } = paginate(req.query);

    const validStatuses = ['UNREAD', 'READ', 'ARCHIVED'];
    const where = status && validStatuses.includes(status.toUpperCase())
      ? { status: status.toUpperCase() }
      : {};

    const [messages, total] = await Promise.all([
      prisma.contactMessage.findMany({
        where, skip, take: limit,
        orderBy: [{ created_at: 'desc' }],
      }),
      prisma.contactMessage.count({ where }),
    ]);

    res.json({ success: true, ...paginatedResponse(messages, total, page, limit) });
  } catch (err) {
    next(err);
  }
};

// GET /api/admin/messages/unread-count
const getUnreadCount = async (req, res, next) => {
  try {
    const count = await prisma.contactMessage.count({ where: { status: 'UNREAD' } });
    res.json({ success: true, data: { count } });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/admin/messages/:id/status  { status: 'READ' | 'UNREAD' | 'ARCHIVED' }
const updateMessageStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const validStatuses = ['UNREAD', 'READ', 'ARCHIVED'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const msg = await prisma.contactMessage.findUnique({ where: { id } });
    if (!msg) return res.status(404).json({ success: false, message: 'Message not found' });

    const updated = await prisma.contactMessage.update({ where: { id }, data: { status } });
    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/admin/messages/:id
const deleteMessage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const msg = await prisma.contactMessage.findUnique({ where: { id } });
    if (!msg) return res.status(404).json({ success: false, message: 'Message not found' });

    await prisma.contactMessage.delete({ where: { id } });
    res.json({ success: true, message: 'Message deleted' });
  } catch (err) {
    next(err);
  }
};

module.exports = { submitMessage, getMessages, getUnreadCount, updateMessageStatus, deleteMessage };
