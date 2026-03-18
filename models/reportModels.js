// models/reportModels.js
// Database queries for Feature 10: Report System
const db = require('../config/db');

const ReportModel = {

  // ── Submit a new report ───────────────────────────────────────
  // reported_type: 'listing' | 'user' | 'message'
  create: (reportData, callback) => {
    const { reporter_id, reported_type, reported_id, reason, details } = reportData;
    const sql = `
      INSERT INTO reports (reporter_id, reported_type, reported_id, reason, details, status)
      VALUES (?, ?, ?, ?, ?, 'pending')`;
    db.query(sql,
      [reporter_id, reported_type, reported_id, reason, details || null],
      callback
    );
  },

  // ── Get all reports (admin view) with optional status filter ──
  getAll: (status, callback) => {
    let sql = `
      SELECT
        r.*,
        u.full_name AS reporter_name,
        u.email     AS reporter_email
      FROM reports r
      JOIN users u ON u.user_id = r.reporter_id`;

    const params = [];
    if (status) {
      sql += ' WHERE r.status = ?';
      params.push(status);
    }
    sql += ' ORDER BY r.created_at DESC';
    db.query(sql, params, callback);
  },

  // ── Get a single report by ID ────────────────────────────────
  findById: (reportId, callback) => {
    db.query(
      `SELECT r.*, u.full_name AS reporter_name
       FROM reports r JOIN users u ON u.user_id = r.reporter_id
       WHERE r.report_id = ?`,
      [reportId],
      callback
    );
  },

  // ── Get all reports submitted by a specific user ──────────────
  getByReporter: (userId, callback) => {
    db.query(
      `SELECT * FROM reports WHERE reporter_id = ? ORDER BY created_at DESC`,
      [userId],
      callback
    );
  },

  // ── Update report status (admin resolves/dismisses) ──────────
  // status: 'reviewed' | 'resolved' | 'dismissed'
  updateStatus: (reportId, status, adminNote, callback) => {
    const sql = `
      UPDATE reports
      SET status = ?, admin_note = ?, resolved_at = NOW()
      WHERE report_id = ?`;
    db.query(sql, [status, adminNote || null, reportId], callback);
  },

  // ── Check if a user already reported the same item ───────────
  // Prevents duplicate reports from the same user
  isDuplicate: (reporterId, reportedType, reportedId, callback) => {
    db.query(
      `SELECT report_id FROM reports
       WHERE reporter_id = ? AND reported_type = ? AND reported_id = ?
         AND status = 'pending'
       LIMIT 1`,
      [reporterId, reportedType, reportedId],
      (err, rows) => {
        if (err) return callback(err, false);
        callback(null, rows.length > 0);
      }
    );
  },

};

module.exports = ReportModel;
