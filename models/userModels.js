const db = require('../config/db');

const UserModel = {


  findByEmail: (email, callback) => {
    db.query(
      'SELECT * FROM users WHERE email = ? AND is_active = 1 LIMIT 1',
      [email],
      (err, rows) => {
        if (err) return callback(err);
        callback(null, rows[0] || null);
      }
    );
  },


  create: (userData, callback) => {
    const { full_name, email, password_hash, role, department } = userData;
    db.query(
      `INSERT INTO users (full_name, email, password_hash, role, department)
       VALUES (?, ?, ?, ?, ?)`,
      [full_name, email, password_hash, role || 'student', department || null],
      callback
    );
  },


  getPublicProfile: (userId, callback) => {
    const sql = `
      SELECT
        u.user_id,
        u.full_name,
        u.email,
        u.role,
        u.department,
        u.profile_picture,
        u.bio,
        u.is_verified,
        u.created_at,
        AVG(r.rating)   AS avg_rating,
        COUNT(r.review_id) AS total_reviews
      FROM users u
      LEFT JOIN reviews r ON r.seller_id = u.user_id
      WHERE u.user_id = ?
      GROUP BY u.user_id`;
    db.query(sql, [userId], callback);
  },


  getSellerListings: (userId, callback) => {
    const sql = `
      SELECT
        l.listing_id,
        l.title,
        l.price,
        l.category,
        l.condition_type,
        l.status,
        l.created_at,
        img.image_url AS primary_image
      FROM listings l
      LEFT JOIN listing_images img
        ON img.listing_id = l.listing_id AND img.is_primary = TRUE
      WHERE l.seller_id = ? AND l.status != 'removed'
      ORDER BY l.created_at DESC`;
    db.query(sql, [userId], callback);
  },

  updateProfile: (userId, fields, callback) => {
    const allowed = ['full_name', 'department', 'bio', 'profile_picture'];
    const updates = [];
    const params  = [];

    allowed.forEach(key => {
      if (fields[key] !== undefined) {
        updates.push(`${key} = ?`);
        params.push(fields[key]);
      }
    });

    if (updates.length === 0)
      return callback(new Error('No valid fields to update.'));

    params.push(userId);
    db.query(
      `UPDATE users SET ${updates.join(', ')} WHERE user_id = ?`,
      params,
      callback
    );
  },

};

module.exports = UserModel;