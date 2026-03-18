// controllers/paymentControllers.js
// Handles Feature 5: Online & Offline Payment
const PaymentModel       = require('../models/paymentModels');
const NotificationModel  = require('../models/notificationModels');

const VALID_METHODS  = ['online', 'offline', 'bkash', 'nagad', 'rocket', 'bank'];
const VALID_STATUSES = ['confirmed', 'completed', 'cancelled', 'disputed'];

const PaymentController = {

  // ── POST /api/payments/orders ─────────────────────────────────
  // Body: { listing_id, seller_id, agreed_price, payment_method, notes }
  createOrder: (req, res) => {
    const buyer_id = req.user.user_id;
    const { listing_id, seller_id, agreed_price, payment_method, notes } = req.body;

    // Validation
    if (!listing_id || !seller_id || !agreed_price)
      return res.status(400).json({ success: false, message: 'listing_id, seller_id and agreed_price are required.' });

    if (buyer_id === parseInt(seller_id))
      return res.status(400).json({ success: false, message: 'You cannot buy your own listing.' });

    if (!VALID_METHODS.includes(payment_method))
      return res.status(400).json({ success: false, message: `payment_method must be one of: ${VALID_METHODS.join(', ')}.` });

    if (parseFloat(agreed_price) <= 0)
      return res.status(400).json({ success: false, message: 'agreed_price must be greater than 0.' });

    const orderData = {
      listing_id:     parseInt(listing_id),
      buyer_id,
      seller_id:      parseInt(seller_id),
      agreed_price:   parseFloat(agreed_price),
      payment_method,
      notes,
    };

    PaymentModel.createOrder(orderData, (err, result) => {
      if (err) return res.status(500).json({ success: false, message: 'Database error.', error: err.message });

      const orderId = result.insertId;

      // Notify seller about the new order
      NotificationModel.create(
        parseInt(seller_id),
        'order',
        'New Order Received',
        `You have a new order for your listing. Payment method: ${payment_method}.`,
        `/views/orders.html?id=${orderId}`,
        () => {}
      );

      // Emit real-time notification if Socket.IO is available
      if (req.io) {
        req.io.to(`user:${seller_id}`).emit('notification', {
          type:  'order',
          title: 'New Order Received',
          body:  `Payment method: ${payment_method}`,
        });
      }

      return res.status(201).json({
        success:  true,
        message:  'Order placed successfully.',
        order_id: orderId,
        payment_method,
        note: payment_method === 'offline'
          ? 'Please arrange payment directly with the seller.'
          : `Please complete your ${payment_method} payment and share the transaction ID with the seller.`,
      });
    });
  },

  // ── GET /api/payments/orders ──────────────────────────────────
  // Get all orders for the logged-in user (as buyer or seller)
  getMyOrders: (req, res) => {
    PaymentModel.getOrdersForUser(req.user.user_id, (err, orders) => {
      if (err) return res.status(500).json({ success: false, message: 'Database error.', error: err.message });
      return res.status(200).json({ success: true, data: orders });
    });
  },

  // ── GET /api/payments/orders/:id ─────────────────────────────
  // Get a single order's details
  getOrder: (req, res) => {
    const orderId = parseInt(req.params.id);
    if (isNaN(orderId))
      return res.status(400).json({ success: false, message: 'Invalid order ID.' });

    PaymentModel.findById(orderId, (err, rows) => {
      if (err)          return res.status(500).json({ success: false, message: 'Database error.' });
      if (!rows.length) return res.status(404).json({ success: false, message: 'Order not found.' });

      const order = rows[0];
      const userId = req.user.user_id;

      // Only buyer or seller can view the order
      if (order.buyer_id !== userId && order.seller_id !== userId)
        return res.status(403).json({ success: false, message: 'Access denied.' });

      return res.status(200).json({ success: true, data: order });
    });
  },

  // ── PUT /api/payments/orders/:id/status ──────────────────────
  // Seller confirms/completes/cancels an order
  // Body: { order_status }
  updateOrderStatus: (req, res) => {
    const orderId      = parseInt(req.params.id);
    const { order_status } = req.body;
    const userId       = req.user.user_id;

    if (!VALID_STATUSES.includes(order_status))
      return res.status(400).json({ success: false, message: `order_status must be one of: ${VALID_STATUSES.join(', ')}.` });

    PaymentModel.findById(orderId, (err, rows) => {
      if (err)          return res.status(500).json({ success: false, message: 'Database error.' });
      if (!rows.length) return res.status(404).json({ success: false, message: 'Order not found.' });

      const order = rows[0];
      if (order.buyer_id !== userId && order.seller_id !== userId)
        return res.status(403).json({ success: false, message: 'Access denied.' });

      PaymentModel.updateOrderStatus(orderId, order_status, (err2) => {
        if (err2) return res.status(500).json({ success: false, message: 'Database error.' });

        // Record transaction history when order is completed
        if (order_status === 'completed') {
          PaymentModel.recordTransaction(orderId, order.buyer_id,  'purchase', order.agreed_price, () => {});
          PaymentModel.recordTransaction(orderId, order.seller_id, 'sale',     order.agreed_price, () => {});
        }

        // Notify the other party
        const notifyUserId = userId === order.buyer_id ? order.seller_id : order.buyer_id;
        const messages = {
          confirmed:  'Your order has been confirmed by the seller.',
          completed:  'Your transaction has been marked as completed!',
          cancelled:  'An order has been cancelled.',
          disputed:   'A dispute has been raised on an order.',
        };
        NotificationModel.create(
          notifyUserId, 'order',
          `Order ${order_status.charAt(0).toUpperCase() + order_status.slice(1)}`,
          messages[order_status],
          `/views/orders.html?id=${orderId}`,
          () => {}
        );

        if (req.io) {
          req.io.to(`user:${notifyUserId}`).emit('notification', {
            type: 'order', title: `Order ${order_status}`, body: messages[order_status],
          });
        }

        return res.status(200).json({ success: true, message: `Order marked as ${order_status}.` });
      });
    });
  },

  // ── PUT /api/payments/orders/:id/payment ─────────────────────
  // Confirm payment received (seller marks payment as paid)
  // Body: { payment_status }
  updatePaymentStatus: (req, res) => {
    const orderId        = parseInt(req.params.id);
    const { payment_status } = req.body;
    const userId         = req.user.user_id;

    const validPayStatuses = ['paid', 'failed', 'refunded'];
    if (!validPayStatuses.includes(payment_status))
      return res.status(400).json({ success: false, message: `payment_status must be one of: ${validPayStatuses.join(', ')}.` });

    PaymentModel.findById(orderId, (err, rows) => {
      if (err)          return res.status(500).json({ success: false, message: 'Database error.' });
      if (!rows.length) return res.status(404).json({ success: false, message: 'Order not found.' });

      const order = rows[0];
      if (order.seller_id !== userId)
        return res.status(403).json({ success: false, message: 'Only the seller can confirm payment.' });

      PaymentModel.updatePaymentStatus(orderId, payment_status, (err2) => {
        if (err2) return res.status(500).json({ success: false, message: 'Database error.' });

        // Notify buyer
        NotificationModel.create(
          order.buyer_id, 'payment',
          'Payment Status Updated',
          `Your payment for "${order.listing_title}" has been marked as ${payment_status}.`,
          `/views/orders.html?id=${orderId}`,
          () => {}
        );

        return res.status(200).json({ success: true, message: `Payment marked as ${payment_status}.` });
      });
    });
  },

  // ── GET /api/payments/history ─────────────────────────────────
  // Get the logged-in user's full transaction history
  getHistory: (req, res) => {
    PaymentModel.getTransactionHistory(req.user.user_id, (err, rows) => {
      if (err) return res.status(500).json({ success: false, message: 'Database error.', error: err.message });
      return res.status(200).json({ success: true, data: rows });
    });
  },

};

module.exports = PaymentController;
