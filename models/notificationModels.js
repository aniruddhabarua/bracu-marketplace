// models/notificationModels.js
// Database queries for Feature 8: Notifications
const db = require('../config/db');

const NotificationModel = {

  // ── Create a notification for a user ─────────────────────────
  // type: 'message' | 'order' | 'payment' | 'review' | 'report' | 'system'
  create: (userId, type, title, body, link, callback) => {
    const sql = `
      INSERT INTO notifications (user_id, type, title, body, link)
      VALUES (?, ?, ?, ?, ?)`;
    db.query(sql, [userId, type, title, body, link || null], callback);
  },

  // ── Get all notifications for a user (newest first) ──────────
  getForUser: (userId, callback) => {
    const sql = `
      SELECT notification_id, type, title, body, link,
             is_read, created_at
      FROM notifications
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT 50`;
    db.query(sql, [userId], callback);
  },

  // ── Count unread notifications for a user ────────────────────
  countUnread: (userId, callback) => {
    db.query(
      'SELECT COUNT(*) AS unread FROM notifications WHERE user_id = ? AND is_read = FALSE',
      [userId],
      callback
    );
  },

  // ── Mark a single notification as read ───────────────────────
  markOneRead: (notificationId, userId, callback) => {
    db.query(
      'UPDATE notifications SET is_read = TRUE WHERE notification_id = ? AND user_id = ?',
      [notificationId, userId],
      callback
    );
  },

  // ── Mark ALL notifications as read for a user ─────────────────
  markAllRead: (userId, callback) => {
    db.query(
      'UPDATE notifications SET is_read = TRUE WHERE user_id = ?',
      [userId],
      callback
    );
  },

  // ── Delete a single notification ─────────────────────────────
  deleteOne: (notificationId, userId, callback) => {
    db.query(
      'DELETE FROM notifications WHERE notification_id = ? AND user_id = ?',
      [notificationId, userId],
      callback
    );
  },

};

module.exports = NotificationModel;
