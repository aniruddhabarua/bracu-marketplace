function addUser() {
  // add user
}

async function searchProducts() {
  const keyword  = document.getElementById('keyword').value.trim();
  const category = document.getElementById('category').value;
  const minPrice = document.getElementById('minPrice').value;
  const maxPrice = document.getElementById('maxPrice').value;
  const params = new URLSearchParams();
  if (keyword)  params.append('keyword',  keyword);
  if (category) params.append('category', category);
  if (minPrice) params.append('minPrice', minPrice);
  if (maxPrice) params.append('maxPrice', maxPrice);
  const res      = await fetch(`/products/search?${params.toString()}`);
  const products = await res.json();

  displayProducts(products);
}
function resetSearch() {
  document.getElementById('keyword').value  = '';
  document.getElementById('category').value = '';
  document.getElementById('minPrice').value = '';
  document.getElementById('maxPrice').value = '';
  loadAllProducts();
}
function displayProducts(products) {
  const grid        = document.getElementById('productGrid');
  const resultCount = document.getElementById('resultCount');

  grid.innerHTML = '';

  resultCount.textContent = `${products.length} product(s) found`;

  if (products.length === 0) {
    grid.innerHTML = '<p class="no-results">No products match your search.</p>';
    return;
  }

  products.forEach(product => {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.innerHTML = `
      <span class="category-badge">${product.category}</span>
      <h3>${product.name}</h3>
      <p class="description">${product.description}</p>
      <p class="price">৳ ${product.price}</p>
    `;
    grid.appendChild(card);
  });
}
