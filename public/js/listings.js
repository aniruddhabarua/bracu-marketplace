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

    const listing = data.data;
    
    // Check if user is following this seller (if not their own listing)
    let isFollowing = false;
    if (user && user.user_id !== listing.seller_id) {
      isFollowing = await checkFollowStatus(listing.seller_id);
    }

    renderListing(listing, isFollowing);

  } catch (error) {
    console.error('Error loading listing:', error);
    showError('Could not reach server');
  }
}

// Check if user is following a seller
async function checkFollowStatus(sellerId) {
  try {
    const res = await fetch(`/api/favorite-sellers/check/${sellerId}`, {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    const data = await res.json();
    return data.success ? data.is_favorite : false;
  } catch (error) {
    console.error('Error checking follow status:', error);
    return false;
  }
}

// ==========================================
// RENDER LISTING
// ==========================================

function renderListing(listing, isFollowing = false) {
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
            <div class="seller-header" style="cursor: pointer;" onclick="showSellerProfile(${listing.seller_id})">
              <div class="seller-avatar">
                ${sellerAvatar}
              </div>
              <div class="seller-info">
                <h3>
                  ${seller}
                  ${listing.seller_is_verified ? '<span style="color: #4caf50; font-size: 12px; margin-left: 6px;">✅ Verified</span>' : ''}
                </h3>
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
              <button class="btn btn-secondary" id="followBtn" onclick="toggleFollowSeller(${listing.seller_id}, '${seller}')">
                ${isFollowing ? '⭐ Following' : '☆ Follow Seller'}
              </button>
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

async function toggleFollowSeller(sellerId, sellerName) {
  try {
    const btn = document.getElementById('followBtn');
    const isFollowing = btn.textContent.includes('Following');

    const res = await fetch(`/api/favorite-sellers/${sellerId}`, {
      method: isFollowing ? 'DELETE' : 'POST',
      headers: { 'Authorization': 'Bearer ' + token }
    });

    const data = await res.json();

    if (data.success) {
      if (isFollowing) {
        btn.textContent = '☆ Follow Seller';
        alert(`✅ Unfollowed ${sellerName}`);
      } else {
        btn.textContent = '⭐ Following';
        alert(`✅ Following ${sellerName}! You'll see their latest listings in your profile.`);
      }
    } else {
      alert('❌ ' + (data.message || 'Failed to update follow status'));
    }
  } catch (error) {
    console.error('Error toggling follow status:', error);
    alert('Could not update follow status. Please try again.');
  }
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

// ==========================================
// SELLER PROFILE MODAL
// ==========================================

async function showSellerProfile(sellerId) {
  try {
    const res = await fetch(`/api/users/${sellerId}`, {
      headers: token ? { 'Authorization': 'Bearer ' + token } : {}
    });

    if (!res.ok) {
      alert('Could not load seller profile');
      return;
    }

    const data = await res.json();
    if (!data.success) {
      alert('Seller profile not found');
      return;
    }

    const seller = data.data;
    const verificationBadge = seller.is_verified ? '✅ Verified' : '';
    const memberYear = new Date(seller.member_since).getFullYear();
    const roleLabel = seller.role.charAt(0).toUpperCase() + seller.role.slice(1);
    const sellerAvatar = seller.profile_picture ? `<img src="${seller.profile_picture}" alt="${seller.full_name}">` : '👤';
    const stars = seller.avg_rating ? '⭐'.repeat(Math.round(seller.avg_rating)) : 'No ratings yet';

    const profileHtml = `
      <div style="text-align: center; margin-bottom: 24px;">
        <div style="width: 100px; height: 100px; margin: 0 auto 16px; border-radius: 8px; background: #f5f5f5; display: flex; align-items: center; justify-content: center; font-size: 40px; overflow: hidden;">
          ${sellerAvatar}
        </div>
        <h3 style="margin: 8px 0 4px; color: #1a1a2e; font-size: 18px;">
          ${escapeHtml(seller.full_name)}
          ${verificationBadge ? `<span style="color: #4caf50; font-size: 14px; margin-left: 8px;">${verificationBadge}</span>` : ''}
        </h3>
        <p style="margin: 0 0 8px; color: #999; font-size: 12px;">${roleLabel}</p>
        ${seller.department ? `<p style="margin: 0 0 12px; color: #666; font-size: 13px;">${escapeHtml(seller.department)}</p>` : ''}
      </div>

      <div style="background: #f9f9f9; border-radius: 6px; padding: 16px; margin-bottom: 16px;">
        <div style="margin-bottom: 12px;">
          <p style="margin: 0 0 4px; color: #999; font-size: 11px; font-weight: bold; text-transform: uppercase;">Email</p>
          <p style="margin: 0; color: #333; font-size: 13px;">${escapeHtml(seller.email)}</p>
        </div>
        <div style="margin-bottom: 12px;">
          <p style="margin: 0 0 4px; color: #999; font-size: 11px; font-weight: bold; text-transform: uppercase;">Member Since</p>
          <p style="margin: 0; color: #333; font-size: 13px;">${memberYear}</p>
        </div>
        <div>
          <p style="margin: 0 0 4px; color: #999; font-size: 11px; font-weight: bold; text-transform: uppercase;">Rating</p>
          <p style="margin: 0; color: #ffc107; font-size: 13px;">${stars}${seller.total_reviews > 0 ? ` (${seller.total_reviews} review${seller.total_reviews !== 1 ? 's' : ''})` : ''}</p>
        </div>
      </div>

      ${seller.bio ? `
        <div style="margin-bottom: 16px;">
          <p style="margin: 0 0 8px; color: #999; font-size: 11px; font-weight: bold; text-transform: uppercase;">About</p>
          <p style="margin: 0; color: #666; font-size: 13px; line-height: 1.5;">${escapeHtml(seller.bio)}</p>
        </div>
      ` : ''}

      <div style="border-top: 1px solid #eee; padding-top: 16px;">
        <p style="margin: 0 0 12px; color: #999; font-size: 11px; font-weight: bold; text-transform: uppercase;">Active Listings (${seller.listings ? seller.listings.length : 0})</p>
        ${seller.listings && seller.listings.length > 0 ? `
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px;">
            ${seller.listings.slice(0, 4).map(listing => `
              <a href="/listings?id=${listing.listing_id}" style="text-decoration: none; color: inherit;">
                <div style="background: #f5f5f5; border-radius: 6px; padding: 12px; border: 1px solid #eee; transition: box-shadow 0.2s; cursor: pointer;" onmouseover="this.style.boxShadow='0 2px 8px rgba(0,0,0,0.1)'" onmouseout="this.style.boxShadow='none'">
                  <div style="width: 100%; height: 80px; background: #f0f0f0; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-size: 24px; margin-bottom: 8px; overflow: hidden;">
                    ${listing.primary_image ? `<img src="${listing.primary_image}" alt="${listing.title}" style="width: 100%; height: 100%; object-fit: cover;">` : '📦'}
                  </div>
                  <p style="margin: 0 0 4px; font-size: 12px; font-weight: bold; color: #333; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${escapeHtml(listing.title)}</p>
                  <p style="margin: 0; font-size: 12px; font-weight: bold; color: #1a1a2e;">৳ ${Number(listing.price).toLocaleString()}</p>
                </div>
              </a>
            `).join('')}
          </div>
        ` : '<p style="margin: 0; color: #aaa; font-size: 13px;">No active listings</p>'}
      </div>
    `;

    document.getElementById('sellerProfileContent').innerHTML = profileHtml;
    document.getElementById('sellerModal').style.display = 'block';
    document.body.style.overflow = 'hidden';

  } catch (error) {
    console.error('Error loading seller profile:', error);
    alert('Could not load seller profile. Please try again.');
  }
}

function closeSellerModal() {
  document.getElementById('sellerModal').style.display = 'none';
  document.body.style.overflow = 'auto';
}

// Close modal when clicking outside of it
document.addEventListener('DOMContentLoaded', () => {
  const modal = document.getElementById('sellerModal');
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeSellerModal();
      }
    });
  }
});
