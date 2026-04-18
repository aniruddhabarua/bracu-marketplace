// routes/transactionRoutes.js
const express                 = require('express');
const router                  = express.Router();
const TransactionController   = require('../controllers/transactionControllers');
const { authenticate }        = require('../middleware/auth');

// All routes require login
router.use(authenticate);

// GET /api/transactions             — full history (filterable)
router.get('/',          TransactionController.getHistory);

// GET /api/transactions/summary     — totals: spent, earned, counts
router.get('/summary',   TransactionController.getSummary);

// GET /api/transactions/chart       — monthly breakdown (last 6 months)
router.get('/chart',     TransactionController.getChart);

// GET /api/transactions/:id         — single transaction detail
router.get('/:id',       TransactionController.getOne);

module.exports = router;
