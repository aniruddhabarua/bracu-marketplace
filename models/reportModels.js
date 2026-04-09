const db = require('../config/db');

const ReportModel = {

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


  findById: (reportId, callback) => {
    db.query(
      `SELECT r.*, u.full_name AS reporter_name
       FROM reports r JOIN users u ON u.user_id = r.reporter_id
       WHERE r.report_id = ?`,
      [reportId],
      callback
    );
  },

  getByReporter: (userId, callback) => {
    db.query(
      `SELECT * FROM reports WHERE reporter_id = ? ORDER BY created_at DESC`,
      [userId],
      callback
    );
  },


  updateStatus: (reportId, status, adminNote, callback) => {
    const sql = `
      UPDATE reports
      SET status = ?, admin_note = ?, resolved_at = NOW()
      WHERE report_id = ?`;
    db.query(sql, [status, adminNote || null, reportId], callback);
  },

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
