// src/routes/public.routes.js
const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const validate = require('../middlewares/validate');
const upload = require('../config/upload');
const { registerSchema, contactSchema, submitPostSchema, updateMemberSchema } = require('../validators');

const { register, getMembers, exportCSV, getApprovedBatches, lookupMember, updateMember, updateMemberPhoto } = require('../controllers/member.controller');
const { getCommittees } = require('../controllers/committee.controller');
const { getPosts, getPostBySlug, submitPost } = require('../controllers/post.controller');
const { getEvents, getEventBySlug } = require('../controllers/event.controller');
const { submitMessage, getSpeeches } = require('../controllers/contact.controller');
const { getGallery, getGalleryDates, getSubjectsByDate } = require('../controllers/gallery.controller');

const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: 10,
  message: { success: false, message: 'Too many registration attempts. Please try again later.' },
  standardHeaders: true, legacyHeaders: false,
});

const postSubmitLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, max: 10,
  message: { success: false, message: 'Too many post submissions. Please try again later.' },
  standardHeaders: true, legacyHeaders: false,
});

const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: 5,
  message: { success: false, message: 'Too many messages sent. Please try again later.' },
  standardHeaders: true, legacyHeaders: false,
});

// Members
router.post('/register', registerLimiter, upload.single('photo'), validate(registerSchema), register);
router.get('/members', getMembers);
router.get('/members/export', exportCSV);
router.get('/members/batches', getApprovedBatches);
router.get('/lookup-member', lookupMember);
router.put('/update-member', validate(updateMemberSchema), updateMember);
router.post('/update-member-photo', upload.single('photo'), updateMemberPhoto);

// Posts (public)
router.get('/posts', getPosts);
router.get('/posts/:slug', getPostBySlug);
router.post('/posts', postSubmitLimiter, upload.single('cover_image'), validate(submitPostSchema), submitPost);

// Events
router.get('/events', getEvents);
router.get('/events/:slug', getEventBySlug);

// Committees
router.get('/committees', getCommittees);

// Contact
router.post('/contact', contactLimiter, validate(contactSchema), submitMessage);
router.get('/speeches', getSpeeches);

// Gallery
router.get('/gallery', getGallery);
router.get('/gallery/dates', getGalleryDates);
router.get('/gallery/subjects', getSubjectsByDate);

module.exports = router;

// Visitor analytics
const { trackVisitor, getVisitorStats } = require('../controllers/visitor.controller');
const trackLimiter = rateLimit({
  windowMs: 60 * 1000, max: 5,
  standardHeaders: true, legacyHeaders: false,
});
router.post('/track', trackLimiter, trackVisitor);
router.get('/visitors/stats', getVisitorStats);
