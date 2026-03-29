// ==========================================
// AUTH CHECK
// ==========================================

const token = localStorage.getItem('token');
const user  = JSON.parse(localStorage.getItem('user') || 'null');

if (!token || !user) {
  window.location.href = '/login';
} else {
  document.getElementById('navUser').textContent = 'Hi, ' + user.full_name;
}

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '/login';
}

// ==========================================
// LOAD LISTING
// ==========================================

// Get listing ID from URL parameter
const urlParams = new URLSearchParams(window.location.search);
const listingId = urlParams.get('id');
const isNewListing = urlParams.get('new') === '1';

if (!listingId) {
  showError('No listing ID provided');
} else {
  loadListing(listingId);
}

async function loadListing(id) {
  try {
    const res = await fetch(`/api/listings/${id}`, {
      headers: token ? { 'Authorization': 'Bearer ' + token } : {}
    });

    if (!res.ok) {
      showError('Listing not found');
      return;
    }

    const data = await res.json();
    if (!data.success) {
      showError('Could not load listing');
      return;
    }

    renderListing(data.data);

  } catch (error) {
    console.error('Error loading listing:', error);
    showError('Could not reach server');
  }
}

// ==========================================
// RENDER LISTING
// ==========================================

function renderListing(listing) {
  document.getElementById('loadingBox').style.display = 'none';

  // Show success banner if newly posted
  if (isNewListing) {
    const alertBox = document.getElementById('alertBox');
    alertBox.innerHTML = `
      <div class="alert alert-success">
        ✅ <strong>Success!</strong> Your listing "<strong>${escapeHtml(listing.title)}</strong>" has been posted and is now visible to other students!
      </div>
    `;
  }

  const catEmoji = {
    'Books & Notes':'📚','Electronics':'💻','Clothing & Accessories':'👕',
    'Stationery & Supplies':'✏️','Sports & Fitness':'⚽','Food & Beverages':'🍜',
    'Furniture & Decor':'🪑','Services':'🛠️','Other':'📦',
  };

  const condLabel = {
    new:'New',
    like_new:'Like New',
    good:'Good',
    fair:'Fair',
    poor:'Poor'
  };

  // Images array
  const images = listing.images && listing.images.length > 0 ? listing.images : [listing.primary_image];
  const imagesWithFallback = images.filter(img => img); // Remove null/undefined

  // Main image HTML
  let mainImageHtml = '';
  if (imagesWithFallback.length > 0) {
    mainImageHtml = `<img src="${imagesWithFallback[0]}" alt="${listing.title}" id="mainImage">`;
  } else {
    mainImageHtml = `<div style="display: flex; align-items: center; justify-content: center; height: 100%; font-size: 80px;">${catEmoji[listing.category] || '📦'}</div>`;
  }

  // Thumbnails HTML
  let thumbnailsHtml = '';
  if (imagesWithFallback.length > 1) {
    thumbnailsHtml = imagesWithFallback.map((img, idx) => `
      <div class="thumbnail ${idx === 0 ? 'active' : ''}" onclick="switchImage('${img}', this)">
        <img src="${img}" alt="Image ${idx + 1}">
      </div>
    `).join('');
  }

  const seller = listing.seller_name || 'Unknown';
  const sellerAvatar = listing.seller_avatar ? `<img src="${listing.seller_avatar}" alt="${seller}">` : '👤';
  const avgRating = listing.avg_rating ? Math.round(listing.avg_rating) : 0;
  const stars = avgRating > 0 ? '⭐'.repeat(avgRating) : 'No ratings yet';

  const isOwn = user && user.user_id === listing.seller_id;

  const html = `
    <div class="listing-container">
      <div class="listing-main">
        
        <!-- LEFT: IMAGES -->
        <div class="image-gallery">
          <div class="main-image">
            ${mainImageHtml}
          </div>
          ${thumbnailsHtml ? `<div class="thumbnails">${thumbnailsHtml}</div>` : ''}
        </div>

        <!-- RIGHT: INFO -->
        <div class="listing-info">
          <h1>${escapeHtml(listing.title)}</h1>

          <div class="listing-meta">
            <div class="price-tag">৳ ${Number(listing.price).toLocaleString()}</div>
          </div>

          <div style="margin-bottom: 16px;">
            <span class="badge condition">${condLabel[listing.condition_type] || listing.condition_type}</span>
            <span class="badge category">${listing.category}</span>
          </div>

          <p class="description">${escapeHtml(listing.description)}</p>

          <div class="details-grid">
            <div class="detail-item">
              <div class="detail-label">Category</div>
              <div class="detail-value">${listing.category}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">Condition</div>
              <div class="detail-value">${condLabel[listing.condition_type] || listing.condition_type}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">Location</div>
              <div class="detail-value">${listing.location || 'Not specified'}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">Posted</div>
              <div class="detail-value">${formatDate(listing.created_at)}</div>
            </div>
          </div>

          <!-- SELLER CARD -->
          <div class="seller-card">
            <div class="seller-header">
              <div class="seller-avatar">
                ${sellerAvatar}
              </div>
              <div class="seller-info">
                <h3>${seller}</h3>
                <p>${listing.seller_department || 'BRACU Student'}</p>
                <div class="seller-rating">${stars}</div>
              </div>
            </div>

            ${isOwn ? `
              <button class="btn btn-secondary" onclick="editListing(${listing.listing_id})">✏️ Edit Listing</button>
              <button class="btn btn-secondary" onclick="deleteListing(${listing.listing_id})">🗑️ Delete Listing</button>
            ` : `
              <button class="btn btn-primary" onclick="contactSeller('${seller}')">💬 Contact Seller</button>
              <button class="btn btn-secondary" onclick="addToWishlist(${listing.listing_id})">❤️ Save to Wishlist</button>
            `}

            <div class="posted-date">Seller member since ${new Date(listing.created_at).getFullYear()}</div>
          </div>
        </div>
      </div>
    </div>
  `;

  document.getElementById('listingBox').innerHTML = html;
  document.getElementById('listingBox').style.display = 'block';
}

// ==========================================
// IMAGE GALLERY
// ==========================================

function switchImage(imageSrc, thumbnailEl) {
  // Update main image
  const mainImg = document.getElementById('mainImage');
  if (mainImg) {
    mainImg.src = imageSrc;
  }

  // Update active thumbnail
  document.querySelectorAll('.thumbnail').forEach(t => t.classList.remove('active'));
  thumbnailEl.classList.add('active');
}

// ==========================================
// ACTIONS
// ==========================================

function contactSeller(sellerName) {
  alert(`💬 Chat with ${sellerName} feature coming soon!`);
}

async function addToWishlist(listingId) {
  try {
    console.log('Adding to wishlist, listing ID:', listingId, 'token:', token);
    
    const res = await fetch('/api/wishlist', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ listing_id: listingId })
    });

    console.log('Response status:', res.status);
    
    const data = await res.json();
    console.log('Response data:', data);

    if (data.success) {
      alert('❤️ Added to wishlist!');
    } else if (res.status === 409) {
      alert('⚠️ This item is already in your wishlist.');
    } else {
      alert('❌ ' + (data.message || 'Failed to add to wishlist'));
    }
  } catch (error) {
    console.error('Error adding to wishlist:', error);
    alert('Could not add to wishlist. Please try again. Error: ' + error.message);
  }
}

function editListing(listingId) {
  alert('✏️ Edit listing feature coming soon!');
}

async function deleteListing(listingId) {
  if (!confirm('Are you sure you want to delete this listing? This cannot be undone.')) {
    return;
  }

  try {
    const res = await fetch(`/api/listings/${listingId}`, {
      method: 'DELETE',
      headers: { 'Authorization': 'Bearer ' + token }
    });

    const data = await res.json();
    if (data.success) {
      alert('✅ Listing deleted successfully');
      window.location.href = '/profile';
    } else {
      alert('❌ Failed to delete listing');
    }
  } catch (error) {
    console.error('Error deleting listing:', error);
    alert('Could not delete listing');
  }
}

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

function showError(message) {
  document.getElementById('loadingBox').style.display = 'none';
  document.getElementById('errorBox').textContent = '⚠️ ' + message;
  document.getElementById('errorBox').style.display = 'block';
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

function escapeHtml(text) {
  if (!text) return '';
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}
