// ==========================================
// PROFILE PAGE INITIALIZATION & AUTH CHECK
// ==========================================

// Check if user is logged in
const token = localStorage.getItem('token');
const user  = JSON.parse(localStorage.getItem('user') || 'null');

// Check for new listing parameter
const urlParams = new URLSearchParams(window.location.search);
const newListingId = urlParams.get('new_listing');

if (!token || !user) {
  window.location.href = '/login';
} else {
  document.getElementById('navUser').textContent = 'Hi, ' + user.full_name;
  
  // Show success message if new listing was created
  if (newListingId) {
    showAlert('✅ Listing created successfully! See it in "My Listings" below.', 'success');
    // Clean up URL
    window.history.replaceState({}, document.title, '/profile');
  }
  
  loadProfile();
}

// Logout function
function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '/login';
}

// ==========================================
// PROFILE LOADING & DISPLAY
// ==========================================

async function loadProfile() {
  try {
    // Fetch current user's profile from backend
    const res = await fetch('/api/auth/me', {
      headers: { 'Authorization': 'Bearer ' + token }
    });

    if (!res.ok) {
      showAlert('Failed to load profile', 'error');
      return;
    }

    const data = await res.json();
    if (!data.success) {
      showAlert('Could not retrieve profile data', 'error');
      return;
    }

    const userProfile = data.data;
    
    // Display profile information
    displayProfile(userProfile);
    
    // Load user's listings
    loadUserListings(userProfile.user_id);
    
    // Load user's wishlist
    loadWishlist();
    
    // Load seller ratings (reviews)
    loadSellerRatings(userProfile.user_id);
    
    // Load followed sellers
    loadFollowedSellers();
    
    // Pre-fill edit form with current data
    document.getElementById('editName').value = userProfile.full_name || '';
    document.getElementById('editDepartment').value = userProfile.department || '';
    document.getElementById('editBio').value = userProfile.bio || '';

  } catch (error) {
    console.error('Error loading profile:', error);
    showAlert('Could not reach server', 'error');
  }
}

function displayProfile(userProfile) {
  // Display basic information
  document.getElementById('profileName').textContent = userProfile.full_name || 'User';
  document.getElementById('profileEmail').textContent = userProfile.email || '-';
  document.getElementById('profileDepartment').textContent = userProfile.department || 'Not specified';
  document.getElementById('profileRole').textContent = capitalizeRole(userProfile.role) || 'Student';
  
  // Display bio
  const bioElement = document.getElementById('profileBio');
  if (userProfile.bio && userProfile.bio.trim()) {
    bioElement.textContent = userProfile.bio;
  } else {
    bioElement.innerHTML = '<em style="color: #aaa;">No bio added yet</em>';
  }

  // Display profile picture
  const profilePicElement = document.getElementById('profilePicture');
  if (userProfile.profile_picture) {
    profilePicElement.src = userProfile.profile_picture;
    profilePicElement.alt = userProfile.full_name;
  } else {
    profilePicElement.textContent = '👤';
  }

  // Display rating
  const ratingElement = document.getElementById('profileRating');
  if (userProfile.avg_rating && userProfile.total_reviews > 0) {
    const stars = '⭐'.repeat(Math.round(userProfile.avg_rating));
    ratingElement.innerHTML = `
      <div class="rating-stars">${stars}</div>
      <span>${userProfile.avg_rating.toFixed(1)} / 5.0 (${userProfile.total_reviews} review${userProfile.total_reviews !== 1 ? 's' : ''})</span>
    `;
  } else {
    ratingElement.innerHTML = '<em style="color: #aaa;">No ratings yet</em>';
  }
}

// ==========================================
// LOAD & DISPLAY USER'S LISTINGS
// ==========================================

async function loadUserListings(userId) {
  try {
    // Fetch listings by seller_id using the listings API
    const res = await fetch(`/api/listings?seller_id=${userId}`, {
      headers: { 'Authorization': 'Bearer ' + token }
    });

    if (!res.ok) {
      console.error('Failed to load listings');
      return;
    }

    const data = await res.json();
    const listings = data.data || [];
    renderListings(listings);

  } catch (error) {
    console.error('Error loading listings:', error);
  }
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

function renderListings(listings) {
  const grid = document.getElementById('myListingsGrid');

  if (!listings.length) {
    grid.innerHTML = `
      <div class="empty" style="grid-column: 1 / -1;">
        <div class="icon">📭</div>
        <p>You haven't posted any items yet.</p>
        <p><a href="/sell" style="color: #1a1a2e; text-decoration: underline; font-weight: bold;">Create your first listing →</a></p>
      </div>
    `;
    return;
  }

  grid.className = 'grid';
  grid.innerHTML = listings.map(l => `
    <a class="card" href="/listings?id=${l.listing_id}">
      <div class="card-img">
        ${l.primary_image ? `<img src="${l.primary_image}" alt="${l.title}" loading="lazy">` : (catEmoji[l.category] || '📦')}
      </div>
      <div class="card-body">
        <div class="card-category">${l.category}</div>
        <div class="card-title">${l.title}</div>
        <div class="card-price">৳ ${Number(l.price).toLocaleString()}</div>
        <div style="font-size: 11px; color: #999;">
          ${condLabel[l.condition_type] || l.condition_type}
        </div>
      </div>
    </a>
  `).join('');
}

// ==========================================
// LOAD & DISPLAY USER'S WISHLIST
// ==========================================

async function loadWishlist() {
  try {
    const res = await fetch('/api/wishlist', {
      headers: { 'Authorization': 'Bearer ' + token }
    });

    if (!res.ok) {
      console.error('Failed to load wishlist');
      renderWishlist([]);
      return;
    }

    const data = await res.json();
    const wishlistItems = data.data || [];
    renderWishlist(wishlistItems);

  } catch (error) {
    console.error('Error loading wishlist:', error);
    renderWishlist([]);
  }
}

function renderWishlist(items) {
  const grid = document.getElementById('wishlistGrid');

  if (!items.length) {
    grid.innerHTML = `
      <div class="empty" style="grid-column: 1 / -1;">
        <div class="icon">💔</div>
        <p>Your wishlist is empty.</p>
        <p><a href="/" style="color: #1a1a2e; text-decoration: underline; font-weight: bold;">Browse items to add to your wishlist →</a></p>
      </div>
    `;
    return;
  }

  grid.className = 'grid';
  grid.innerHTML = items.map(item => `
    <div class="card" style="position: relative;">
      <a href="/listings?id=${item.listing_id}" style="text-decoration: none; color: inherit; display: block;">
        <div class="card-img">
          ${item.primary_image ? `<img src="${item.primary_image}" alt="${item.title}" loading="lazy">` : (catEmoji[item.category] || '📦')}
        </div>
        <div class="card-body">
          <div class="card-category">${item.category}</div>
          <div class="card-title">${item.title}</div>
          <div class="card-price">৳ ${Number(item.price).toLocaleString()}</div>
          <div style="font-size: 11px; color: #999;">
            ${item.seller_name || 'Unknown Seller'}
          </div>
        </div>
      </a>
      <button class="btn btn-secondary" style="width: 90%; margin: 8px auto 12px; padding: 8px; font-size: 12px; display: block;" onclick="removeFromWishlist(${item.listing_id})">❌ Remove</button>
    </div>
  `).join('');
}

async function removeFromWishlist(listingId) {
  try {
    const res = await fetch(`/api/wishlist/${listingId}`, {
      method: 'DELETE',
      headers: { 'Authorization': 'Bearer ' + token }
    });

    const data = await res.json();

    if (data.success) {
      showAlert('Removed from wishlist ❌', 'success');
      loadWishlist(); // Reload wishlist
    } else {
      showAlert(data.message || 'Failed to remove from wishlist', 'error');
    }
  } catch (error) {
    console.error('Error removing from wishlist:', error);
    showAlert('Could not remove from wishlist', 'error');
  }
}

// ==========================================
// LOAD & DISPLAY SELLER RATINGS
// ==========================================

async function loadSellerRatings(userId) {
  try {
    // Fetch reviews for this seller
    // Note: This assumes there's a /api/reviews endpoint or similar
    // If not, you can comment this out for now
    const res = await fetch(`/api/reviews?seller_id=${userId}`, {
      headers: { 'Authorization': 'Bearer ' + token }
    });

    if (res.ok) {
      const data = await res.json();
      const reviews = data.data || [];
      renderReviews(reviews);
    } else {
      // Endpoint might not exist yet - show placeholder
      renderReviews([]);
    }

  } catch (error) {
    console.error('Error loading reviews:', error);
    renderReviews([]);
  }
}

function renderReviews(reviews) {
  const container = document.getElementById('reviewsContainer');

  if (!reviews.length) {
    container.innerHTML = `
      <div class="empty">
        <div class="icon">💬</div>
        <p>No reviews yet. Start selling to get reviews from buyers!</p>
      </div>
    `;
    return;
  }

  const reviewsHtml = reviews.map(review => `
    <div class="review-item">
      <div class="review-header">
        <span class="review-author">${review.reviewer_name || 'Anonymous'}</span>
        <span class="review-rating">${'⭐'.repeat(review.rating)}</span>
      </div>
      <div class="review-text">${review.comment || ''}</div>
      <div class="review-date">${formatDate(review.created_at)}</div>
    </div>
  `).join('');

  container.innerHTML = `<div class="reviews-list">${reviewsHtml}</div>`;
}

// ==========================================
// LOAD & DISPLAY FOLLOWED SELLERS
// ==========================================

async function loadFollowedSellers() {
  try {
    const res = await fetch(`/api/users/${user.user_id}/followed-sellers`, {
      headers: { 'Authorization': 'Bearer ' + token }
    });

    if (!res.ok) {
      console.error('Failed to load followed sellers');
      renderFollowedSellers([]);
      return;
    }

    const data = await res.json();
    const sellers = data.data || [];
    renderFollowedSellers(sellers);

  } catch (error) {
    console.error('Error loading followed sellers:', error);
    renderFollowedSellers([]);
  }
}

function renderFollowedSellers(sellers) {
  const grid = document.getElementById('followedSellersGrid');

  if (!sellers.length) {
    grid.innerHTML = `
      <div class="empty" style="grid-column: 1 / -1;">
        <div class="icon">⭐</div>
        <p>You haven't followed any sellers yet.</p>
        <p><a href="/" style="color: #1a1a2e; text-decoration: underline; font-weight: bold;">Browse and follow your favorite sellers →</a></p>
      </div>
    `;
    return;
  }

  grid.className = 'grid';
  grid.innerHTML = sellers.map(seller => `
    <div class="card" style="display: flex; flex-direction: column; justify-content: space-between; cursor: pointer;" onclick="showFollowedSellerProfile(${seller.user_id})">
      <div>
        <div class="card-img" style="height: 120px; justify-content: center; align-items: center; flex-direction: column;">
          ${seller.profile_picture ? `<img src="${seller.profile_picture}" alt="${seller.full_name}" style="border-radius: 50%; width: 80px; height: 80px; object-fit: cover;">` : '<span style="font-size: 40px;">👤</span>'}
        </div>
        <div class="card-body">
          <div class="card-title" style="margin-bottom: 8px;">
            ${seller.full_name}
            ${seller.is_verified ? '<span style="color: #4caf50; font-size: 12px;">✅</span>' : ''}
          </div>
          <div style="font-size: 12px; color: #666; margin-bottom: 6px;">${seller.department || 'BRACU Student'}</div>
          <div style="font-size: 12px; color: #ffc107;">
            ${seller.avg_rating ? '⭐'.repeat(Math.round(seller.avg_rating)) + ` (${seller.total_reviews} reviews)` : 'No ratings'}
          </div>
        </div>
      </div>
      <div style="display: flex; gap: 8px; padding: 12px;">
        <button class="btn btn-secondary" style="flex: 1; margin: 0; padding: 8px; font-size: 12px;" onclick="event.stopPropagation(); unfollowSeller(${seller.user_id})">⭐ Unfollow</button>
      </div>
    </div>
  `).join('');
}

async function unfollowSeller(sellerId) {
  try {
    const res = await fetch(`/api/favorite-sellers/${sellerId}`, {
      method: 'DELETE',
      headers: { 'Authorization': 'Bearer ' + token }
    });

    const data = await res.json();

    if (data.success) {
      showAlert('Unfollowed seller ⭐', 'success');
      loadFollowedSellers(); // Reload
    } else {
      showAlert(data.message || 'Failed to unfollow', 'error');
    }
  } catch (error) {
    console.error('Error unfollowing seller:', error);
    showAlert('Could not unfollow seller', 'error');
  }
}



function toggleEditForm() {
  const form = document.getElementById('editForm');
  form.classList.toggle('show');

  // Scroll to form if opening
  if (form.classList.contains('show')) {
    form.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}

async function saveProfile(event) {
  event.preventDefault();

  const updates = {
    full_name: document.getElementById('editName').value.trim(),
    department: document.getElementById('editDepartment').value.trim(),
    bio: document.getElementById('editBio').value.trim(),
  };

  // Validate
  if (!updates.full_name) {
    showAlert('Full name is required', 'error');
    return;
  }

  try {
    const res = await fetch(`/api/users/${user.user_id}`, {
      method: 'PUT',
      headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updates)
    });

    const data = await res.json();

    if (data.success) {
      // Update localStorage with new user data
      user.full_name = updates.full_name;
      localStorage.setItem('user', JSON.stringify(user));

      // Reload profile display
      const profileRes = await fetch('/api/auth/me', {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      const profileData = await profileRes.json();
      displayProfile(profileData.data);

      // Show success message and close form
      showAlert('Profile updated successfully! ✅', 'success');
      toggleEditForm();
    } else {
      showAlert(data.message || 'Failed to update profile', 'error');
    }

  } catch (error) {
    console.error('Error saving profile:', error);
    showAlert('Could not save profile', 'error');
  }
}

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

function showAlert(message, type) {
  const alertBox = document.getElementById('alertBox');
  const className = type === 'success' ? 'alert-success' : 'alert-error';
  
  alertBox.innerHTML = `<div class="alert ${className}">${message}</div>`;
  
  // Auto-hide after 5 seconds
  setTimeout(() => {
    alertBox.innerHTML = '';
  }, 5000);
}

function capitalizeRole(role) {
  if (!role) return 'Student';
  return role.charAt(0).toUpperCase() + role.slice(1);
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

// ==========================================
// SELLER PROFILE MODAL
// ==========================================

async function showFollowedSellerProfile(sellerId) {
  try {
    const res = await fetch(`/api/users/${sellerId}`, {
      headers: token ? { 'Authorization': 'Bearer ' + token } : {}
    });

    if (!res.ok) {
      showAlert('Could not load seller profile', 'error');
      return;
    }

    const data = await res.json();
    if (!data.success) {
      showAlert('Seller profile not found', 'error');
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
    showAlert('Could not load seller profile', 'error');
  }
}

function closeSellerModal() {
  document.getElementById('sellerModal').style.display = 'none';
  document.body.style.overflow = 'auto';
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
