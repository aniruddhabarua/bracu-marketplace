const express = require('express');
const router = express.Router();
const RecentlyViewedController = require('../controllers/recentlyViewedControllers');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);
router.get('/', RecentlyViewedController.getRecentlyViewed);
router.post('/', RecentlyViewedController.trackView);
router.delete('/', RecentlyViewedController.clearRecentlyViewed);

module.exports = router;