const db = require('../config/db');

const Rating = {
  // ── Create ────────────────────────────────────────────────────

  create({ reviewer_id, seller_id, listing_id, rating, comment }) {
    const sql = `
      INSERT INTO reviews (reviewer_id, seller_id, listing_id, rating, comment, created_at)
      VALUES (?, ?, ?, ?, ?, NOW())
    `;
    return db.promise().query(sql, [reviewer_id, seller_id, listing_id, rating, comment]);
  },

  // ── Read: reviews for a specific listing ─────────────────────

  getByListing(listing_id) {
    const sql = `
      SELECT
        r.id,
        r.rating,
        r.comment,
        r.created_at,
        r.reviewer_id,
        u.name   AS reviewer_name,
        u.avatar AS reviewer_avatar
      FROM reviews r
      JOIN users u ON u.id = r.reviewer_id
      WHERE r.listing_id = ?
      ORDER BY r.created_at DESC
    `;
    return db.promise().query(sql, [listing_id]);
  },

  // ── Read: reviews received by a seller (profile page) ────────

  getBySeller(seller_id) {
    const sql = `
      SELECT
        r.id,
        r.rating,
        r.comment,
        r.created_at,
        r.listing_id,
        r.reviewer_id,
        u.name    AS reviewer_name,
        u.avatar  AS reviewer_avatar,
        l.title   AS listing_title
      FROM reviews r
      JOIN users u ON u.id = r.reviewer_id
      LEFT JOIN listings l ON l.id = r.listing_id
      WHERE r.seller_id = ?
      ORDER BY r.created_at DESC
    `;
    return db.promise().query(sql, [seller_id]);
  },

  // ── Aggregate: average rating + count for a seller ───────────

  getSellerStats(seller_id) {
    const sql = `
      SELECT
        COUNT(*)    AS total_reviews,
        AVG(rating) AS average_rating
      FROM reviews
      WHERE seller_id = ?
    `;
    return db.promise().query(sql, [seller_id]);
  },

  // ── Aggregate: average rating + count for a listing ──────────

  getListingStats(listing_id) {
    const sql = `
      SELECT
        COUNT(*)    AS total_reviews,
        AVG(rating) AS average_rating
      FROM reviews
      WHERE listing_id = ?
    `;
    return db.promise().query(sql, [listing_id]);
  },

  // ── Guard: has this user already reviewed this listing? ───────

  hasReviewed({ reviewer_id, listing_id }) {
    const sql = `
      SELECT review_id FROM reviews
      WHERE reviewer_id = ? AND listing_id = ?
      LIMIT 1
    `;
    return db.promise().query(sql, [reviewer_id, listing_id]);
  },

  // ── Delete (owner or admin) ───────────────────────────────────

  delete({ id, reviewer_id }) {
    const sql = `DELETE FROM reviews WHERE id = ? AND reviewer_id = ?`;
    return db.promise().query(sql, [id, reviewer_id]);
  },
};

module.exports = Rating;