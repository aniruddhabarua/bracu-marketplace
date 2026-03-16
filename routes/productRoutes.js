const express           = require('express');
const router            = express.Router();
const ProductController = require('../controllers/productController');

router.get('/products', ProductController.getProducts);

router.get('/products/categories', ProductController.getCategories);

router.get('/products/search', ProductController.searchProducts);

module.exports = router;