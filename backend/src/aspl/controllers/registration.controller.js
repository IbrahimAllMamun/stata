// src/aspl/controllers/registration.controller.js
const prisma = require('../../config/database');
const { processImage, toUrlPath } = require('../../utils/processImage');

async function uploadPhoto(file) {
  if (!file) return null;
  const fp = await processImage(file.buffer, file.mimetype, { maxWidth: 600, maxHeight: 600, quality: 85 });
  return toUrlPath(fp);
}

// ── helper: bulk-enrich registrations with member data ───────────────────────
async function enrichRegs(regs) {
  if (!regs.length) return regs;
  const emails = [...new Set(regs.map(r => r.email))];
  const members = await prisma.member.findMany({
    where: { email: { in: emails } },
    select: { email: true, full_name: true, batch: true, phone_number: true },
  });
  const map = Object.fromEntries(members.map(m => [m.email, m]));
  return regs.map(r => ({ ...r, member: map[r.email] ?? null }));
}

// ── Public: POST /api/aspl/registrations ─────────────────────────────────────
// Only accepts: season_id, email (must be approved STATA member), playing_position, optional photo.
// All other data (name, batch, phone) lives in the Member table.
const register = async (req, res) => {
  const { season_id, email, playing_position } = req.body;
  if (!season_id || !email || !playing_position)
    return res.status(400).json({ error: 'season_id, email, and playing_position are required.' });

  const emailLower = email.toLowerCase().trim();
  try {
    const season = await prisma.asplSeason.findUnique({ where: { id: parseInt(season_id) } });
    if (!season) return res.status(404).json({ error: 'Season not found.' });
    if (season.status === 'COMPLETED') return res.status(400).json({ error: 'This season is completed. Registration is closed.' });
    if (!season.registration_open) return res.status(400).json({ error: 'Registration is currently closed for this season.' });

    // PENDING members are allowed — both registrations go under review together
    const member = await prisma.member.findUnique({ where: { email: emailLower } });
    if (!member)
      return res.status(404).json({ error: 'No STATA member found with that email. Please register as a STATA member first.' });
    if (member.status === 'ARCHIVED')
      return res.status(403).json({ error: 'Your STATA account is archived. Please contact an admin.' });

    const photo_url = await uploadPhoto(req.file);

    const existing = await prisma.asplRegistration.findUnique({
      where: { email_season_id: { email: emailLower, season_id: parseInt(season_id) } },
    });

    if (existing) {
      let conflict_note = null;
      if (existing.status === 'APPROVED')
        conflict_note = `Re-registration: previously approved as player #${existing.player_sl ?? 'N/A'}. Position/photo changed — requires re-approval.`;

      const updated = await prisma.asplRegistration.update({
        where: { email_season_id: { email: emailLower, season_id: parseInt(season_id) } },
        data: {
          playing_position: playing_position.toUpperCase().trim(),
          ...(photo_url && { photo_url }),
          status: conflict_note ? 'PENDING' : existing.status === 'REJECTED' ? 'PENDING' : existing.status,
          conflict_note,
          admin_note: conflict_note ? null : existing.admin_note,
        },
      });
      return res.json({
        message: conflict_note ? 'Your registration has been updated and sent for re-approval.' : 'Your registration has been updated.',
        registration: updated,
        member: { full_name: member.full_name, batch: member.batch },
        updated: true,
      });
    }

    const created = await prisma.asplRegistration.create({
      data: {
        season_id: parseInt(season_id),
        email: emailLower,
        playing_position: playing_position.toUpperCase().trim(),
        photo_url,
        status: 'PENDING',
      },
    });
    return res.status(201).json({
      message: 'Registration submitted successfully. You will be notified once approved.',
      registration: created,
      member: { full_name: member.full_name, batch: member.batch },
      updated: false,
    });
  } catch (err) {
    console.error('register error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

// ── Public: POST /api/aspl/registrations/update-player ───────────────────────
// Approved players can only change playing_position and/or photo.
const updatePlayerDetails = async (req, res) => {
  const { season_id, email, playing_position } = req.body;
  if (!season_id || !email) return res.status(400).json({ error: 'season_id and email are required.' });
  const emailLower = email.toLowerCase().trim();
  try {
    const existing = await prisma.asplRegistration.findUnique({
      where: { email_season_id: { email: emailLower, season_id: parseInt(season_id) } },
    });
    if (!existing) return res.status(404).json({ error: 'No registration found for that email in this season.' });

    const photo_url = await uploadPhoto(req.file);
    const updateData = {};
    if (playing_position) updateData.playing_position = playing_position.toUpperCase().trim();
    if (photo_url) updateData.photo_url = photo_url;
    if (!Object.keys(updateData).length)
      return res.status(400).json({ error: 'Nothing to update. Provide a new position or photo.' });

    if (existing.status === 'APPROVED') {
      updateData.conflict_note = `Update request: previously approved as player #${existing.player_sl ?? 'N/A'}. Position/photo changed — requires re-approval.`;
      updateData.status = 'PENDING';
      updateData.admin_note = null;
    }

    const updated = await prisma.asplRegistration.update({
      where: { email_season_id: { email: emailLower, season_id: parseInt(season_id) } },
      data: updateData,
    });
    return res.json({
      message: existing.status === 'APPROVED' ? 'Update submitted for re-approval.' : 'Your registration has been updated.',
      registration: updated,
    });
  } catch (err) {
    console.error('updatePlayerDetails error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

// ── Public: GET /api/aspl/registrations/check ────────────────────────────────
const checkRegistration = async (req, res) => {
  const { email, season_id } = req.query;
  if (!email || !season_id) return res.status(400).json({ error: 'email and season_id required.' });
  try {
    const reg = await prisma.asplRegistration.findUnique({
      where: { email_season_id: { email: email.toLowerCase().trim(), season_id: parseInt(season_id) } },
    });
    if (!reg) return res.status(404).json({ error: 'No registration found.' });
    return res.json(reg);
  } catch (err) {
    console.error('checkRegistration error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

// ── Public: GET /api/aspl/registrations/lookup ───────────────────────────────
// Returns registration + joined member data, for pre-filling the update form
const lookupRegistration = async (req, res) => {
  const { email, season_id } = req.query;
  if (!email || !season_id) return res.status(400).json({ error: 'email and season_id required.' });
  try {
    const emailLower = email.toLowerCase().trim();
    const [reg, member] = await Promise.all([
      prisma.asplRegistration.findUnique({
        where: { email_season_id: { email: emailLower, season_id: parseInt(season_id) } },
      }),
      prisma.member.findUnique({
        where: { email: emailLower },
        select: { full_name: true, batch: true, phone_number: true, job_title: true, organisation: true },
      }),
    ]);
    if (!reg) return res.status(404).json({ error: 'No registration found for that email.' });
    return res.json({ ...reg, member });
  } catch (err) {
    console.error('lookupRegistration error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

// ── Admin: GET /api/aspl/registrations ───────────────────────────────────────
const getRegistrations = async (req, res) => {
  const { season_id, status } = req.query;
  try {
    const regs = await prisma.asplRegistration.findMany({
      where: {
        ...(season_id && { season_id: parseInt(season_id) }),
        ...(status && { status }),
      },
      orderBy: [{ conflict_note: 'desc' }, { created_at: 'asc' }],
    });
    return res.json(await enrichRegs(regs));
  } catch (err) {
    console.error('getRegistrations error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

// ── Admin: PATCH /api/aspl/registrations/:id/approve ─────────────────────────
const approveRegistration = async (req, res) => {
  const { admin_note } = req.body;
  const id = parseInt(req.params.id);
  try {
    const reg = await prisma.asplRegistration.findUnique({ where: { id } });
    if (!reg) return res.status(404).json({ error: 'Registration not found.' });

    const member = await prisma.member.findUnique({ where: { email: reg.email } });
    if (!member) return res.status(404).json({ error: 'Associated STATA member not found.' });

    // sl is a global PK across all seasons — must find global max, not per-season max
    const lastPlayer = await prisma.asplPlayer.findFirst({
      orderBy: { sl: 'desc' },
    });
    const nextSL = (lastPlayer?.sl ?? 0) + 1;

    await prisma.$transaction(async (tx) => {
      // Check if a player row already exists for this member in this season
      // (covers the case where player_sl is null on a re-registration after being sold)
      const existingPlayer = await tx.asplPlayer.findFirst({
        where: { member_email: reg.email, season_id: reg.season_id },
      });

      if (existingPlayer) {
        // Always update in-place — never create a duplicate
        await tx.asplPlayer.update({
          where: { sl: existingPlayer.sl },
          data: { playing_position: reg.playing_position, photo_url: reg.photo_url },
        });
        await tx.asplRegistration.update({
          where: { id },
          data: { status: 'APPROVED', player_sl: existingPlayer.sl, conflict_note: null, admin_note: admin_note ?? null },
        });
        // total_players unchanged — player already counted
      } else {
        await tx.asplPlayer.create({
          data: {
            sl: nextSL,
            season_id: reg.season_id,
            member_email: reg.email,
            playing_position: reg.playing_position,
            photo_url: reg.photo_url,
            status: false,
            randomized: false,
          },
        });
        await tx.asplRegistration.update({
          where: { id },
          data: { status: 'APPROVED', player_sl: nextSL, conflict_note: null, admin_note: admin_note ?? null },
        });
        await tx.asplSeason.update({
          where: { id: reg.season_id },
          data: { total_players: { increment: 1 } },
        });
      }
    });
    return res.json({ message: 'Registration approved.' });
  } catch (err) {
    console.error('approveRegistration error:', err);
    return res.status(500).json({ error: 'Internal server error.', detail: err.message });
  }
};

// ── Admin: PATCH /api/aspl/registrations/:id/reject ──────────────────────────
const rejectRegistration = async (req, res) => {
  const id = parseInt(req.params.id);
  const { admin_note } = req.body;
  try {
    await prisma.asplRegistration.update({
      where: { id },
      data: { status: 'REJECTED', admin_note: admin_note ?? null, conflict_note: null },
    });
    return res.json({ message: 'Registration rejected.' });
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Registration not found.' });
    console.error('rejectRegistration error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

// ── Admin: DELETE /api/aspl/registrations/:id ─────────────────────────────────
const deleteRegistration = async (req, res) => {
  try {
    await prisma.asplRegistration.delete({ where: { id: parseInt(req.params.id) } });
    return res.json({ message: 'Registration deleted.' });
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Registration not found.' });
    return res.status(500).json({ error: 'Internal server error.' });
  }
};


// ── Admin: GET /api/aspl/registrations/pending-count ─────────────────────────
const getPendingRegistrationCount = async (req, res) => {
  try {
    const count = await prisma.asplRegistration.count({ where: { status: 'PENDING' } });
    return res.json({ success: true, data: { count } });
  } catch (err) {
    console.error('getPendingRegistrationCount error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

module.exports = {
  register, updatePlayerDetails,
  checkRegistration, lookupRegistration,
  getRegistrations, approveRegistration, rejectRegistration, deleteRegistration,
  getPendingRegistrationCount,
};