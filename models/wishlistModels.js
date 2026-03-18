// models/wishlistModels.js
// Database queries for Feature 9: Wishlist
const db = require('../config/db');

const WishlistModel = {

  // ── Get all wishlist items for a user ─────────────────────────
  getForUser: (userId, callback) => {
    const sql = `
      SELECT
        w.wishlist_id,
        w.added_at,
        l.listing_id,
        l.title,
        l.price,
        l.condition_type,
        l.status,
        s.full_name    AS seller_name,
        s.user_id      AS seller_id,
        img.image_url  AS primary_image
      FROM wishlist w
      JOIN listings l ON l.listing_id = w.listing_id
      JOIN users    s ON s.user_id    = l.seller_id
      LEFT JOIN listing_images img
        ON img.listing_id = l.listing_id AND img.is_primary = TRUE
      WHERE w.user_id = ?
      ORDER BY w.added_at DESC`;
    db.query(sql, [userId], callback);
  },

  // ── Check if a listing is already in user's wishlist ──────────
  exists: (userId, listingId, callback) => {
    db.query(
      'SELECT wishlist_id FROM wishlist WHERE user_id = ? AND listing_id = ?',
      [userId, listingId],
      (err, rows) => {
        if (err) return callback(err, false);
        callback(null, rows.length > 0, rows[0]?.wishlist_id);
      }
    );
  },

  // ── Add a listing to wishlist ─────────────────────────────────
  add: (userId, listingId, callback) => {
    db.query(
      'INSERT IGNORE INTO wishlist (user_id, listing_id) VALUES (?, ?)',
      [userId, listingId],
      callback
    );
  },

  // ── Remove a listing from wishlist ────────────────────────────
  remove: (userId, listingId, callback) => {
    db.query(
      'DELETE FROM wishlist WHERE user_id = ? AND listing_id = ?',
      [userId, listingId],
      callback
    );
  },

  // ── Count how many users have wishlisted a listing ───────────
  countForListing: (listingId, callback) => {
    db.query(
      'SELECT COUNT(*) AS total FROM wishlist WHERE listing_id = ?',
      [listingId],
      callback
    );
  },

};

module.exports = WishlistModel;
