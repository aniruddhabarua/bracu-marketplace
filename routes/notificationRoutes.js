// routes/notificationRoutes.js
const express                    = require('express');
const router                     = express.Router();
const NotificationController     = require('../controllers/notificationControllers');

// All notification routes require authentication.
// router.use(authenticate);

// GET    /api/notifications           — get all notifications + unread count
router.get('/',                         NotificationController.getAll);

// PUT    /api/notifications/:id/read  — mark one or all as read (id = 'all' for all)
router.put('/:id/read',                 NotificationController.markRead);

// DELETE /api/notifications/:id       — delete one notification
router.delete('/:id',                   NotificationController.deleteOne);

module.exports = router;
