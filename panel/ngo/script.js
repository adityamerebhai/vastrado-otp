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
            
            // Refresh donations when donations section is shown
            if (targetSection === 'donations') {
              displayDonations();
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
              displayNgoOrders();
            }
          } else {
            section.style.display = 'none';
          }
        });
    
    // Hide donate form when switching sections
    if (donateFormCard && targetSection !== 'donate') {
      donateFormCard.style.display = 'none';
    }
  });
});

// =====================
// Donate form handling
// =====================
const donateAction = document.getElementById('donateAction');
const donateFormCard = document.getElementById('donateFormCard');
const closeFormBtn = document.getElementById('closeFormBtn');
const cancelBtn = document.getElementById('cancelBtn');
const donateForm = document.getElementById('donateForm');
const fileInput = document.getElementById('photos');
const fileUploadArea = document.getElementById('fileUploadArea');
const filePreview = document.getElementById('filePreview');

// Open donate form when + button is clicked
if (donateAction) {
  donateAction.addEventListener('click', () => {
    if (donateFormCard) {
      const donateSection = document.querySelector('.content-section[data-section="donate"]');
      if (donateSection) {
        donateSection.style.display = 'flex';
        donateSection.style.flexDirection = 'column';
        donateSection.style.gap = '16px';
      }
      donateFormCard.style.display = 'block';
    }
  });
}

// Close form handlers
function closeDonateForm() {
  if (donateFormCard) {
    donateFormCard.style.display = 'none';
  }
  if (donateForm) {
    donateForm.reset();
  }
  if (filePreview) {
    filePreview.innerHTML = '';
  }
  const donateSection = document.querySelector('.content-section[data-section="donate"]');
  if (donateSection) {
    donateSection.style.display = 'none';
  }
}

if (closeFormBtn) {
  closeFormBtn.addEventListener('click', closeDonateForm);
}

if (cancelBtn) {
  cancelBtn.addEventListener('click', closeDonateForm);
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
// Store and display donations made
// =====================
const API_BASE_URL = "https://vastrado-otp-production.up.railway.app/api";

function getStoredDonations() {
  const localItems = localStorage.getItem('ngoDonations');
  if (localItems) {
    try {
      return JSON.parse(localItems);
    } catch (e) {
      console.error('Error parsing local storage:', e);
    }
  }
  return [];
}

async function syncToCloud(donations) {
  try {
    localStorage.setItem('ngoDonations', JSON.stringify(donations));
    localStorage.setItem('ngoDonations_sync', Date.now().toString());
    
    try {
      const apiUrl = `${API_BASE_URL}/ngo-donations`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        },
        body: JSON.stringify(donations),
        cache: 'no-cache'
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          console.log(`✅ Synced ${donations.length} donations to backend API`);
          return true;
        }
      }
    } catch (apiError) {
      console.error('❌ Backend API POST failed:', apiError);
      console.log('💡 Using local storage only');
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('❌ Sync failed:', error);
    return false;
  }
}

async function saveDonation(donation) {
  const donations = getStoredDonations();
  donations.push(donation);
  
  localStorage.setItem('ngoDonations', JSON.stringify(donations));
  
  try {
    const success = await syncToCloud(donations);
    if (success) {
      console.log('✅ Successfully synced donation to API');
    } else {
      console.error('⚠️ Failed to sync to API, but saved locally');
    }
  } catch (error) {
    console.error('❌ Error syncing to cloud:', error);
  }
  
  updateStats();
  displayDonations();
}

// Update stats cards
function updateStats() {
  const donations = getStoredDonations();
  const donationsCount = donations.length;
  const newItemsCount = donations.filter(d => d.clothCondition === 'new').length;
  const pendingCount = 0; // No pending status for donations
  
  const donationsCountEl = document.getElementById('donationsCount');
  const amountCountEl = document.getElementById('amountCount');
  const pendingCountEl = document.getElementById('pendingCount');
  
  if (donationsCountEl) {
    donationsCountEl.textContent = donationsCount;
  }
  if (amountCountEl) {
    amountCountEl.textContent = newItemsCount;
  }
  if (pendingCountEl) {
    pendingCountEl.textContent = pendingCount;
  }
}

function displayDonations() {
  const donationsGrid = document.getElementById('donationsGrid');
  if (!donationsGrid) return;

  const donations = getStoredDonations();
  donationsGrid.innerHTML = '';

  if (donations.length === 0) {
    donationsGrid.innerHTML = '<p class="muted" style="text-align: center; padding: 40px;">No donations yet. Make your first donation!</p>';
    return;
  }

  donations.forEach((donation, index) => {
    const card = document.createElement('div');
    card.className = 'listing-card';
    card.dataset.index = index;
    
    const mainImage = donation.photos && donation.photos.length > 0 ? donation.photos[0] : '';
    
    card.innerHTML = `
      <button class="delete-listing-btn" data-index="${index}" aria-label="Delete donation">×</button>
      <div class="listing-image">
        <img src="${mainImage}" alt="Donation ${index + 1}" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'200\' height=\'200\'%3E%3Crect fill=\'%23ddd\' width=\'200\' height=\'200\'/%3E%3Ctext fill=\'%23999\' font-family=\'sans-serif\' font-size=\'18\' dy=\'10.5\' font-weight=\'bold\' x=\'50%25\' y=\'50%25\' text-anchor=\'middle\'%3ENo Image%3C/text%3E%3C/svg%3E'">
      </div>
      <div class="listing-info">
        <p class="listing-fabric"><strong>Type:</strong> ${donation.donationType || 'N/A'}</p>
        <p class="listing-cost"><strong>Quality:</strong> ${donation.clothCondition || 'N/A'}</p>
        <p class="listing-condition"><strong>Description:</strong> ${donation.description ? (donation.description.substring(0, 30) + (donation.description.length > 30 ? '...' : '')) : 'N/A'}</p>
      </div>
    `;

    // Delete button handler
    const deleteBtn = card.querySelector('.delete-listing-btn');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent card click
        removeDonation(index);
      });
    }

    // Card click handler for viewing details
    card.addEventListener('click', () => showDonationDetails(donation, index));
    donationsGrid.appendChild(card);
  });
}

// Remove donation function
let pendingDeleteIndex = null;

function removeDonation(index) {
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
      const donations = getStoredDonations();
      if (pendingDeleteIndex >= 0 && pendingDeleteIndex < donations.length) {
        donations.splice(pendingDeleteIndex, 1);
        localStorage.setItem('ngoDonations', JSON.stringify(donations));
        syncToCloud(donations);
        displayDonations();
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

if (deleteConfirmModal) {
  deleteConfirmModal.addEventListener('click', (e) => {
    if (e.target === deleteConfirmModal) {
      pendingDeleteIndex = null;
      deleteConfirmModal.style.display = 'none';
    }
  });
}

function showDonationDetails(donation, index) {
  const modal = document.getElementById('detailModal');
  const modalBody = document.getElementById('modalBody');
  
  if (!modal || !modalBody) return;

  const photosHtml = donation.photos && donation.photos.length > 0 
    ? donation.photos.map(photo => `<img src="${photo}" alt="Photo" class="detail-photo">`).join('')
    : '<p class="muted">No photos available</p>';

  modalBody.innerHTML = `
    <div class="detail-header">
      <h2>Donation Details</h2>
    </div>
    <div class="detail-photos">
      ${photosHtml}
    </div>
    <div class="detail-info">
      <div class="detail-row">
        <span class="detail-label">Cloth Type:</span>
        <span class="detail-value">${donation.donationType || 'N/A'}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Quality:</span>
        <span class="detail-value">${donation.clothCondition || 'N/A'}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Description:</span>
        <span class="detail-value">${donation.description || 'N/A'}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Date:</span>
        <span class="detail-value">${new Date(donation.dateAdded || Date.now()).toLocaleDateString()}</span>
      </div>
    </div>
  `;

  modal.style.display = 'flex';
}

// Close modal
const closeModal = document.getElementById('closeModal');
const detailModal = document.getElementById('detailModal');

if (closeModal) {
  closeModal.addEventListener('click', () => {
    if (detailModal) {
      detailModal.style.display = 'none';
    }
  });
}

if (detailModal) {
  detailModal.addEventListener('click', (e) => {
    if (e.target === detailModal) {
      detailModal.style.display = 'none';
    }
  });
}

// Form submission
async function handleDonateFormSubmit(e) {
  if (e) e.preventDefault();
  
  if (!donateForm) return;
  
  const formData = new FormData(donateForm);
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
    const donorUsername = localStorage.getItem('username') || 'Unknown Donor';
    const donationType = formData.get('donationType');
    const clothCondition = formData.get('clothCondition');
    const description = formData.get('description');
    
    // Validate data before saving
    if (!donationType || !clothCondition || !description) {
      alert('Please fill in all required fields');
      return;
    }
    
    if (photoData.length === 0) {
      alert('Please upload at least one photo');
      return;
    }

    const donation = {
      id: Date.now(),
      donor: donorUsername,
      photos: photoData.filter(p => p !== null),
      donationType: donationType,
      clothCondition: clothCondition,
      description: description,
      dateAdded: new Date().toISOString()
    };

    // Save to localStorage and sync to cloud
    console.log('📝 [FORM] Saving donation and syncing to cloud...');
    await saveDonation(donation);
    
    // Verify it was saved
    const savedDonations = getStoredDonations();
    const wasSaved = savedDonations.some(d => d.id === donation.id);
    
    if (!wasSaved) {
      console.error('❌ Failed to save donation to localStorage');
      return;
    }
    
    console.log('✅ [FORM] Donation saved and synced successfully');
    
    // Reset form and close
    closeDonateForm();
    
    // Hide donate section
    const donateSection = document.querySelector('.content-section[data-section="donate"]');
    if (donateSection) {
      donateSection.style.display = 'none';
    }
    
    // Switch to donations section
    const donationsMenuItem = document.querySelector('.menu-item[data-section="donations"]');
    if (donationsMenuItem) {
      donationsMenuItem.click();
    }
    
    // Display donations
    displayDonations();
    
    // Show success modal
    const successModal = document.getElementById('successModal');
    const successTitle = document.getElementById('successTitle');
    const successMessage = document.getElementById('successMessage');
    if (successModal && successTitle && successMessage) {
      successTitle.textContent = 'Donation Submitted!';
      successMessage.textContent = 'Your donation has been submitted successfully. Thank you for your generosity!';
      successModal.style.display = 'flex';
    }
  } catch (error) {
    console.error('❌ Error saving donation:', error);
    console.error('❌ Error details:', error.message, error.stack);
  }
}

if (donateForm) {
  donateForm.addEventListener('submit', handleDonateFormSubmit);
  
  // Also add direct handler to submit button for mobile compatibility
  const submitBtn = donateForm.querySelector('.submit-btn');
  if (submitBtn) {
    submitBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      handleDonateFormSubmit(e);
    });
    submitBtn.addEventListener('touchend', (e) => {
      e.preventDefault();
      e.stopPropagation();
      handleDonateFormSubmit(e);
    });
  }
}

// Success modal close
const successOkBtn = document.getElementById('successOkBtn');
const successModal = document.getElementById('successModal');

if (successOkBtn && successModal) {
  successOkBtn.addEventListener('click', () => {
    successModal.style.display = 'none';
  });
  
  successModal.addEventListener('click', (e) => {
    if (e.target === successModal) {
      successModal.style.display = 'none';
    }
  });
}

// =====================
// Profile Dropdown
// =====================
const profileDropdown = document.getElementById('profileDropdown');
const profileDropdownMenu = document.getElementById('profileDropdownMenu');

if (profileDropdown) {
  const toggleDropdown = (e) => {
    e.stopPropagation();
    if (profileDropdownMenu) {
      profileDropdownMenu.style.display =
        profileDropdownMenu.style.display === 'none' ? 'block' : 'none';
    }
  };
  
  profileDropdown.addEventListener('click', toggleDropdown);
  profileDropdown.addEventListener('touchend', (e) => {
    e.preventDefault();
    toggleDropdown(e);
  }, { passive: false });
}

document.addEventListener('click', () => {
  if (profileDropdownMenu) {
    profileDropdownMenu.style.display = 'none';
  }
});

// =====================
// Logout
// =====================
const logoutBtn = document.getElementById('logoutBtn');
const logoutConfirmModal = document.getElementById('logoutConfirmModal');
const confirmLogoutBtn = document.getElementById('confirmLogoutBtn');
const cancelLogoutBtn = document.getElementById('cancelLogoutBtn');

if (logoutBtn) {
  logoutBtn.addEventListener('click', () => {
    if (logoutConfirmModal) {
      logoutConfirmModal.style.display = 'flex';
    }
  });
}

if (confirmLogoutBtn) {
  confirmLogoutBtn.addEventListener('click', () => {
    localStorage.removeItem('username');
    localStorage.removeItem('loggedIn');
    window.location.href = '/';
  });
}

if (cancelLogoutBtn) {
  cancelLogoutBtn.addEventListener('click', () => {
    if (logoutConfirmModal) {
      logoutConfirmModal.style.display = 'none';
    }
  });
}

if (logoutConfirmModal) {
  logoutConfirmModal.addEventListener('click', (e) => {
    if (e.target === logoutConfirmModal) {
      logoutConfirmModal.style.display = 'none';
    }
  });
}

// =====================
// Notifications
// =====================
function displayNotifications() {
  const notificationsList = document.getElementById('notificationsList');
  if (!notificationsList) return;
  
  const notifications = JSON.parse(localStorage.getItem('ngoNotifications') || '[]');
  
  if (notifications.length === 0) {
    notificationsList.innerHTML = '<p class="muted" style="padding: 20px; text-align: center;">No notifications yet</p>';
    return;
  }
  
  notificationsList.innerHTML = notifications.map(notif => `
    <div class="notification-item ${notif.read ? 'notification-read' : 'notification-new'}">
      <div class="notification-icon">📢</div>
      <div class="notification-content">
        <p class="notification-text">${notif.message}</p>
        <p class="notification-time">${new Date(notif.time).toLocaleString()}</p>
      </div>
    </div>
  `).join('');
}

// =====================
// Orders
// =====================
function displayNgoOrders() {
  const ordersList = document.getElementById('ngoOrdersList');
  if (!ordersList) return;
  
  const donations = getStoredDonations();
  
  if (donations.length === 0) {
    ordersList.innerHTML = '<p class="muted" style="padding: 20px; text-align: center;">No donations yet.</p>';
    return;
  }
  
  ordersList.innerHTML = donations.map(donation => `
    <div class="order-item">
      <div class="order-item-info">
        <p class="order-item-title">${donation.donationType || 'Donation'}</p>
        <p class="order-item-buyer">Quality: ${donation.clothCondition || 'N/A'}</p>
        <p class="order-item-date">${new Date(donation.dateAdded || Date.now()).toLocaleString()}</p>
      </div>
    </div>
  `).join('');
}

// =====================
// Settings
// =====================
const themePills = document.querySelectorAll('.pill');
const notifyToggle = document.getElementById('notifyToggle');

// Theme switching
const themeMap = {
  light: {
    '--bg': '#fdfaf5',
    '--card': '#ffffff',
    '--primary': '#f7b731',
    '--text': '#2f2f2f',
    '--muted': '#6f6f6f'
  },
  grey: {
    '--bg': '#f5f5f5',
    '--card': '#ffffff',
    '--primary': '#6c757d',
    '--text': '#212529',
    '--muted': '#6c757d'
  },
  dark: {
    '--bg': '#1a1a1a',
    '--card': '#2d2d2d',
    '--primary': '#f7b731',
    '--text': '#ffffff',
    '--muted': '#b0b0b0'
  }
};

function applyTheme(theme) {
  const themeVars = themeMap[theme];
  if (themeVars) {
    Object.entries(themeVars).forEach(([key, value]) => {
      document.documentElement.style.setProperty(key, value);
    });
    localStorage.setItem('ngoTheme', theme);
  }
}

// Load saved theme
const savedTheme = localStorage.getItem('ngoTheme') || 'light';
applyTheme(savedTheme);

themePills.forEach(pill => {
  pill.addEventListener('click', () => {
    themePills.forEach(p => p.classList.remove('active'));
    pill.classList.add('active');
    const theme = pill.dataset.theme;
    applyTheme(theme);
  });
  
  if (pill.dataset.theme === savedTheme) {
    pill.classList.add('active');
  }
});

// Notifications toggle
if (notifyToggle) {
  const savedNotify = localStorage.getItem('ngoNotify');
  if (savedNotify !== null) {
    notifyToggle.checked = savedNotify === 'true';
  }
  
  notifyToggle.addEventListener('change', () => {
    localStorage.setItem('ngoNotify', notifyToggle.checked.toString());
  });
}

// =====================
// Initialize
// =====================
document.addEventListener('DOMContentLoaded', () => {
  const username = localStorage.getItem('username');
  const loggedIn = localStorage.getItem('loggedIn');
  
  if (!username || loggedIn !== 'true') {
    window.location.href = '/';
    return;
  }
  
  // Set profile name
  const profileName = document.getElementById('profileName');
  const avatar = document.getElementById('avatar');
  if (profileName) {
    profileName.textContent = username || 'NGO';
  }
  if (avatar) {
    avatar.textContent = (username || 'N').charAt(0).toUpperCase();
  }
  
  updateStats();
  displayDonations();
  displayNotifications();
});

