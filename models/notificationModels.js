const db = require('../config/db');

const NotificationModel = {

  // ── Create a notification ─────────────────────────────────────
  // type: 'message' | 'order' | 'payment' | 'review' | 'report' | 'system'
  create: (userId, type, title, body, link, callback) => {
    db.query(
      `INSERT INTO notifications (user_id, type, title, body, link)
       VALUES (?, ?, ?, ?, ?)`,
      [userId, type, title, body, link || null],
      callback || (() => {})
    );
  },

  // ── Get all notifications for a user (newest first) ──────────
  getForUser: (userId, callback) => {
    db.query(
      `SELECT notification_id, type, title, body, link, is_read, created_at
       FROM notifications
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT 50`,
      [userId], callback
    );
  },

  // ── Count unread notifications ────────────────────────────────
  countUnread: (userId, callback) => {
    db.query(
      `SELECT COUNT(*) AS unread
       FROM notifications
       WHERE user_id = ? AND is_read = FALSE`,
      [userId], callback
    );
  },

  // ── Mark one notification as read ─────────────────────────────
  markOneRead: (notifId, userId, callback) => {
    db.query(
      `UPDATE notifications SET is_read = TRUE
       WHERE notification_id = ? AND user_id = ?`,
      [notifId, userId], callback
    );
  },

  // ── Mark ALL notifications as read ───────────────────────────
  markAllRead: (userId, callback) => {
    db.query(
      `UPDATE notifications SET is_read = TRUE WHERE user_id = ?`,
      [userId], callback
    );
  },

  // ── Delete one notification ───────────────────────────────────
  deleteOne: (notifId, userId, callback) => {
    db.query(
      `DELETE FROM notifications
       WHERE notification_id = ? AND user_id = ?`,
      [notifId, userId], callback
    );
  },

  // ── Delete ALL notifications for a user ──────────────────────
  deleteAll: (userId, callback) => {
    db.query(
      `DELETE FROM notifications WHERE user_id = ?`,
      [userId], callback
    );
  },

};

module.exports = NotificationModel;
