// src/aspl/controllers/teamPlayer.controller.js
const prisma = require('../../config/database');

const includeRelations = {
  player: true,
  team:   true,
};

// GET /api/aspl/team-players          → all records
// GET /api/aspl/team-players/:id      → all players for a given team id
const getTeamPlayers = async (req, res) => {
  const { id } = req.params;
  try {
    if (id !== undefined) {
      const team = await prisma.asplTeam.findUnique({ where: { id: parseInt(id) } });
      if (!team) return res.status(404).json({ detail: 'Team not found.' });

      const records = await prisma.asplTeamPlayer.findMany({
        where:   { team_id: parseInt(id) },
        include: includeRelations,
      });
      return res.json(records);
    }

    const records = await prisma.asplTeamPlayer.findMany({ include: includeRelations });
    return res.json(records);
  } catch (err) {
    console.error('getTeamPlayers error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

// POST /api/aspl/team-players/create
// Body: { player: <sl>, team: <id>, price: <number> }
const createTeamPlayer = async (req, res) => {
  const { player: playerSL, team: teamId, price } = req.body;

  if (!playerSL || !teamId || price === undefined) {
    return res.status(400).json({ error: 'player, team, and price are required.' });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const player = await tx.asplPlayer.findUnique({ where: { sl: parseInt(playerSL) } });
      if (!player)       throw Object.assign(new Error('Player not found.'), { status: 404 });
      if (player.status) throw Object.assign(new Error('Player is already sold.'), { status: 400 });

      const team = await tx.asplTeam.findUnique({ where: { id: parseInt(teamId) } });
      if (!team)              throw Object.assign(new Error('Team not found.'), { status: 404 });
      if (team.balance < price) throw Object.assign(new Error('Insufficient balance.'), { status: 400 });

      const record = await tx.asplTeamPlayer.create({
        data: { team_id: parseInt(teamId), player_sl: parseInt(playerSL), price },
      });

      await tx.asplPlayer.update({ where: { sl: parseInt(playerSL) }, data: { status: true } });
      await tx.asplTeam.update({ where: { id: parseInt(teamId) }, data: { balance: { decrement: price } } });

      return record;
    });

    return res.status(201).json(result);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    // Prisma unique constraint violation
    if (err.code === 'P2002') {
      return res.status(400).json({ error: 'Player is already assigned to a team.' });
    }
    console.error('createTeamPlayer error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

module.exports = { getTeamPlayers, createTeamPlayer };
