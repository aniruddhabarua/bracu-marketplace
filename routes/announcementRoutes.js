const express = require('express');
const router = express.Router();
const AnnouncementController = require('../controllers/announcementController');
const { authenticate, requireAdmin } = require('../middleware/auth');

// Public route to get announcements
router.get('/', AnnouncementController.getAnnouncements);

// Admin only routes
router.post('/', authenticate, requireAdmin, AnnouncementController.postAnnouncement);
router.delete('/:id', authenticate, requireAdmin, AnnouncementController.deleteAnnouncement);

module.exports = router;
