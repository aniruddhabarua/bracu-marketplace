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

async function trackRecentView(listingId) {
  if (!token || !listingId) return;
  
  try {
    await fetch('/api/recently-viewed', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ listing_id: listingId })
    });
    console.log('View tracked successfully');
  } catch (err) {
    console.error('Failed to track view:', err);
  }
}

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
    
    trackRecentView(listingId);
    
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

async function hasUserPurchased(listingId) {
  try {
    const res = await fetch(`/api/transactions?listing_id=${listingId}&order_status=completed`, {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    const data = await res.json();
    if (data.success && data.data) {
      return data.data.some(t => t.type === 'purchase' && t.order_status === 'completed');
    }
    return false;
  } catch (error) {
    console.error('Error checking purchase status:', error);
    return false;
  }
}

async function loadExistingReviews(listingId) {
  try {
    const res = await fetch(`/api/ratings/listing/${listingId}`);
    const data = await res.json();
    
    const reviewContainer = document.getElementById('reviewSection');
    if (!reviewContainer) return;
    
    const reviews = data.reviews || [];
    const avgRating = data.average_rating;
    const totalReviews = data.total_reviews || 0;
    
    let reviewsHtml = `
      <div class="reviews-header">
        <h3 style="font-size: 18px; font-weight: 500; margin-bottom: 8px;">⭐ Customer Reviews</h3>
    `;
    
    if (avgRating) {
      reviewsHtml += `<p style="color: #c9a03d; margin-bottom: 16px;">${'★'.repeat(Math.round(avgRating))}${'☆'.repeat(5-Math.round(avgRating))} (${avgRating} / 5) • ${totalReviews} review${totalReviews !== 1 ? 's' : ''}</p>`;
    } else {
      reviewsHtml += `<p style="color: #aaa; margin-bottom: 16px;">No reviews yet</p>`;
    }
    
    reviewsHtml += `</div>`;
    
    if (reviews.length > 0) {
      reviewsHtml += `
        <div class="reviews-list" style="display: flex; flex-direction: column; gap: 16px;">
          ${reviews.map(review => `
            <div class="review-card" style="background: #fff; border: 1px solid #efede8; border-radius: 16px; padding: 16px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                <div style="display: flex; align-items: center; gap: 12px;">
                  <strong style="color: #1a1a1a;">${escapeHtml(review.reviewer_name || 'Anonymous')}</strong>
                  <span style="color: #ffc107;">${'★'.repeat(review.rating)}${'☆'.repeat(5-review.rating)}</span>
                </div>
                <span style="font-size: 11px; color: #aaa;">${formatDate(review.created_at)}</span>
              </div>
              ${review.comment ? `<p style="color: #5a5a5a; line-height: 1.5; margin-top: 8px;">"${escapeHtml(review.comment)}"</p>` : ''}
            </div>
          `).join('')}
        </div>
      `;
    } else {
      reviewsHtml += '<p style="color: #aaa; text-align: center; padding: 32px;">Be the first to review this item!</p>';
    }
    
    if (reviewContainer.innerHTML.includes('review-form')) {
      let existingDiv = reviewContainer.querySelector('#existingReviews');
      if (!existingDiv) {
        existingDiv = document.createElement('div');
        existingDiv.id = 'existingReviews';
        reviewContainer.appendChild(existingDiv);
      }
      existingDiv.innerHTML = reviewsHtml;
    } else {
      reviewContainer.innerHTML = reviewsHtml;
    }
    
  } catch (error) {
    console.error('Error loading reviews:', error);
  }
}

let selectedProductRating = 0;

function selectRating(rating) {
  selectedProductRating = rating;
  const stars = document.querySelectorAll('#reviewSection .star-btn');
  stars.forEach((star, idx) => {
    if (idx < rating) {
      star.classList.add('active');
      star.style.color = '#ffc107';
    } else {
      star.classList.remove('active');
      star.style.color = '#ddd';
    }
  });
}

async function submitProductReview(listingId, sellerId) {
  if (!selectedProductRating) {
    alert('Please select a rating (1-5 stars)');
    return;
  }
  
  const comment = document.getElementById('reviewComment').value.trim();
  const submitBtn = event.target;
  
  submitBtn.disabled = true;
  submitBtn.textContent = 'Submitting...';
  
  try {
    const res = await fetch('/api/ratings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        listing_id: listingId,
        seller_id: sellerId,
        rating: selectedProductRating,
        comment: comment
      })
    });
    
    const data = await res.json();
    
    if (res.ok || data.message === 'Review submitted successfully') {
      alert('✅ Thank you for your review!');
      location.reload();
    } else {
      alert('❌ ' + (data.error || 'Failed to submit review'));
      submitBtn.disabled = false;
      submitBtn.textContent = 'Submit Review';
    }
  } catch (error) {
    console.error('Error submitting review:', error);
    alert('Could not submit review. Please try again.');
    submitBtn.disabled = false;
    submitBtn.textContent = 'Submit Review';
  }
}

async function loadReviewSection(listingId, sellerId, sellerName) {
  try {
    const purchasesRes = await fetch(`/api/transactions?listing_id=${listingId}&order_status=completed`, {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    const purchasesData = await purchasesRes.json();
    
    const hasPurchased = purchasesData.success && purchasesData.data && 
                         purchasesData.data.some(t => t.type === 'purchase');
    
    const reviewsRes = await fetch(`/api/ratings/listing/${listingId}`);
    const reviewsData = await reviewsRes.json();
    const hasReviewed = reviewsData.reviews && 
                        reviewsData.reviews.some(r => r.reviewer_id === user.user_id);
    
    const reviewSection = document.getElementById('reviewSection');
    if (!reviewSection) return;
    
    if (hasPurchased && !hasReviewed) {
      reviewSection.innerHTML = `
        <h3 style="font-size: 18px; font-weight: 500; margin-bottom: 16px;">✍️ Write a Review</h3>
        <div class="review-form" style="background: #faf9f7; border-radius: 20px; padding: 24px;">
          <p style="margin-bottom: 12px; color: #5a5a5a;">You purchased this item. Share your experience with ${escapeHtml(sellerName)}!</p>
          <div class="rating-stars" style="display: flex; gap: 8px; margin-bottom: 16px;">
            <button class="star-btn" data-val="1" onclick="selectRating(1)">★</button>
            <button class="star-btn" data-val="2" onclick="selectRating(2)">★</button>
            <button class="star-btn" data-val="3" onclick="selectRating(3)">★</button>
            <button class="star-btn" data-val="4" onclick="selectRating(4)">★</button>
            <button class="star-btn" data-val="5" onclick="selectRating(5)">★</button>
          </div>
          <textarea id="reviewComment" class="review-textarea" 
                    placeholder="What did you think about this item? Your feedback helps the community..." 
                    style="width: 100%; padding: 12px; border: 1px solid #e0ddd8; border-radius: 12px; font-family: inherit; resize: vertical; min-height: 100px; margin-bottom: 16px;"></textarea>
          <button class="btn btn-primary" onclick="submitProductReview(${listingId}, ${sellerId})" 
                  style="width: auto; padding: 10px 24px; display: inline-block;">Submit Review</button>
        </div>
        <div id="existingReviews"></div>
      `;
      loadExistingReviews(listingId);
    } else {
      loadExistingReviews(listingId);
    }
  } catch (error) {
    console.error('Error loading review section:', error);
    loadExistingReviews(listingId);
  }
}

async function loadSimilarProducts(listingId) {
  try {
    const res = await fetch(`/api/listings/${listingId}/similar?limit=6`);
    const data = await res.json();
    
    if (!data.success || !data.data || data.data.length === 0) {
      return;
    }
    
    const products = data.data;
    const catEmoji = {
      'Books & Notes':'📚','Electronics':'💻','Clothing & Accessories':'👕',
      'Stationery & Supplies':'✏️','Sports & Fitness':'⚽','Food & Beverages':'🍜',
      'Furniture & Decor':'🪑','Services':'🛠️','Other':'📦',
    };
    
    let productsHtml = `
      <div style="margin-top: 48px; padding-top: 32px; border-top: 1px solid #efede8;">
        <h3 style="font-size: 20px; font-weight: 600; margin-bottom: 24px;">🛍️ Similar Products</h3>
        <div class="similar-products-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 20px;">
    `;
    
    products.forEach(product => {
      const image = product.primary_image ? `<img src="${product.primary_image}" alt="${product.title}" style="width: 100%; height: 160px; object-fit: cover;">` 
                   : `<div style="width: 100%; height: 160px; display: flex; align-items: center; justify-content: center; background: #f1f5f9; font-size: 60px;">${catEmoji[product.category] || '📦'}</div>`;
      
      const rating = product.avg_rating ? Math.round(product.avg_rating) : 0;
      const stars = rating > 0 ? '⭐'.repeat(rating) : '☆☆☆☆☆';
      
      productsHtml += `
        <a href="/listings.html?id=${product.listing_id}" style="text-decoration: none; color: inherit;">
          <div class="similar-product-card" style="background: #fff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; transition: all 0.2s; cursor: pointer;">
            <div style="position: relative; overflow: hidden;">
              ${image}
            </div>
            <div style="padding: 16px;">
              <h4 style="font-size: 14px; font-weight: 600; color: #0f172a; margin-bottom: 8px; line-height: 1.3; white-space: normal; word-break: break-word; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">${escapeHtml(product.title)}</h4>
              <p style="font-size: 13px; color: #475569; margin-bottom: 8px;">${product.category}</p>
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                <p style="font-size: 16px; font-weight: 700; color: #0f172a;">৳ ${Number(product.price).toLocaleString()}</p>
              </div>
              <p style="font-size: 12px; color: #94a3b8;">${stars} (${product.total_reviews || 0})</p>
            </div>
          </div>
        </a>
      `;
    });
    
    productsHtml += `
        </div>
      </div>
    `;
    
    const container = document.getElementById('listingBox');
    if (container) {
      container.innerHTML += productsHtml;
    }
    
  } catch (error) {
    console.error('Error loading similar products:', error);
  }
}

function renderListing(listing, isFollowing = false) {
  document.getElementById('loadingBox').style.display = 'none';

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

  const statusLabels = {
    available: '✅ Available',
    reserved: '🔄 Reserved',
    sold: '❌ Sold'
  };

  const statusColors = {
    available: '#22c55e',
    reserved: '#f59e0b',
    sold: '#ef4444'
  };

  const images = listing.images && listing.images.length > 0 ? listing.images : [listing.primary_image];
  const imagesWithFallback = images.filter(img => img);

  let mainImageHtml = '';
  if (imagesWithFallback.length > 0) {
    mainImageHtml = `<img src="${imagesWithFallback[0]}" alt="${listing.title}" id="mainImage">`;
  } else {
    mainImageHtml = `<div style="display: flex; align-items: center; justify-content: center; height: 100%; font-size: 80px;">${catEmoji[listing.category] || '📦'}</div>`;
  }

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
  const stars = avgRating > 0 ? '⭐'.repeat(avgRating) + ` (${listing.total_reviews || 0})` : 'No ratings yet';

  const isOwn = user && user.user_id === listing.seller_id;

  const html = `
    <div class="listing-container">
      <div class="listing-main">
        
        <div class="image-gallery">
          <div class="main-image">
            ${mainImageHtml}
          </div>
          ${thumbnailsHtml ? `<div class="thumbnails">${thumbnailsHtml}</div>` : ''}
        </div>

        <div class="listing-info">
          <h1>${escapeHtml(listing.title)}</h1>

          <div class="listing-meta">
            <div class="price-tag">৳ ${Number(listing.price).toLocaleString()}</div>
            <div class="status-badge" style="background: ${statusColors[listing.status] || '#888'}; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px;">
              ${statusLabels[listing.status] || listing.status}
            </div>
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

          ${isOwn ? `
            <div class="status-selector" style="margin: 16px 0; padding: 12px; background: #f5f3ef; border-radius: 12px;">
              <label style="font-size: 13px; font-weight: 500; display: block; margin-bottom: 8px;">📦 Product Status:</label>
              <div style="display: flex; gap: 12px;">
                <button class="status-btn ${listing.status === 'available' ? 'active' : ''}" 
                        onclick="updateListingStatus(${listing.listing_id}, 'available')"
                        style="flex:1; padding: 8px; border-radius: 8px; border: 1px solid #ddd; background: ${listing.status === 'available' ? '#22c55e' : '#fff'}; color: ${listing.status === 'available' ? '#fff' : '#333'}; cursor: pointer;">
                  ✅ Available
                </button>
                <button class="status-btn ${listing.status === 'reserved' ? 'active' : ''}" 
                        onclick="updateListingStatus(${listing.listing_id}, 'reserved')"
                        style="flex:1; padding: 8px; border-radius: 8px; border: 1px solid #ddd; background: ${listing.status === 'reserved' ? '#f59e0b' : '#fff'}; color: ${listing.status === 'reserved' ? '#fff' : '#333'}; cursor: pointer;">
                  🔄 Reserved
                </button>
                <button class="status-btn ${listing.status === 'sold' ? 'active' : ''}" 
                        onclick="updateListingStatus(${listing.listing_id}, 'sold')"
                        style="flex:1; padding: 8px; border-radius: 8px; border: 1px solid #ddd; background: ${listing.status === 'sold' ? '#ef4444' : '#fff'}; color: ${listing.status === 'sold' ? '#fff' : '#333'}; cursor: pointer;">
                  ❌ Sold
                </button>
              </div>
            </div>
          ` : ''}

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
                <button class="btn-report minimal" onclick="event.stopPropagation(); openReportModal(${listing.seller_id}, 'user')">🚩 Report Seller</button>
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
              <div style="text-align:center; margin-top:16px;">
                <button class="btn-report" onclick="openReportModal(${listing.listing_id}, 'listing')">🚩 Report Listing</button>
              </div>
            `}

            <div class="posted-date">Seller member since ${new Date(listing.created_at).getFullYear()}</div>
          </div>
        </div>
      </div>
      <div id="reviewSection" style="margin-top: 48px; padding-top: 32px; border-top: 1px solid #efede8;"></div>
    </div>
  `;

  document.getElementById('listingBox').innerHTML = html;
  document.getElementById('listingBox').style.display = 'block';
  
  if (!isOwn && token) {
    loadReviewSection(listing.listing_id, listing.seller_id, seller);
  } else {
    loadExistingReviews(listing.listing_id);
  }
  
  // Load similar products after reviews
  loadSimilarProducts(listing.listing_id);
}

async function updateListingStatus(listingId, status) {
  const statusLabels = {
    available: 'Available',
    reserved: 'Reserved',
    sold: 'Sold'
  };
  
  if (!confirm(`Mark this listing as ${statusLabels[status]}?`)) return;
  
  try {
    const res = await fetch(`/api/listings/${listingId}/status`, {
      method: 'PATCH',
      headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status })
    });
    
    const data = await res.json();
    if (data.success) {
      alert(`✅ Listing marked as ${statusLabels[status]}`);
      location.reload();
    } else {
      alert('❌ ' + (data.message || 'Failed to update status'));
    }
  } catch (error) {
    console.error('Error updating status:', error);
    alert('Could not update status');
  }
}

function switchImage(imageSrc, thumbnailEl) {
  const mainImg = document.getElementById('mainImage');
  if (mainImg) {
    mainImg.src = imageSrc;
  }

  document.querySelectorAll('.thumbnail').forEach(t => t.classList.remove('active'));
  thumbnailEl.classList.add('active');
}

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

    const reviewsRes = await fetch(`/api/ratings/seller/${sellerId}`);
    const reviewsData = await reviewsRes.json();
    const reviews = reviewsData.reviews || [];

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

      <div style="border-top: 1px solid #eee; padding-top: 16px; margin-top: 16px;">
        <p style="margin: 0 0 12px; color: #999; font-size: 11px; font-weight: bold; text-transform: uppercase;">Recent Reviews (${reviews.length})</p>
        ${reviews.length > 0 ? `
          <div style="max-height: 240px; overflow-y: auto; padding-right: 4px;">
            ${reviews.map(r => `
              <div style="padding: 12px; background: #fdfcf9; border-radius: 12px; border: 1px solid #f0efeb; margin-bottom: 10px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                  <span style="font-size: 13px; font-weight: 600; color: #1a1a2e;">${escapeHtml(r.reviewer_name)}</span>
                  <span style="color: #ffc107; font-size: 14px;">${'★'.repeat(r.rating)}${'☆'.repeat(5-r.rating)}</span>
                </div>
                <p style="font-size: 13px; color: #5a5a5a; margin: 0; font-style: italic;">"${escapeHtml(r.comment || 'No comment provided')}"</p>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 8px;">
                  <span style="font-size: 11px; color: #aaa;">📦 ${escapeHtml(r.listing_title || 'Item')}</span>
                  <span style="font-size: 11px; color: #bbb;">${new Date(r.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            `).join('')}
          </div>
        ` : '<p style="margin: 0; color: #aaa; font-size: 13px; text-align: center; padding: 20px;">No reviews yet</p>'}
      </div>
    `;

    document.getElementById('sellerProfileContent').innerHTML = profileHtml;
    
    const reportBtn = document.getElementById('reportSellerBtn');
    if (reportBtn) {
      reportBtn.onclick = () => {
        document.getElementById('reportedUserId').value = sellerId;
        document.getElementById('reportModal').style.display = 'flex';
        document.body.style.overflow = 'hidden';
      };
    }

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

let selectedRating = 0;
function openRatingModal(listingId, sellerId, sellerName) {
  selectedRating = 0;
  document.getElementById('ratingSellerName').textContent = `Reviewing ${sellerName}`;
  document.getElementById('ratingComment').value = '';
  document.querySelectorAll('.star-btn').forEach(s => s.classList.remove('active'));
  document.getElementById('submitRatingBtn').disabled = true;
  
  const submitBtn = document.getElementById('submitRatingBtn');
  submitBtn.onclick = () => submitRating(listingId, sellerId);
  
  document.getElementById('ratingModal').classList.add('open');
  document.body.style.overflow = 'hidden';
  setupStarRating();
}

function closeRatingModal() {
  document.getElementById('ratingModal').classList.remove('open');
  document.body.style.overflow = 'auto';
}

function setupStarRating() {
  const stars = document.querySelectorAll('.star-btn');
  const submitBtn = document.getElementById('submitRatingBtn');
  
  stars.forEach(btn => {
    btn.onclick = () => {
      selectedRating = parseInt(btn.dataset.val);
      stars.forEach((s, idx) => {
        s.classList.toggle('active', idx < selectedRating);
      });
      submitBtn.disabled = false;
    };
  });
}

async function submitRating(listingId, sellerId) {
  const comment = document.getElementById('ratingComment').value;
  const submitBtn = document.getElementById('submitRatingBtn');
  
  submitBtn.disabled = true;
  submitBtn.textContent = 'Submitting...';
  
  try {
    const res = await fetch('/api/ratings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        listing_id: listingId,
        seller_id: sellerId,
        rating: selectedRating,
        comment: comment
      })
    });
    
    const data = await res.json();
    if (res.ok) {
      alert('✅ Review submitted successfully! Thank you.');
      closeRatingModal();
      location.reload();
    } else {
      alert('❌ ' + (data.error || 'Failed to submit review'));
      submitBtn.disabled = false;
      submitBtn.textContent = 'Submit Review';
    }
  } catch (error) {
    console.error('Error submitting review:', error);
    alert('Could not submit review');
    submitBtn.disabled = false;
    submitBtn.textContent = 'Submit Review';
  }
}

function openReportModal(reportedId, type = 'user') {
  document.getElementById('reportedUserId').value = reportedId;
  document.getElementById('reportModal').setAttribute('data-type', type);
  document.getElementById('reportModal').querySelector('h2').textContent = `Report ${type === 'user' ? 'User' : 'Listing'}`;
  document.getElementById('reportModal').style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

function closeReportModal() {
  document.getElementById('reportModal').style.display = 'none';
  document.body.style.overflow = 'auto';
}

async function handleReportSubmit(e) {
  e.preventDefault();
  const reportedId = document.getElementById('reportedUserId').value;
  const reason = document.getElementById('reportReason').value;
  const details = document.getElementById('reportDetails').value;
  const type = document.getElementById('reportModal').getAttribute('data-type') || 'user';
  const submitBtn = e.target.querySelector('button[type="submit"]');

  if (!reason) return alert('Please select a reason');

  submitBtn.disabled = true;
  submitBtn.textContent = 'Submitting...';

  try {
    const res = await fetch('/api/reports', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        reported_type: type,
        reported_id: reportedId,
        reason,
        details
      })
    });

    const data = await res.json();
    if (res.ok) {
      alert('✅ Report submitted. Our team will review it shortly.');
      closeReportModal();
    } else {
      alert('❌ ' + (data.message || 'Failed to submit report'));
    }
  } catch (error) {
    console.error('Error submitting report:', error);
    alert('Could not submit report');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Submit Report';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const sellerModal = document.getElementById('sellerModal');
  const ratingModal = document.getElementById('ratingModal');
  const reportModal = document.getElementById('reportModal');
  const reportForm  = document.getElementById('reportForm');

  if (reportForm) reportForm.onsubmit = handleReportSubmit;

  [sellerModal, ratingModal, reportModal].forEach(m => {
    if (m) {
      m.addEventListener('click', (e) => {
        if (e.target === m) {
          if (m.id === 'sellerModal') closeSellerModal();
          else if (m.id === 'ratingModal') closeRatingModal();
          else closeReportModal();
        }
      });
    }
  });
});