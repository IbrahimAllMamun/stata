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
const { createPost, updatePost, deletePost, togglePublish, getAdminPosts, approvePost, rejectPost, getPendingPostCount } = require('../controllers/post.controller');
const { createEvent, updateEvent, deleteEvent } = require('../controllers/event.controller');
const { getMessages, getUnreadCount, updateMessageStatus, deleteMessage, toggleFeatured } = require('../controllers/contact.controller');
const { getMembersByStatus, getPendingCount, updateMemberStatus, deleteMember, exportCSV, getApprovedBatches, getMemberUpdateRequests, approveMemberUpdate, rejectMemberUpdate, getPendingUpdateCount, adminUpdateMemberPhoto, debugPhotoStatus } = require('../controllers/member.controller');
const { uploadPhotos, deletePhoto, getAdminGallery } = require('../controllers/gallery.controller');
const { sendCampaign, getCampaigns, previewRecipients, verifySMTP } = require('../controllers/email.controller');

// Public auth
router.post('/login', validate(loginSchema), login);

// All routes below require authentication (admin OR moderator)
router.use(authenticate);

// Dashboard
router.get('/dashboard', getDashboardStats);

// Member management — admin and moderator
router.get('/members', getMembersByStatus);
router.get('/members/pending-count', getPendingCount);
router.get('/members/debug-photo', debugPhotoStatus); // remove after confirming photos work
router.get('/members/export-csv', exportCSV);
router.get('/members/batches', getApprovedBatches);
router.patch('/members/:id/status', updateMemberStatus);
router.post('/members/:id/photo', upload.single('photo'), adminUpdateMemberPhoto);
router.delete('/members/:id', deleteMember);

// Member update requests — admin and moderator
router.get('/member-updates', getMemberUpdateRequests);
router.get('/member-updates/count', getPendingUpdateCount);
router.post('/member-updates/:id/approve', approveMemberUpdate);
router.post('/member-updates/:id/reject', rejectMemberUpdate);

// Moderator management — admin only
router.post('/moderators', requireRole('admin'), createModerator);

// Committee — admin only
router.post('/committee', requireRole('admin'), validate(committeeSchema), createCommittee);
router.post('/committee/assign', requireRole('admin'), upload.single('image'), assignMember);
router.delete('/committee/:id', requireRole('admin'), deleteCommittee);

// Posts — admin and moderator
router.get('/posts', getAdminPosts);
router.get('/posts/pending-count', getPendingPostCount);
router.post('/posts', upload.single('cover_image'), validate(postSchema), createPost);
router.put('/posts/:id', upload.single('cover_image'), validate(updatePostSchema), updatePost);
router.delete('/posts/:id', deletePost);
router.patch('/posts/:id/toggle', togglePublish);
router.patch('/posts/:id/approve', approvePost);
router.patch('/posts/:id/reject', rejectPost);

// Events — admin and moderator
router.post('/events', upload.single('banner_image'), validate(eventSchema), createEvent);
router.put('/events/:id', upload.single('banner_image'), validate(updateEventSchema), updateEvent);
router.delete('/events/:id', deleteEvent);

// Gallery — admin and moderator
router.get('/gallery', getAdminGallery);
router.post('/gallery', upload.array('images', 10), uploadPhotos);
router.delete('/gallery/:id', deletePhoto);

// Contact messages — admin and moderator
router.get('/messages', getMessages);
router.get('/messages/unread-count', getUnreadCount);
router.patch('/messages/:id/status', updateMessageStatus);
router.patch('/messages/:id/feature', toggleFeatured);
router.delete('/messages/:id', deleteMessage);

// Email campaigns — admin and moderator
router.get('/email/campaigns', getCampaigns);
router.get('/email/preview-recipients', previewRecipients);
router.get('/email/verify-smtp', verifySMTP);
router.post('/email/send', sendCampaign);

module.exports = router;