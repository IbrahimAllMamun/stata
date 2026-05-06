// src/aspl/controllers/teamPlayer.controller.js
const prisma = require('../../config/database');

const includeRelations = { player: true, team: true };

// GET /api/aspl/team-players?season_id=X
// GET /api/aspl/team-players/:id  → all players for a given team
const getTeamPlayers = async (req, res) => {
  const { id } = req.params;
  const { season_id } = req.query;
  try {
    if (id !== undefined) {
      const team = await prisma.asplTeam.findUnique({ where: { id: parseInt(id) } });
      if (!team) return res.status(404).json({ detail: 'Team not found.' });
      const records = await prisma.asplTeamPlayer.findMany({
        where: { team_id: parseInt(id) },
        include: includeRelations,
        orderBy: { id: 'asc' },
      });
      return res.json(records);
    }
    const records = await prisma.asplTeamPlayer.findMany({
      where: season_id ? { team: { season_id: parseInt(season_id) } } : undefined,
      include: includeRelations,
      orderBy: { id: 'asc' },
    });
    return res.json(records);
  } catch (err) {
    console.error('getTeamPlayers error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

// POST /api/aspl/team-players/create
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
        include: includeRelations,
      });
      await tx.asplPlayer.update({ where: { sl: parseInt(playerSL) }, data: { status: true } });
      await tx.asplTeam.update({ where: { id: parseInt(teamId) }, data: { balance: { decrement: price } } });
      return record;
    });
    return res.status(201).json(result);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    if (err.code === 'P2002') return res.status(400).json({ error: 'Player is already assigned to a team.' });
    console.error('createTeamPlayer error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

// PATCH /api/aspl/team-players/:id
// Body: { team_id?, price? }  — change team and/or price, reconcile balances
const updateTeamPlayer = async (req, res) => {
  const recordId = parseInt(req.params.id);
  const { team_id: newTeamId, price: newPrice } = req.body;

  if (newTeamId === undefined && newPrice === undefined) {
    return res.status(400).json({ error: 'Provide team_id or price to update.' });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const existing = await tx.asplTeamPlayer.findUnique({
        where: { id: recordId },
        include: includeRelations,
      });
      if (!existing) throw Object.assign(new Error('Bid not found.'), { status: 404 });

      const oldTeamId = existing.team_id;
      const oldPrice  = existing.price;
      const targetTeamId = newTeamId !== undefined ? parseInt(newTeamId) : oldTeamId;
      const targetPrice  = newPrice  !== undefined ? parseInt(newPrice)  : oldPrice;

      const teamChanged  = targetTeamId !== oldTeamId;
      const priceChanged = targetPrice  !== oldPrice;

      if (!teamChanged && !priceChanged) return existing;

      // Validate uniqueness if team changed
      if (teamChanged) {
        const conflict = await tx.asplTeamPlayer.findUnique({
          where: { player_sl_team_id: { player_sl: existing.player_sl, team_id: targetTeamId } },
        });
        if (conflict) throw Object.assign(new Error('Player is already in that team.'), { status: 400 });
      }

      // Refund old team
      await tx.asplTeam.update({
        where: { id: oldTeamId },
        data: { balance: { increment: oldPrice } },
      });

      // Charge new team
      const newTeam = await tx.asplTeam.findUnique({ where: { id: targetTeamId } });
      if (!newTeam) throw Object.assign(new Error('Target team not found.'), { status: 404 });
      if (newTeam.balance < targetPrice) {
        throw Object.assign(new Error(`Insufficient balance. ${newTeam.team_name} has $${newTeam.balance + (teamChanged ? 0 : oldPrice)} available.`), { status: 400 });
      }
      await tx.asplTeam.update({
        where: { id: targetTeamId },
        data: { balance: { decrement: targetPrice } },
      });

      // Update the record
      const updated = await tx.asplTeamPlayer.update({
        where: { id: recordId },
        data: { team_id: targetTeamId, price: targetPrice },
        include: includeRelations,
      });

      // If team changed, update player.status = true (still sold)
      // player_sl stays the same, just reassigned

      return updated;
    });
    return res.json(result);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    console.error('updateTeamPlayer error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

// DELETE /api/aspl/team-players/:id  — removes bid, refunds team, marks player unsold
const deleteTeamPlayer = async (req, res) => {
  const recordId = parseInt(req.params.id);
  try {
    await prisma.$transaction(async (tx) => {
      const existing = await tx.asplTeamPlayer.findUnique({ where: { id: recordId } });
      if (!existing) throw Object.assign(new Error('Bid not found.'), { status: 404 });

      await tx.asplTeamPlayer.delete({ where: { id: recordId } });
      await tx.asplPlayer.update({ where: { sl: existing.player_sl }, data: { status: false } });
      await tx.asplTeam.update({ where: { id: existing.team_id }, data: { balance: { increment: existing.price } } });
    });
    return res.json({ message: 'Bid deleted and balance refunded.' });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    console.error('deleteTeamPlayer error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

module.exports = { getTeamPlayers, createTeamPlayer, updateTeamPlayer, deleteTeamPlayer };
