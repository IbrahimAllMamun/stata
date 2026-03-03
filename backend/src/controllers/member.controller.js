// src/controllers/member.controller.js
const prisma = require('../config/database');
const { paginate, paginatedResponse } = require('../utils/helpers');

// ─── Public ───────────────────────────────────────────────────────────────────

const register = async (req, res, next) => {
  try {
    const {
      batch, full_name, email, phone_number,
      alternative_phone, job_title, organisation,
      organisation_address, notify_events,
    } = req.body;

    const existing = await prisma.member.findUnique({ where: { email: email.toLowerCase() } });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Email already registered' });
    }

    const member = await prisma.member.create({
      data: {
        batch: parseInt(batch),
        full_name,
        email: email.toLowerCase(),
        phone_number,
        alternative_phone: alternative_phone || null,
        job_title: job_title || null,
        organisation: organisation || null,
        organisation_address: organisation_address || null,
        notify_events,
        status: 'PENDING',
      },
    });

    res.status(201).json({
      success: true,
      message: 'Registration successful. Your account is pending approval.',
      data: { id: member.id },
    });
  } catch (err) {
    next(err);
  }
};

// Only return APPROVED members to the public
const getMembers = async (req, res, next) => {
  try {
    const { batch } = req.query;
    const { page, limit, skip } = paginate(req.query);

    const where = { status: 'APPROVED' };
    if (batch) where.batch = parseInt(batch);

    const [members, total] = await Promise.all([
      prisma.member.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ batch: 'asc' }, { full_name: 'asc' }],
        include: {
          committee_members: { select: { position: true } },
        },
      }),
      prisma.member.count({ where }),
    ]);

    const enriched = members.map((m) => {
      const positions = m.committee_members.map((cm) => cm.position);
      return {
        id: m.id, batch: m.batch, full_name: m.full_name,
        email: m.email, phone_number: m.phone_number,
        alternative_phone: m.alternative_phone, job_title: m.job_title,
        organisation: m.organisation, organisation_address: m.organisation_address,
        notify_events: m.notify_events, created_at: m.created_at,
        is_committee_member: positions.length > 0,
        is_president_or_secretary:
          positions.includes('PRESIDENT') || positions.includes('GENERAL_SECRETARY'),
      };
    });

    res.json({ success: true, ...paginatedResponse(enriched, total, page, limit) });
  } catch (err) {
    next(err);
  }
};

// CSV export — approved only
const exportCSV = async (req, res, next) => {
  try {
    const members = await prisma.member.findMany({
      where: { status: 'APPROVED' },
      orderBy: [{ batch: 'asc' }, { full_name: 'asc' }],
    });

    const headers = [
      'id', 'batch', 'full_name', 'email', 'phone_number',
      'alternative_phone', 'job_title', 'organisation',
      'organisation_address', 'notify_events', 'created_at',
    ];

    const rows = members.map((m) =>
      headers.map((h) => {
        const val = m[h] ?? '';
        return `"${String(val).replace(/"/g, '""')}"`;
      }).join(',')
    );

    const csv = [headers.join(','), ...rows].join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="stata_members.csv"');
    res.send(csv);
  } catch (err) {
    next(err);
  }
};

// ─── Admin ────────────────────────────────────────────────────────────────────

// Get members by status (pending / approved / archived)
const getMembersByStatus = async (req, res, next) => {
  try {
    const { status = 'PENDING' } = req.query;
    const validStatuses = ['PENDING', 'APPROVED', 'ARCHIVED'];
    const normalized = status.toUpperCase();
    if (!validStatuses.includes(normalized)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const { page, limit, skip } = paginate(req.query);
    const where = { status: normalized };

    const [members, total] = await Promise.all([
      prisma.member.findMany({
        where, skip, take: limit,
        orderBy: [{ created_at: 'desc' }],
      }),
      prisma.member.count({ where }),
    ]);

    res.json({ success: true, ...paginatedResponse(members, total, page, limit) });
  } catch (err) {
    next(err);
  }
};

// Get pending count for dashboard badge
const getPendingCount = async (req, res, next) => {
  try {
    const count = await prisma.member.count({ where: { status: 'PENDING' } });
    res.json({ success: true, data: { count } });
  } catch (err) {
    next(err);
  }
};

const updateMemberStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const validStatuses = ['APPROVED', 'ARCHIVED', 'PENDING'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const member = await prisma.member.findUnique({ where: { id } });
    if (!member) return res.status(404).json({ success: false, message: 'Member not found' });

    const updated = await prisma.member.update({
      where: { id },
      data: { status },
    });

    res.json({ success: true, message: `Member ${status.toLowerCase()}`, data: updated });
  } catch (err) {
    next(err);
  }
};

const deleteMember = async (req, res, next) => {
  try {
    const { id } = req.params;
    const member = await prisma.member.findUnique({ where: { id } });
    if (!member) return res.status(404).json({ success: false, message: 'Member not found' });

    await prisma.member.delete({ where: { id } });
    res.json({ success: true, message: 'Member deleted' });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  register, getMembers, exportCSV,
  getMembersByStatus, getPendingCount, updateMemberStatus, deleteMember,
};