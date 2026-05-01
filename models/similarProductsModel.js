const db = require('../config/db');

const SimilarProductsModel = {

  getSimilarByCategory: (category, excludeListingId, limit, callback) => {
    const sql = `
      SELECT
        l.listing_id,
        l.title,
        l.description,
        l.price,
        l.category,
        l.condition_type,
        l.status,
        l.created_at,
        u.full_name AS seller_name,
        u.user_id AS seller_id,
        img.image_url AS primary_image,
        (SELECT AVG(rating) FROM reviews WHERE seller_id = u.user_id) AS avg_rating,
        (SELECT COUNT(review_id) FROM reviews WHERE seller_id = u.user_id) AS total_reviews
      FROM listings l
      JOIN users u ON u.user_id = l.seller_id
      LEFT JOIN listing_images img
        ON img.listing_id = l.listing_id AND img.is_primary = TRUE
      WHERE l.category = ? 
        AND l.listing_id != ?
        AND l.status = 'available'
      ORDER BY l.created_at DESC
      LIMIT ?
    `;

    db.query(sql, [category, excludeListingId, limit], callback);
  },

};

module.exports = SimilarProductsModel;
