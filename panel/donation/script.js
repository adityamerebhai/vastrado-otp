// =====================
// Section navigation: show/hide content based on menu selection
// =====================
document.querySelectorAll('.menu-item').forEach((btn) => {
  btn.addEventListener('click', () => {
    // Update active menu item
    document.querySelectorAll('.menu-item').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    // Show/hide content sections
    const targetSection = btn.dataset.section;
    document.querySelectorAll('.content-section').forEach((section) => {
      if (section.dataset.section === targetSection) {
        section.style.display = 'flex';
        section.style.flexDirection = 'column';
        section.style.gap = '16px';
        
        // Refresh listings when listings section is shown
        if (targetSection === 'listings') {
          displayListings();
        }
        
        // Update stats when profile section is shown
        if (targetSection === 'profile') {
          updateStats();
        }
        
        // Load notifications when notifications section is shown
        if (targetSection === 'notifications') {
          displayNotifications();
        }
        
        // Load orders when orders section is shown
        if (targetSection === 'orders') {
          displayDonationOrders();
        }
      } else {
        section.style.display = 'none';
      }
    });
    
    // Hide upload form when switching sections
    if (uploadFormCard && targetSection !== 'upload') {
      uploadFormCard.style.display = 'none';
    }
  });
});

// =====================
// Upload form handling
// =====================
const uploadAction = document.getElementById('uploadAction');
const uploadFormCard = document.getElementById('uploadFormCard');
const closeFormBtn = document.getElementById('closeFormBtn');
const cancelBtn = document.getElementById('cancelBtn');
const uploadForm = document.getElementById('uploadForm');
const fileInput = document.getElementById('photos');
const fileUploadArea = document.getElementById('fileUploadArea');
const filePreview = document.getElementById('filePreview');

// Open upload form when + button is clicked
if (uploadAction) {
  uploadAction.addEventListener('click', () => {
    // Show form in the upload section (which is now hidden but still exists)
    if (uploadFormCard) {
      // Make sure upload section is visible
      const uploadSection = document.querySelector('.content-section[data-section="upload"]');
      if (uploadSection) {
        uploadSection.style.display = 'flex';
        uploadSection.style.flexDirection = 'column';
        uploadSection.style.gap = '16px';
      }
      uploadFormCard.style.display = 'block';
    }
  });
}

// Close form handlers
function closeUploadForm() {
  if (uploadFormCard) {
    uploadFormCard.style.display = 'none';
  }
  if (uploadForm) {
    uploadForm.reset();
  }
  if (filePreview) {
    filePreview.innerHTML = '';
  }
  // Hide upload section
  const uploadSection = document.querySelector('.content-section[data-section="upload"]');
  if (uploadSection) {
    uploadSection.style.display = 'none';
  }
}

if (closeFormBtn) {
  closeFormBtn.addEventListener('click', closeUploadForm);
}

if (cancelBtn) {
  cancelBtn.addEventListener('click', closeUploadForm);
}

// File upload handling
if (fileUploadArea && fileInput) {
  // Click to browse
  fileUploadArea.addEventListener('click', () => {
    fileInput.click();
  });

  // Drag and drop
  fileUploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    fileUploadArea.style.borderColor = 'var(--primary)';
    fileUploadArea.style.backgroundColor = 'rgba(247, 183, 49, 0.05)';
  });

  fileUploadArea.addEventListener('dragleave', () => {
    fileUploadArea.style.borderColor = '';
    fileUploadArea.style.backgroundColor = '';
  });

  fileUploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    fileUploadArea.style.borderColor = '';
    fileUploadArea.style.backgroundColor = '';
    
    if (e.dataTransfer.files.length > 0) {
      fileInput.files = e.dataTransfer.files;
      handleFileSelection(e.dataTransfer.files);
    }
  });

  // File input change
  fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      handleFileSelection(e.target.files);
    }
  });
}

function handleFileSelection(files) {
  if (!filePreview) return;
  
  filePreview.innerHTML = '';
  const fileArray = Array.from(files);
  
  fileArray.forEach((file, index) => {
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const previewItem = document.createElement('div');
        previewItem.className = 'preview-item';
        previewItem.innerHTML = `
          <img src="${e.target.result}" alt="Preview ${index + 1}">
          <button type="button" class="remove-preview" data-index="${index}">×</button>
          <p class="preview-name">${file.name}</p>
        `;
        filePreview.appendChild(previewItem);

        // Remove preview handler
        const removeBtn = previewItem.querySelector('.remove-preview');
        removeBtn.addEventListener('click', () => {
          previewItem.remove();
          // Create new FileList without this file
          const dt = new DataTransfer();
          fileArray.forEach((f, i) => {
            if (i !== index) dt.items.add(f);
          });
          fileInput.files = dt.files;
        });
      };
      reader.readAsDataURL(file);
    }
  });
}

// =====================
// Store and display uploaded items
// =====================
// Cross-Device Storage using a simple approach
// =====================
// For true cross-device sync, you need a backend API
// This implementation uses localStorage + a shared URL parameter approach
// In production, replace with your backend API endpoint

function getStoredItems() {
  // First try localStorage
  const localItems = localStorage.getItem('donationListings');
  if (localItems) {
    try {
      return JSON.parse(localItems);
    } catch (e) {
      console.error('Error parsing local storage:', e);
    }
  }
  return [];
}

// Sync to cloud storage using backend API
// Railway server URL
const API_BASE_URL = "https://vastrado-otp-production.up.railway.app/api";
async function syncToCloud(items) {
  console.log('🔍 [DEBUG] syncToCloud() called');
  console.log('🔍 [DEBUG] Items to sync:', items);
  console.log('🔍 [DEBUG] Items count:', items.length);
  console.log('🔍 [DEBUG] API_BASE_URL:', API_BASE_URL);
  
  try {
    // Save to localStorage first (always works)
    localStorage.setItem('donationListings', JSON.stringify(items));
    localStorage.setItem('donationListings_sync', Date.now().toString());
    console.log('✅ Saved to localStorage');
    
    // Try to sync to backend API for cross-device sync
    try {
      const apiUrl = `${API_BASE_URL}/listings`;
      console.log('🔍 [DEBUG] Posting to:', apiUrl);
      console.log('🔍 [DEBUG] Items to sync:', items.length);
      console.log('🔍 [DEBUG] Payload preview:', JSON.stringify(items).substring(0, 200) + '...');
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        },
        body: JSON.stringify(items),
        cache: 'no-cache'
      });
      
      console.log('🔍 [DEBUG] Response status:', response.status, response.statusText);
      console.log('🔍 [DEBUG] Response headers:', Object.fromEntries(response.headers.entries()));
      
      if (response.ok) {
        const result = await response.json();
        console.log('🔍 [DEBUG] Response data:', result);
        if (result.success) {
          console.log(`✅ Synced ${items.length} listings to backend API (cross-device enabled)`);
          return true;
        } else {
          console.error(`❌ Backend API returned success: false`, result);
        }
      } else {
        const errorText = await response.text();
        console.error(`❌ Backend API error: ${response.status} - ${errorText}`);
        console.error('❌ Full error response:', errorText);
        return false;
      }
    } catch (apiError) {
      // Backend not available - use local storage only
      console.error('❌ Backend API POST failed:', apiError);
      console.error('❌ Error name:', apiError.name);
      console.error('❌ Error message:', apiError.message);
      console.error('❌ Error stack:', apiError.stack);
      console.log('💡 Using local storage only (cross-device sync unavailable)');
      return false; // Return false if API sync failed
    }
    
    return true; // Only return true if everything succeeded
  } catch (error) {
    console.error('❌ Sync failed:', error);
    console.error('❌ Error details:', error.message, error.stack);
    return false;
  }
}

// Fetch donations from API for cross-device sync
async function fetchDonationsFromAPI() {
  try {
    const url = `${API_BASE_URL}/listings`;
    console.log(`🔄 [DONATION] Fetching donations from: ${url}`);
    
    const res = await fetch(url, { 
      method: 'GET',
      cache: "no-cache",
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Accept': 'application/json'
      },
      mode: 'cors',
      credentials: 'omit'
    });
    
    if (!res.ok) {
      const errorText = await res.text().catch(() => 'Unknown error');
      console.warn(`❌ [DONATION] Failed to fetch donations: ${res.status} ${res.statusText}`);
      console.warn(`❌ [DONATION] Error response:`, errorText);
      return null;
    }
    
    // Check if response is actually JSON
    const contentType = res.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      console.error('❌ [DONATION] Server did not return JSON. Content-Type:', contentType);
      return null;
    }
    
    // Parse JSON with error handling
    let data;
    let responseText = '';
    try {
      responseText = await res.text();
      if (!responseText || responseText.trim() === '') {
        // Empty response is valid - means no donations yet
        console.log('ℹ️ [DONATION] Server returned empty response (no donations in database)');
        data = [];
      } else {
        data = JSON.parse(responseText);
      }
    } catch (parseError) {
      console.error('❌ [DONATION] JSON parse error:', parseError);
      console.error('❌ [DONATION] Response text that failed to parse:', responseText?.substring(0, 200) || 'No response text');
      return null;
    }
    
    console.log(`📦 [DONATION] Received ${Array.isArray(data) ? data.length : 0} donations from server`);
    
    if (Array.isArray(data)) {
      // Update localStorage with fetched data for offline access (even if empty)
      localStorage.setItem('donationListings', JSON.stringify(data));
      localStorage.setItem('donationListings_sync', Date.now().toString());
      if (data.length > 0) {
        console.log('✅ [DONATION] Donations synced to localStorage');
      } else {
        console.log('✅ [DONATION] API returned empty array (no donations yet)');
      }
      return data; // Return array even if empty (successful fetch)
    }
    
    // If data is not an array, something went wrong
    console.warn('⚠️ [DONATION] Server returned non-array data:', data);
    return null;
  } catch (error) {
    console.error('❌ [DONATION] Error fetching donations from API:', error);
    return null;
  }
}

// Get items from cloud storage
async function getItemsFromCloud() {
  // For now, return local storage items
  // In production, fetch from your backend API
  return getStoredItems();
}

async function saveItem(item) {
  console.log('💾 [SAVE] saveItem() called with:', item);
  const items = getStoredItems();
  console.log('💾 [SAVE] Current items count:', items.length);
  items.push(item);
  console.log('💾 [SAVE] New items count:', items.length);
  
  // Save to localStorage first
  localStorage.setItem('donationListings', JSON.stringify(items));
  console.log('💾 [SAVE] Saved to localStorage');
  
  // Sync ALL items to cloud - WAIT for it to complete
  console.log('💾 [SAVE] Syncing ALL items to cloud...');
  try {
    const success = await syncToCloud(items);
    if (success) {
      console.log('💾 [SAVE] ✅ Successfully synced all items to API');
    } else {
      console.error('💾 [SAVE] ⚠️ Failed to sync to API, but saved locally');
      console.error('💾 [SAVE] Check network connection and server logs');
    }
  } catch (error) {
    console.error('💾 [SAVE] ❌ Error syncing to cloud:', error);
    console.error('💾 [SAVE] Error details:', error.message);
  }
  
  updateStats();
  displayListings();
}

// Update stats cards
// Calculate donor level based on donation count
function getDonorLevel(donationCount) {
  if (donationCount >= 100) {
    return {
      level: 'Elite Donor',
      range: '100+',
      color: '#FFD700',
      gradient: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
      icon: '👑',
      description: 'The highest tier of donors'
    };
  } else if (donationCount >= 60) {
    return {
      level: 'Prime Donor',
      range: '60-100',
      color: '#C0C0C0',
      gradient: 'linear-gradient(135deg, #E8E8E8 0%, #C0C0C0 100%)',
      icon: '💎',
      description: 'An exceptional contributor'
    };
  } else if (donationCount >= 30) {
    return {
      level: 'Gold Donor',
      range: '30-60',
      color: '#FFD700',
      gradient: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
      icon: '⭐',
      description: 'A valued supporter'
    };
  } else if (donationCount >= 10) {
    return {
      level: 'Silver Donor',
      range: '10-30',
      color: '#C0C0C0',
      gradient: 'linear-gradient(135deg, #E8E8E8 0%, #C0C0C0 100%)',
      icon: '🥈',
      description: 'A dedicated contributor'
    };
  } else if (donationCount >= 1) {
    return {
      level: 'Supporter Donor',
      range: '1-10',
      color: '#CD7F32',
      gradient: 'linear-gradient(135deg, #CD7F32 0%, #8B4513 100%)',
      icon: '🤝',
      description: 'Thank you for your support'
    };
  } else {
    return {
      level: 'New Donor',
      range: '0',
      color: '#95a5a6',
      gradient: 'linear-gradient(135deg, #bdc3c7 0%, #95a5a6 100%)',
      icon: '🌱',
      description: 'Start your donation journey'
    };
  }
}

function updateStats() {
  const items = getStoredItems();
  const listingsCount = items.length;
  const sellerUsername = localStorage.getItem('username');
  
  // Get payments for this seller
  const allPayments = JSON.parse(localStorage.getItem('vastradoPayments') || '[]');
  const sellerPayments = allPayments.filter(p => p.seller === sellerUsername);
  const salesCount = sellerPayments.filter(p => p.status === 'confirmed').length;
  const pendingCount = sellerPayments.filter(p => p.status === 'pending').length;
  
  // Calculate donor level based on total donations (listings count)
  const donorInfo = getDonorLevel(listingsCount);
  
  const listingsCountEl = document.getElementById('listingsCount');
  const salesCountEl = document.getElementById('salesCount');
  const pendingCountEl = document.getElementById('pendingCount');
  const donorStatusLevelEl = document.getElementById('donorStatusLevel');
  const donorStatusSubEl = document.getElementById('donorStatusSub');
  const donorStatusCard = document.getElementById('donorStatusCard');
  
  if (listingsCountEl) {
    listingsCountEl.textContent = listingsCount;
  }
  if (salesCountEl) {
    salesCountEl.textContent = salesCount;
  }
  if (pendingCountEl) {
    pendingCountEl.textContent = pendingCount;
  }
  if (donorStatusLevelEl) {
    donorStatusLevelEl.textContent = donorInfo.icon;
    donorStatusLevelEl.style.color = donorInfo.color;
  }
  if (donorStatusSubEl) {
    donorStatusSubEl.textContent = donorInfo.level;
  }
  if (donorStatusCard) {
    donorStatusCard.style.borderTop = `3px solid ${donorInfo.color}`;
  }
}

function displayListings() {
  const listingsGrid = document.getElementById('listingsGrid');
  if (!listingsGrid) return;

  const items = getStoredItems();
  listingsGrid.innerHTML = '';

  if (items.length === 0) {
    listingsGrid.innerHTML = '<p class="muted" style="text-align: center; padding: 40px;">No listings yet. Upload your first item!</p>';
    return;
  }

  items.forEach((item, index) => {
    const card = document.createElement('div');
    card.className = 'listing-card';
    card.dataset.index = index;
    
    const mainImage = item.photos && item.photos.length > 0 ? item.photos[0] : '';
    
    card.innerHTML = `
      <button class="delete-listing-btn" data-index="${index}" aria-label="Delete listing">×</button>
      <div class="listing-image">
        <img src="${mainImage}" alt="Listing ${index + 1}" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'200\' height=\'200\'%3E%3Crect fill=\'%23ddd\' width=\'200\' height=\'200\'/%3E%3Ctext fill=\'%23999\' font-family=\'sans-serif\' font-size=\'18\' dy=\'10.5\' font-weight=\'bold\' x=\'50%25\' y=\'50%25\' text-anchor=\'middle\'%3ENo Image%3C/text%3E%3C/svg%3E'">
      </div>
      <div class="listing-info">
        <p class="listing-fabric"><strong>Fabric:</strong> ${item.fabricType || 'N/A'}</p>
        <p class="listing-condition"><strong>Condition:</strong> ${item.clothCondition || 'N/A'}</p>
      </div>
    `;

    // Delete button handler
    const deleteBtn = card.querySelector('.delete-listing-btn');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent card click
        removeListing(index);
      });
    }

    // Card click handler for viewing details
    card.addEventListener('click', () => showItemDetails(item, index));
    listingsGrid.appendChild(card);
  });
}

// Remove listing function
let pendingDeleteIndex = null;

function removeListing(index) {
  pendingDeleteIndex = index;
  const deleteModal = document.getElementById('deleteConfirmModal');
  if (deleteModal) {
    deleteModal.style.display = 'flex';
  }
}

// Handle delete confirmation
const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
const deleteConfirmModal = document.getElementById('deleteConfirmModal');

if (confirmDeleteBtn) {
  confirmDeleteBtn.addEventListener('click', () => {
    if (pendingDeleteIndex !== null) {
      const items = getStoredItems();
      if (pendingDeleteIndex >= 0 && pendingDeleteIndex < items.length) {
        items.splice(pendingDeleteIndex, 1);
        localStorage.setItem('donationListings', JSON.stringify(items));

        // 🔥 IMPORTANT: sync deletion to server
        syncToCloud(items);
        displayListings();
        updateStats();

      }
      pendingDeleteIndex = null;
    }
    if (deleteConfirmModal) {
      deleteConfirmModal.style.display = 'none';
    }
  });
}

if (cancelDeleteBtn) {
  cancelDeleteBtn.addEventListener('click', () => {
    pendingDeleteIndex = null;
    if (deleteConfirmModal) {
      deleteConfirmModal.style.display = 'none';
    }
  });
}

// Close modal on overlay click
if (deleteConfirmModal) {
  deleteConfirmModal.addEventListener('click', (e) => {
    if (e.target === deleteConfirmModal) {
      pendingDeleteIndex = null;
      deleteConfirmModal.style.display = 'none';
    }
  });
}

function showItemDetails(item, index) {
  const modal = document.getElementById('detailModal');
  const modalBody = document.getElementById('modalBody');
  
  if (!modal || !modalBody) return;

  const photosHtml = item.photos && item.photos.length > 0 
    ? item.photos.map(photo => `<img src="${photo}" alt="Photo" class="detail-photo">`).join('')
    : '<p class="muted">No photos available</p>';

  modalBody.innerHTML = `
    <div class="detail-header">
      <h2>Item Details</h2>
    </div>
    <div class="detail-photos">
      ${photosHtml}
    </div>
    <div class="detail-info">
      <div class="detail-row">
        <span class="detail-label">Fabric Type:</span>
        <span class="detail-value">${item.fabricType || 'N/A'}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Condition:</span>
        <span class="detail-value">${item.clothCondition || 'N/A'}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Phone Number:</span>
        <span class="detail-value">${item.phoneNumber || 'N/A'}</span>
      </div>
    </div>
  `;

  modal.style.display = 'flex';
}

// Close modal
const closeModal = document.getElementById('closeModal');
if (closeModal) {
  closeModal.addEventListener('click', () => {
    const modal = document.getElementById('detailModal');
    if (modal) modal.style.display = 'none';
  });
}

// Close modal on overlay click
const modalOverlay = document.getElementById('detailModal');
if (modalOverlay) {
  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) {
      modalOverlay.style.display = 'none';
    }
  });
}

// Form submission handler
async function handleFormSubmit(e) {
  if (e) e.preventDefault();
  
  if (!uploadForm) return;
  
  const formData = new FormData(uploadForm);
  const photos = [];
  
  // Convert file inputs to base64
  const filePromises = Array.from(fileInput.files).map(file => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(file);
    });
  });

  try {
    const photoData = await Promise.all(filePromises);
    const sellerUsername = localStorage.getItem('username') || 'Unknown Seller';
    const data = {
      id: Date.now(),
      
      sellerUsername: sellerUsername,
      photos: photoData.filter(p => p !== null),
      fabricType: formData.get('fabricType'),
      clothCondition: formData.get('clothCondition'),
      phoneNumber: formData.get('phoneNumber'),
      dateAdded: new Date().toISOString()
    };

    // Validate data before saving
    if (!data.fabricType || !data.clothCondition) {
      console.error('Missing required fields');
      return;
    }

    // Save to localStorage and sync to cloud - WAIT for it
    console.log('📝 [FORM] Saving item and syncing to cloud...');
    await saveItem(data);
    
    // Verify it was saved
    const savedItems = getStoredItems();
    const wasSaved = savedItems.some(item => item.id === data.id);
    
    if (!wasSaved) {
      console.error('❌ Failed to save item to localStorage');
      return;
    }
    
    console.log('✅ [FORM] Item saved and synced successfully');
    
    // Reset form and close
    closeUploadForm();
    
    // Hide upload section
    const uploadSection = document.querySelector('.content-section[data-section="upload"]');
    if (uploadSection) {
      uploadSection.style.display = 'none';
    }
    
    // Switch to listings section
    const listingsMenuItem = document.querySelector('.menu-item[data-section="listings"]');
    if (listingsMenuItem) {
      listingsMenuItem.click();
    }
    
    // Display listings
    displayListings();
  } catch (error) {
    console.error('❌ Error saving item:', error);
    console.error('❌ Error details:', error.message, error.stack);
  }
}

// Form submission
if (uploadForm) {
  uploadForm.addEventListener('submit', handleFormSubmit);
  
  // Also add direct handler to submit button for mobile compatibility
  const submitBtn = uploadForm.querySelector('.submit-btn');
  if (submitBtn) {
    submitBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      handleFormSubmit(e);
    });
    submitBtn.addEventListener('touchend', (e) => {
      e.preventDefault();
      e.stopPropagation();
      handleFormSubmit(e);
    });
  }
}

// =====================
// Profile name/avatar from stored username
// =====================
const storedUsername = localStorage.getItem('username');
const profileNameEl = document.getElementById('profileName');
const avatarEl = document.getElementById('avatar');
if (storedUsername) {
  profileNameEl.textContent = storedUsername;
  const initial = storedUsername.trim().charAt(0).toUpperCase() || 'D';
  avatarEl.textContent = initial;
}

// =====================
// Theme switching
// =====================
const themePills = document.querySelectorAll('.pill');
const themeMap = {
  light: {
    '--bg': '#fdfaf5',
    '--card': '#ffffff',
    '--primary': '#f7b731',
    '--primary-strong': '#e3a020',
    '--accent': '#ffdca4',
    '--text': '#2f2f2f',
    '--muted': '#6f6f6f',
    '--shadow': '0 12px 30px rgba(0, 0, 0, 0.08)',
    '--menu-bg': '#fff7ea',
    '--upload-gradient-start': '#ffe7bd',
    '--upload-gradient-end': '#ffd79a',
    '--upload-btn-bg': '#ffffff',
    '--pill-bg': '#fff7ea',
    '--pill-border': '#f1e6d6',
    '--border-color': '#f1e6d6',
    '--toggle-bg': '#ddd'
  },
  grey: {
    '--bg': '#e8e8e8',
    '--card': '#f5f5f5',
    '--primary': '#808080',
    '--primary-strong': '#6b6b6b',
    '--accent': '#d0d0d0',
    '--text': '#2a2a2a',
    '--muted': '#6b6b6b',
    '--shadow': '0 10px 24px rgba(0, 0, 0, 0.12)',
    '--menu-bg': '#e0e0e0',
    '--upload-gradient-start': '#d5d5d5',
    '--upload-gradient-end': '#c5c5c5',
    '--upload-btn-bg': '#f5f5f5',
    '--pill-bg': '#e0e0e0',
    '--pill-border': '#b8b8b8',
    '--border-color': '#b8b8b8',
    '--toggle-bg': '#b0b0b0'
  },
  dark: {
    '--bg': '#1f1f24',
    '--card': '#2a2a30',
    '--primary': '#f7b731',
    '--primary-strong': '#e3a020',
    '--accent': '#3b2d16',
    '--text': '#f5f5f5',
    '--muted': '#b0b0b5',
    '--shadow': '0 12px 30px rgba(0, 0, 0, 0.45)',
    '--menu-bg': '#2a2a30',
    '--upload-gradient-start': '#3a3a40',
    '--upload-gradient-end': '#2f2f35',
    '--upload-btn-bg': '#2a2a30',
    '--pill-bg': '#2a2a30',
    '--pill-border': '#3a3a40',
    '--border-color': '#3a3a40',
    '--toggle-bg': '#555'
  }
};

function applyTheme(name) {
  const theme = themeMap[name] || themeMap.light;
  Object.entries(theme).forEach(([k, v]) => {
    document.documentElement.style.setProperty(k, v);
  });
  localStorage.setItem('donationTheme', name);
  themePills.forEach(p => p.classList.toggle('active', p.dataset.theme === name));
}

const savedTheme = localStorage.getItem('donationTheme') || 'light';
applyTheme(savedTheme);

themePills.forEach(pill => {
  pill.addEventListener('click', () => applyTheme(pill.dataset.theme));
});

// =====================
// Settings toggles (mock)
// =====================
const notifyToggle = document.getElementById('notifyToggle');
if (notifyToggle) {
  const saved = localStorage.getItem('donationNotify');
  if (saved !== null) notifyToggle.checked = saved === 'true';
  notifyToggle.addEventListener('change', () => {
    localStorage.setItem('donationNotify', notifyToggle.checked ? 'true' : 'false');
  });
}

// =====================
// Profile Dropdown and Logout
// =====================
const profileDropdown = document.getElementById('profileDropdown');
const profileDropdownMenu = document.getElementById('profileDropdownMenu');
const logoutBtn = document.getElementById('logoutBtn');
const logoutConfirmModal = document.getElementById('logoutConfirmModal');
const confirmLogoutBtn = document.getElementById('confirmLogoutBtn');
const cancelLogoutBtn = document.getElementById('cancelLogoutBtn');

// Toggle dropdown
if (profileDropdown && profileDropdownMenu) {
  profileDropdown.addEventListener('click', (e) => {
    e.stopPropagation();
    const isVisible = profileDropdownMenu.style.display === 'block';
    profileDropdownMenu.style.display = isVisible ? 'none' : 'block';
  });

  // Close dropdown when clicking outside
  document.addEventListener('click', (e) => {
    if (!profileDropdown.contains(e.target)) {
      profileDropdownMenu.style.display = 'none';
    }
  });
}

// Show logout confirmation
if (logoutBtn) {
  logoutBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    profileDropdownMenu.style.display = 'none';
    if (logoutConfirmModal) {
      logoutConfirmModal.style.display = 'flex';
    }
  });
}

// Handle logout confirmation
if (confirmLogoutBtn) {
  confirmLogoutBtn.addEventListener('click', () => {
    const username = localStorage.getItem('username');
    
    // Clear user credentials
    localStorage.removeItem('username');
    localStorage.removeItem('email');
    localStorage.removeItem('role');
    localStorage.removeItem('loggedIn');
    
    // Clear donation panel data
    localStorage.removeItem('donationListings');
    localStorage.removeItem('donationListings_sync');
    localStorage.removeItem('donationTheme');
    localStorage.removeItem('donationNotify');
    
    // Clear NGO orders related to this user's donations
    const ngoOrders = JSON.parse(localStorage.getItem('ngoOrders') || '[]');
    // Filter out orders that match this user's donation IDs
    const donationListings = JSON.parse(localStorage.getItem('donationListings') || '[]');
    const userDonationIds = donationListings.map(item => item.id?.toString()).filter(Boolean);
    const filteredNgoOrders = ngoOrders.filter(order => 
      !userDonationIds.includes(order.donationId?.toString())
    );
    if (filteredNgoOrders.length !== ngoOrders.length) {
      localStorage.setItem('ngoOrders', JSON.stringify(filteredNgoOrders));
    }
    
    // Clear user-specific payments
    if (username) {
      const allPayments = JSON.parse(localStorage.getItem('vastradoPayments') || '[]');
      const filteredPayments = allPayments.filter(p => p.seller !== username && p.buyer !== username);
      localStorage.setItem('vastradoPayments', JSON.stringify(filteredPayments));
      
      // Clear user-specific chats
      const allChats = JSON.parse(localStorage.getItem('vastradoChats') || '[]');
      const filteredChats = allChats.filter(c => c.seller !== username && c.buyer !== username);
      localStorage.setItem('vastradoChats', JSON.stringify(filteredChats));
      
      // Clear user-specific notifications
      const allNotifications = JSON.parse(localStorage.getItem('vastradoNotifications') || '[]');
      const filteredNotifications = allNotifications.filter(n => n.to !== username && n.from !== username);
      localStorage.setItem('vastradoNotifications', JSON.stringify(filteredNotifications));
    }
    
    // Redirect to main page
    window.location.href = 'https://vastrado-otp-production.up.railway.app/';
  });
}

// Cancel logout
if (cancelLogoutBtn) {
  cancelLogoutBtn.addEventListener('click', () => {
    if (logoutConfirmModal) {
      logoutConfirmModal.style.display = 'none';
    }
  });
}

// Close logout modal on overlay click
if (logoutConfirmModal) {
  logoutConfirmModal.addEventListener('click', (e) => {
    if (e.target === logoutConfirmModal) {
      logoutConfirmModal.style.display = 'none';
    }
  });
}
/* ===============================
   NOTIFICATIONS (DONATION)
================================ */
async function displayNotifications() {
  await loadNotifications();
}

async function loadNotifications() {
  const notificationsList = document.getElementById("notificationsList");
  const notifBadge = document.getElementById("notifBadge");
  if (!notificationsList) return;

  const seller = localStorage.getItem("username");

  try {
    const res = await fetch(`${API_BASE_URL}/notifications/${seller}`);
    const notifications = await res.json();

    // Badge
    if (notifBadge) {
      if (notifications.length > 0) {
        notifBadge.style.display = "inline-flex";
        notifBadge.textContent = notifications.length;
      } else {
        notifBadge.style.display = "none";
      }
    }

    if (notifications.length === 0) {
      notificationsList.innerHTML =
        `<p class="muted" style="padding:20px;text-align:center">No notifications</p>`;
      return;
    }

    notificationsList.innerHTML = notifications.map(n => `
      <div class="notification-item">
        <div>
          <strong>${n.from}</strong> sent you a message
          <div class="notification-time">
            ${new Date(n.timestamp).toLocaleTimeString()}
          </div>
        </div>
      </div>
    `).join("");

  } catch (err) {
    notificationsList.innerHTML =
      `<p class="muted">Notification service unavailable</p>`;
  }
}

// =====================
// Orders Functionality
// =====================
function displayDonationOrders() {
  const ordersList = document.getElementById('donationOrdersList');
  if (!ordersList) {
    console.error('📦 [ORDERS] donationOrdersList element not found');
    return;
  }
  
  // Get NGO orders from localStorage
  const ngoOrders = JSON.parse(localStorage.getItem('ngoOrders') || '[]');
  
  if (ngoOrders.length === 0) {
    ordersList.innerHTML = '<p class="muted" style="padding: 20px; text-align: center;">No completed orders yet.</p>';
    return;
  }
  
  // Get donation listings to match with orders for full details
  const donationListings = getStoredItems();
  
  // Display orders
  ordersList.innerHTML = ngoOrders.map(order => {
    // Find the original donation item to get full details
    const donationItem = donationListings.find(item => 
      item.id && item.id.toString() === order.donationId?.toString()
    ) || order; // Fallback to order data if donation not found
    
    const mainImage = (order.photos && order.photos.length > 0) 
      ? order.photos[0] 
      : (donationItem.photos && donationItem.photos.length > 0)
        ? donationItem.photos[0]
        : '';
    
    const orderDate = new Date(order.dateOrdered).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    return `
      <div class="order-item">
        <img src="${mainImage}" alt="Order" class="order-item-image" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'200\' height=\'200\'%3E%3Crect fill=\'%23ddd\' width=\'200\' height=\'200\'/%3E%3Ctext fill=\'%23999\' font-family=\'sans-serif\' font-size=\'18\' dy=\'10.5\' font-weight=\'bold\' x=\'50%25\' y=\'50%25\' text-anchor=\'middle\'%3ENo Image%3C/text%3E%3C/svg%3E'">
        <div class="order-item-info">
          <div class="order-item-title">Donation Order Confirmed</div>
          <div class="order-item-buyer">Fabric Type: ${order.fabricType || donationItem.fabricType || 'N/A'}</div>
          <div class="order-item-condition">Condition: ${order.clothCondition || donationItem.clothCondition || 'N/A'}</div>
          ${order.phoneNumber ? `<div class="order-item-buyer">Phone: ${order.phoneNumber}</div>` : ''}
          <div class="order-item-date">Ordered: ${orderDate}</div>
          <div style="margin-top: 8px; padding: 4px 8px; background: #27ae60; color: white; border-radius: 4px; display: inline-block; font-size: 0.75rem; font-weight: 600;">Confirmed by NGO</div>
        </div>
      </div>
    `;
  }).join('');
}

// =====================
// Initialize: show profile section by default and load listings
// =====================
// Sync listings from cloud on startup
async function syncListingsFromCloud() {
  const cloudItems = await getItemsFromCloud();
  if (cloudItems && cloudItems.length > 0) {
    // Merge with local items (avoid duplicates)
    const localItems = getStoredItems();
    const merged = [...localItems];
    
    cloudItems.forEach(cloudItem => {
      if (!merged.some(item => item.id === cloudItem.id)) {
        merged.push(cloudItem);
      }
    });
    
    // Save merged list
    localStorage.setItem('donationListings', JSON.stringify(merged));
    displayListings();
    updateStats();
    return true;
  }
  return false;
}

// Display donor status modal
function showDonorStatusModal() {
  const modal = document.getElementById('donorStatusModal');
  const modalBody = document.getElementById('donorStatusBody');
  if (!modal || !modalBody) return;
  
  const items = getStoredItems();
  const donationCount = items.length;
  const currentLevel = getDonorLevel(donationCount);
  
  // All levels for display
  const allLevels = [
    { count: 100, ...getDonorLevel(100) },
    { count: 60, ...getDonorLevel(60) },
    { count: 30, ...getDonorLevel(30) },
    { count: 10, ...getDonorLevel(10) },
    { count: 1, ...getDonorLevel(1) }
  ];
  
  modalBody.innerHTML = `
    <div class="donor-status-header" style="text-align: center; margin-bottom: 32px;">
      <div class="donor-status-icon-large" style="font-size: 80px; margin-bottom: 16px;">${currentLevel.icon}</div>
      <h2 style="margin: 0 0 8px; color: var(--text); font-size: 2rem;">${currentLevel.level}</h2>
      <p style="margin: 0; color: var(--muted); font-size: 1.1rem;">${currentLevel.description}</p>
      <div style="margin-top: 16px; padding: 12px 24px; background: ${currentLevel.gradient}; border-radius: 12px; display: inline-block;">
        <div style="font-size: 2.5rem; font-weight: 700; color: white; margin-bottom: 4px;">${donationCount}</div>
        <div style="font-size: 0.9rem; color: rgba(255,255,255,0.9);">Total Donations</div>
      </div>
    </div>
    
    <div class="donor-levels-list" style="margin-top: 32px;">
      <h3 style="margin: 0 0 20px; color: var(--text); font-size: 1.2rem; text-align: center;">Donor Status Levels</h3>
      ${allLevels.map((level, index) => {
        // Determine if this is the current level
        let isCurrent = false;
        if (index === 0) {
          // Elite Donor (highest)
          isCurrent = donationCount >= 100;
        } else if (index === allLevels.length - 1) {
          // Supporter Donor (lowest)
          isCurrent = donationCount >= 1 && donationCount < 10;
        } else {
          // Middle levels
          const nextLevel = allLevels[index - 1];
          isCurrent = donationCount >= level.count && donationCount < nextLevel.count;
        }
        
        const isUnlocked = donationCount >= level.count;
        const nextLevel = index > 0 ? allLevels[index - 1] : null;
        const progress = nextLevel && donationCount < nextLevel.count ? Math.min(100, Math.max(0, ((donationCount - level.count) / (nextLevel.count - level.count)) * 100)) : (donationCount >= level.count ? 100 : 0);
        
        return `
          <div class="donor-level-item ${isCurrent ? 'current' : ''} ${isUnlocked ? 'unlocked' : 'locked'}" 
               style="padding: 20px; margin-bottom: 16px; border-radius: 12px; border: 2px solid ${isCurrent ? level.color : 'var(--border-color)'}; 
                      background: ${isCurrent ? `${level.color}15` : isUnlocked ? 'var(--card)' : 'var(--menu-bg)'};
                      position: relative; overflow: hidden;">
            ${isCurrent ? `<div style="position: absolute; top: 8px; right: 8px; background: ${level.color}; color: white; padding: 4px 12px; border-radius: 20px; font-size: 0.75rem; font-weight: 600;">CURRENT</div>` : ''}
            <div style="display: flex; align-items: center; gap: 16px;">
              <div style="font-size: 48px; opacity: ${isUnlocked ? '1' : '0.3'};">${level.icon}</div>
              <div style="flex: 1;">
                <div style="font-size: 1.3rem; font-weight: 700; color: ${isUnlocked ? level.color : 'var(--muted)'}; margin-bottom: 4px;">
                  ${level.level}
                </div>
                <div style="font-size: 0.9rem; color: var(--muted); margin-bottom: 8px;">
                  ${level.range} donations
                </div>
                ${nextLevel && donationCount < nextLevel.count ? `
                  <div style="margin-top: 8px;">
                    <div style="display: flex; justify-content: space-between; font-size: 0.85rem; color: var(--muted); margin-bottom: 4px;">
                      <span>Progress to next level</span>
                      <span>${donationCount}/${nextLevel.count}</span>
                    </div>
                    <div style="height: 6px; background: var(--menu-bg); border-radius: 3px; overflow: hidden;">
                      <div style="height: 100%; background: ${level.color}; width: ${progress}%; transition: width 0.3s ease;"></div>
                    </div>
                  </div>
                ` : donationCount >= level.count ? `
                  <div style="margin-top: 8px; color: ${level.color}; font-size: 0.85rem; font-weight: 600;">✓ Unlocked</div>
                ` : ''}
              </div>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
  
  modal.style.display = 'flex';
}

// Donor status card click handler
const donorStatusCard = document.getElementById('donorStatusCard');
if (donorStatusCard) {
  donorStatusCard.addEventListener('click', () => {
    showDonorStatusModal();
  });
  
  // Touch support for mobile
  donorStatusCard.addEventListener('touchend', (e) => {
    e.preventDefault();
    showDonorStatusModal();
  });
}

// Close donor status modal
const closeDonorStatusModal = document.getElementById('closeDonorStatusModal');
if (closeDonorStatusModal) {
  closeDonorStatusModal.addEventListener('click', () => {
    const modal = document.getElementById('donorStatusModal');
    if (modal) modal.style.display = 'none';
  });
}

// Close modal on overlay click
const donorStatusModalOverlay = document.getElementById('donorStatusModal');
if (donorStatusModalOverlay) {
  donorStatusModalOverlay.addEventListener('click', (e) => {
    if (e.target === donorStatusModalOverlay) {
      donorStatusModalOverlay.style.display = 'none';
    }
  });
}

// =====================
// REFRESH BUTTON HANDLER
// =====================
const refreshDonationsBtn = document.getElementById('refreshDonations');
if (refreshDonationsBtn) {
  refreshDonationsBtn.addEventListener('click', async () => {
    const originalContent = refreshDonationsBtn.innerHTML;
    refreshDonationsBtn.innerHTML = '⏳ Fetching...';
    refreshDonationsBtn.disabled = true;
    
    try {
      // Fetch donations from API
      const donations = await fetchDonationsFromAPI();
      
      if (donations !== null) {
        // API call succeeded (even if empty array)
        displayListings();
        updateStats();
        refreshDonationsBtn.innerHTML = '✓ Refreshed!';
        console.log('✅ [DONATION] Donations refreshed successfully');
      } else {
        // API call failed (network error, server error, etc.)
        // Fallback to localStorage
        displayListings();
        updateStats();
        refreshDonationsBtn.innerHTML = originalContent;
        console.warn('⚠️ [DONATION] API fetch failed, using localStorage');
      }
    } catch (err) {
      console.error('❌ [DONATION] Refresh error:', err);
      refreshDonationsBtn.innerHTML = '❌ Error';
      // Still show localStorage data
      displayListings();
      updateStats();
    }
    
    // Reset button after 2 seconds
    setTimeout(() => {
      refreshDonationsBtn.innerHTML = originalContent;
      refreshDonationsBtn.disabled = false;
    }, 2000);
  });
  
  // Also support touch events for mobile
  refreshDonationsBtn.addEventListener('touchend', async (e) => {
    e.preventDefault();
    refreshDonationsBtn.click();
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  console.log('🚀 [INIT] Donation panel initialized');
  const profileSection = document.querySelector('.content-section[data-section="profile"]');
  if (profileSection) {
    profileSection.style.display = 'flex';
    profileSection.style.flexDirection = 'column';
    profileSection.style.gap = '16px';
  }
  
  // Get current listings from localStorage FIRST
  const localItems = getStoredItems();
  console.log('🚀 [INIT] Local items count:', localItems.length);
  
  // CRITICAL: Sync ALL local items to cloud API on startup
  // This ensures any listings created get synced to the API
  if (localItems.length > 0) {
    console.log('🚀 [INIT] Syncing ALL local items to cloud API...');
    const syncSuccess = await syncToCloud(localItems);
    if (syncSuccess) {
      console.log('🚀 [INIT] ✅ Successfully synced all items to API');
    } else {
      console.log('🚀 [INIT] ⚠️ Failed to sync to API - check console for errors');
    }
  } else {
    console.log('🚀 [INIT] No local items to sync');
  }
  
  // Then sync from cloud (to get items from other devices)
  await syncListingsFromCloud();
  
  // Update stats
  updateStats();
  
  // Load and display listings
  displayListings();
});

