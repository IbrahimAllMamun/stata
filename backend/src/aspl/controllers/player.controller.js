// src/aspl/controllers/player.controller.js
const prisma = require('../../config/database');

// GET /api/aspl/players          → all players
// GET /api/aspl/players/:sl      → single player by SL
const getPlayers = async (req, res) => {
  const { sl } = req.params;
  try {
    if (sl) {
      const player = await prisma.asplPlayer.findUnique({
        where: { sl: parseInt(sl) },
      });
      if (!player) return res.status(404).json({ detail: 'Player not found.' });
      return res.json(player);
    }
    const players = await prisma.asplPlayer.findMany({ orderBy: { sl: 'asc' } });
    return res.json(players);
  } catch (err) {
    console.error('getPlayers error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

// GET /api/aspl/players/random
// Picks a random player not yet sold (status=false) and not yet shown
// (randomized=false). Resets all randomized flags when all available
// players have been shown.
const getRandomPlayer = async (req, res) => {
  try {
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const available = await prisma.asplPlayer.findMany({
        where: { status: false, randomized: false },
      });

      if (!available.length) {
        await prisma.asplPlayer.updateMany({ data: { randomized: false } });
        continue;
      }

      const randomPlayer = available[Math.floor(Math.random() * available.length)];

      await prisma.asplPlayer.update({
        where: { sl: randomPlayer.sl },
        data: { randomized: true },
      });

      return res.json(randomPlayer);
    }
  } catch (err) {
    console.error('getRandomPlayer error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

module.exports = { getPlayers, getRandomPlayer };
