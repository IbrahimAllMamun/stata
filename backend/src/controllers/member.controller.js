// src/controllers/member.controller.js
const prisma = require('../config/database');
const { paginate, paginatedResponse } = require('../utils/helpers');

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
      },
    });

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: { id: member.id },
    });
  } catch (err) {
    next(err);
  }
};

const getMembers = async (req, res, next) => {
  try {
    const { batch } = req.query;
    const { page, limit, skip } = paginate(req.query);

    const where = {};
    if (batch) where.batch = parseInt(batch);

    const [members, total] = await Promise.all([
      prisma.member.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ batch: 'asc' }, { full_name: 'asc' }],
        include: {
          committee_members: {
            select: { position: true },
          },
        },
      }),
      prisma.member.count({ where }),
    ]);

    const enriched = members.map((m) => {
      const positions = m.committee_members.map((cm) => cm.position);
      return {
        id: m.id,
        batch: m.batch,
        full_name: m.full_name,
        email: m.email,
        phone_number: m.phone_number,
        alternative_phone: m.alternative_phone,
        job_title: m.job_title,
        organisation: m.organisation,
        organisation_address: m.organisation_address,
        notify_events: m.notify_events,
        created_at: m.created_at,
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

// CSV export
const exportCSV = async (req, res, next) => {
  try {
    const members = await prisma.member.findMany({
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

module.exports = { register, getMembers, exportCSV };
