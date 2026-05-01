const db = require('../config/db');

const TransactionModel = {

  getHistory: (userId, filters, callback) => {
    let sql = `
      SELECT
        th.transaction_id,
        th.type,
        th.amount,
        th.created_at,
        o.order_id,
        o.order_status,
        o.payment_status,
        o.payment_method,
        o.notes,
        l.listing_id,
        l.title          AS listing_title,
        l.category       AS listing_category,
        l.condition_type AS listing_condition,
        img.image_url    AS listing_image,
        buyer.full_name  AS buyer_name,
        buyer.user_id    AS buyer_id,
        seller.full_name AS seller_name,
        seller.user_id   AS seller_id
      FROM transaction_history th
      JOIN orders  o      ON o.order_id    = th.order_id
      JOIN listings l     ON l.listing_id  = o.listing_id
      JOIN users   buyer  ON buyer.user_id = o.buyer_id
      JOIN users   seller ON seller.user_id= o.seller_id
      LEFT JOIN listing_images img
        ON img.listing_id = l.listing_id AND img.is_primary = TRUE
      WHERE th.user_id = ?`;

    const params = [userId];

    if (filters.listing_id) {
      sql += ' AND l.listing_id = ?';
      params.push(filters.listing_id);
    }

    if (filters.type && ['purchase', 'sale'].includes(filters.type)) {
      sql += ' AND th.type = ?';
      params.push(filters.type);
    }

    if (filters.order_status) {
      sql += ' AND o.order_status = ?';
      params.push(filters.order_status);
    }

    if (filters.from) {
      sql += ' AND th.created_at >= ?';
      params.push(filters.from);
    }
    if (filters.to) {
      sql += ' AND th.created_at <= ?';
      params.push(filters.to + ' 23:59:59');
    }

    sql += ' ORDER BY th.created_at DESC';

    db.query(sql, params, callback);
  },

  getSummary: (userId, callback) => {
    const sql = `
      SELECT
        SUM(CASE WHEN th.type = 'purchase' THEN th.amount ELSE 0 END) AS total_spent,
        SUM(CASE WHEN th.type = 'sale'     THEN th.amount ELSE 0 END) AS total_earned,
        COUNT(CASE WHEN th.type = 'purchase' THEN 1 END)              AS total_purchases,
        COUNT(CASE WHEN th.type = 'sale'     THEN 1 END)              AS total_sales,
        COUNT(*)                                                       AS total_transactions
      FROM transaction_history th
      JOIN orders o ON o.order_id = th.order_id
      WHERE th.user_id = ?
        AND o.order_status = 'completed'`;
    db.query(sql, [userId], callback);
  },

  findById: (transactionId, userId, callback) => {
    const sql = `
      SELECT
        th.*,
        o.order_id,
        o.order_status,
        o.payment_status,
        o.payment_method,
        o.agreed_price,
        o.notes,
        o.created_at     AS order_date,
        o.updated_at     AS order_updated,
        l.listing_id,
        l.title          AS listing_title,
        l.description    AS listing_description,
        l.category       AS listing_category,
        l.condition_type AS listing_condition,
        l.location       AS listing_location,
        img.image_url    AS listing_image,
        buyer.full_name  AS buyer_name,
        buyer.email      AS buyer_email,
        buyer.department AS buyer_department,
        seller.full_name AS seller_name,
        seller.email     AS seller_email,
        seller.department AS seller_department
      FROM transaction_history th
      JOIN orders   o      ON o.order_id     = th.order_id
      JOIN listings l      ON l.listing_id   = o.listing_id
      JOIN users    buyer  ON buyer.user_id  = o.buyer_id
      JOIN users    seller ON seller.user_id = o.seller_id
      LEFT JOIN listing_images img
        ON img.listing_id = l.listing_id AND img.is_primary = TRUE
      WHERE th.transaction_id = ? AND th.user_id = ?`;
    db.query(sql, [transactionId, userId], callback);
  },

  getMonthlyBreakdown: (userId, callback) => {
    const sql = `
      SELECT
        DATE_FORMAT(th.created_at, '%Y-%m') AS month,
        SUM(CASE WHEN th.type = 'purchase' THEN th.amount ELSE 0 END) AS spent,
        SUM(CASE WHEN th.type = 'sale'     THEN th.amount ELSE 0 END) AS earned,
        COUNT(*) AS count
      FROM transaction_history th
      JOIN orders o ON o.order_id = th.order_id
      WHERE th.user_id = ?
        AND th.created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
      GROUP BY DATE_FORMAT(th.created_at, '%Y-%m')
      ORDER BY month ASC`;
    db.query(sql, [userId], callback);
  },

};

module.exports = TransactionModel;