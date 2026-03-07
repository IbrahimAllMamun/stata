// src/aspl/routes/aspl.routes.js
const express = require('express');

const { getPlayers, getRandomPlayer }          = require('../controllers/player.controller');
const { getTeams }                             = require('../controllers/team.controller');
const { getTeamPlayers, createTeamPlayer }     = require('../controllers/teamPlayer.controller');

const router = express.Router();

// ── Players ───────────────────────────────────────────────────────────────────
// ORDER MATTERS: /random must be declared before /:sl
router.get('/players/random', getRandomPlayer);
router.get('/players/:sl',    getPlayers);
router.get('/players',        getPlayers);

// ── Teams ─────────────────────────────────────────────────────────────────────
router.get('/teams/:id', getTeams);
router.get('/teams',     getTeams);

// ── Team-Players ──────────────────────────────────────────────────────────────
// ORDER MATTERS: /create must be declared before /:id
router.post('/team-players/create', createTeamPlayer);
router.get('/team-players/:id',     getTeamPlayers);
router.get('/team-players',         getTeamPlayers);

module.exports = router;
