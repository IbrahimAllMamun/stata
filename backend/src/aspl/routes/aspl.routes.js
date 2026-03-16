// src/aspl/routes/aspl.routes.js
const express = require('express');
const { authenticate } = require('../../middlewares/auth');
const { authenticateMember } = require('../../middlewares/memberAuth');

const upload = require('../../config/upload');

const { getPlayers, getRandomPlayer } = require('../controllers/player.controller');
const { getTeams, getTeamById, getTeamsBySeason, createTeam, updateTeam, deleteTeam } = require('../controllers/team.controller');
const { getTeamPlayers, createTeamPlayer, updateTeamPlayer, deleteTeamPlayer } = require('../controllers/teamPlayer.controller');
const { getSeasons, getSeasonById, getActiveSeason, createSeason, updateSeason, deleteSeason } = require('../controllers/season.controller');
const { register, updatePlayerDetails, checkRegistration, lookupRegistration, getRegistrations, approveRegistration, rejectRegistration, deleteRegistration, getPendingRegistrationCount } = require('../controllers/registration.controller');

const router = express.Router();

// ── Seasons ───────────────────────────────────────────────────────────────────
router.get('/seasons/active', getActiveSeason);
router.get('/seasons/:id', getSeasonById);
router.get('/seasons', getSeasons);
router.post('/seasons', authenticateMember, createSeason);
router.patch('/seasons/:id', authenticateMember, updateSeason);
router.delete('/seasons/:id', authenticateMember, deleteSeason);

// ── Registrations (public submit, admin manage) ───────────────────────────────
router.post('/registrations', upload.single('photo'), register);
router.post('/registrations/update-player', upload.single('photo'), updatePlayerDetails);
router.get('/registrations/lookup', lookupRegistration);
router.get('/registrations/check', checkRegistration);
router.get('/registrations/pending-count', authenticateMember, getPendingRegistrationCount);
router.get('/registrations', authenticateMember, getRegistrations);
router.patch('/registrations/:id/approve', authenticateMember, approveRegistration);
router.patch('/registrations/:id/reject', authenticateMember, rejectRegistration);
router.delete('/registrations/:id', authenticateMember, deleteRegistration);

// ── Players ───────────────────────────────────────────────────────────────────
router.get('/players/random', getRandomPlayer);
router.get('/players/:sl', getPlayers);
router.get('/players', getPlayers);

// ── Teams ─────────────────────────────────────────────────────────────────────
router.get('/seasons/:seasonId/teams', getTeamsBySeason);
router.get('/teams/:id', getTeamById);
router.get('/teams', getTeams);
router.post('/teams', authenticateMember, upload.single('logo'), createTeam);
router.put('/teams/:id', authenticateMember, upload.single('logo'), updateTeam);
router.delete('/teams/:id', authenticateMember, deleteTeam);

// ── Team-Players ──────────────────────────────────────────────────────────────
router.post('/team-players/create', authenticateMember, createTeamPlayer);
router.patch('/team-players/:id', authenticateMember, updateTeamPlayer);
router.delete('/team-players/:id', authenticateMember, deleteTeamPlayer);
router.get('/team-players/:id', getTeamPlayers);
router.get('/team-players', getTeamPlayers);

module.exports = router;