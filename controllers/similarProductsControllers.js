const ListingModel = require('../models/listingModel');
const SimilarProductsModel = require('../models/similarProductsModel');

const SimilarProductsController = {

  getSimilarProducts: (req, res) => {
    const listingId = parseInt(req.params.id);
    const limit = Math.min(parseInt(req.query.limit) || 6, 20);

    if (isNaN(listingId)) {
      return res.status(400).json({ success: false, message: 'Invalid listing ID.' });
    }

    ListingModel.findById(listingId, (err, listing) => {
      if (err) {
        return res.status(500).json({ success: false, message: 'Database error.' });
      }
      if (!listing) {
        return res.status(404).json({ success: false, message: 'Listing not found.' });
      }

      SimilarProductsModel.getSimilarByCategory(listing.category, listingId, limit, (err2, products) => {
        if (err2) {
          return res.status(500).json({ success: false, message: 'Database error.' });
        }

        return res.status(200).json({ success: true, data: products || [] });
      });
    });
  },

};

module.exports = SimilarProductsController;
