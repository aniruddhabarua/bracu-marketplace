// controllers/transactionControllers.js
// Handles Transaction History (FR-16: Users can view past purchases and sales)
const TransactionModel = require('../models/transactionModel');

const TransactionController = {

  // ── GET /api/transactions ─────────────────────────────────────
  // Returns full transaction history for the logged-in user
  // Optional query params: ?type=purchase|sale
  //                        &order_status=completed|cancelled
  //                        &from=YYYY-MM-DD &to=YYYY-MM-DD
  getHistory: (req, res) => {
    const userId  = req.user.user_id;
    const filters = {
      type:         req.query.type         || null,
      order_status: req.query.order_status || null,
      from:         req.query.from         || null,
      to:           req.query.to           || null,
    };

    TransactionModel.getHistory(userId, filters, (err, rows) => {
      if (err) return res.status(500).json({
        success: false, message: 'Database error.', error: err.message,
      });
      return res.status(200).json({
        success: true,
        count:   rows.length,
        data:    rows,
      });
    });
  },

  // ── GET /api/transactions/summary ────────────────────────────
  // Returns totals: total_spent, total_earned, counts
  getSummary: (req, res) => {
    TransactionModel.getSummary(req.user.user_id, (err, rows) => {
      if (err) return res.status(500).json({ success: false, message: 'Database error.' });
      const summary = rows[0] || {};
      return res.status(200).json({
        success: true,
        data: {
          total_spent:        parseFloat(summary.total_spent)    || 0,
          total_earned:       parseFloat(summary.total_earned)   || 0,
          total_purchases:    parseInt(summary.total_purchases)  || 0,
          total_sales:        parseInt(summary.total_sales)      || 0,
          total_transactions: parseInt(summary.total_transactions) || 0,
          net:                (parseFloat(summary.total_earned) || 0) -
                              (parseFloat(summary.total_spent)  || 0),
        },
      });
    });
  },

  // ── GET /api/transactions/chart ───────────────────────────────
  // Returns monthly breakdown for the last 6 months (for chart)
  getChart: (req, res) => {
    TransactionModel.getMonthlyBreakdown(req.user.user_id, (err, rows) => {
      if (err) return res.status(500).json({ success: false, message: 'Database error.' });
      return res.status(200).json({ success: true, data: rows });
    });
  },

  // ── GET /api/transactions/:id ─────────────────────────────────
  // Returns a single transaction's full detail
  getOne: (req, res) => {
    const txnId  = parseInt(req.params.id);
    const userId = req.user.user_id;

    if (isNaN(txnId))
      return res.status(400).json({ success: false, message: 'Invalid transaction ID.' });

    TransactionModel.findById(txnId, userId, (err, rows) => {
      if (err)          return res.status(500).json({ success: false, message: 'Database error.' });
      if (!rows.length) return res.status(404).json({ success: false, message: 'Transaction not found.' });
      return res.status(200).json({ success: true, data: rows[0] });
    });
  },

};

module.exports = TransactionController;
