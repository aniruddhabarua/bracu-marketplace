const db = require('../config/db');

const AnnouncementModel = {
  // Fetch all announcements, most recent first
  getAll: (callback) => {
    const sql = `
      SELECT a.*, u.full_name as admin_name 
      FROM announcements a
      JOIN users u ON a.admin_id = u.user_id
      ORDER BY a.created_at DESC
    `;
    db.query(sql, callback);
  },

  // Create a new announcement
  create: (data, callback) => {
    const sql = 'INSERT INTO announcements (admin_id, title, content, category) VALUES (?, ?, ?, ?)';
    db.query(sql, [data.admin_id, data.title, data.content, data.category], callback);
  },

  // Delete an announcement
  delete: (id, callback) => {
    const sql = 'DELETE FROM announcements WHERE announcement_id = ?';
    db.query(sql, [id], callback);
  }
};

module.exports = AnnouncementModel;
