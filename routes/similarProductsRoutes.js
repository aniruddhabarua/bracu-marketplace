const express = require('express');
const router = express.Router();
const SimilarProductsController = require('../controllers/similarProductsControllers');

router.get('/:id/similar', SimilarProductsController.getSimilarProducts);

module.exports = router;
