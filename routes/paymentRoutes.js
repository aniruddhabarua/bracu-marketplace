// routes/paymentRoutes.js
const express           = require('express');
const router            = express.Router();
const PaymentController = require('../controllers/paymentControllers');
const { authenticate }  = require('../middleware/auth');

// All payment routes require login
router.use(authenticate);

// POST   /api/payments/orders             — place a new order
router.post('/orders',               PaymentController.createOrder);

// GET    /api/payments/orders             — all my orders (buyer + seller)
router.get('/orders',                PaymentController.getMyOrders);

// GET    /api/payments/orders/:id         — single order detail
router.get('/orders/:id',            PaymentController.getOrder);

// PUT    /api/payments/orders/:id/status  — update order status
router.put('/orders/:id/status',     PaymentController.updateOrderStatus);

// PUT    /api/payments/orders/:id/payment — seller marks payment as paid
router.put('/orders/:id/payment',    PaymentController.updatePaymentStatus);

module.exports = router;
