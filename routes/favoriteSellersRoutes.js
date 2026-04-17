const express = require('express');
const router = express.Router();
const FavoriteSellersController = require('../controllers/favoriteSellersControllers');
const { authenticate } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

// POST /api/favorite-sellers/:sellerId - Follow a seller
router.post('/:sellerId', FavoriteSellersController.followSeller);

// DELETE /api/favorite-sellers/:sellerId - Unfollow a seller
router.delete('/:sellerId', FavoriteSellersController.unfollowSeller);

// GET /api/favorite-sellers/check/:sellerId - Check if following
router.get('/check/:sellerId', FavoriteSellersController.checkFollowStatus);

// GET /api/favorite-sellers - Get all favorite sellers
router.get('/', FavoriteSellersController.getFavoriteSellers);

// GET /api/favorite-sellers/listings - Get listings from favorite sellers
router.get('/listings/all', FavoriteSellersController.getFavoriteSellersListings);

module.exports = router;
