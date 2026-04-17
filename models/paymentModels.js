// models/paymentModels.js
// Database queries for Feature 5: Online & Offline Payment
const db = require('../db');

const PaymentModel = {

  // ── Create a new order/payment record ────────────────────────
  createOrder: (orderData, callback) => {
    const {
      listing_id, buyer_id, seller_id,
      agreed_price, payment_method, notes
    } = orderData;

    const sql = `
      INSERT INTO orders
        (listing_id, buyer_id, seller_id, agreed_price, payment_method, notes,
         payment_status, order_status)
      VALUES (?, ?, ?, ?, ?, ?, 'pending', 'pending')`;

    db.query(sql,
      [listing_id, buyer_id, seller_id, agreed_price, payment_method, notes || null],
      (err, result) => {
        if (err) return callback(err);
        // Mark listing as reserved
        db.query(
          "UPDATE listings SET status = 'reserved' WHERE listing_id = ?",
          [listing_id],
          () => {}
        );
        callback(null, result);
      }
    );
  },

  // ── Get a single order by ID ──────────────────────────────────
  findById: (orderId, callback) => {
    const sql = `
      SELECT
        o.*,
        l.title        AS listing_title,
        l.price        AS listing_price,
        b.full_name    AS buyer_name,
        b.email        AS buyer_email,
        s.full_name    AS seller_name,
        s.email        AS seller_email,
        img.image_url  AS listing_image
      FROM orders o
      JOIN listings l      ON l.listing_id  = o.listing_id
      JOIN users    b      ON b.user_id     = o.buyer_id
      JOIN users    s      ON s.user_id     = o.seller_id
      LEFT JOIN listing_images img
        ON img.listing_id = o.listing_id AND img.is_primary = TRUE
      WHERE o.order_id = ?`;
    db.query(sql, [orderId], callback);
  },

  // ── Get all orders for a user (as buyer OR seller) ───────────
  getOrdersForUser: (userId, callback) => {
    const sql = `
      SELECT
        o.*,
        l.title       AS listing_title,
        img.image_url AS listing_image,
        b.full_name   AS buyer_name,
        s.full_name   AS seller_name
      FROM orders o
      JOIN listings l ON l.listing_id = o.listing_id
      JOIN users b    ON b.user_id    = o.buyer_id
      JOIN users s    ON s.user_id    = o.seller_id
      LEFT JOIN listing_images img
        ON img.listing_id = o.listing_id AND img.is_primary = TRUE
      WHERE o.buyer_id = ? OR o.seller_id = ?
      ORDER BY o.created_at DESC`;
    db.query(sql, [userId, userId], callback);
  },

  // ── Update order status (confirmed / completed / cancelled) ──
  updateOrderStatus: (orderId, order_status, callback) => {
    db.query(
      'UPDATE orders SET order_status = ? WHERE order_id = ?',
      [order_status, orderId],
      (err, result) => {
        if (err) return callback(err);
        // If completed → mark listing as sold
        if (order_status === 'completed') {
          db.query(
            `UPDATE listings SET status = 'sold'
             WHERE listing_id = (SELECT listing_id FROM orders WHERE order_id = ?)`,
            [orderId], () => {}
          );
        }
        // If cancelled → free the listing back to available
        if (order_status === 'cancelled') {
          db.query(
            `UPDATE listings SET status = 'available'
             WHERE listing_id = (SELECT listing_id FROM orders WHERE order_id = ?)`,
            [orderId], () => {}
          );
        }
        callback(null, result);
      }
    );
  },

  // ── Update payment status (paid / failed / refunded) ─────────
  updatePaymentStatus: (orderId, payment_status, callback) => {
    db.query(
      'UPDATE orders SET payment_status = ? WHERE order_id = ?',
      [payment_status, orderId],
      callback
    );
  },

  // ── Record transaction history entry ─────────────────────────
  recordTransaction: (orderId, userId, type, amount, callback) => {
    db.query(
      `INSERT INTO transaction_history (order_id, user_id, type, amount)
       VALUES (?, ?, ?, ?)`,
      [orderId, userId, type, amount],
      callback
    );
  },

  // ── Get transaction history for a user ───────────────────────
  getTransactionHistory: (userId, callback) => {
    const sql = `
      SELECT
        th.*,
        o.order_status,
        o.payment_method,
        o.payment_status,
        l.title        AS listing_title,
        img.image_url  AS listing_image
      FROM transaction_history th
      JOIN orders  o   ON o.order_id   = th.order_id
      JOIN listings l  ON l.listing_id = o.listing_id
      LEFT JOIN listing_images img
        ON img.listing_id = o.listing_id AND img.is_primary = TRUE
      WHERE th.user_id = ?
      ORDER BY th.created_at DESC`;
    db.query(sql, [userId], callback);
  },

};

module.exports = PaymentModel;
