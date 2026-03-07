// src/aspl/controllers/team.controller.js
const prisma = require('../../config/database');

// GET /api/aspl/teams          → all teams
// GET /api/aspl/teams/:id      → single team
const getTeams = async (req, res) => {
  const { id } = req.params;
  try {
    if (id) {
      const team = await prisma.asplTeam.findUnique({
        where: { id: parseInt(id) },
      });
      if (!team) return res.status(404).json({ detail: 'Team not found.' });
      return res.json(team);
    }
    const teams = await prisma.asplTeam.findMany({ orderBy: { id: 'asc' } });
    return res.json(teams);
  } catch (err) {
    console.error('getTeams error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

module.exports = { getTeams };
