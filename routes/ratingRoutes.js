const express = require('express');
const router = express.Router();
const {
  submitRating,
  getListingRatings,
  getSellerRatings,
  deleteRating,
} = require('../controllers/ratingController');

const { authenticate } = require('../middleware/auth');

router.get('/listing/:listing_id', getListingRatings);
router.get('/seller/:seller_id', getSellerRatings);

router.post('/', authenticate, submitRating);
router.delete('/:id', authenticate, deleteRating);

module.exports = router;