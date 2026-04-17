const RecentlyViewedModel = require('../models/recentlyViewedModel');

const RecentlyViewedController = {

  trackView: (req, res) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    const userId = req.user.user_id;
    const listingId = parseInt(req.body.listing_id);

    if (isNaN(listingId)) {
      return res.status(400).json({ success: false, message: 'Invalid listing ID.' });
    }

    RecentlyViewedModel.addOrUpdate(userId, listingId, (err) => {
      if (err) {
        console.error('Error tracking recent view:', err);
        return res.status(500).json({ success: false, message: 'Database error.' });
      }

      return res.status(200).json({ success: true, message: 'View tracked.' });
    });
  },
  getRecentlyViewed: (req, res) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    const userId = req.user.user_id;
    const limit = parseInt(req.query.limit) || 12;

    RecentlyViewedModel.getForUser(userId, limit, (err, items) => {
      if (err) {
        return res.status(500).json({ success: false, message: 'Database error.', error: err.message });
      }

      return res.status(200).json({
        success: true,
        count: items.length,
        data: items,
      });
    });
  },

};

module.exports = RecentlyViewedController;