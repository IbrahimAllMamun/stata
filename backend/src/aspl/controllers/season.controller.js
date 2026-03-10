// src/aspl/controllers/season.controller.js
const prisma = require('../../config/database');

// Compute total_players live from the aspl_players table to avoid drift
async function withLiveCount(season) {
  if (!season) return season;
  const total_players = await prisma.asplPlayer.count({ where: { season_id: season.id } });
  return { ...season, total_players };
}

// GET /api/aspl/seasons
const getSeasons = async (req, res) => {
  try {
    const seasons = await prisma.asplSeason.findMany({
      orderBy: { created_at: 'desc' },
      include: {
        _count: { select: { teams: true, players: true, registrations: true } },
      },
    });
    const withCounts = await Promise.all(seasons.map(withLiveCount));
    return res.json(withCounts);
  } catch (err) {
    console.error('getSeasons error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

// GET /api/aspl/seasons/:id
const getSeasonById = async (req, res) => {
  try {
    const season = await prisma.asplSeason.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        teams: { orderBy: { id: 'asc' } },
        _count: { select: { teams: true, players: true, registrations: true } },
      },
    });
    if (!season) return res.status(404).json({ error: 'Season not found.' });
    return res.json(await withLiveCount(season));
  } catch (err) {
    console.error('getSeasonById error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

// GET /api/aspl/seasons/active
const getActiveSeason = async (req, res) => {
  try {
    const season = await prisma.asplSeason.findFirst({
      where: { status: 'ACTIVE' },
      include: {
        teams: { orderBy: { id: 'asc' } },
        _count: { select: { teams: true, players: true, registrations: true } },
      },
    });
    if (!season) return res.status(404).json({ error: 'No active season.' });
    return res.json(await withLiveCount(season));
  } catch (err) {
    console.error('getActiveSeason error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

// POST /api/aspl/seasons
const createSeason = async (req, res) => {
  const {
    name, sport,
    max_squad_size = 15, min_squad_size = 11,
    min_bid_price = 20, starting_balance = 1000,
  } = req.body;

  if (!name || !sport)
    return res.status(400).json({ error: 'name and sport are required.' });
  if (!['FOOTBALL', 'CRICKET'].includes(sport))
    return res.status(400).json({ error: 'sport must be FOOTBALL or CRICKET.' });

  try {
    const season = await prisma.asplSeason.create({
      data: {
        name, sport,
        max_squad_size: parseInt(max_squad_size),
        min_squad_size: parseInt(min_squad_size),
        min_bid_price: parseInt(min_bid_price),
        starting_balance: parseInt(starting_balance),
        total_players: 0,
        status: 'DRAFT',
      },
    });
    return res.status(201).json(season);
  } catch (err) {
    console.error('createSeason error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

// PATCH /api/aspl/seasons/:id
const updateSeason = async (req, res) => {
  const id = parseInt(req.params.id);
  const {
    name, sport, status,
    max_squad_size, min_squad_size,
    min_bid_price, starting_balance, registration_open,
    // total_players intentionally excluded — always computed live
  } = req.body;

  try {
    if (status === 'ACTIVE') {
      await prisma.asplSeason.updateMany({
        where: { status: 'ACTIVE', id: { not: id } },
        data: { status: 'COMPLETED' },
      });
    }

    const season = await prisma.asplSeason.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(sport !== undefined && { sport }),
        ...(status !== undefined && { status }),
        ...(max_squad_size !== undefined && { max_squad_size: parseInt(max_squad_size) }),
        ...(min_squad_size !== undefined && { min_squad_size: parseInt(min_squad_size) }),
        ...(min_bid_price !== undefined && { min_bid_price: parseInt(min_bid_price) }),
        ...(starting_balance !== undefined && { starting_balance: parseInt(starting_balance) }),
        ...(registration_open !== undefined && { registration_open: Boolean(registration_open) }),
      },
    });
    return res.json(await withLiveCount(season));
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Season not found.' });
    console.error('updateSeason error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

// DELETE /api/aspl/seasons/:id
const deleteSeason = async (req, res) => {
  try {
    await prisma.asplSeason.delete({ where: { id: parseInt(req.params.id) } });
    return res.json({ message: 'Season deleted.' });
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Season not found.' });
    console.error('deleteSeason error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

module.exports = { getSeasons, getSeasonById, getActiveSeason, createSeason, updateSeason, deleteSeason };