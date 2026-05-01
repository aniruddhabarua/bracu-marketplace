const ListingModel      = require('../models/listingModel');
const NotificationModel = require('../models/notificationModels');

const VALID_CONDITIONS = ['new', 'like_new', 'good', 'fair', 'poor'];
const VALID_CATEGORIES = [
  'Books & Notes',
  'Electronics',
  'Clothing & Accessories',
  'Stationery & Supplies',
  'Sports & Fitness',
  'Food & Beverages',
  'Furniture & Decor',
  'Services',
  'Other',
];

const ListingController = {


  createListing: (req, res) => {
    const seller_id = req.user.user_id;
    const { title, description, price, category, condition_type, location } = req.body;

    if (!title || !description || !price || !category || !condition_type)
      return res.status(400).json({
        success: false,
        message: 'title, description, price, category and condition_type are required.',
      });

    if (title.trim().length < 3 || title.trim().length > 100)
      return res.status(400).json({ success: false, message: 'title must be 3–100 characters.' });

    if (description.trim().length < 10)
      return res.status(400).json({ success: false, message: 'description must be at least 10 characters.' });

    const parsedPrice = parseFloat(price);
    if (isNaN(parsedPrice) || parsedPrice <= 0)
      return res.status(400).json({ success: false, message: 'price must be a positive number.' });

    if (!VALID_CATEGORIES.includes(category))
      return res.status(400).json({
        success: false,
        message: `category must be one of: ${VALID_CATEGORIES.join(', ')}.`,
      });

    if (!VALID_CONDITIONS.includes(condition_type))
      return res.status(400).json({
        success: false,
        message: `condition_type must be one of: ${VALID_CONDITIONS.join(', ')}.`,
      });

    const listingData = {
      seller_id,
      title:          title.trim(),
      description:    description.trim(),
      price:          parsedPrice,
      category,
      condition_type,
      location:       location ? location.trim() : null,
    };

    ListingModel.create(listingData, (err, result) => {
      if (err)
        return res.status(500).json({ success: false, message: 'Database error.', error: err.message });

      const listingId = result.insertId;

      
      const files = req.files || [];          
      if (files.length === 0) {
        
        return res.status(201).json({
          success:    true,
          message:    'Listing created successfully.',
          listing_id: listingId,
        });
      }

      let saved = 0;
      files.forEach((file, index) => {
        const imageUrl = `/uploads/listings/${file.filename}`;
        const isPrimary = index === 0;        

        ListingModel.addImage(listingId, imageUrl, isPrimary, (imgErr) => {
          if (imgErr) console.error('Image save error:', imgErr.message);
          saved++;
          if (saved === files.length) {
            return res.status(201).json({
              success:    true,
              message:    'Listing created successfully.',
              listing_id: listingId,
              images_saved: saved,
            });
          }
        });
      });
    });
  },

  
  getListings: (req, res) => {
    const filters = {
      keyword:        req.query.keyword        || '',
      category:       req.query.category       || '',
      condition_type: req.query.condition_type || '',
      minPrice:       req.query.minPrice,
      maxPrice:       req.query.maxPrice,
      seller_id:      req.query.seller_id ? parseInt(req.query.seller_id) : null,
    };

    ListingModel.getAll(filters, (err, listings) => {
      if (err)
        return res.status(500).json({ success: false, message: 'Database error.', error: err.message });

      return res.status(200).json({ success: true, count: listings.length, data: listings });
    });
  },

 
  getCategories: (req, res) => {
    ListingModel.getCategories((err, rows) => {
      if (err)
        return res.status(500).json({ success: false, message: 'Database error.' });

      const categories = rows.map(r => r.category);
      return res.status(200).json({ success: true, data: categories });
    });
  },

  
  getListing: (req, res) => {
    const listingId = parseInt(req.params.id);
    console.log('=== getListing called ===');
    console.log('Listing ID:', listingId);
    
    if (isNaN(listingId)) {
      console.log('Invalid ID - not a number');
      return res.status(400).json({ success: false, message: 'Invalid listing ID.' });
    }

    ListingModel.findById(listingId, (err, listing) => {
      console.log('findById callback triggered');
      console.log('Error object:', err);
      console.log('Listing result:', listing);
      
      if (err) {
        console.log('ERROR in findById:', err.message);
        return res.status(500).json({ success: false, message: 'Database error.', error: err.message });
      }
      if (!listing) {
        console.log('No listing found for ID:', listingId);
        return res.status(404).json({ success: false, message: 'Listing not found.' });
      }

      console.log('Success! Returning listing');
      return res.status(200).json({ success: true, data: listing });
    });
  },

  
  updateListing: (req, res) => {
    const listingId = parseInt(req.params.id);
    const userId    = req.user.user_id;

    if (isNaN(listingId))
      return res.status(400).json({ success: false, message: 'Invalid listing ID.' });

    ListingModel.isOwner(listingId, userId, (err, owns) => {
      if (err)   return res.status(500).json({ success: false, message: 'Database error.' });
      if (!owns) return res.status(403).json({ success: false, message: 'You can only edit your own listings.' });

      const fields = {};
      const allowed = ['title', 'description', 'price', 'category', 'condition_type', 'location', 'status'];
      allowed.forEach(key => {
        if (req.body[key] !== undefined) fields[key] = req.body[key];
      });

      if (fields.price !== undefined) {
        const p = parseFloat(fields.price);
        if (isNaN(p) || p <= 0)
          return res.status(400).json({ success: false, message: 'price must be a positive number.' });
        fields.price = p;
      }

      ListingModel.update(listingId, fields, (err2, result) => {
        if (err2) return res.status(500).json({ success: false, message: 'Database error.', error: err2.message });
        if (result.affectedRows === 0)
          return res.status(404).json({ success: false, message: 'Listing not found.' });

        return res.status(200).json({ success: true, message: 'Listing updated successfully.' });
      });
    });
  },

  
  deleteListing: (req, res) => {
    const listingId = parseInt(req.params.id);
    const userId    = req.user.user_id;
    const isAdmin   = req.user.role === 'admin';

    if (isNaN(listingId))
      return res.status(400).json({ success: false, message: 'Invalid listing ID.' });

    if (isAdmin) {
     
      ListingModel.delete(listingId, (err) => {
        if (err) return res.status(500).json({ success: false, message: 'Database error.' });
        return res.status(200).json({ success: true, message: 'Listing deleted.' });
      });
    } else {
      ListingModel.isOwner(listingId, userId, (err, owns) => {
        if (err)   return res.status(500).json({ success: false, message: 'Database error.' });
        if (!owns) return res.status(403).json({ success: false, message: 'You can only delete your own listings.' });

        ListingModel.delete(listingId, (err2) => {
          if (err2) return res.status(500).json({ success: false, message: 'Database error.' });
          return res.status(200).json({ success: true, message: 'Listing deleted.' });
        });
      });
    }
  },

};


updateStatus: (req, res) => {
  const listingId = parseInt(req.params.id);
  const userId = req.user.user_id;
  const { status } = req.body;

  if (isNaN(listingId)) {
    return res.status(400).json({ success: false, message: 'Invalid listing ID.' });
  }

  const validStatuses = ['available', 'reserved', 'sold'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ success: false, message: 'Status must be available, reserved, or sold.' });
  }


  ListingModel.isOwner(listingId, userId, (err, owns) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Database error.' });
    }
    if (!owns) {
      return res.status(403).json({ success: false, message: 'You can only update your own listings.' });
    }

    ListingModel.updateStatus(listingId, status, (err2, result) => {
      if (err2) {
        return res.status(500).json({ success: false, message: 'Database error.', error: err2.message });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: 'Listing not found.' });
      }

      return res.status(200).json({ success: true, message: `Listing status updated to ${status}.` });
    });
  });
},

module.exports = ListingController;