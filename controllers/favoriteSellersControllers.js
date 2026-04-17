// controllers/favoriteSellersControllers.js
const FavoriteSellersModel = require('../models/favoriteSellersModel');

const FavoriteSellersController = {

  // POST /api/favorite-sellers/:sellerId
  // Follow a seller
  followSeller: (req, res) => {
    // req.user should be set by JWT middleware
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    const userId = req.user.user_id;
    const sellerId = parseInt(req.params.sellerId);

    if (isNaN(sellerId)) {
      return res.status(400).json({ success: false, message: 'Invalid seller ID.' });
    }

    if (userId === sellerId) {
      return res.status(400).json({ success: false, message: 'You cannot follow yourself.' });
    }

    FavoriteSellersModel.addFavoriteSeller(userId, sellerId, (err, result) => {
      if (err) {
        if (err.code === 'ER_DUP_ENTRY') {
          return res.status(409).json({ success: false, message: 'Already following this seller.' });
        }
        return res.status(500).json({ success: false, message: 'Database error.', error: err.message });
      }

      return res.status(201).json({
        success: true,
        message: 'Seller followed successfully.',
        favorite_id: result.insertId,
      });
    });
  },

  // DELETE /api/favorite-sellers/:sellerId
  // Unfollow a seller
  unfollowSeller: (req, res) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    const userId = req.user.user_id;
    const sellerId = parseInt(req.params.sellerId);

    if (isNaN(sellerId)) {
      return res.status(400).json({ success: false, message: 'Invalid seller ID.' });
    }

    FavoriteSellersModel.removeFavoriteSeller(userId, sellerId, (err, result) => {
      if (err) {
        return res.status(500).json({ success: false, message: 'Database error.', error: err.message });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: 'Not following this seller.' });
      }

      return res.status(200).json({
        success: true,
        message: 'Seller unfollowed successfully.',
      });
    });
  },

  // GET /api/favorite-sellers/check/:sellerId
  // Check if user is following a seller
  checkFollowStatus: (req, res) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    const userId = req.user.user_id;
    const sellerId = parseInt(req.params.sellerId);

    if (isNaN(sellerId)) {
      return res.status(400).json({ success: false, message: 'Invalid seller ID.' });
    }

    FavoriteSellersModel.isFavoriteSeller(userId, sellerId, (err, isFavorite) => {
      if (err) {
        return res.status(500).json({ success: false, message: 'Database error.', error: err.message });
      }

      return res.status(200).json({
        success: true,
        is_favorite: isFavorite,
      });
    });
  },

  // GET /api/favorite-sellers
  // Get all favorite sellers for the logged-in user
  getFavoriteSellers: (req, res) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    const userId = req.user.user_id;

    FavoriteSellersModel.getFavoriteSellers(userId, (err, sellers) => {
      if (err) {
        return res.status(500).json({ success: false, message: 'Database error.', error: err.message });
      }

      return res.status(200).json({
        success: true,
        count: sellers.length,
        data: sellers,
      });
    });
  },

  // GET /api/favorite-sellers/listings
  // Get recent listings from all favorite sellers
  getFavoriteSellersListings: (req, res) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    const userId = req.user.user_id;
    const limit = parseInt(req.query.limit) || 12;

    FavoriteSellersModel.getFavoriteSellersListings(userId, limit, (err, listings) => {
      if (err) {
        return res.status(500).json({ success: false, message: 'Database error.', error: err.message });
      }

      return res.status(200).json({
        success: true,
        count: listings.length,
        data: listings,
      });
    });
  },

};

module.exports = FavoriteSellersController;
