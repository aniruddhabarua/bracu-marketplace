// controllers/wishlistControllers.js
// Handles Feature 9: Wishlist
const WishlistModel     = require('../models/wishlistModels');
const NotificationModel = require('../models/notificationModels');

const WishlistController = {

  // ── GET /api/wishlist ─────────────────────────────────────────
  // Get all wishlisted items for the logged-in user
  getWishlist: (req, res) => {
    WishlistModel.getForUser(req.user.user_id, (err, items) => {
      if (err) return res.status(500).json({ success: false, message: 'Database error.', error: err.message });
      return res.status(200).json({ success: true, count: items.length, data: items });
    });
  },

  // ── POST /api/wishlist ────────────────────────────────────────
  // Add a listing to wishlist
  // Body: { listing_id }
  addToWishlist: (req, res) => {
    console.log('=== addToWishlist called ===');
    console.log('req.user:', req.user);
    console.log('req.body:', req.body);
    
    if (!req.user) {
      console.log('ERROR: req.user is undefined');
      return res.status(401).json({ success: false, message: 'User not authenticated.' });
    }
    
    const userId    = req.user.user_id;
    const listingId = parseInt(req.body.listing_id);

    console.log('userId:', userId, 'listingId:', listingId);

    if (!listingId || isNaN(listingId))
      return res.status(400).json({ success: false, message: 'listing_id is required.' });

    // Check if already wishlisted
    WishlistModel.exists(userId, listingId, (err, already) => {
      if (err) return res.status(500).json({ success: false, message: 'Database error.' });
      if (already)
        return res.status(409).json({ success: false, message: 'Already in your wishlist.' });

      WishlistModel.add(userId, listingId, (err2) => {
        if (err2) {
          console.log('ERROR adding to wishlist:', err2);
          return res.status(500).json({ success: false, message: 'Database error.', error: err2.message });
        }
        console.log('Successfully added to wishlist');
        return res.status(201).json({ success: true, message: 'Added to wishlist.' });
      });
    });
  },

  // ── DELETE /api/wishlist/:listing_id ─────────────────────────
  // Remove a listing from wishlist
  removeFromWishlist: (req, res) => {
    const userId    = req.user.user_id;
    const listingId = parseInt(req.params.listing_id);

    if (isNaN(listingId))
      return res.status(400).json({ success: false, message: 'Invalid listing ID.' });

    WishlistModel.remove(userId, listingId, (err, result) => {
      if (err) return res.status(500).json({ success: false, message: 'Database error.' });
      if (result.affectedRows === 0)
        return res.status(404).json({ success: false, message: 'Item not found in your wishlist.' });
      return res.status(200).json({ success: true, message: 'Removed from wishlist.' });
    });
  },

  // ── GET /api/wishlist/check/:listing_id ──────────────────────
  // Check if a specific listing is in the user's wishlist
  // (Used on listing detail pages to toggle the heart icon)
  checkWishlist: (req, res) => {
    const userId    = req.user.user_id;
    const listingId = parseInt(req.params.listing_id);

    if (isNaN(listingId))
      return res.status(400).json({ success: false, message: 'Invalid listing ID.' });

    WishlistModel.exists(userId, listingId, (err, exists) => {
      if (err) return res.status(500).json({ success: false, message: 'Database error.' });
      return res.status(200).json({ success: true, in_wishlist: exists });
    });
  },

};

module.exports = WishlistController;
