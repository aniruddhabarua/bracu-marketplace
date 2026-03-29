// routes/wishlistRoutes.js
const express             = require('express');
const router              = express.Router();
const WishlistController  = require('../controllers/wishlistControllers');
const { authenticate }    = require('../middleware/auth');

// All wishlist routes require authentication.
router.use(authenticate);

// GET    /api/wishlist                        — get my wishlist
router.get('/',                                 WishlistController.getWishlist);

// POST   /api/wishlist                        — add a listing to wishlist
router.post('/',                                WishlistController.addToWishlist);

// GET    /api/wishlist/check/:listing_id      — check if a listing is wishlisted
router.get('/check/:listing_id',                WishlistController.checkWishlist);

// DELETE /api/wishlist/:listing_id            — remove a listing from wishlist
router.delete('/:listing_id',                   WishlistController.removeFromWishlist);

module.exports = router;
