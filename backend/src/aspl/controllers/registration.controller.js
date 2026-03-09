// src/aspl/controllers/registration.controller.js
const prisma = require('../../config/database');
const processImage = require('../../utils/processImage');

// ── Public: POST /api/aspl/registrations ─────────────────────────────────────
// Upsert by email+season. If existing approved player re-registers → conflict note.
const register = async (req, res) => {
  const { season_id, email, full_name, batch, playing_position, phone } = req.body;

  if (!season_id || !email || !full_name || !batch || !playing_position || !phone) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  const emailLower = email.toLowerCase().trim();

  try {
    // Season must be ACTIVE or DRAFT to accept registrations
    const season = await prisma.asplSeason.findUnique({ where: { id: parseInt(season_id) } });
    if (!season) return res.status(404).json({ error: 'Season not found.' });
    if (season.status === 'COMPLETED') {
      return res.status(400).json({ error: 'This season is completed. Registration is closed.' });
    }
    if (!season.registration_open) {
      return res.status(400).json({ error: 'Registration is currently closed for this season.' });
    }

    // Handle photo upload
    let photo_url = null;
    if (req.file) {
      const filePath = await processImage(req.file.buffer, req.file.mimetype, {
        maxWidth: 600, maxHeight: 600, quality: 85,
      });
      photo_url = filePath.replace(process.env.UPLOAD_PATH || '/tmp/uploads', '/uploads');
    }

    // Check for existing registration
    const existing = await prisma.asplRegistration.findUnique({
      where: { email_season_id: { email: emailLower, season_id: parseInt(season_id) } },
    });

    let conflict_note = null;

    if (existing) {
      // If previously approved, flag as conflict needing re-approval
      if (existing.status === 'APPROVED') {
        conflict_note = `Re-registration: previously approved as player #${existing.player_sl ?? 'N/A'}. Details changed — requires re-approval.`;
      } else if (existing.status === 'REJECTED') {
        conflict_note = null; // allow clean re-submission after rejection
      }
      // PENDING → just overwrite silently (they're updating before review)

      const updated = await prisma.asplRegistration.update({
        where: { email_season_id: { email: emailLower, season_id: parseInt(season_id) } },
        data: {
          full_name: full_name.trim(),
          batch: parseInt(batch),
          playing_position: playing_position.toUpperCase().trim(),
          phone: phone.trim(),
          ...(photo_url && { photo_url }),
          status: conflict_note ? 'PENDING' : existing.status === 'REJECTED' ? 'PENDING' : existing.status,
          conflict_note,
          admin_note: conflict_note ? null : existing.admin_note,
          updated_at: new Date(),
        },
      });

      return res.json({
        message: conflict_note
          ? 'Your registration has been updated and sent for re-approval.'
          : 'Your registration has been updated.',
        registration: sanitize(updated),
        updated: true,
      });
    }

    // New registration
    const created = await prisma.asplRegistration.create({
      data: {
        season_id: parseInt(season_id),
        email: emailLower,
        full_name: full_name.trim(),
        batch: parseInt(batch),
        playing_position: playing_position.toUpperCase().trim(),
        phone: phone.trim(),
        photo_url,
        status: 'PENDING',
      },
    });

    return res.status(201).json({
      message: 'Registration submitted successfully. You will be notified once approved.',
      registration: sanitize(created),
      updated: false,
    });
  } catch (err) {
    console.error('register error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

// ── Public: GET /api/aspl/registrations/check?email=&season_id= ──────────────
// Let users check their registration status
const checkRegistration = async (req, res) => {
  const { email, season_id } = req.query;
  if (!email || !season_id) return res.status(400).json({ error: 'email and season_id required.' });

  try {
    const reg = await prisma.asplRegistration.findUnique({
      where: { email_season_id: { email: email.toLowerCase().trim(), season_id: parseInt(season_id) } },
    });
    if (!reg) return res.status(404).json({ error: 'No registration found.' });
    return res.json(sanitize(reg));
  } catch (err) {
    console.error('checkRegistration error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

// ── Public: GET /api/aspl/registrations/lookup?email=&season_id= ─────────────
// Returns full registration data including phone for pre-filling update form
const lookupRegistration = async (req, res) => {
  const { email, season_id } = req.query;
  if (!email || !season_id) return res.status(400).json({ error: 'email and season_id required.' });

  try {
    const reg = await prisma.asplRegistration.findUnique({
      where: { email_season_id: { email: email.toLowerCase().trim(), season_id: parseInt(season_id) } },
    });
    if (!reg) return res.status(404).json({ error: 'No registration found for that email.' });
    return res.json(reg); // full data including phone
  } catch (err) {
    console.error('lookupRegistration error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};


const getRegistrations = async (req, res) => {
  const { season_id, status } = req.query;
  try {
    const registrations = await prisma.asplRegistration.findMany({
      where: {
        ...(season_id && { season_id: parseInt(season_id) }),
        ...(status && { status }),
      },
      orderBy: [
        // conflicts and pending first
        { conflict_note: 'desc' },
        { created_at: 'asc' },
      ],
    });
    return res.json(registrations);
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

    const season = await prisma.asplSeason.findUnique({ where: { id: reg.season_id } });

    // Auto-assign next SL for this season
    const lastPlayer = await prisma.asplPlayer.findFirst({
      where: { season_id: reg.season_id },
      orderBy: { sl: 'desc' },
    });
    const nextSL = (lastPlayer?.sl ?? 0) + 1;

    // Create or update the AsplPlayer record
    await prisma.$transaction(async (tx) => {
      // If re-approval with existing player_sl, update that record
      if (reg.player_sl) {
        await tx.asplPlayer.upsert({
          where: { sl: reg.player_sl },
          update: {
            name: reg.full_name,
            batch: reg.batch,
            playing_position: reg.playing_position,
            photo_url: reg.photo_url,
            phone: reg.phone,
            email: reg.email,
          },
          create: {
            sl: reg.player_sl,
            season_id: reg.season_id,
            name: reg.full_name,
            batch: reg.batch,
            playing_position: reg.playing_position,
            photo_url: reg.photo_url,
            phone: reg.phone,
            email: reg.email,
          },
        });
      } else {
        await tx.asplPlayer.create({
          data: {
            sl: nextSL,
            season_id: reg.season_id,
            name: reg.full_name,
            batch: reg.batch,
            playing_position: reg.playing_position,
            photo_url: reg.photo_url,
            phone: reg.phone,
            email: reg.email,
            status: false,
            randomized: false,
          },
        });
      }

      // Update registration
      await tx.asplRegistration.update({
        where: { id },
        data: {
          status: 'APPROVED',
          player_sl: reg.player_sl ?? nextSL,
          conflict_note: null,
          admin_note: admin_note ?? null,
        },
      });

      // Update season total_players count
      await tx.asplSeason.update({
        where: { id: reg.season_id },
        data: { total_players: { increment: reg.player_sl ? 0 : 1 } },
      });
    });

    return res.json({ message: 'Registration approved.' });
  } catch (err) {
    console.error('approveRegistration error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

// ── Admin: PATCH /api/aspl/registrations/:id/reject ──────────────────────────
const rejectRegistration = async (req, res) => {
  const { admin_note } = req.body;
  const id = parseInt(req.params.id);

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

// Strip sensitive fields for public responses
function sanitize(reg) {
  const { phone, ...rest } = reg;
  return rest;
}

module.exports = {
  register,
  checkRegistration,
  lookupRegistration,
  getRegistrations,
  approveRegistration,
  rejectRegistration,
  deleteRegistration,
};