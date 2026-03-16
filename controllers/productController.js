const { getAllProducts, getCategories, searchProducts } = require('../models/productModel');

const ProductController = {

  
  getProducts: (req, res) => {
    const products = getAllProducts();
    res.json(products);
  },


  getCategories: (req, res) => {
    const categories = getCategories();
    res.json(categories);
  },

  searchProducts: (req, res) => {
    const { keyword, category, minPrice, maxPrice } = req.query;
    const results = searchProducts({ keyword, category, minPrice, maxPrice });
    res.json(results);
  },

};

module.exports = ProductController;