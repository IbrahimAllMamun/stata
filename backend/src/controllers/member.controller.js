// src/controllers/member.controller.js
const prisma = require('../config/database');
const { processImage, toUrlPath } = require('../utils/processImage');

async function uploadPhoto(file) {
  if (!file) return null;
  const fp = await processImage(file.buffer, file.mimetype, { maxWidth: 600, maxHeight: 600, quality: 85 });
  return toUrlPath(fp);
}
const { paginate, paginatedResponse } = require('../utils/helpers');

// ─── Public ───────────────────────────────────────────────────────────────────

const register = async (req, res, next) => {
  try {
    const {
      batch, full_name, email, phone_number,
      alternative_phone, job_title, organisation,
      organisation_address, notify_events, blood_group,
    } = req.body;

    const photo_url = await uploadPhoto(req.file);

    const existing = await prisma.member.findUnique({ where: { email: email.toLowerCase().trim() } });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Email already registered' });
    }

    // notify_events arrives as a boolean after Joi coercion, but guard against
    // string values that may slip through (e.g. "true"/"false" from FormData)
    const notifyBool = notify_events === true || notify_events === 'true';

    const member = await prisma.member.create({
      data: {
        batch: parseInt(batch),
        full_name: full_name.trim(),
        email: email.toLowerCase().trim(),
        phone_number: phone_number.trim(),
        alternative_phone: alternative_phone?.trim() || null,
        job_title: job_title?.trim() || null,
        organisation: organisation?.trim() || null,
        organisation_address: organisation_address?.trim() || null,
        notify_events: notifyBool,
        photo_url: photo_url || null,
        blood_group: blood_group || null,
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
    const { batch, blood_group } = req.query;
    const { page, limit, skip } = paginate(req.query);

    const where = { status: 'APPROVED' };
    if (batch) where.batch = parseInt(batch);
    if (blood_group) where.blood_group = blood_group;

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
        notify_events: m.notify_events, photo_url: m.photo_url ?? null, blood_group: m.blood_group ?? null, created_at: m.created_at,
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

// CSV export — approved members with optional batch + notify_events filters
const exportCSV = async (req, res, next) => {
  try {
    const { batch, notify_events } = req.query;

    const where = { status: 'APPROVED' };
    if (batch && batch !== '') where.batch = parseInt(batch);
    if (notify_events !== undefined && notify_events !== '') {
      where.notify_events = notify_events === 'true';
    }

    const members = await prisma.member.findMany({
      where,
      orderBy: [{ batch: 'asc' }, { notify_events: 'desc' }, { full_name: 'asc' }],
    });

    const headers = [
      'batch', 'full_name', 'email', 'phone_number',
      'alternative_phone', 'job_title', 'organisation',
      'organisation_address', 'notify_events', 'blood_group', 'created_at',
    ];

    const displayHeaders = [
      'Batch', 'Full Name', 'Email', 'Phone Number',
      'Alternative Phone', 'Job Title', 'Organisation',
      'Organisation Address', 'Notify Events', 'Blood Group', 'Registered At',
    ];

    const escape = (val) => `"${String(val ?? '').replace(/"/g, '""')}"`;

    const rows = members.map((m) =>
      headers.map((h) => escape(h === 'notify_events' ? (m[h] ? 'Yes' : 'No') : m[h])).join(',')
    );

    // Build a descriptive filename
    let filenameParts = ['stata_members'];
    if (batch) filenameParts.push(`batch${batch}`);
    if (notify_events !== undefined && notify_events !== '') {
      filenameParts.push(notify_events === 'true' ? 'notify_yes' : 'notify_no');
    }
    filenameParts.push(new Date().toISOString().slice(0, 10));
    const filename = filenameParts.join('_') + '.csv';

    const csv = [displayHeaders.join(','), ...rows].join('\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send('\uFEFF' + csv); // BOM for Excel UTF-8 compatibility
  } catch (err) {
    next(err);
  }
};

// Distinct approved batches — for filter dropdowns
const getApprovedBatches = async (req, res, next) => {
  try {
    const rows = await prisma.member.findMany({
      where: { status: 'APPROVED' },
      select: { batch: true },
      distinct: ['batch'],
      orderBy: { batch: 'asc' },
    });
    res.json({ success: true, data: rows.map(r => r.batch) });
  } catch (err) {
    next(err);
  }
};

// ─── Public: GET /lookup-member?email= ───────────────────────────────────────
// Returns member data (excluding sensitive status info) for pre-filling the update form
const lookupMember = async (req, res, next) => {
  try {
    const { email } = req.query;
    if (!email) return res.status(400).json({ success: false, message: 'Email is required.' });

    const member = await prisma.member.findUnique({
      where: { email: email.toLowerCase().trim() },
      select: {
        id: true, batch: true, full_name: true, email: true,
        phone_number: true, alternative_phone: true,
        job_title: true, organisation: true,
        organisation_address: true, notify_events: true, photo_url: true, blood_group: true, status: true,
      },
    });

    if (!member) return res.status(200).json({ success: false, found: false, data: null });

    res.json({ success: true, found: true, data: member });
  } catch (err) {
    next(err);
  }
};


// ─── Public: POST /update-member-photo ───────────────────────────────────────
// Photo updates go through the approval queue, same as other field changes.
const updateMemberPhoto = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email is required.' });

    const member = await prisma.member.findUnique({ where: { email: email.toLowerCase().trim() } });
    if (!member) return res.status(404).json({ success: false, message: 'No member found with that email.' });
    if (member.status === 'ARCHIVED') {
      return res.status(403).json({ success: false, message: 'This account has been archived.' });
    }

    const photo_url = await uploadPhoto(req.file);
    if (!photo_url) return res.status(400).json({ success: false, message: 'No photo provided.' });

    // Cancel any existing pending update for this member (superseded)
    await prisma.memberUpdateRequest.updateMany({
      where: { member_id: member.id, status: 'PENDING' },
      data: { status: 'REJECTED', admin_note: 'Superseded by a newer update request.' },
    });

    // Create a pending update request with just the new photo
    await prisma.memberUpdateRequest.create({
      data: {
        member_id: member.id,
        photo_url,
        status: 'PENDING',
      },
    });

    res.json({
      success: true,
      message: 'Photo update submitted and is pending admin approval.',
      data: { photo_url },
    });
  } catch (err) {
    next(err);
  }
};

// ─── Public: PUT /update-member ───────────────────────────────────────────────
// Creates a pending update request — does NOT touch the member directly.
// An admin must approve before changes go live.
const updateMember = async (req, res, next) => {
  try {
    const {
      email, batch, full_name, phone_number,
      alternative_phone, job_title, organisation,
      organisation_address, notify_events, blood_group,
    } = req.body;

    if (!email) return res.status(400).json({ success: false, message: 'Email is required.' });

    const member = await prisma.member.findUnique({ where: { email: email.toLowerCase().trim() } });
    if (!member) return res.status(404).json({ success: false, message: 'No member found with that email.' });

    if (member.status === 'ARCHIVED') {
      return res.status(403).json({ success: false, message: 'This account has been archived and cannot be updated.' });
    }

    // Cancel any existing pending update for this member (superseded)
    await prisma.memberUpdateRequest.updateMany({
      where: { member_id: member.id, status: 'PENDING' },
      data: { status: 'REJECTED', admin_note: 'Superseded by a newer update request.' },
    });

    // Process photo if provided alongside the profile update
    const photo_url = req.file ? await uploadPhoto(req.file) : null;

    // Create pending request — only store fields that are actually provided
    const request = await prisma.memberUpdateRequest.create({
      data: {
        member_id: member.id,
        batch: batch !== undefined ? parseInt(batch) : null,
        full_name: full_name !== undefined ? full_name.trim() : null,
        phone_number: phone_number !== undefined ? phone_number.trim() : null,
        alternative_phone: alternative_phone?.trim() || null,
        job_title: job_title?.trim() || null,
        organisation: organisation?.trim() || null,
        organisation_address: organisation_address?.trim() || null,
        notify_events: notify_events !== undefined ? notify_events : null,
        blood_group: blood_group !== undefined ? (blood_group || null) : null,
        photo_url: photo_url || null,
        status: 'PENDING',
      },
    });

    res.json({
      success: true,
      message: 'Your update request has been submitted and is pending admin approval. Changes will be applied once reviewed.',
      data: { request_id: request.id },
    });
  } catch (err) {
    next(err);
  }
};

// ─── Admin: GET /admin/member-updates ────────────────────────────────────────
const getMemberUpdateRequests = async (req, res, next) => {
  try {
    const { status = 'PENDING' } = req.query;
    const requests = await prisma.memberUpdateRequest.findMany({
      where: { status },
      orderBy: { created_at: 'asc' },
      include: {
        member: {
          select: {
            id: true, full_name: true, email: true, batch: true,
            phone_number: true, alternative_phone: true,
            job_title: true, organisation: true,
            organisation_address: true, notify_events: true, photo_url: true, blood_group: true, status: true,
          },
        },
      },
    });
    res.json({ success: true, data: requests });
  } catch (err) {
    next(err);
  }
};

// ─── Admin: POST /admin/member-updates/:id/approve ───────────────────────────
const approveMemberUpdate = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { admin_note } = req.body;

    const request = await prisma.memberUpdateRequest.findUnique({
      where: { id }, include: { member: true },
    });
    if (!request) return res.status(404).json({ success: false, message: 'Update request not found.' });
    if (request.status !== 'PENDING') {
      return res.status(400).json({ success: false, message: 'This request has already been reviewed.' });
    }

    // Build update payload from only non-null fields
    const updateData = {};
    if (request.batch !== null) updateData.batch = request.batch;
    if (request.full_name !== null) updateData.full_name = request.full_name;
    if (request.phone_number !== null) updateData.phone_number = request.phone_number;
    if (request.alternative_phone !== null) updateData.alternative_phone = request.alternative_phone;
    if (request.job_title !== null) updateData.job_title = request.job_title;
    if (request.organisation !== null) updateData.organisation = request.organisation;
    if (request.organisation_address !== null) updateData.organisation_address = request.organisation_address;
    if (request.notify_events !== null) updateData.notify_events = request.notify_events;
    if (request.blood_group !== null) updateData.blood_group = request.blood_group;
    if (request.photo_url !== null) updateData.photo_url = request.photo_url;

    await prisma.$transaction([
      prisma.member.update({ where: { id: request.member_id }, data: updateData }),
      prisma.memberUpdateRequest.update({
        where: { id },
        data: { status: 'APPROVED', admin_note: admin_note ?? null, reviewed_at: new Date() },
      }),
    ]);

    res.json({ success: true, message: 'Update approved and applied to member profile.' });
  } catch (err) {
    next(err);
  }
};

// ─── Admin: POST /admin/member-updates/:id/reject ────────────────────────────
const rejectMemberUpdate = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { admin_note } = req.body;

    const request = await prisma.memberUpdateRequest.findUnique({ where: { id } });
    if (!request) return res.status(404).json({ success: false, message: 'Update request not found.' });
    if (request.status !== 'PENDING') {
      return res.status(400).json({ success: false, message: 'This request has already been reviewed.' });
    }

    await prisma.memberUpdateRequest.update({
      where: { id },
      data: { status: 'REJECTED', admin_note: admin_note ?? null, reviewed_at: new Date() },
    });

    res.json({ success: true, message: 'Update request rejected.' });
  } catch (err) {
    next(err);
  }
};

// ─── Admin: GET /admin/member-updates/count ──────────────────────────────────
const getPendingUpdateCount = async (req, res, next) => {
  try {
    const count = await prisma.memberUpdateRequest.count({ where: { status: 'PENDING' } });
    res.json({ success: true, data: { count } });
  } catch (err) {
    next(err);
  }
};

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


// ─── Admin: GET /admin/members/debug-photo ───────────────────────────────────
// Temporary debug endpoint — remove after confirming photos work.
// Returns photo_url for every member so you can verify DB + Prisma are in sync.
const debugPhotoStatus = async (req, res, next) => {
  try {
    const members = await prisma.member.findMany({
      select: { id: true, email: true, full_name: true, photo_url: true },
      orderBy: { created_at: 'desc' },
      take: 20,
    });
    res.json({
      success: true,
      message: 'If photo_url column is missing from results, run the DB migration and npx prisma generate',
      data: members,
    });
  } catch (err) {
    next(err);
  }
};


// ─── Admin: POST /admin/members/:id/photo ────────────────────────────────────
const adminUpdateMemberPhoto = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No photo provided.' });
    const { id } = req.params;
    const member = await prisma.member.findUnique({ where: { id } });
    if (!member) return res.status(404).json({ success: false, message: 'Member not found.' });
    const photo_url = await uploadPhoto(req.file);
    if (!photo_url) return res.status(500).json({ success: false, message: 'Photo upload failed.' });
    await prisma.member.update({ where: { id }, data: { photo_url } });
    res.json({ success: true, message: 'Photo updated.', data: { photo_url } });
  } catch (err) { next(err); }
};

module.exports = {
  register, getMembers, exportCSV, getApprovedBatches,
  lookupMember, updateMember, updateMemberPhoto, adminUpdateMemberPhoto,
  getMemberUpdateRequests, approveMemberUpdate, rejectMemberUpdate, getPendingUpdateCount,
  getMembersByStatus, getPendingCount, updateMemberStatus, deleteMember, debugPhotoStatus,
};