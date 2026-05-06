// src/aspl/controllers/team.controller.js
const prisma = require('../../config/database');
const { processImage, toUrlPath } = require('../../utils/processImage');

// GET /api/aspl/seasons/:seasonId/teams
const getTeamsBySeason = async (req, res) => {
  try {
    const teams = await prisma.asplTeam.findMany({
      where: { season_id: parseInt(req.params.seasonId) },
      orderBy: { id: 'asc' },
    });
    return res.json(teams);
  } catch (err) {
    console.error('getTeamsBySeason error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

// GET /api/aspl/teams  — all teams (active season or all)
const getTeams = async (req, res) => {
  const { season_id } = req.query;
  try {
    const teams = await prisma.asplTeam.findMany({
      where: season_id ? { season_id: parseInt(season_id) } : undefined,
      orderBy: { id: 'asc' },
    });
    return res.json(teams);
  } catch (err) {
    console.error('getTeams error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

// GET /api/aspl/teams/:id
const getTeamById = async (req, res) => {
  try {
    const team = await prisma.asplTeam.findUnique({ where: { id: parseInt(req.params.id) } });
    if (!team) return res.status(404).json({ detail: 'Team not found.' });
    return res.json(team);
  } catch (err) {
    console.error('getTeamById error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

// POST /api/aspl/teams  — create team with optional logo
const createTeam = async (req, res) => {
  const { season_id, owner_name, team_name, color = '#2F5BEA' } = req.body;

  if (!season_id || !owner_name || !team_name) {
    return res.status(400).json({ error: 'season_id, owner_name, and team_name are required.' });
  }

  try {
    const season = await prisma.asplSeason.findUnique({ where: { id: parseInt(season_id) } });
    if (!season) return res.status(404).json({ error: 'Season not found.' });

    let logo_url = null;
    if (req.file) {
      const filePath = await processImage(req.file.buffer, req.file.mimetype, { maxWidth: 400, maxHeight: 400, quality: 90 });
      logo_url = toUrlPath(filePath);
    }

    const team = await prisma.asplTeam.create({
      data: {
        season_id: parseInt(season_id),
        owner_name,
        team_name,
        color,
        balance: season.starting_balance,
        logo_url,
      },
    });
    return res.status(201).json(team);
  } catch (err) {
    console.error('createTeam error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

// PUT /api/aspl/teams/:id
const updateTeam = async (req, res) => {
  const { owner_name, team_name, color } = req.body;
  try {
    let logo_url;
    if (req.file) {
      const filePath = await processImage(req.file.buffer, req.file.mimetype, { maxWidth: 400, maxHeight: 400, quality: 90 });
      logo_url = toUrlPath(filePath);
    }

    const team = await prisma.asplTeam.update({
      where: { id: parseInt(req.params.id) },
      data: {
        ...(owner_name !== undefined && { owner_name }),
        ...(team_name  !== undefined && { team_name }),
        ...(color      !== undefined && { color }),
        ...(logo_url   !== undefined && { logo_url }),
      },
    });
    return res.json(team);
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Team not found.' });
    console.error('updateTeam error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

// DELETE /api/aspl/teams/:id
const deleteTeam = async (req, res) => {
  try {
    await prisma.asplTeam.delete({ where: { id: parseInt(req.params.id) } });
    return res.json({ message: 'Team deleted.' });
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Team not found.' });
    console.error('deleteTeam error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

module.exports = { getTeams, getTeamById, getTeamsBySeason, createTeam, updateTeam, deleteTeam };
