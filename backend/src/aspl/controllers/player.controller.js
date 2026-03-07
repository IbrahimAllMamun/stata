// src/aspl/controllers/player.controller.js
const prisma = require('../../config/database');

// GET /api/aspl/players?season_id=X
const getPlayers = async (req, res) => {
  const { sl } = req.params;
  const { season_id } = req.query;
  try {
    if (sl) {
      const player = await prisma.asplPlayer.findUnique({ where: { sl: parseInt(sl) } });
      if (!player) return res.status(404).json({ detail: 'Player not found.' });
      return res.json(player);
    }
    const players = await prisma.asplPlayer.findMany({
      where: season_id ? { season_id: parseInt(season_id) } : undefined,
      orderBy: { sl: 'asc' },
    });
    return res.json(players);
  } catch (err) {
    console.error('getPlayers error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

// GET /api/aspl/players/random?season_id=X
const getRandomPlayer = async (req, res) => {
  const { season_id } = req.query;
  const where = {
    status: false,
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
          data: { randomized: false },
        });
        continue;
      }
      const randomPlayer = available[Math.floor(Math.random() * available.length)];
      await prisma.asplPlayer.update({ where: { sl: randomPlayer.sl }, data: { randomized: true } });
      return res.json(randomPlayer);
    }
  } catch (err) {
    console.error('getRandomPlayer error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

module.exports = { getPlayers, getRandomPlayer };
