// Auth check
const token = localStorage.getItem('token');
const user = JSON.parse(localStorage.getItem('user') || 'null');

if (!token || !user) {
  window.location.href = '/login';
}

// ==========================================
// FILE UPLOAD HANDLING
// ==========================================

const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const previewGrid = document.getElementById('previewGrid');
let uploadedFiles = [];

// Click to browse
uploadArea.addEventListener('click', () => fileInput.click());

// Drag and drop
uploadArea.addEventListener('dragover', (e) => {
  e.preventDefault();
  uploadArea.style.borderColor = '#c9a03d';
  uploadArea.style.backgroundColor = '#fff5e6';
});

uploadArea.addEventListener('dragleave', () => {
  uploadArea.style.borderColor = '#e0ddd8';
  uploadArea.style.backgroundColor = '#faf9f7';
});

uploadArea.addEventListener('drop', (e) => {
  e.preventDefault();
  uploadArea.style.borderColor = '#e0ddd8';
  uploadArea.style.backgroundColor = '#faf9f7';
  
  const files = e.dataTransfer.files;
  handleFiles(files);
});

// File input change
fileInput.addEventListener('change', (e) => {
  handleFiles(e.target.files);
});

function handleFiles(files) {
  for (let file of files) {
    if (!file.type.startsWith('image/')) continue;
    if (file.size > 5 * 1024 * 1024) {
      alert(`File ${file.name} is too large (max 5MB)`);
      continue;
    }
    
    uploadedFiles.push(file);
  }
  
  renderPreviews();
}

function renderPreviews() {
  previewGrid.innerHTML = '';
  
  uploadedFiles.forEach((file, index) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const item = document.createElement('div');
      item.className = 'preview-item' + (index === 0 ? ' primary' : '');
      
      item.innerHTML = `
        <img src="${e.target.result}" alt="preview">
        ${index === 0 ? '<div class="cover-tag">Cover</div>' : ''}
        <button type="button" class="remove" onclick="removeImage(${index})">✕</button>
      `;
      
      previewGrid.appendChild(item);
    };
    reader.readAsDataURL(file);
  });
}

function removeImage(index) {
  uploadedFiles.splice(index, 1);
  renderPreviews();
}

// ==========================================
// FORM VALIDATION & SUBMISSION
// ==========================================

const form = document.getElementById('sellForm');
const alertBox = document.getElementById('alertBox');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  // Get form values
  const title = document.getElementById('title').value.trim();
  const description = document.getElementById('description').value.trim();
  const price = document.getElementById('price').value.trim();
  const category = document.getElementById('category').value;
  const condition = document.getElementById('condition').value;
  const location = document.getElementById('location').value.trim();
  
  // Validate
  if (!title || title.length < 3) {
    showAlert('Title must be at least 3 characters', 'error');
    document.getElementById('f-title').classList.add('has-error');
    return;
  }
  
  if (!description || description.length < 10) {
    showAlert('Description must be at least 10 characters', 'error');
    document.getElementById('f-description').classList.add('has-error');
    return;
  }
  
  if (!price || parseFloat(price) <= 0) {
    showAlert('Price must be greater than 0', 'error');
    document.getElementById('f-price').classList.add('has-error');
    return;
  }
  
  if (!category) {
    showAlert('Please select a category', 'error');
    document.getElementById('f-category').classList.add('has-error');
    return;
  }
  
  if (!condition) {
    showAlert('Please select a condition', 'error');
    document.getElementById('f-condition').classList.add('has-error');
    return;
  }
  
  if (!location) {
    showAlert('Please enter a location', 'error');
    document.getElementById('f-location').classList.add('has-error');
    return;
  }
  
  // Clear errors
  document.querySelectorAll('.has-error').forEach(el => el.classList.remove('has-error'));
  
  try {
    // Create FormData
    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('price', parseFloat(price));
    formData.append('category', category);
    formData.append('condition_type', condition);
    formData.append('location', location);
    
    // Add files
    uploadedFiles.forEach(file => {
      formData.append('images', file);
    });
    
    // Submit
    const res = await fetch('/api/listings', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + token },
      body: formData
    });
    
    const data = await res.json();
    
    if (data.success) {
      showAlert('✅ Item posted successfully! Redirecting to homepage...', 'success');
      
      // Redirect to homepage to see new item
      setTimeout(() => {
        window.location.href = `/`;
      }, 1500);
    } else {
      showAlert('❌ ' + (data.message || 'Failed to post item'), 'error');
    }
  } catch (error) {
    console.error('Error:', error);
    showAlert('Could not post item. Please try again.', 'error');
  }
});

function showAlert(message, type) {
  alertBox.className = 'alert ' + type;
  alertBox.textContent = message;
  alertBox.style.display = 'block';
  
  // Auto-hide after 5 seconds
  setTimeout(() => {
    alertBox.style.display = 'none';
  }, 5000);
}

// Clear error on input
document.querySelectorAll('.form-group input, .form-group textarea, .form-group select').forEach(el => {
  el.addEventListener('input', function() {
    this.parentElement.classList.remove('has-error');
  });
});

// Character counter
const descInput = document.getElementById('description');
const descCount = document.getElementById('descCount');
descInput.addEventListener('input', () => {
  descCount.textContent = descInput.value.length;
});
