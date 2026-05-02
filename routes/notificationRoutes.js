// routes/notificationRoutes.js
const express                = require('express');
const router = require("express").Router();
const controller = require("../controllers/notificationControllers");

router.get("/", controller.getNotifications);

module.exports = router;
const router                 = express.Router();
const NotificationController = require('../controllers/notificationControllers');
const { authenticate }       = require('../middleware/auth');

// All routes require a valid JWT token
router.use(authenticate);

// GET  /api/notifications               — all notifications + unread count
router.get('/',                 NotificationController.getAll);

// GET  /api/notifications/unread-count  — just the badge number (lightweight)
router.get('/unread-count',     NotificationController.getUnreadCount);

// PUT  /api/notifications/:id/read      — mark one as read  (id='all' for all)
router.put('/:id/read',         NotificationController.markRead);

// DELETE /api/notifications/:id         — delete one        (id='all' for all)
router.delete('/:id',           NotificationController.deleteOne);

module.exports = router;
