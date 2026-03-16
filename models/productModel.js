const products = [
  { id: 1,  name: "Calculus Textbook",     category: "Books",       price: 450, description: "Essential calculus book for BRACU students" },
  { id: 2,  name: "Scientific Calculator", category: "Electronics", price: 850, description: "Casio scientific calculator fx-991" },
];


const getAllProducts = () => products;

const getCategories = () => [...new Set(products.map(p => p.category))];


const searchProducts = ({ keyword, category, minPrice, maxPrice }) => {
  return products.filter(product => {

    const matchKeyword = keyword
      ? product.name.toLowerCase().includes(keyword.toLowerCase()) ||
        product.description.toLowerCase().includes(keyword.toLowerCase())
      : true;

    const matchCategory = category ? product.category === category : true;

    const matchMin = minPrice !== '' && minPrice !== undefined
      ? product.price >= Number(minPrice) : true;

    const matchMax = maxPrice !== '' && maxPrice !== undefined
      ? product.price <= Number(maxPrice) : true;

    return matchKeyword && matchCategory && matchMin && matchMax;
  });
};

module.exports = { getAllProducts, getCategories, searchProducts };