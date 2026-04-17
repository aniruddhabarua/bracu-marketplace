const db = require('../config/db');

const FavoriteSellersModel = {

  // Add a seller to favorites
  addFavoriteSeller: (userId, sellerId, callback) => {
    const sql = `
      INSERT INTO favorite_sellers (user_id, seller_id)
      VALUES (?, ?)
    `;
    db.query(sql, [userId, sellerId], callback);
  },

  // Remove a seller from favorites
  removeFavoriteSeller: (userId, sellerId, callback) => {
    const sql = `
      DELETE FROM favorite_sellers
      WHERE user_id = ? AND seller_id = ?
    `;
    db.query(sql, [userId, sellerId], callback);
  },

  // Check if a seller is in user's favorites
  isFavoriteSeller: (userId, sellerId, callback) => {
    const sql = `
      SELECT favorite_id FROM favorite_sellers
      WHERE user_id = ? AND seller_id = ?
      LIMIT 1
    `;
    db.query(sql, [userId, sellerId], (err, rows) => {
      if (err) return callback(err);
      callback(null, rows.length > 0);
    });
  },

  // Get all favorite sellers for a user with their details
  getFavoriteSellers: (userId, callback) => {
    const sql = `
      SELECT
        fs.favorite_id,
        fs.followed_at,
        u.user_id,
        u.full_name,
        u.email,
        u.role,
        u.department,
        u.profile_picture,
        u.bio,
        u.is_verified,
        AVG(r.rating) AS avg_rating,
        COUNT(r.review_id) AS total_reviews
      FROM favorite_sellers fs
      INNER JOIN users u ON fs.seller_id = u.user_id
      LEFT JOIN reviews r ON r.seller_id = u.user_id
      WHERE fs.user_id = ?
      GROUP BY fs.favorite_id, u.user_id
      ORDER BY fs.followed_at DESC
    `;
    db.query(sql, [userId], callback);
  },

  // Get favorite sellers count
  getFavoriteSellersCount: (userId, callback) => {
    const sql = `
      SELECT COUNT(*) AS count FROM favorite_sellers
      WHERE user_id = ?
    `;
    db.query(sql, [userId], (err, rows) => {
      if (err) return callback(err);
      callback(null, rows[0].count);
    });
  },

  // Get recent listings from favorite sellers
  getFavoriteSellersListings: (userId, limit = 12, callback) => {
    const sql = `
      SELECT
        l.listing_id,
        l.title,
        l.price,
        l.condition_type,
        l.status,
        l.created_at,
        u.user_id AS seller_id,
        u.full_name AS seller_name,
        u.profile_picture AS seller_picture,
        li.image_url
      FROM listings l
      INNER JOIN users u ON l.seller_id = u.user_id
      INNER JOIN favorite_sellers fs ON fs.seller_id = u.user_id
      LEFT JOIN listing_images li ON li.listing_id = l.listing_id AND li.is_primary = 1
      WHERE fs.user_id = ? AND l.status = 'available'
      ORDER BY l.created_at DESC
      LIMIT ?
    `;
    db.query(sql, [userId, limit], callback);
  },

};

module.exports = FavoriteSellersModel;
