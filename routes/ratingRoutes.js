// routes/ratingRoutes.js
const express = require('express');
const router  = express.Router();
const {
  submitRating,
  getListingRatings,
  getSellerRatings,
  deleteRating,
} = require('../controllers/ratingController');

const { authenticate } = require('../middleware/auth'); // adjust path as needed

// ── Public routes (no auth needed to read reviews) ───────────
router.get('/listing/:listing_id', getListingRatings);  // GET /api/ratings/listing/:listing_id
router.get('/seller/:seller_id',   getSellerRatings);   // GET /api/ratings/seller/:seller_id

// ── Protected routes (must be logged in) ─────────────────────
router.post('/',      authenticate, submitRating);    // POST   /api/ratings
router.delete('/:id', authenticate, deleteRating);   // DELETE /api/ratings/:id

module.exports = router;