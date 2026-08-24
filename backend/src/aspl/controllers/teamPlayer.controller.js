// src/aspl/controllers/teamPlayer.controller.js
const prisma = require('../../config/database');

const includeRelations = { player: true, team: true };

const fail = (message, status) => Object.assign(new Error(message), { status });

// AsplPlayer only stores member_email, so squad lists would otherwise render as
// "#910001". Contact details are attached only for logged-in members.
async function enrichRecords(records, includeContact) {
  if (!records.length) return records;
  const emails = [...new Set(records.map(r => r.player?.member_email).filter(Boolean))];
  if (!emails.length) return records;

  const members = await prisma.member.findMany({
    where: { email: { in: emails } },
    select: { email: true, full_name: true, batch: true, phone_number: true, photo_url: true },
  });
  const map = Object.fromEntries(members.map(m => [m.email, m]));

  return records.map(r => {
    if (!r.player) return r;
    const m = map[r.player.member_email];
    return {
      ...r,
      player: {
        ...r.player,
        name:      m?.full_name ?? r.player.member_email,
        batch:     m?.batch     ?? null,
        photo_url: m?.photo_url ?? null,
        ...(includeContact
          ? { phone: m?.phone_number ?? null }
          : { member_email: undefined, phone: null }),
      },
    };
  });
}

// A team must keep enough money to still fill its remaining mandatory squad slots
// at the minimum bid price, so an early overbid can't leave it unable to field a side.
function maxAffordable(team, season, squadSize) {
  const slotsAfterThis = Math.max(0, season.min_squad_size - squadSize - 1);
  return team.balance - slotsAfterThis * season.min_bid_price;
}

// Shared validation for buying/reassigning a player. Returns the resolved season.
async function assertBidAllowed(tx, { player, team, price, excludeRecordId }) {
  if (player.season_id !== team.season_id)
    throw fail('Player and team belong to different seasons.', 400);

  const season = await tx.asplSeason.findUnique({ where: { id: team.season_id } });
  if (!season) throw fail('Season not found.', 404);
  if (season.status === 'COMPLETED')
    throw fail('This season is completed. Bidding is closed.', 400);

  if (price < season.min_bid_price)
    throw fail(`Minimum bid for this season is $${season.min_bid_price}.`, 400);

  const squadSize = await tx.asplTeamPlayer.count({
    where: { team_id: team.id, ...(excludeRecordId ? { id: { not: excludeRecordId } } : {}) },
  });
  if (squadSize >= season.max_squad_size)
    throw fail(`${team.team_name} already has the maximum of ${season.max_squad_size} players.`, 400);

  const ceiling = maxAffordable(team, season, squadSize);
  if (price > ceiling) {
    const slotsAfterThis = Math.max(0, season.min_squad_size - squadSize - 1);
    throw slotsAfterThis > 0 && ceiling < team.balance
      ? fail(`Max bid is $${ceiling}. ${team.team_name} must reserve $${slotsAfterThis * season.min_bid_price} for ${slotsAfterThis} more required player(s).`, 400)
      : fail(`Insufficient balance. ${team.team_name} has $${team.balance} available.`, 400);
  }
  return season;
}

// GET /api/aspl/team-players?season_id=X
// GET /api/aspl/team-players/:id  → all players for a given team
const getTeamPlayers = async (req, res) => {
  const { id } = req.params;
  const { season_id } = req.query;
  const includeContact = !!req.member;
  try {
    if (id !== undefined) {
      const teamId = parseInt(id);
      if (isNaN(teamId)) return res.status(400).json({ detail: 'Invalid team id.' });
      const team = await prisma.asplTeam.findUnique({ where: { id: teamId } });
      if (!team) return res.status(404).json({ detail: 'Team not found.' });
      const records = await prisma.asplTeamPlayer.findMany({
        where: { team_id: teamId },
        include: includeRelations,
        orderBy: { id: 'asc' },
      });
      return res.json(await enrichRecords(records, includeContact));
    }
    const records = await prisma.asplTeamPlayer.findMany({
      where: season_id ? { team: { season_id: parseInt(season_id) } } : undefined,
      include: includeRelations,
      orderBy: { id: 'asc' },
    });
    return res.json(await enrichRecords(records, includeContact));
  } catch (err) {
    console.error('getTeamPlayers error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

// POST /api/aspl/team-players/create
const createTeamPlayer = async (req, res) => {
  const { player: playerSL, team: teamId, price } = req.body;
  if (playerSL === undefined || teamId === undefined || price === undefined) {
    return res.status(400).json({ error: 'player, team, and price are required.' });
  }

  const sl        = parseInt(playerSL);
  const team_id   = parseInt(teamId);
  const bid       = parseInt(price);
  if (isNaN(sl) || isNaN(team_id)) return res.status(400).json({ error: 'player and team must be numbers.' });
  if (isNaN(bid) || bid <= 0)      return res.status(400).json({ error: 'price must be a positive number.' });

  try {
    const result = await prisma.$transaction(async (tx) => {
      const player = await tx.asplPlayer.findUnique({ where: { sl } });
      if (!player)       throw fail('Player not found.', 404);
      if (player.status) throw fail('Player is already sold.', 400);

      const team = await tx.asplTeam.findUnique({ where: { id: team_id } });
      if (!team) throw fail('Team not found.', 404);

      await assertBidAllowed(tx, { player, team, price: bid });

      // Conditional updates so two concurrent confirms can't both succeed:
      // the loser's WHERE no longer matches and its count comes back 0.
      const claimed = await tx.asplPlayer.updateMany({
        where: { sl, status: false },
        data:  { status: true },
      });
      if (claimed.count === 0) throw fail('Player was just sold to another team.', 409);

      const charged = await tx.asplTeam.updateMany({
        where: { id: team_id, balance: { gte: bid } },
        data:  { balance: { decrement: bid } },
      });
      if (charged.count === 0) throw fail('Insufficient balance.', 400);

      return tx.asplTeamPlayer.create({
        data: { team_id, player_sl: sl, price: bid },
        include: includeRelations,
      });
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

  if (isNaN(recordId)) return res.status(400).json({ error: 'Invalid bid id.' });
  if (newTeamId === undefined && newPrice === undefined) {
    return res.status(400).json({ error: 'Provide team_id or price to update.' });
  }
  if (newPrice !== undefined && (isNaN(parseInt(newPrice)) || parseInt(newPrice) <= 0)) {
    return res.status(400).json({ error: 'price must be a positive number.' });
  }
  if (newTeamId !== undefined && isNaN(parseInt(newTeamId))) {
    return res.status(400).json({ error: 'team_id must be a number.' });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const existing = await tx.asplTeamPlayer.findUnique({
        where: { id: recordId },
        include: includeRelations,
      });
      if (!existing) throw fail('Bid not found.', 404);

      const oldTeamId = existing.team_id;
      const oldPrice  = existing.price;
      const targetTeamId = newTeamId !== undefined ? parseInt(newTeamId) : oldTeamId;
      const targetPrice  = newPrice  !== undefined ? parseInt(newPrice)  : oldPrice;

      const teamChanged  = targetTeamId !== oldTeamId;
      const priceChanged = targetPrice  !== oldPrice;
      if (!teamChanged && !priceChanged) return existing;

      if (teamChanged) {
        const conflict = await tx.asplTeamPlayer.findUnique({
          where: { player_sl_team_id: { player_sl: existing.player_sl, team_id: targetTeamId } },
        });
        if (conflict) throw fail('Player is already in that team.', 400);
      }

      // Refund the old team first so a same-team re-price is measured against
      // the budget the team would actually have.
      await tx.asplTeam.update({
        where: { id: oldTeamId },
        data:  { balance: { increment: oldPrice } },
      });

      const newTeam = await tx.asplTeam.findUnique({ where: { id: targetTeamId } });
      if (!newTeam) throw fail('Target team not found.', 404);

      await assertBidAllowed(tx, {
        player: existing.player,
        team: newTeam,
        price: targetPrice,
        excludeRecordId: recordId,
      });

      const charged = await tx.asplTeam.updateMany({
        where: { id: targetTeamId, balance: { gte: targetPrice } },
        data:  { balance: { decrement: targetPrice } },
      });
      if (charged.count === 0) throw fail(`Insufficient balance. ${newTeam.team_name} has $${newTeam.balance} available.`, 400);

      return tx.asplTeamPlayer.update({
        where: { id: recordId },
        data:  { team_id: targetTeamId, price: targetPrice },
        include: includeRelations,
      });
    });
    // The caller swaps this row straight into its table, so it needs the same
    // enrichment the list endpoint provides or the player name reverts to an id.
    return res.json((await enrichRecords([result], true))[0]);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    console.error('updateTeamPlayer error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

// DELETE /api/aspl/team-players/:id  — removes bid, refunds team, marks player unsold
const deleteTeamPlayer = async (req, res) => {
  const recordId = parseInt(req.params.id);
  if (isNaN(recordId)) return res.status(400).json({ error: 'Invalid bid id.' });
  try {
    await prisma.$transaction(async (tx) => {
      const existing = await tx.asplTeamPlayer.findUnique({ where: { id: recordId } });
      if (!existing) throw fail('Bid not found.', 404);

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
