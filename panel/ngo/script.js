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
          displayNgoOrders();
        }
      } else {
        section.style.display = 'none';
      }
    });
    
  });
});

// =====================
// API CONFIG
// =====================
const API_BASE_URL = "https://vastrado-otp-production.up.railway.app/api";

// =====================
// NGO panel reads donations from donation panel
// No upload functionality - only viewing donations
// =====================

// =====================
// Store and display uploaded items
// =====================
// Cross-Device Storage using API + localStorage fallback
// =====================

// Fetch donations from API for cross-device sync
async function fetchDonationsFromAPI() {
  try {
    const url = `${API_BASE_URL}/listings`;
    console.log(`🔄 [NGO] Fetching donations from: ${url}`);
    
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
      console.warn(`❌ [NGO] Failed to fetch donations: ${res.status} ${res.statusText}`);
      console.warn(`❌ [NGO] Error response:`, errorText);
      return null;
    }
    
    // Check if response is actually JSON
    const contentType = res.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      console.error('❌ [NGO] Server did not return JSON. Content-Type:', contentType);
      return null;
    }
    
    // Parse JSON with error handling
    let data;
    let responseText = '';
    try {
      responseText = await res.text();
      if (!responseText || responseText.trim() === '') {
        // Empty response is valid - means no donations yet
        console.log('ℹ️ [NGO] Server returned empty response (no donations in database)');
        data = [];
      } else {
        data = JSON.parse(responseText);
      }
    } catch (parseError) {
      console.error('❌ [NGO] JSON parse error:', parseError);
      console.error('❌ [NGO] Response text that failed to parse:', responseText?.substring(0, 200) || 'No response text');
      return null;
    }
    
    console.log(`📦 [NGO] Received ${Array.isArray(data) ? data.length : 0} donations from server`);
    
    if (Array.isArray(data)) {
      // Update localStorage with fetched data for offline access (even if empty)
      localStorage.setItem('donationListings', JSON.stringify(data));
      localStorage.setItem('donationListings_sync', Date.now().toString());
      if (data.length > 0) {
        console.log('✅ [NGO] Donations synced to localStorage');
      } else {
        console.log('✅ [NGO] API returned empty array (no donations yet)');
      }
      return data; // Return array even if empty (successful fetch)
    }
    
    // If data is not an array, something went wrong
    console.warn('⚠️ [NGO] Server returned non-array data:', data);
    return null;
  } catch (error) {
    console.error('❌ [NGO] Error fetching donations from API:', error);
    return null;
  }
}

// Get stored items - reads from localStorage (fallback)
// For API data, use fetchDonationsFromAPI() and then this will read from updated localStorage
function getStoredItems() {
  // Read donations from donation panel's localStorage
  const donationItems = localStorage.getItem('donationListings');
  if (donationItems) {
    try {
      return JSON.parse(donationItems);
    } catch (e) {
      console.error('Error parsing donation listings:', e);
    }
  }
  return [];
}

// Get available items (excluding ordered items)
function getAvailableItems() {
  const allItems = getStoredItems();
  const orders = getStoredOrders();
  
  // Get all donation IDs that have been ordered
  const orderedIds = new Set();
  orders.forEach(order => {
    // Check donationId first (this is the ID of the original donation item)
    if (order.donationId !== undefined && order.donationId !== null) {
      orderedIds.add(order.donationId.toString());
    }
    // Also check order.id as fallback (in case donationId wasn't set properly)
    if (order.id !== undefined && order.id !== null && !order.donationId) {
      orderedIds.add(order.id.toString());
    }
  });
  
  // Filter out items that have been ordered
  return allItems.filter(item => {
    // Match by item.id if it exists (primary matching method)
    if (item.id !== undefined && item.id !== null) {
      return !orderedIds.has(item.id.toString());
    }
    // If item has no ID, we can't reliably match it, so include it
    // (This handles edge cases where items don't have IDs)
    // Note: Items from donation panel should always have IDs
    return true;
  });
}

// Update stats cards
function updateStats() {
  const items = getAvailableItems(); // Use available items instead of all items
  const listingsCount = items.length;
  
  // Count items by condition
  const newItemsCount = items.filter(item => item.clothCondition === 'new').length;
  const likeNewItemsCount = items.filter(item => item.clothCondition === 'like-new').length;
  
  const listingsCountEl = document.getElementById('listingsCount');
  const salesCountEl = document.getElementById('salesCount');
  const pendingCountEl = document.getElementById('pendingCount');
  
  if (listingsCountEl) {
    listingsCountEl.textContent = listingsCount;
  }
  if (salesCountEl) {
    salesCountEl.textContent = newItemsCount;
  }
  if (pendingCountEl) {
    pendingCountEl.textContent = likeNewItemsCount;
  }
}

function displayListings() {
  const listingsGrid = document.getElementById('listingsGrid');
  if (!listingsGrid) return;

  const items = getAvailableItems(); // Use available items (excluding ordered ones)
  listingsGrid.innerHTML = '';

  if (items.length === 0) {
    listingsGrid.innerHTML = '<p class="muted" style="text-align: center; padding: 40px;">No donations available yet. Donations uploaded in the donation panel will appear here.</p>';
    return;
  }

  items.forEach((item, index) => {
    const card = document.createElement('div');
    card.className = 'listing-card';
    card.dataset.index = index;
    
    const mainImage = item.photos && item.photos.length > 0 ? item.photos[0] : '';
    
    card.innerHTML = `
      <div class="listing-image">
        <img src="${mainImage}" alt="Donation ${index + 1}" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'200\' height=\'200\'%3E%3Crect fill=\'%23ddd\' width=\'200\' height=\'200\'/%3E%3Ctext fill=\'%23999\' font-family=\'sans-serif\' font-size=\'18\' dy=\'10.5\' font-weight=\'bold\' x=\'50%25\' y=\'50%25\' text-anchor=\'middle\'%3ENo Image%3C/text%3E%3C/svg%3E'">
      </div>
      <div class="listing-info">
        <p class="listing-fabric"><strong>Fabric:</strong> ${item.fabricType || 'N/A'}</p>
        <p class="listing-condition"><strong>Condition:</strong> ${item.clothCondition || 'N/A'}</p>
      </div>
    `;

    // Card click handler for viewing details
    card.addEventListener('click', () => showItemDetails(item, index));
    listingsGrid.appendChild(card);
  });
}

// NGO panel cannot delete donations - they are managed by the donation panel

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
    <div class="detail-actions" style="margin-top: 24px; padding-top: 24px; border-top: 1px solid var(--border-color);">
      <button class="submit-btn" id="confirmOrderBtn" data-item-id="${item.id || index}">Confirm Order</button>
    </div>
  `;

  // Add event listener for confirm order button
  const confirmOrderBtn = document.getElementById('confirmOrderBtn');
  if (confirmOrderBtn) {
    confirmOrderBtn.addEventListener('click', () => {
      confirmOrder(item, index);
    });
  }

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

// NGO panel has no upload form - donations are managed by donation panel

// =====================
// Profile name/avatar from stored username
// =====================
const storedUsername = localStorage.getItem('username');
const profileNameEl = document.getElementById('profileName');
const avatarEl = document.getElementById('avatar');
if (storedUsername) {
  profileNameEl.textContent = storedUsername;
  const initial = storedUsername.trim().charAt(0).toUpperCase() || 'N';
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
  localStorage.setItem('ngoTheme', name);
  themePills.forEach(p => p.classList.toggle('active', p.dataset.theme === name));
}

const savedTheme = localStorage.getItem('ngoTheme') || 'light';
applyTheme(savedTheme);

themePills.forEach(pill => {
  pill.addEventListener('click', () => applyTheme(pill.dataset.theme));
});

// =====================
// Settings toggles (mock)
// =====================
const notifyToggle = document.getElementById('notifyToggle');
if (notifyToggle) {
  const saved = localStorage.getItem('ngoNotify');
  if (saved !== null) notifyToggle.checked = saved === 'true';
  notifyToggle.addEventListener('change', () => {
    localStorage.setItem('ngoNotify', notifyToggle.checked ? 'true' : 'false');
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
    
    // Clear NGO panel data
    localStorage.removeItem('ngoListings');
    localStorage.removeItem('ngoTheme');
    localStorage.removeItem('ngoNotify');
    
    // Clear NGO orders (all orders made by this NGO user)
    localStorage.removeItem('ngoOrders');
    
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
// =====================
// Order Management
// =====================
function getStoredOrders() {
  const orders = localStorage.getItem('ngoOrders');
  if (orders) {
    try {
      return JSON.parse(orders);
    } catch (e) {
      console.error('Error parsing NGO orders:', e);
    }
  }
  return [];
}

function saveOrder(order) {
  const orders = getStoredOrders();
  // Check if order already exists
  const existingIndex = orders.findIndex(o => o.id === order.id);
  if (existingIndex >= 0) {
    // Update existing order
    orders[existingIndex] = order;
  } else {
    // Add new order
    orders.push(order);
  }
  localStorage.setItem('ngoOrders', JSON.stringify(orders));
  console.log('✅ [NGO] Order saved:', order);
}

function confirmOrder(item, index) {
  const order = {
    id: item.id || `order_${Date.now()}_${index}`,
    donationId: item.id || index,
    photos: item.photos || [],
    fabricType: item.fabricType || 'N/A',
    clothCondition: item.clothCondition || 'N/A',
    phoneNumber: item.phoneNumber || 'N/A',
    dateOrdered: new Date().toISOString(),
    status: 'confirmed'
  };
  
  saveOrder(order);
  
  // Close modal
  const modal = document.getElementById('detailModal');
  if (modal) modal.style.display = 'none';
  
  // Show success message
  const successModal = document.getElementById('successModal');
  const successTitle = document.getElementById('successTitle');
  const successMessage = document.getElementById('successMessage');
  if (successModal && successTitle && successMessage) {
    successTitle.textContent = 'Order Confirmed!';
    successMessage.textContent = 'The donation has been added to your orders.';
    successModal.style.display = 'flex';
    
    // Auto close after 2 seconds
    setTimeout(() => {
      successModal.style.display = 'none';
    }, 2000);
  }
  
  // Refresh listings to remove the ordered item
  displayListings();
  updateStats();
  
  // Update orders display if orders section is visible
  const ordersSection = document.querySelector('.content-section[data-section="orders"]');
  if (ordersSection && ordersSection.style.display !== 'none') {
    displayNgoOrders();
  }
}

function displayNgoOrders() {
  const ordersList = document.getElementById('ngoOrdersList');
  if (!ordersList) {
    console.error('📦 [ORDERS] ngoOrdersList element not found');
    return;
  }
  
  const orders = getStoredOrders();
  
  if (orders.length === 0) {
    ordersList.innerHTML = '<p class="muted" style="padding: 20px; text-align: center;">No orders yet.</p>';
    return;
  }
  
  ordersList.innerHTML = orders.map(order => {
    const mainImage = order.photos && order.photos.length > 0 ? order.photos[0] : '';
    const orderDate = new Date(order.dateOrdered).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
    
    return `
      <div class="order-item">
        <img src="${mainImage}" alt="Order" class="order-item-image" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'200\' height=\'200\'%3E%3Crect fill=\'%23ddd\' width=\'200\' height=\'200\'/%3E%3Ctext fill=\'%23999\' font-family=\'sans-serif\' font-size=\'18\' dy=\'10.5\' font-weight=\'bold\' x=\'50%25\' y=\'50%25\' text-anchor=\'middle\'%3ENo Image%3C/text%3E%3C/svg%3E'">
        <div class="order-item-info">
          <div class="order-item-title">Donation Order</div>
          <div class="order-item-buyer">Fabric: ${order.fabricType}</div>
          <div class="order-item-condition">Condition: ${order.clothCondition}</div>
          <div class="order-item-date">Ordered: ${orderDate}</div>
          <div class="order-item-status" style="margin-top: 8px; padding: 4px 8px; background: #27ae60; color: white; border-radius: 4px; display: inline-block; font-size: 0.75rem; font-weight: 600;">Confirmed</div>
        </div>
      </div>
    `;
  }).join('');
}

// Success modal close handler
const successOkBtn = document.getElementById('successOkBtn');
if (successOkBtn) {
  successOkBtn.addEventListener('click', () => {
    const successModal = document.getElementById('successModal');
    if (successModal) {
      successModal.style.display = 'none';
    }
  });
}

// =====================
// Initialize: show profile section by default and load listings
// =====================
// NGO panel reads donations from donation panel's localStorage
// No cloud sync needed - donations are managed by donation panel

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
        console.log('✅ [NGO] Donations refreshed successfully');
      } else {
        // API call failed (network error, server error, etc.)
        // Fallback to localStorage
        displayListings();
        updateStats();
        refreshDonationsBtn.innerHTML = originalContent;
        console.warn('⚠️ [NGO] API fetch failed, using localStorage');
      }
    } catch (err) {
      console.error('❌ [NGO] Refresh error:', err);
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
  console.log('🚀 [INIT] NGO panel initialized');
  const profileSection = document.querySelector('.content-section[data-section="profile"]');
  if (profileSection) {
    profileSection.style.display = 'flex';
    profileSection.style.flexDirection = 'column';
    profileSection.style.gap = '16px';
  }
  
  // Get donations from donation panel's localStorage (no automatic API fetch on load)
  const donations = getStoredItems();
  console.log('🚀 [INIT] Donations available:', donations.length);
  console.log('💡 [INIT] Click refresh button to fetch latest donations from API');
  
  // Update stats
  updateStats();
  
  // Load and display listings
  displayListings();
});

