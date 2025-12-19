// =====================
// Section navigation: show/hide content based on menu selection
// =====================
document.querySelectorAll('.menu-item').forEach((btn) => {
  const handleMenuClick = () => {
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
      } else {
        section.style.display = 'none';
      }
    });
    
    // Hide upload form when switching sections
    if (uploadFormCard && targetSection !== 'upload') {
      uploadFormCard.style.display = 'none';
    }
  };
  
  btn.addEventListener('click', handleMenuClick);
  // Mobile touch support
  btn.addEventListener('touchend', (e) => {
    e.preventDefault();
    handleMenuClick();
  }, { passive: false });
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
  const openUploadForm = () => {
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
  };
  
  uploadAction.addEventListener('click', openUploadForm);
  // Mobile touch support
  uploadAction.addEventListener('touchend', (e) => {
    e.preventDefault();
    openUploadForm();
  }, { passive: false });
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
  // Mobile touch support
  closeFormBtn.addEventListener('touchend', (e) => {
    e.preventDefault();
    closeUploadForm();
  }, { passive: false });
}

if (cancelBtn) {
  cancelBtn.addEventListener('click', closeUploadForm);
  // Mobile touch support
  cancelBtn.addEventListener('touchend', (e) => {
    e.preventDefault();
    closeUploadForm();
  }, { passive: false });
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
function getStoredItems() {
  const localItems = localStorage.getItem('sellerListings');
  if (localItems) {
    try {
      return JSON.parse(localItems);
    } catch (e) {
      console.error('Error parsing local storage:', e);
    }
  }
  return [];
}

function saveItem(item) {
  console.log('💾 [SAVE] saveItem() called with:', item);
  const items = getStoredItems();
  console.log('💾 [SAVE] Current items count:', items.length);
  items.push(item);
  console.log('💾 [SAVE] New items count:', items.length);
  
  // Save to localStorage
  localStorage.setItem('sellerListings', JSON.stringify(items));
  console.log('💾 [SAVE] Saved to localStorage');
  
  updateStats();
  displayListings();
}

// Update stats cards
function updateStats() {
  const items = getStoredItems();
  const listingsCount = items.length;
  
  const listingsCountEl = document.getElementById('listingsCount');
  
  if (listingsCountEl) {
    listingsCountEl.textContent = listingsCount;
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
        <p class="listing-cost"><strong>Cost:</strong> ₹${item.expectedCost || '0'}</p>
        <p class="listing-condition"><strong>Condition:</strong> ${item.clothCondition || 'N/A'}</p>
      </div>
    `;

    // Delete button handler
    const deleteBtn = card.querySelector('.delete-listing-btn');
    if (deleteBtn) {
      const handleDelete = (e) => {
        e.stopPropagation(); // Prevent card click
        removeListing(index);
      };
      
      deleteBtn.addEventListener('click', handleDelete);
      // Mobile touch support
      deleteBtn.addEventListener('touchend', (e) => {
        e.preventDefault();
        e.stopPropagation();
        handleDelete(e);
      }, { passive: false });
    }

    // Card click handler for viewing details
    const handleCardClick = () => showItemDetails(item, index);
    card.addEventListener('click', handleCardClick);
    // Mobile touch support
    card.addEventListener('touchend', (e) => {
      e.preventDefault();
      handleCardClick();
    }, { passive: false });
    
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
  const handleConfirmDelete = () => {
    if (pendingDeleteIndex !== null) {
      const items = getStoredItems();
      if (pendingDeleteIndex >= 0 && pendingDeleteIndex < items.length) {
        items.splice(pendingDeleteIndex, 1);
        localStorage.setItem('sellerListings', JSON.stringify(items));
        displayListings();
        updateStats();
      }
      pendingDeleteIndex = null;
    }
    if (deleteConfirmModal) {
      deleteConfirmModal.style.display = 'none';
    }
  };
  
  confirmDeleteBtn.addEventListener('click', handleConfirmDelete);
  // Mobile touch support
  confirmDeleteBtn.addEventListener('touchend', (e) => {
    e.preventDefault();
    e.stopPropagation();
    handleConfirmDelete();
  }, { passive: false });
}

if (cancelDeleteBtn) {
  const handleCancelDelete = () => {
    pendingDeleteIndex = null;
    if (deleteConfirmModal) {
      deleteConfirmModal.style.display = 'none';
    }
  };
  
  cancelDeleteBtn.addEventListener('click', handleCancelDelete);
  // Mobile touch support
  cancelDeleteBtn.addEventListener('touchend', (e) => {
    e.preventDefault();
    e.stopPropagation();
    handleCancelDelete();
  }, { passive: false });
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
        <span class="detail-label">Expected Cost:</span>
        <span class="detail-value">₹${item.expectedCost || '0'}</span>
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
  const closeDetailModal = () => {
    const modal = document.getElementById('detailModal');
    if (modal) modal.style.display = 'none';
  };
  
  closeModal.addEventListener('click', closeDetailModal);
  // Mobile touch support
  closeModal.addEventListener('touchend', (e) => {
    e.preventDefault();
    closeDetailModal();
  }, { passive: false });
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
      expectedCost: formData.get('expectedCost'),
      clothCondition: formData.get('clothCondition'),
      phoneNumber: formData.get('phoneNumber'),
      dateAdded: new Date().toISOString()
    };

    // Validate data before saving
    if (!data.fabricType || !data.expectedCost || !data.clothCondition) {
      console.error('Missing required fields');
      return;
    }

    // Save to localStorage
    console.log('📝 [FORM] Saving item...');
    saveItem(data);
    
    // Verify it was saved
    const savedItems = getStoredItems();
    const wasSaved = savedItems.some(item => item.id === data.id);
    
    if (!wasSaved) {
      console.error('❌ Failed to save item to localStorage');
      return;
    }
    
    console.log('✅ [FORM] Item saved successfully');
    
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
  if (profileNameEl) profileNameEl.textContent = storedUsername;
  if (avatarEl) {
    const initial = storedUsername.trim().charAt(0).toUpperCase() || 'S';
    avatarEl.textContent = initial;
  }
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
  localStorage.setItem('sellerTheme', name);
  themePills.forEach(p => p.classList.toggle('active', p.dataset.theme === name));
}

const savedTheme = localStorage.getItem('sellerTheme') || 'light';
applyTheme(savedTheme);

themePills.forEach(pill => {
  pill.addEventListener('click', () => applyTheme(pill.dataset.theme));
});

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
  const toggleDropdown = (e) => {
    e.stopPropagation();
    const isVisible = profileDropdownMenu.style.display === 'block';
    profileDropdownMenu.style.display = isVisible ? 'none' : 'block';
  };
  
  profileDropdown.addEventListener('click', toggleDropdown);
  // Mobile touch support
  profileDropdown.addEventListener('touchend', (e) => {
    e.preventDefault();
    toggleDropdown(e);
  }, { passive: false });

  // Close dropdown when clicking outside
  document.addEventListener('click', (e) => {
    if (!profileDropdown.contains(e.target)) {
      profileDropdownMenu.style.display = 'none';
    }
  });
}

// Show logout confirmation
if (logoutBtn) {
  const showLogoutModal = (e) => {
    e.stopPropagation();
    if (profileDropdownMenu) profileDropdownMenu.style.display = 'none';
    if (logoutConfirmModal) {
      logoutConfirmModal.style.display = 'flex';
    }
  };
  
  logoutBtn.addEventListener('click', showLogoutModal);
  // Mobile touch support
  logoutBtn.addEventListener('touchend', (e) => {
    e.preventDefault();
    e.stopPropagation();
    showLogoutModal(e);
  }, { passive: false });
}

// Handle logout confirmation
if (confirmLogoutBtn) {
  const handleLogout = () => {
    // Clear all localStorage data
    localStorage.removeItem('username');
    localStorage.removeItem('email');
    localStorage.removeItem('role');
    localStorage.removeItem('loggedIn');
    localStorage.removeItem('sellerListings');
    localStorage.removeItem('sellerTheme');
    localStorage.removeItem('sellerNotify');
    
    // Redirect to main page
    window.location.href = '/';
  };
  
  confirmLogoutBtn.addEventListener('click', handleLogout);
  // Mobile touch support
  confirmLogoutBtn.addEventListener('touchend', (e) => {
    e.preventDefault();
    e.stopPropagation();
    handleLogout();
  }, { passive: false });
}

// Cancel logout
if (cancelLogoutBtn) {
  const hideLogoutModal = (e) => {
    e.stopPropagation();
    if (logoutConfirmModal) {
      logoutConfirmModal.style.display = 'none';
    }
  };
  
  cancelLogoutBtn.addEventListener('click', hideLogoutModal);
  // Mobile touch support
  cancelLogoutBtn.addEventListener('touchend', (e) => {
    e.preventDefault();
    e.stopPropagation();
    hideLogoutModal(e);
  }, { passive: false });
}

// Close logout modal on overlay click
if (logoutConfirmModal) {
  logoutConfirmModal.addEventListener('click', (e) => {
    if (e.target === logoutConfirmModal) {
      logoutConfirmModal.style.display = 'none';
    }
  });
}

// =====================
// Settings toggles
// =====================
const notifyToggle = document.getElementById('notifyToggle');
if (notifyToggle) {
  const saved = localStorage.getItem('sellerNotify');
  if (saved !== null) notifyToggle.checked = saved === 'true';
  notifyToggle.addEventListener('change', () => {
    localStorage.setItem('sellerNotify', notifyToggle.checked ? 'true' : 'false');
  });
}

// =====================
// Initialize: show profile section by default and load listings
// =====================
document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 [INIT] Seller panel initialized');
  const profileSection = document.querySelector('.content-section[data-section="profile"]');
  if (profileSection) {
    profileSection.style.display = 'flex';
    profileSection.style.flexDirection = 'column';
    profileSection.style.gap = '16px';
  }
  
  // Get current listings from localStorage
  const localItems = getStoredItems();
  console.log('🚀 [INIT] Local items count:', localItems.length);
  
  // Update stats
  updateStats();
  
  // Load and display listings
  displayListings();
});
