// src/routes/admin.routes.js
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const upload = require('../config/upload');

const {
  loginSchema, committeeSchema, assignMemberSchema,
  postSchema, updatePostSchema, eventSchema, updateEventSchema,
} = require('../validators');

const { login, getDashboardStats } = require('../controllers/admin.controller');
const { createCommittee, assignMember, deleteCommittee } = require('../controllers/committee.controller');
const { createPost, updatePost, deletePost, togglePublish } = require('../controllers/post.controller');
const { createEvent, updateEvent, deleteEvent } = require('../controllers/event.controller');

// Auth
router.post('/login', validate(loginSchema), login);

// All routes below require authentication
router.use(authenticate);

// Dashboard
router.get('/dashboard', getDashboardStats);

// Committee
router.post('/committee', validate(committeeSchema), createCommittee);
router.post('/committee/assign', upload.single('image'), assignMember);
router.delete('/committee/:id', deleteCommittee);

// Posts
router.post('/posts', upload.single('cover_image'), validate(postSchema), createPost);
router.put('/posts/:id', upload.single('cover_image'), validate(updatePostSchema), updatePost);
router.delete('/posts/:id', deletePost);
router.patch('/posts/:id/toggle', togglePublish);

// Events
router.post('/events', upload.single('banner_image'), validate(eventSchema), createEvent);
router.put('/events/:id', upload.single('banner_image'), validate(updateEventSchema), updateEvent);
router.delete('/events/:id', deleteEvent);

module.exports = router;
