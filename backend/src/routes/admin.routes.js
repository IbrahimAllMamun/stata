// src/routes/admin.routes.js
const express = require('express');
const router = express.Router();
const { authenticateMember, requireMemberRole } = require('../middlewares/memberAuth');
const validate = require('../middlewares/validate');
const upload = require('../config/upload');

const {
  committeeSchema, assignMemberSchema,
  postSchema, updatePostSchema, eventSchema, updateEventSchema,
} = require('../validators');

const { getDashboardStats } = require('../controllers/admin.controller');
const { createCommittee, assignMember, deleteCommitteeMember, deleteCommittee } = require('../controllers/committee.controller');
const { createPost, updatePost, deletePost, togglePublish, getAdminPosts, approvePost, rejectPost, getPendingPostCount } = require('../controllers/post.controller');
const { createEvent, updateEvent, deleteEvent } = require('../controllers/event.controller');
const { getMessages, getUnreadCount, updateMessageStatus, deleteMessage, toggleFeatured } = require('../controllers/contact.controller');
const { getMembersByStatus, getPendingCount, updateMemberStatus, deleteMember, exportCSV, getApprovedBatches, getMemberUpdateRequests, approveMemberUpdate, rejectMemberUpdate, getPendingUpdateCount, adminUpdateMemberPhoto, debugPhotoStatus } = require('../controllers/member.controller');
const { adminSendSetupEmail, updateMemberRole, listStaff } = require('../controllers/auth.controller');
const { uploadPhotos, deletePhoto, getAdminGallery, getSubjectsByDate } = require('../controllers/gallery.controller');
const { sendCampaign, getCampaigns, previewRecipients, verifySMTP, sendIndividual, getInbox, getInboxUnreadCount } = require('../controllers/email.controller');
const { getStatus: getInitialPwStatus, sendAll: sendInitialPwAll, sendOne: sendInitialPwOne } = require('../controllers/initialPassword.controller');

// All routes require authentication (admin OR moderator)
// Uses member table tokens — role field drives access
router.use(authenticateMember);
// authenticateMember only proves "some member is logged in"; without this the
// routes below would be open to every approved alumnus, not just staff.
router.use(requireMemberRole('admin', 'mod'));

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
router.post('/members/:id/send-setup-email', adminSendSetupEmail);
router.patch('/members/:id/role', requireMemberRole('admin'), updateMemberRole);

// Staff management (admins + mods from member table)
router.get('/staff', requireMemberRole('admin'), listStaff);
router.delete('/members/:id', deleteMember);

// Member update requests — admin and moderator
router.get('/member-updates', getMemberUpdateRequests);
router.get('/member-updates/count', getPendingUpdateCount);
router.post('/member-updates/:id/approve', approveMemberUpdate);
router.post('/member-updates/:id/reject', rejectMemberUpdate);

// Committee — admin only
router.post('/committee', requireMemberRole('admin'), validate(committeeSchema), createCommittee);
router.post('/committee/assign', requireMemberRole('admin'), assignMember);
router.delete('/committee/member/:id', requireMemberRole('admin'), deleteCommitteeMember);
router.delete('/committee/:id', requireMemberRole('admin'), deleteCommittee);

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
router.get('/gallery/subjects', getSubjectsByDate);
router.post('/gallery', upload.array('images', 30), uploadPhotos);
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
router.post('/email/send-individual', sendIndividual);
router.get('/email/inbox', getInbox);
router.get('/email/inbox-unread-count', getInboxUnreadCount);

// Initial password dispatch — legacy members without password
router.get('/initial-passwords/status', getInitialPwStatus);
router.post('/initial-passwords/send-all', sendInitialPwAll);
router.post('/initial-passwords/send/:id', sendInitialPwOne);

module.exports = router;