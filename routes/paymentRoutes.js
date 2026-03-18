// routes/paymentRoutes.js
const express           = require('express');
const router            = express.Router();
const PaymentController = require('../controllers/paymentControllers');

// All payment routes require authentication.
// Plug in your JWT middleware here:
//   const { authenticate } = require('../middleware/auth');
//   router.use(authenticate);

// POST   /api/payments/orders          — place a new order
router.post('/orders',                    PaymentController.createOrder);

// GET    /api/payments/orders          — get all my orders (buyer + seller)
router.get('/orders',                     PaymentController.getMyOrders);

// GET    /api/payments/orders/:id      — get a single order
router.get('/orders/:id',                 PaymentController.getOrder);

// PUT    /api/payments/orders/:id/status  — update order status
router.put('/orders/:id/status',          PaymentController.updateOrderStatus);

// PUT    /api/payments/orders/:id/payment — seller confirms payment received
router.put('/orders/:id/payment',         PaymentController.updatePaymentStatus);

// GET    /api/payments/history         — get transaction history
router.get('/history',                    PaymentController.getHistory);

module.exports = router;
