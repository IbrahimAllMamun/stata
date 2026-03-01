// src/routes/public.routes.js
const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const validate = require('../middlewares/validate');
const { registerSchema } = require('../validators');
const { register, getMembers, exportCSV } = require('../controllers/member.controller');
const { getCommittees } = require('../controllers/committee.controller');
const { getPosts, getPostBySlug } = require('../controllers/post.controller');
const { getEvents, getEventBySlug } = require('../controllers/event.controller');

const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: { success: false, message: 'Too many registration attempts. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Members
router.post('/register', registerLimiter, validate(registerSchema), register);
router.get('/members', getMembers);
router.get('/members/export', exportCSV);

// Committees
router.get('/committees', getCommittees);

// Posts
router.get('/posts', getPosts);
router.get('/posts/:slug', getPostBySlug);

// Events
router.get('/events', getEvents);
router.get('/events/:slug', getEventBySlug);

module.exports = router;