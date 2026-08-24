// src/aspl/routes/aspl.routes.js
const express = require('express');
const { authenticateMember, requireMemberRole, optionalMemberAuth } = require('../../middlewares/memberAuth');

const upload = require('../../config/upload');

const { getPlayers, getRandomPlayer } = require('../controllers/player.controller');
const { getTeams, getTeamById, getTeamsBySeason, createTeam, updateTeam, deleteTeam } = require('../controllers/team.controller');
const { getTeamPlayers, createTeamPlayer, updateTeamPlayer, deleteTeamPlayer } = require('../controllers/teamPlayer.controller');
const { getSeasons, getSeasonById, getActiveSeason, createSeason, updateSeason, deleteSeason } = require('../controllers/season.controller');
const { register, updatePlayerDetails, checkRegistration, lookupRegistration, getRoster, getRegistrations, approveRegistration, rejectRegistration, deleteRegistration, getPendingRegistrationCount } = require('../controllers/registration.controller');

const router = express.Router();

// Staff-only guard for every ASPL management action.
const staffOnly = [authenticateMember, requireMemberRole('admin', 'mod')];

// ── Seasons ───────────────────────────────────────────────────────────────────
router.get('/seasons/active', getActiveSeason);
router.get('/seasons/:id', getSeasonById);
router.get('/seasons', getSeasons);
router.post('/seasons', staffOnly, createSeason);
router.patch('/seasons/:id', staffOnly, updateSeason);
router.delete('/seasons/:id', staffOnly, deleteSeason);

// ── Registrations ─────────────────────────────────────────────────────────────
// Members register themselves — the email comes from the token, never the body.
router.post('/registrations', authenticateMember, upload.single('photo'), register);
router.post('/registrations/update-player', authenticateMember, upload.single('photo'), updatePlayerDetails);
// Public roster: names/positions/status only, no contact details.
router.get('/registrations/roster', optionalMemberAuth, getRoster);
router.get('/registrations/lookup', authenticateMember, lookupRegistration);
router.get('/registrations/check', authenticateMember, checkRegistration);
router.get('/registrations/pending-count', staffOnly, getPendingRegistrationCount);
router.get('/registrations', staffOnly, getRegistrations);
router.patch('/registrations/:id/approve', staffOnly, approveRegistration);
router.patch('/registrations/:id/reject', staffOnly, rejectRegistration);
router.delete('/registrations/:id', staffOnly, deleteRegistration);

// ── Players ───────────────────────────────────────────────────────────────────
// optionalMemberAuth: contact details are attached only for logged-in members.
router.get('/players/random', staffOnly, getRandomPlayer);
router.get('/players/:sl', optionalMemberAuth, getPlayers);
router.get('/players', optionalMemberAuth, getPlayers);

// ── Teams ─────────────────────────────────────────────────────────────────────
router.get('/seasons/:seasonId/teams', getTeamsBySeason);
router.get('/teams/:id', getTeamById);
router.get('/teams', getTeams);
router.post('/teams', staffOnly, upload.single('logo'), createTeam);
router.put('/teams/:id', staffOnly, upload.single('logo'), updateTeam);
router.delete('/teams/:id', staffOnly, deleteTeam);

// ── Team-Players ──────────────────────────────────────────────────────────────
router.post('/team-players/create', staffOnly, createTeamPlayer);
router.patch('/team-players/:id', staffOnly, updateTeamPlayer);
router.delete('/team-players/:id', staffOnly, deleteTeamPlayer);
router.get('/team-players/:id', optionalMemberAuth, getTeamPlayers);
router.get('/team-players', optionalMemberAuth, getTeamPlayers);

module.exports = router;
