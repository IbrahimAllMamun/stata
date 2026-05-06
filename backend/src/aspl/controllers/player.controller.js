// src/aspl/controllers/player.controller.js
const prisma = require('../../config/database');

// Join Member data onto player records so callers get name/batch/phone
async function enrichPlayers(players) {
  if (!players.length) return [];
  const emails  = [...new Set(players.map(p => p.member_email))];
  const members = await prisma.member.findMany({
    where:  { email: { in: emails } },
    select: { email: true, full_name: true, batch: true, phone_number: true, job_title: true, organisation: true, photo_url: true },
  });
  const map = Object.fromEntries(members.map(m => [m.email, m]));
  return players.map(p => {
    const m = map[p.member_email];
    return {
      ...p,
      name:         m?.full_name    ?? p.member_email,
      batch:        m?.batch        ?? null,
      phone:        m?.phone_number ?? null,
      job_title:    m?.job_title    ?? null,
      organisation: m?.organisation ?? null,
      photo_url:    m?.photo_url    ?? null,
    };
  });
}

// GET /api/aspl/players?season_id=X  or  /players/:sl
const getPlayers = async (req, res) => {
  const { sl } = req.params;
  const { season_id } = req.query;
  try {
    if (sl) {
      const player = await prisma.asplPlayer.findUnique({ where: { sl: parseInt(sl) } });
      if (!player) return res.status(404).json({ detail: 'Player not found.' });
      return res.json((await enrichPlayers([player]))[0]);
    }
    const players = await prisma.asplPlayer.findMany({
      where:   season_id ? { season_id: parseInt(season_id) } : undefined,
      orderBy: { sl: 'asc' },
    });
    return res.json(await enrichPlayers(players));
  } catch (err) {
    console.error('getPlayers error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

// GET /api/aspl/players/random?season_id=X
const getRandomPlayer = async (req, res) => {
  const { season_id } = req.query;
  const where = {
    status:    false,
    randomized: false,
    ...(season_id && { season_id: parseInt(season_id) }),
  };
  try {
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const available = await prisma.asplPlayer.findMany({ where });
      if (!available.length) {
        await prisma.asplPlayer.updateMany({
          where: season_id ? { season_id: parseInt(season_id) } : {},
          data:  { randomized: false },
        });
        continue;
      }
      const pick = available[Math.floor(Math.random() * available.length)];
      await prisma.asplPlayer.update({ where: { sl: pick.sl }, data: { randomized: true } });
      return res.json((await enrichPlayers([pick]))[0]);
    }
  } catch (err) {
    console.error('getRandomPlayer error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

module.exports = { getPlayers, getRandomPlayer };
