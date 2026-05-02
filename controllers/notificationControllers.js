// controllers/notificationControllers.js
const Notification = require("../models/notificationModels");

// TEMP USER
const CURRENT_USER_ID = 1;

exports.getNotifications = async (req, res) => {
  try {
    const data = await Notification.getNotifications(CURRENT_USER_ID);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

await Notification.createNotification(
  receiver_id,
  "You have a new message",
  "chat"
);

global.io.to(String(receiver_id)).emit("new_notification", {
  message: "You have a new message"
});

const NotificationController = {

  // ── GET /api/notifications ────────────────────────────────────
  // Returns all notifications + unread count for logged-in user
  getAll: (req, res) => {
    const userId = 1; // TEMP FIX

    NotificationModel.getForUser(userId, (err, notifications) => {
      if (err) return res.status(500).json({ success: false, message: 'Database error.' });

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

  // ── GET /api/notifications/unread-count ───────────────────────
  // Lightweight endpoint — only returns the unread badge number
  // Used by the navbar bell on every page load
  getUnreadCount: (req, res) => {
    NotificationModel.countUnread(req.user.user_id, (err, rows) => {
      if (err) return res.status(500).json({ success: false, message: 'Database error.' });
      return res.status(200).json({ success: true, unread: rows[0].unread });
    });
  },

  // ── PUT /api/notifications/:id/read ──────────────────────────
  // id = specific notification_id   OR   id = 'all'
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
        return res.status(200).json({ success: true, message: 'Marked as read.' });
      });
    }
  },

  // ── DELETE /api/notifications/:id ────────────────────────────
  // id = specific notification_id   OR   id = 'all'
  deleteOne: (req, res) => {
    const userId = req.user.user_id;
    const { id } = req.params;

    if (id === 'all') {
      NotificationModel.deleteAll(userId, (err) => {
        if (err) return res.status(500).json({ success: false, message: 'Database error.' });
        return res.status(200).json({ success: true, message: 'All notifications cleared.' });
      });
    } else {
      const notifId = parseInt(id);
      if (isNaN(notifId))
        return res.status(400).json({ success: false, message: 'Invalid notification ID.' });

      NotificationModel.deleteOne(notifId, userId, (err, result) => {
        if (err) return res.status(500).json({ success: false, message: 'Database error.' });
        if (result.affectedRows === 0)
          return res.status(404).json({ success: false, message: 'Notification not found.' });
        return res.status(200).json({ success: true, message: 'Notification deleted.' });
      });
    }
  },

};

module.exports = NotificationController;
