// src/aspl/controllers/player.controller.js
const prisma = require('../../config/database');

// Join Member data onto player records so callers get name/batch.
// Contact details (email/phone/employer) are attached only for logged-in members —
// this endpoint is reachable anonymously.
async function enrichPlayers(players, includeContact) {
  if (!players.length) return [];
  const emails  = [...new Set(players.map(p => p.member_email))];
  const members = await prisma.member.findMany({
    where:  { email: { in: emails } },
    select: { email: true, full_name: true, batch: true, phone_number: true, job_title: true, organisation: true, photo_url: true },
  });
  const map = Object.fromEntries(members.map(m => [m.email, m]));
  return players.map(p => {
    const m = map[p.member_email];
    const base = {
      ...p,
      name:      m?.full_name ?? p.member_email,
      batch:     m?.batch     ?? null,
      photo_url: m?.photo_url ?? null,
    };
    if (!includeContact) {
      return { ...base, member_email: undefined, phone: null, job_title: null, organisation: null };
    }
    return {
      ...base,
      phone:        m?.phone_number ?? null,
      job_title:    m?.job_title    ?? null,
      organisation: m?.organisation ?? null,
    };
  });
}

// GET /api/aspl/players?season_id=X  or  /players/:sl
const getPlayers = async (req, res) => {
  const { sl } = req.params;
  const { season_id } = req.query;
  const includeContact = !!req.member;
  try {
    if (sl) {
      const parsedSL = parseInt(sl);
      if (isNaN(parsedSL)) return res.status(400).json({ detail: 'Invalid player number.' });
      const player = await prisma.asplPlayer.findUnique({ where: { sl: parsedSL } });
      if (!player) return res.status(404).json({ detail: 'Player not found.' });
      // Player numbers are globally unique, so a caller scoped to one season must
      // not be able to page into another season's players.
      if (season_id && player.season_id !== parseInt(season_id))
        return res.status(404).json({ detail: 'Player not found in this season.' });
      return res.json((await enrichPlayers([player], includeContact))[0]);
    }
    const players = await prisma.asplPlayer.findMany({
      where:   season_id ? { season_id: parseInt(season_id) } : undefined,
      orderBy: { sl: 'asc' },
    });
    return res.json(await enrichPlayers(players, includeContact));
  } catch (err) {
    console.error('getPlayers error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

// GET /api/aspl/players/random?season_id=X
// Picks an unsold player that has not come up yet this cycle. When every unsold
// player has been shown, the cycle resets once and we pick again.
const getRandomPlayer = async (req, res) => {
  const { season_id } = req.query;
  const seasonWhere = season_id ? { season_id: parseInt(season_id) } : {};
  const available = { status: false, ...seasonWhere };
  try {
    let pool = await prisma.asplPlayer.findMany({ where: { ...available, randomized: false } });

    if (!pool.length) {
      // Reset the cycle for unsold players only. Resetting sold players too would
      // make this loop forever once the auction completes.
      await prisma.asplPlayer.updateMany({ where: available, data: { randomized: false } });
      pool = await prisma.asplPlayer.findMany({ where: { ...available, randomized: false } });
    }

    if (!pool.length) {
      return res.status(404).json({ error: 'No unsold players remaining in this season.' });
    }

    const pick = pool[Math.floor(Math.random() * pool.length)];
    await prisma.asplPlayer.update({ where: { sl: pick.sl }, data: { randomized: true } });
    return res.json((await enrichPlayers([pick], true))[0]);
  } catch (err) {
    console.error('getRandomPlayer error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

module.exports = { getPlayers, getRandomPlayer };
