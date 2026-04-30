// controllers/ratingController.js
const Rating = require('../models/ratingModel');

// ── POST /api/ratings ─────────────────────────────────────────
// Submit a new review for a listing/seller
const submitRating = async (req, res) => {
  try {
    const reviewer_id = req.user?.user_id; // assumes auth middleware sets req.user
    if (!reviewer_id) return res.status(401).json({ error: 'Unauthorized' });

    const { seller_id, listing_id, rating, comment } = req.body;

    // Validate required fields
    if (!seller_id || !listing_id || !rating) {
      return res.status(400).json({ error: 'seller_id, listing_id, and rating are required' });
    }

    // Validate rating range
    const ratingNum = parseInt(rating);
    if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      return res.status(400).json({ error: 'Rating must be a number between 1 and 5' });
    }

    // Prevent self-review
    if (parseInt(seller_id) === reviewer_id) {
      return res.status(403).json({ error: 'You cannot review your own listing' });
    }

    // Prevent duplicate review on same listing
    const [existing] = await Rating.hasReviewed({ reviewer_id, listing_id });
    if (existing.length > 0) {
      return res.status(409).json({ error: 'You have already reviewed this listing' });
    }

    await Rating.create({ reviewer_id, seller_id, listing_id, rating: ratingNum, comment });

    // Emit real-time update if Socket.IO is available
    if (req.io) {
      const [stats] = await Rating.getListingStats(listing_id);
      req.io.emit(`rating:listing:${listing_id}`, stats[0]);

      const [sellerStats] = await Rating.getSellerStats(seller_id);
      req.io.emit(`rating:seller:${seller_id}`, sellerStats[0]);
    }

    return res.status(201).json({ message: 'Review submitted successfully' });
  } catch (err) {
    console.error('submitRating error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// ── GET /api/ratings/listing/:listing_id ──────────────────────
// All reviews for a listing + aggregate stats
const getListingRatings = async (req, res) => {
  try {
    const { listing_id } = req.params;

    const [[reviews], [statsRows]] = await Promise.all([
      Rating.getByListing(listing_id),
      Rating.getListingStats(listing_id),
    ]);

    const stats = statsRows[0];

    return res.json({
      average_rating: stats.average_rating ? parseFloat(stats.average_rating).toFixed(1) : null,
      total_reviews:  parseInt(stats.total_reviews),
      reviews,
    });
  } catch (err) {
    console.error('getListingRatings error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// ── GET /api/ratings/seller/:seller_id ────────────────────────
// All reviews received by a seller + aggregate stats (for profile page)
const getSellerRatings = async (req, res) => {
  try {
    const { seller_id } = req.params;

    const [[reviews], [statsRows]] = await Promise.all([
      Rating.getBySeller(seller_id),
      Rating.getSellerStats(seller_id),
    ]);

    const stats = statsRows[0];

    return res.json({
      average_rating: stats.average_rating ? parseFloat(stats.average_rating).toFixed(1) : null,
      total_reviews:  parseInt(stats.total_reviews),
      reviews,
    });
  } catch (err) {
    console.error('getSellerRatings error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// ── DELETE /api/ratings/:id ───────────────────────────────────
// Delete your own review
const deleteRating = async (req, res) => {
  try {
    const reviewer_id = req.user?.user_id;
    if (!reviewer_id) return res.status(401).json({ error: 'Unauthorized' });

    const { id } = req.params;
    const [result] = await Rating.delete({ id, reviewer_id });

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Review not found or not yours to delete' });
    }

    return res.json({ message: 'Review deleted' });
  } catch (err) {
    console.error('deleteRating error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = { submitRating, getListingRatings, getSellerRatings, deleteRating };