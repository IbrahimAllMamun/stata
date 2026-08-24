// src/aspl/controllers/registration.controller.js
const prisma = require('../../config/database');
const { processImage, toUrlPath } = require('../../utils/processImage');

const isStaff = (req) => !!req.member && ['admin', 'mod'].includes(req.member.role);

// Photo upload helper — saves to member table directly (not registration).
// Callers must already have proven the requester owns memberEmail.
async function uploadAndSavePhoto(file, memberEmail) {
  if (!file) return null;
  const fp = await processImage(file.buffer, file.mimetype, { maxWidth: 600, maxHeight: 600, quality: 85 });
  const photo_url = toUrlPath(fp);
  await prisma.member.update({
    where: { email: memberEmail },
    data: { photo_url },
  });
  return photo_url;
}

// Remove the approved player created for a registration, refunding any bid.
// Used when a registration is rejected or deleted after approval.
async function releasePlayer(tx, reg) {
  if (!reg.player_sl) return;
  const player = await tx.asplPlayer.findUnique({ where: { sl: reg.player_sl } });
  if (!player) return;

  const bids = await tx.asplTeamPlayer.findMany({ where: { player_sl: reg.player_sl } });
  for (const bid of bids) {
    await tx.asplTeam.update({
      where: { id: bid.team_id },
      data:  { balance: { increment: bid.price } },
    });
  }
  if (bids.length) await tx.asplTeamPlayer.deleteMany({ where: { player_sl: reg.player_sl } });

  await tx.asplPlayer.delete({ where: { sl: reg.player_sl } });
  await tx.asplSeason.update({
    where: { id: reg.season_id },
    data:  { total_players: { decrement: 1 } },
  });
}

// ── helper: bulk-enrich registrations with member data ───────────────────────
async function enrichRegs(regs) {
  if (!regs.length) return regs;
  const emails = [...new Set(regs.map(r => r.email))];
  const members = await prisma.member.findMany({
    where: { email: { in: emails } },
    select: { email: true, full_name: true, batch: true, phone_number: true, photo_url: true },
  });
  const map = Object.fromEntries(members.map(m => [m.email, m]));
  return regs.map(r => ({ ...r, member: map[r.email] ?? null }));
}

// ── Member: POST /api/aspl/registrations ─────────────────────────────────────
// The email always comes from the auth token — never the request body — so a
// caller cannot register (or overwrite the photo of) somebody else.
const register = async (req, res) => {
  const { season_id, playing_position } = req.body;
  if (!season_id || !playing_position)
    return res.status(400).json({ error: 'season_id and playing_position are required.' });

  const emailLower = req.member.email.toLowerCase().trim();
  try {
    const season = await prisma.asplSeason.findUnique({ where: { id: parseInt(season_id) } });
    if (!season) return res.status(404).json({ error: 'Season not found.' });
    if (season.status === 'COMPLETED') return res.status(400).json({ error: 'This season is completed. Registration is closed.' });
    if (!season.registration_open) return res.status(400).json({ error: 'Registration is currently closed for this season.' });

    const member = await prisma.member.findUnique({ where: { email: emailLower } });
    if (!member)
      return res.status(404).json({ error: 'No STATA member found with that email. Please register as a STATA member first.' });
    if (member.status !== 'APPROVED')
      return res.status(403).json({ error: 'Your STATA membership must be approved before registering for ASPL.' });

    if (req.file) {
      await uploadAndSavePhoto(req.file, emailLower);
    } else if (!member.photo_url) {
      return res.status(400).json({ error: 'A profile photo is required for ASPL registration. Please upload a photo.' });
    }

    const position = playing_position.toUpperCase().trim();
    const existing = await prisma.asplRegistration.findUnique({
      where: { email_season_id: { email: emailLower, season_id: parseInt(season_id) } },
    });

    if (existing) {
      // Only force re-approval when the position actually changed. Re-submitting
      // the same details (e.g. just a new photo) must not un-approve a player
      // who may already have been auctioned.
      const positionChanged = existing.playing_position !== position;
      const conflict_note = existing.status === 'APPROVED' && positionChanged
        ? `Re-registration: previously approved as player #${existing.player_sl ?? 'N/A'}. Position changed from ${existing.playing_position} to ${position} — requires re-approval.`
        : null;

      const updated = await prisma.asplRegistration.update({
        where: { email_season_id: { email: emailLower, season_id: parseInt(season_id) } },
        data: {
          playing_position: position,
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
        playing_position: position,
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

// ── Member: POST /api/aspl/registrations/update-player ───────────────────────
const updatePlayerDetails = async (req, res) => {
  const { season_id, playing_position } = req.body;
  if (!season_id) return res.status(400).json({ error: 'season_id is required.' });
  const emailLower = req.member.email.toLowerCase().trim();
  try {
    const existing = await prisma.asplRegistration.findUnique({
      where: { email_season_id: { email: emailLower, season_id: parseInt(season_id) } },
    });
    if (!existing) return res.status(404).json({ error: 'No registration found for that email in this season.' });

    const season = await prisma.asplSeason.findUnique({ where: { id: parseInt(season_id) } });
    if (season && season.status === 'COMPLETED')
      return res.status(400).json({ error: 'This season is completed and can no longer be edited.' });

    if (req.file) await uploadAndSavePhoto(req.file, emailLower);

    const position = playing_position ? playing_position.toUpperCase().trim() : null;
    const positionChanged = position !== null && position !== existing.playing_position;

    const updateData = {};
    if (positionChanged) updateData.playing_position = position;
    if (!positionChanged && !req.file)
      return res.status(400).json({ error: 'Nothing to update. Provide a new position or photo.' });

    if (existing.status === 'APPROVED' && positionChanged) {
      updateData.conflict_note = `Update request: previously approved as player #${existing.player_sl ?? 'N/A'}. Position changed from ${existing.playing_position} to ${position} — requires re-approval.`;
      updateData.status = 'PENDING';
      updateData.admin_note = null;
    }

    const updated = Object.keys(updateData).length
      ? await prisma.asplRegistration.update({
          where: { email_season_id: { email: emailLower, season_id: parseInt(season_id) } },
          data: updateData,
        })
      : existing;

    return res.json({
      message: updateData.conflict_note ? 'Update submitted for re-approval.' : 'Your registration has been updated.',
      registration: updated,
    });
  } catch (err) {
    console.error('updatePlayerDetails error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

// ── Member: GET /api/aspl/registrations/check ────────────────────────────────
const checkRegistration = async (req, res) => {
  const { email, season_id } = req.query;
  if (!season_id) return res.status(400).json({ error: 'season_id required.' });
  const target = (email || req.member.email).toLowerCase().trim();
  if (target !== req.member.email.toLowerCase() && !isStaff(req))
    return res.status(403).json({ error: 'You can only view your own registration.' });
  try {
    const reg = await prisma.asplRegistration.findUnique({
      where: { email_season_id: { email: target, season_id: parseInt(season_id) } },
    });
    if (!reg) return res.status(404).json({ error: 'No registration found.' });
    return res.json(reg);
  } catch (err) {
    console.error('checkRegistration error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

// ── Member: GET /api/aspl/registrations/lookup ───────────────────────────────
const lookupRegistration = async (req, res) => {
  const { email, season_id } = req.query;
  if (!season_id) return res.status(400).json({ error: 'season_id required.' });
  const target = (email || req.member.email).toLowerCase().trim();
  if (target !== req.member.email.toLowerCase() && !isStaff(req))
    return res.status(403).json({ error: 'You can only view your own registration.' });
  try {
    const [reg, member] = await Promise.all([
      prisma.asplRegistration.findUnique({
        where: { email_season_id: { email: target, season_id: parseInt(season_id) } },
      }),
      prisma.member.findUnique({
        where: { email: target },
        select: { full_name: true, batch: true, phone_number: true, job_title: true, organisation: true, photo_url: true },
      }),
    ]);
    if (!reg) return res.status(200).json({ found: false, data: null });
    return res.json({ found: true, data: { ...reg, member } });
  } catch (err) {
    console.error('lookupRegistration error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

// ── Public: GET /api/aspl/registrations/roster ───────────────────────────────
// Everyone who has registered for a season, approved or still pending.
// Deliberately excludes contact details — this is reachable anonymously.
const getRoster = async (req, res) => {
  const { season_id } = req.query;
  if (!season_id) return res.status(400).json({ error: 'season_id required.' });
  const seasonId = parseInt(season_id);
  if (isNaN(seasonId)) return res.status(400).json({ error: 'season_id must be a number.' });

  try {
    const regs = await prisma.asplRegistration.findMany({
      where: { season_id: seasonId, status: { in: ['PENDING', 'APPROVED'] } },
      orderBy: [{ status: 'asc' }, { created_at: 'asc' }],
    });
    if (!regs.length) return res.json([]);

    const emails = [...new Set(regs.map(r => r.email))];
    const slNumbers = regs.map(r => r.player_sl).filter(sl => sl != null);

    const [members, players] = await Promise.all([
      prisma.member.findMany({
        where: { email: { in: emails } },
        select: { email: true, full_name: true, batch: true, photo_url: true },
      }),
      slNumbers.length
        ? prisma.asplPlayer.findMany({
            where: { sl: { in: slNumbers } },
            select: { sl: true, status: true },
          })
        : Promise.resolve([]),
    ]);

    const memberMap = Object.fromEntries(members.map(m => [m.email, m]));
    const soldMap   = Object.fromEntries(players.map(p => [p.sl, p.status]));

    return res.json(regs.map(r => {
      const m = memberMap[r.email];
      return {
        id: r.id,
        season_id: r.season_id,
        playing_position: r.playing_position,
        registration_status: r.status,          // PENDING | APPROVED
        player_sl: r.player_sl ?? null,
        sold: r.player_sl != null ? !!soldMap[r.player_sl] : false,
        name:      m?.full_name ?? 'STATA member',
        batch:     m?.batch     ?? null,
        photo_url: m?.photo_url ?? null,
        created_at: r.created_at,
      };
    }));
  } catch (err) {
    console.error('getRoster error:', err);
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
  if (isNaN(id)) return res.status(400).json({ error: 'Invalid registration id.' });

  // sl is a manually assigned primary key, so two concurrent approvals can pick
  // the same number. Retry on the resulting unique-constraint violation.
  const MAX_ATTEMPTS = 5;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      await prisma.$transaction(async (tx) => {
        const reg = await tx.asplRegistration.findUnique({ where: { id } });
        if (!reg) throw Object.assign(new Error('Registration not found.'), { status: 404 });

        const member = await tx.member.findUnique({ where: { email: reg.email } });
        if (!member) throw Object.assign(new Error('Associated STATA member not found.'), { status: 404 });

        const existingPlayer = await tx.asplPlayer.findFirst({
          where: { member_email: reg.email, season_id: reg.season_id },
        });

        if (existingPlayer) {
          await tx.asplPlayer.update({
            where: { sl: existingPlayer.sl },
            data: { playing_position: reg.playing_position },
          });
          await tx.asplRegistration.update({
            where: { id },
            data: { status: 'APPROVED', player_sl: existingPlayer.sl, conflict_note: null, admin_note: admin_note ?? null },
          });
          return;
        }

        const lastPlayer = await tx.asplPlayer.findFirst({ orderBy: { sl: 'desc' } });
        const nextSL = (lastPlayer?.sl ?? 0) + 1;

        await tx.asplPlayer.create({
          data: {
            sl: nextSL,
            season_id: reg.season_id,
            member_email: reg.email,
            playing_position: reg.playing_position,
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
      });
      return res.json({ message: 'Registration approved.' });
    } catch (err) {
      if (err.status) return res.status(err.status).json({ error: err.message });
      if (err.code === 'P2002' && attempt < MAX_ATTEMPTS) continue;
      console.error('approveRegistration error:', err);
      return res.status(500).json({ error: 'Internal server error.', detail: err.message });
    }
  }
  return res.status(409).json({ error: 'Could not allocate a player number. Please retry.' });
};

// ── Admin: PATCH /api/aspl/registrations/:id/reject ──────────────────────────
const rejectRegistration = async (req, res) => {
  const id = parseInt(req.params.id);
  const { admin_note } = req.body;
  if (isNaN(id)) return res.status(400).json({ error: 'Invalid registration id.' });
  try {
    await prisma.$transaction(async (tx) => {
      const reg = await tx.asplRegistration.findUnique({ where: { id } });
      if (!reg) throw Object.assign(new Error('Registration not found.'), { status: 404 });

      // A previously approved player must leave the auction pool too, otherwise
      // a rejected registrant stays biddable.
      await releasePlayer(tx, reg);

      await tx.asplRegistration.update({
        where: { id },
        data: { status: 'REJECTED', admin_note: admin_note ?? null, conflict_note: null, player_sl: null },
      });
    });
    return res.json({ message: 'Registration rejected.' });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    if (err.code === 'P2025') return res.status(404).json({ error: 'Registration not found.' });
    console.error('rejectRegistration error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

// ── Admin: DELETE /api/aspl/registrations/:id ─────────────────────────────────
const deleteRegistration = async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: 'Invalid registration id.' });
  try {
    await prisma.$transaction(async (tx) => {
      const reg = await tx.asplRegistration.findUnique({ where: { id } });
      if (!reg) throw Object.assign(new Error('Registration not found.'), { status: 404 });
      await releasePlayer(tx, reg);
      await tx.asplRegistration.delete({ where: { id } });
    });
    return res.json({ message: 'Registration deleted.' });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    if (err.code === 'P2025') return res.status(404).json({ error: 'Registration not found.' });
    console.error('deleteRegistration error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

// ── Admin: GET /api/aspl/registrations/pending-count ─────────────────────────
const getPendingRegistrationCount = async (req, res) => {
  const { season_id } = req.query;
  try {
    const count = await prisma.asplRegistration.count({
      where: { status: 'PENDING', ...(season_id && { season_id: parseInt(season_id) }) },
    });
    return res.json({ success: true, data: { count } });
  } catch (err) {
    console.error('getPendingRegistrationCount error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

module.exports = {
  register, updatePlayerDetails,
  checkRegistration, lookupRegistration, getRoster,
  getRegistrations, approveRegistration, rejectRegistration, deleteRegistration,
  getPendingRegistrationCount,
};
