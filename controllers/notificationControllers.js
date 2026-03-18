// controllers/notificationControllers.js
// Handles Feature 8: Notifications
const NotificationModel = require('../models/notificationModels');

const NotificationController = {

  // ── GET /api/notifications ────────────────────────────────────
  // Get all notifications for the logged-in user
  getAll: (req, res) => {
    const userId = req.user.user_id;

    NotificationModel.getForUser(userId, (err, notifications) => {
      if (err) return res.status(500).json({ success: false, message: 'Database error.', error: err.message });

      NotificationModel.countUnread(userId, (err2, countRows) => {
        if (err2) return res.status(500).json({ success: false, message: 'Database error.' });

        return res.status(200).json({
          success: true,
          unread:  countRows[0].unread,
          data:    notifications,
        });
      });
    });
  },

  // ── PUT /api/notifications/:id/read ──────────────────────────
  // Mark a single notification as read
  // Use id = 'all' to mark everything as read
  markRead: (req, res) => {
    const userId = req.user.user_id;
    const { id } = req.params;

    if (id === 'all') {
      NotificationModel.markAllRead(userId, (err) => {
        if (err) return res.status(500).json({ success: false, message: 'Database error.' });
        return res.status(200).json({ success: true, message: 'All notifications marked as read.' });
      });
    } else {
      const notifId = parseInt(id);
      if (isNaN(notifId))
        return res.status(400).json({ success: false, message: 'Invalid notification ID.' });

      NotificationModel.markOneRead(notifId, userId, (err, result) => {
        if (err) return res.status(500).json({ success: false, message: 'Database error.' });
        if (result.affectedRows === 0)
          return res.status(404).json({ success: false, message: 'Notification not found.' });
        return res.status(200).json({ success: true, message: 'Notification marked as read.' });
      });
    }
  },

  // ── DELETE /api/notifications/:id ────────────────────────────
  // Delete a single notification
  deleteOne: (req, res) => {
    const userId  = req.user.user_id;
    const notifId = parseInt(req.params.id);
    if (isNaN(notifId))
      return res.status(400).json({ success: false, message: 'Invalid notification ID.' });

    NotificationModel.deleteOne(notifId, userId, (err, result) => {
      if (err) return res.status(500).json({ success: false, message: 'Database error.' });
      if (result.affectedRows === 0)
        return res.status(404).json({ success: false, message: 'Notification not found.' });
      return res.status(200).json({ success: true, message: 'Notification deleted.' });
    });
  },

};

module.exports = NotificationController;
