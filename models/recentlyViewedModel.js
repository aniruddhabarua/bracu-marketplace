const db = require('../db');

const RecentlyViewedModel = {

  addOrUpdate: (userId, listingId, callback) => {
 
    db.query(
      'SELECT view_id FROM recently_viewed WHERE user_id = ? AND listing_id = ?',
      [userId, listingId],
      (err, rows) => {
        if (err) return callback(err);
        
        if (rows.length > 0) {
          
          db.query(
            'UPDATE recently_viewed SET viewed_at = NOW() WHERE user_id = ? AND listing_id = ?',
            [userId, listingId],
            callback
          );
        } else {
          db.query(
            'INSERT INTO recently_viewed (user_id, listing_id) VALUES (?, ?)',
            [userId, listingId],
            callback
          );
        }
      }
    );
  },


  getForUser: (userId, limit = 12, callback) => {
    const sql = `
      SELECT
        rv.view_id,
        rv.viewed_at,
        l.listing_id,
        l.title,
        l.price,
        l.category,
        l.condition_type,
        l.status,
        l.seller_id,
        u.full_name AS seller_name,
        img.image_url AS primary_image
      FROM recently_viewed rv
      JOIN listings l ON l.listing_id = rv.listing_id
      JOIN users u ON u.user_id = l.seller_id
      LEFT JOIN listing_images img
        ON img.listing_id = l.listing_id AND img.is_primary = TRUE
      WHERE rv.user_id = ? AND l.status != 'removed'
      ORDER BY rv.viewed_at DESC
      LIMIT ?
    `;
    db.query(sql, [userId, limit], callback);
  },

};

module.exports = RecentlyViewedModel;