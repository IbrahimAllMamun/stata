// src/aspl/routes/aspl.routes.js
const express = require('express');
const { authenticate } = require('../../middlewares/auth');
const upload = require('../../config/upload');

const { getPlayers, getRandomPlayer } = require('../controllers/player.controller');
const { getTeams, getTeamById, getTeamsBySeason, createTeam, updateTeam, deleteTeam } = require('../controllers/team.controller');
const { getTeamPlayers, createTeamPlayer, updateTeamPlayer, deleteTeamPlayer } = require('../controllers/teamPlayer.controller');
const { getSeasons, getSeasonById, getActiveSeason, createSeason, updateSeason, deleteSeason } = require('../controllers/season.controller');
const { register, checkRegistration, lookupRegistration, getRegistrations, approveRegistration, rejectRegistration, deleteRegistration } = require('../controllers/registration.controller');

const router = express.Router();

// ── Seasons ───────────────────────────────────────────────────────────────────
router.get('/seasons/active', getActiveSeason);
router.get('/seasons/:id', getSeasonById);
router.get('/seasons', getSeasons);
router.post('/seasons', authenticate, createSeason);
router.patch('/seasons/:id', authenticate, updateSeason);
router.delete('/seasons/:id', authenticate, deleteSeason);

// ── Registrations (public submit, admin manage) ───────────────────────────────
router.post('/registrations', upload.single('photo'), register);
router.get('/registrations/lookup', lookupRegistration);
router.get('/registrations/check', checkRegistration);
router.get('/registrations', authenticate, getRegistrations);
router.patch('/registrations/:id/approve', authenticate, approveRegistration);
router.patch('/registrations/:id/reject', authenticate, rejectRegistration);
router.delete('/registrations/:id', authenticate, deleteRegistration);

// ── Players ───────────────────────────────────────────────────────────────────
router.get('/players/random', getRandomPlayer);
router.get('/players/:sl', getPlayers);
router.get('/players', getPlayers);

// ── Teams ─────────────────────────────────────────────────────────────────────
router.get('/seasons/:seasonId/teams', getTeamsBySeason);
router.get('/teams/:id', getTeamById);
router.get('/teams', getTeams);
router.post('/teams', authenticate, upload.single('logo'), createTeam);
router.put('/teams/:id', authenticate, upload.single('logo'), updateTeam);
router.delete('/teams/:id', authenticate, deleteTeam);

// ── Team-Players ──────────────────────────────────────────────────────────────
router.post('/team-players/create', authenticate, createTeamPlayer);
router.patch('/team-players/:id', authenticate, updateTeamPlayer);
router.delete('/team-players/:id', authenticate, deleteTeamPlayer);
router.get('/team-players/:id', getTeamPlayers);
router.get('/team-players', getTeamPlayers);

module.exports = router;