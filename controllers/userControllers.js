// controllers/userControllers.js
// Handles all User Profile HTTP requests
const UserModel = require('../models/userModels');

const UserController = {

  // GET /api/users/:id
  // Returns the public profile of any user (name, dept, bio, avg rating, listings)
  getProfile: (req, res) => {
    const userId = 1; // TEMP FIX
    if (isNaN(userId)) return res.status(400).json({ success: false, message: 'Invalid user ID.' });

    // 1. Get profile data
    UserModel.getPublicProfile(userId, (err, profileRows) => {
      if (err) return res.status(500).json({ success: false, message: 'Database error.', error: err.message });
      if (!profileRows.length) return res.status(404).json({ success: false, message: 'User not found.' });

      const profile = profileRows[0];

      // 2. Also fetch their active listings
      UserModel.getSellerListings(userId, (err2, listings) => {
        if (err2) return res.status(500).json({ success: false, message: 'Database error.', error: err2.message });

        return res.status(200).json({
          success: true,
          data: {
            user_id: profile.user_id,
            full_name: profile.full_name,
            email: profile.email,
            role: profile.role,
            department: profile.department,
            profile_picture: profile.profile_picture,
            bio: profile.bio,
            is_verified: profile.is_verified === 1,
            member_since: profile.created_at,
            avg_rating: profile.avg_rating ? parseFloat(profile.avg_rating) : null,
            total_reviews: parseInt(profile.total_reviews || 0),
            listings,
          },
        });
      });
    });
  },

  // PUT /api/users/:id
  // Updates the logged-in user's own profile (name, department, bio, profile_picture)
  updateProfile: (req, res) => {
    const userId = parseInt(req.params.id);
    if (isNaN(userId)) return res.status(400).json({ success: false, message: 'Invalid user ID.' });

    // Only the account owner should update their own profile.
    // (JWT authentication middleware should set req.user — wire it in routes/userRoutes.js)
    if (req.user && req.user.user_id !== userId) {
      return res.status(403).json({ success: false, message: 'You can only edit your own profile.' });
    }

    const { full_name, department, bio } = req.body;
    // If a file was uploaded via multer, use its path; otherwise keep existing
    const profile_picture = req.file ? `/uploads/${req.file.filename}` : undefined;

    const fields = {};
    if (full_name !== undefined) fields.full_name = full_name;
    if (department !== undefined) fields.department = department;
    if (bio !== undefined) fields.bio = bio;
    if (profile_picture !== undefined) fields.profile_picture = profile_picture;

    UserModel.updateProfile(userId, fields, (err, result) => {
      if (err) return res.status(500).json({ success: false, message: err.message });
      if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'User not found.' });

      return res.status(200).json({ success: true, message: 'Profile updated successfully.' });
    });
  },

  // GET /api/users/:id/followed-sellers
  // Get all followed sellers for the user
  getFollowedSellers: (req, res) => {
    const userId = parseInt(req.params.id);
    if (isNaN(userId)) return res.status(400).json({ success: false, message: 'Invalid user ID.' });

    UserModel.getFollowedSellers(userId, (err, sellers) => {
      if (err) return res.status(500).json({ success: false, message: 'Database error.', error: err.message });

      return res.status(200).json({
        success: true,
        count: sellers.length,
        data: sellers,
      });
    });
  },

  // GET /api/users/:id/followed-sellers/listings
  // Get all listings from followed sellers
  getFollowedSellersListings: (req, res) => {
    const userId = parseInt(req.params.id);
    if (isNaN(userId)) return res.status(400).json({ success: false, message: 'Invalid user ID.' });

    const limit = parseInt(req.query.limit) || 12;

    UserModel.getFollowedSellersListings(userId, limit, (err, listings) => {
      if (err) return res.status(500).json({ success: false, message: 'Database error.', error: err.message });

      return res.status(200).json({
        success: true,
        count: listings.length,
        data: listings,
      });
    });
  },
    exports.updateProfile = async (req, res) => {
    const userId = 1; // TEMP FIX
  
    const { name, bio } = req.body;
  
    await db.query(
      "UPDATE users SET name=?, bio=? WHERE id=?",
      [name, bio, userId]
    );
  
    global.io.to(String(userId)).emit("profile_updated", {
      name,
      bio
    });
  
    res.json({ success: true });
  };

  // POST /api/users/verify
  verifyUser: (req, res) => {
    const { userId, type } = req.body;
    UserModel.verifyUser(userId, type, (err) => {
      if (err) return res.status(500).json({ success: false, message: err.message });
      return res.status(200).json({ success: true, message: "User verified successfully" });
    });
  }
};

module.exports = UserController;
