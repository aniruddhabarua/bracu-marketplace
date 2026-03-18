const db = require('../config/db');

const ListingModel = {

  
  create: (listingData, callback) => {
    const {
      seller_id, title, description,
      price, category, condition_type, location,
    } = listingData;

    const sql = `
      INSERT INTO listings
        (seller_id, title, description, price, category, condition_type, location, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'available')`;

    db.query(
      sql,
      [seller_id, title, description, price, category, condition_type, location || null],
      callback,
    );
  },

 
  addImage: (listingId, imageUrl, isPrimary, callback) => {
    db.query(
      `INSERT INTO listing_images (listing_id, image_url, is_primary)
       VALUES (?, ?, ?)`,
      [listingId, imageUrl, isPrimary ? 1 : 0],
      callback,
    );
  },

  
  getAll: (filters, callback) => {
    let sql = `
      SELECT
        l.listing_id,
        l.title,
        l.description,
        l.price,
        l.category,
        l.condition_type,
        l.location,
        l.status,
        l.created_at,
        u.full_name       AS seller_name,
        u.user_id         AS seller_id,
        u.profile_picture AS seller_avatar,
        img.image_url     AS primary_image
      FROM listings l
      JOIN users u ON u.user_id = l.seller_id
      LEFT JOIN listing_images img
        ON img.listing_id = l.listing_id AND img.is_primary = TRUE
      WHERE l.status = 'available'`;

    const params = [];

    if (filters.keyword) {
      sql += ` AND (l.title LIKE ? OR l.description LIKE ?)`;
      params.push(`%${filters.keyword}%`, `%${filters.keyword}%`);
    }
    if (filters.category) {
      sql += ` AND l.category = ?`;
      params.push(filters.category);
    }
    if (filters.condition_type) {
      sql += ` AND l.condition_type = ?`;
      params.push(filters.condition_type);
    }
    if (filters.minPrice !== undefined && filters.minPrice !== '') {
      sql += ` AND l.price >= ?`;
      params.push(Number(filters.minPrice));
    }
    if (filters.maxPrice !== undefined && filters.maxPrice !== '') {
      sql += ` AND l.price <= ?`;
      params.push(Number(filters.maxPrice));
    }

    sql += ` ORDER BY l.created_at DESC`;

    db.query(sql, params, callback);
  },

  
  findById: (listingId, callback) => {
    const sql = `
      SELECT
        l.*,
        u.full_name       AS seller_name,
        u.user_id         AS seller_id,
        u.profile_picture AS seller_avatar,
        u.department      AS seller_department
      FROM listings l
      JOIN users u ON u.user_id = l.seller_id
      WHERE l.listing_id = ?`;

    db.query(sql, [listingId], (err, rows) => {
      if (err) return callback(err);
      if (!rows.length) return callback(null, null);

      const listing = rows[0];

      
      db.query(
        `SELECT image_id, image_url, is_primary
         FROM listing_images WHERE listing_id = ? ORDER BY is_primary DESC`,
        [listingId],
        (err2, images) => {
          if (err2) return callback(err2);
          listing.images = images;
          callback(null, listing);
        },
      );
    });
  },

  
  update: (listingId, fields, callback) => {
    const allowed = ['title', 'description', 'price', 'category', 'condition_type', 'location', 'status'];
    const updates = [];
    const params  = [];

    allowed.forEach(key => {
      if (fields[key] !== undefined) {
        updates.push(`${key} = ?`);
        params.push(fields[key]);
      }
    });

    if (updates.length === 0) return callback(new Error('No valid fields to update.'));

    params.push(listingId);
    db.query(
      `UPDATE listings SET ${updates.join(', ')} WHERE listing_id = ?`,
      params,
      callback,
    );
  },

  delete: (listingId, callback) => {
    
    db.query('DELETE FROM listing_images WHERE listing_id = ?', [listingId], (err) => {
      if (err) return callback(err);
      db.query('DELETE FROM listings WHERE listing_id = ?', [listingId], callback);
    });
  },

  
  isOwner: (listingId, userId, callback) => {
    db.query(
      'SELECT listing_id FROM listings WHERE listing_id = ? AND seller_id = ?',
      [listingId, userId],
      (err, rows) => {
        if (err) return callback(err, false);
        callback(null, rows.length > 0);
      },
    );
  },

  
  getCategories: (callback) => {
    db.query(
      `SELECT DISTINCT category FROM listings
       WHERE category IS NOT NULL AND category != ''
       ORDER BY category ASC`,
      [],
      callback,
    );
  },

};

module.exports = ListingModel;