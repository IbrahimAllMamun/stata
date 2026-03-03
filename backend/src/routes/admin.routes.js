// src/routes/admin.routes.js
const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const upload = require('../config/upload');

const {
  loginSchema, committeeSchema, assignMemberSchema,
  postSchema, updatePostSchema, eventSchema, updateEventSchema,
} = require('../validators');

const { login, getDashboardStats, createModerator } = require('../controllers/admin.controller');
const { createCommittee, assignMember, deleteCommittee } = require('../controllers/committee.controller');
const { createPost, updatePost, deletePost, togglePublish } = require('../controllers/post.controller');
const { createEvent, updateEvent, deleteEvent } = require('../controllers/event.controller');
const {
  getMembersByStatus, getPendingCount, updateMemberStatus, deleteMember,
} = require('../controllers/member.controller');

// Public auth
router.post('/login', validate(loginSchema), login);

// All routes below require authentication (admin OR moderator)
router.use(authenticate);

// Dashboard
router.get('/dashboard', getDashboardStats);

// Member management — admin and moderator
router.get('/members', getMembersByStatus);
router.get('/members/pending-count', getPendingCount);   // ← must be before /:id
router.patch('/members/:id/status', updateMemberStatus);
router.delete('/members/:id', deleteMember);

// Moderator management — admin only
router.post('/moderators', requireRole('admin'), createModerator);

// Committee — admin only
router.post('/committee', requireRole('admin'), validate(committeeSchema), createCommittee);
router.post('/committee/assign', requireRole('admin'), upload.single('image'), assignMember);
router.delete('/committee/:id', requireRole('admin'), deleteCommittee);

// Posts — admin and moderator
router.post('/posts', upload.single('cover_image'), validate(postSchema), createPost);
router.put('/posts/:id', upload.single('cover_image'), validate(updatePostSchema), updatePost);
router.delete('/posts/:id', deletePost);
router.patch('/posts/:id/toggle', togglePublish);

// Events — admin and moderator
router.post('/events', upload.single('banner_image'), validate(eventSchema), createEvent);
router.put('/events/:id', upload.single('banner_image'), validate(updateEventSchema), updateEvent);
router.delete('/events/:id', deleteEvent);

module.exports = router;