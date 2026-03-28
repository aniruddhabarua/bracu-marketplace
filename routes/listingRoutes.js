const express           = require('express');
const router            = express.Router();
const path              = require('path');
const multer            = require('multer');
const ListingController = require('../controllers/listingControllers');
const { authenticate }  = require('../middleware/auth');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '..', 'public', 'uploads', 'listings'));
  },
  filename: (req, file, cb) => {
    const ext    = path.extname(file.originalname).toLowerCase();
    const unique = `listing_${Date.now()}_${Math.round(Math.random() * 1e6)}${ext}`;
    cb(null, unique);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  allowed.includes(file.mimetype) ? cb(null, true) : cb(new Error('Only JPEG, PNG, WEBP and GIF images are allowed.'), false);
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });


router.get('/',             ListingController.getListings);      
router.get('/categories',   ListingController.getCategories);     
router.get('/:id',          ListingController.getListing);        

router.post('/',   authenticate, upload.array('images', 5), ListingController.createListing);
router.put('/:id', authenticate, ListingController.updateListing);
router.delete('/:id', authenticate, ListingController.deleteListing);

router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError || err.message) {
    return res.status(400).json({ success: false, message: err.message });
  }
  next(err);
});

module.exports = router;