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
        
        // Refresh products when browse section is shown
        if (targetSection === 'browse') {
          displayProducts();
        }
        
        // Refresh wishlist when wishlist section is shown
        if (targetSection === 'wishlist') {
          displayWishlist();
        }
        
        // Update stats when profile section is shown
        if (targetSection === 'profile') {
          updateStats();
        }
        
        // Load chat list when chat section is shown
        if (targetSection === 'chat') {
          loadChatList();
        }
        
        // Load notifications when notifications section is shown
        if (targetSection === 'notifications') {
          displayNotifications();
        }
        
        // Load payments when payments section is shown
        if (targetSection === 'payments') {
          displayBuyerPayments();
        }
        
        // Load orders when orders section is shown
        if (targetSection === 'orders') {
          displayBuyerOrders();
        }
      } else {
        section.style.display = 'none';
      }
    });
  });
});

// =====================
// Browse action button
// =====================
const browseAction = document.getElementById('browseAction');
if (browseAction) {
  browseAction.addEventListener('click', () => {
    // Click the Browse Products menu item
    const browseMenuItem = document.querySelector('.menu-item[data-section="browse"]');
    if (browseMenuItem) {
      browseMenuItem.click();
    }
  });
}

// =====================
// Refresh products button
// =====================
const refreshProducts = document.getElementById('refreshProducts');
if (refreshProducts) {
  refreshProducts.addEventListener('click', () => {
    displayProducts();
    // Visual feedback
    refreshProducts.textContent = '✓ Refreshed!';
    refreshProducts.style.background = 'var(--primary)';
    refreshProducts.style.color = 'white';
    setTimeout(() => {
      refreshProducts.textContent = '🔄 Refresh';
      refreshProducts.style.background = '';
      refreshProducts.style.color = '';
    }, 1500);
  });
}

// =====================
// Store and display data
// =====================
function getWishlist() {
  const items = localStorage.getItem('buyerWishlist');
  return items ? JSON.parse(items) : [];
}

function saveWishlist(items) {
  localStorage.setItem('buyerWishlist', JSON.stringify(items));
  updateStats();
}

function getOrders() {
  const items = localStorage.getItem('buyerOrders');
  return items ? JSON.parse(items) : [];
}

// Update stats cards
function updateStats() {
  const wishlist = getWishlist();
  const buyerUsername = localStorage.getItem('username');
  const allPayments = JSON.parse(localStorage.getItem('vastradoPayments') || '[]');
  const buyerPayments = allPayments.filter(p => p.buyer === buyerUsername);
  const confirmedOrders = buyerPayments.filter(p => p.status === 'confirmed').length;
  const pendingPayments = buyerPayments.filter(p => p.status === 'pending').length;
  
  const ordersCountEl = document.getElementById('ordersCount');
  const wishlistCountEl = document.getElementById('wishlistCount');
  const pendingCountEl = document.getElementById('pendingCount');
  
  if (ordersCountEl) {
    ordersCountEl.textContent = confirmedOrders;
  }
  if (wishlistCountEl) {
    wishlistCountEl.textContent = wishlist.length;
  }
  if (pendingCountEl) {
    pendingCountEl.textContent = pendingPayments;
  }
}

// Get all available products (from seller listings - for demo purposes)
function getAvailableProducts() {
  // In a real app, this would fetch from an API
  // For now, we'll check if there are any seller listings in localStorage
  const sellerListings = localStorage.getItem('sellerListings');
  return sellerListings ? JSON.parse(sellerListings) : [];
}

function displayProducts() {
  const productsGrid = document.getElementById('productsGrid');
  const productCountEl = document.getElementById('productCount');
  if (!productsGrid) return;

  const products = getAvailableProducts();
  const wishlist = getWishlist();
  productsGrid.innerHTML = '';

  // Update product count
  if (productCountEl) {
    productCountEl.textContent = products.length > 0 ? `(${products.length} items available)` : '';
  }

  if (products.length === 0) {
    productsGrid.innerHTML = '<p class="muted" style="text-align: center; padding: 40px;">No products available yet. Check back soon!</p>';
    return;
  }

  products.forEach((product, index) => {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.dataset.index = index;
    
    const mainImage = product.photos && product.photos.length > 0 ? product.photos[0] : '';
    const isInWishlist = wishlist.some(item => item.id === product.id);
    
    const sellerName = product.sellerUsername || 'Unknown Seller';
    
    card.innerHTML = `
      <button class="wishlist-btn ${isInWishlist ? 'active' : ''}" data-id="${product.id}" aria-label="Add to wishlist">❤</button>
      <div class="product-image">
        <img src="${mainImage}" alt="Product ${index + 1}" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'200\\' height=\\'200\\'%3E%3Crect fill=\\'%23ddd\\' width=\\'200\\' height=\\'200\\'/%3E%3Ctext fill=\\'%23999\\' font-family=\\'sans-serif\\' font-size=\\'18\\' dy=\\'10.5\\' font-weight=\\'bold\\' x=\\'50%25\\' y=\\'50%25\\' text-anchor=\\'middle\\'%3ENo Image%3C/text%3E%3C/svg%3E'">
      </div>
      <div class="product-info">
        <p class="product-seller"><span class="seller-badge">👤 ${sellerName}</span></p>
        <p class="product-fabric"><strong>Fabric:</strong> ${product.fabricType || 'N/A'}</p>
        <p class="product-cost"><strong>Cost:</strong> ₹${product.expectedCost || '0'}</p>
        <p class="product-condition"><strong>Condition:</strong> ${product.clothCondition || 'N/A'}</p>
      </div>
    `;

    // Wishlist button handler
    const wishlistBtn = card.querySelector('.wishlist-btn');
    if (wishlistBtn) {
      wishlistBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleWishlist(product, wishlistBtn);
      });
    }

    // Card click handler for viewing details
    card.addEventListener('click', () => showProductDetails(product));
    productsGrid.appendChild(card);
  });
}

function toggleWishlist(product, btn) {
  const wishlist = getWishlist();
  const existingIndex = wishlist.findIndex(item => item.id === product.id);
  
  if (existingIndex >= 0) {
    // Remove from wishlist
    wishlist.splice(existingIndex, 1);
    btn.classList.remove('active');
  } else {
    // Add to wishlist
    wishlist.push(product);
    btn.classList.add('active');
  }
  
  saveWishlist(wishlist);
}

function displayWishlist() {
  const wishlistGrid = document.getElementById('wishlistGrid');
  if (!wishlistGrid) return;

  const wishlist = getWishlist();
  wishlistGrid.innerHTML = '';

  if (wishlist.length === 0) {
    wishlistGrid.innerHTML = '<p class="muted" style="text-align: center; padding: 40px;">Your wishlist is empty. Browse products and add items you like!</p>';
    return;
  }

  wishlist.forEach((product, index) => {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.dataset.index = index;
    
    const mainImage = product.photos && product.photos.length > 0 ? product.photos[0] : '';
    
    card.innerHTML = `
      <button class="wishlist-btn active" data-id="${product.id}" aria-label="Remove from wishlist">❤</button>
      <div class="product-image">
        <img src="${mainImage}" alt="Wishlist Item ${index + 1}" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'200\\' height=\\'200\\'%3E%3Crect fill=\\'%23ddd\\' width=\\'200\\' height=\\'200\\'/%3E%3Ctext fill=\\'%23999\\' font-family=\\'sans-serif\\' font-size=\\'18\\' dy=\\'10.5\\' font-weight=\\'bold\\' x=\\'50%25\\' y=\\'50%25\\' text-anchor=\\'middle\\'%3ENo Image%3C/text%3E%3C/svg%3E'">
      </div>
      <div class="product-info">
        <p class="product-fabric"><strong>Fabric:</strong> ${product.fabricType || 'N/A'}</p>
        <p class="product-cost"><strong>Cost:</strong> ₹${product.expectedCost || '0'}</p>
        <p class="product-condition"><strong>Condition:</strong> ${product.clothCondition || 'N/A'}</p>
      </div>
    `;

    // Wishlist button handler (remove from wishlist)
    const wishlistBtn = card.querySelector('.wishlist-btn');
    if (wishlistBtn) {
      wishlistBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        removeFromWishlist(product.id);
      });
    }

    // Card click handler for viewing details
    card.addEventListener('click', () => showProductDetails(product));
    wishlistGrid.appendChild(card);
  });
}

function removeFromWishlist(productId) {
  const wishlist = getWishlist();
  const index = wishlist.findIndex(item => item.id === productId);
  
  if (index >= 0) {
    wishlist.splice(index, 1);
    saveWishlist(wishlist);
    displayWishlist();
  }
}

function showProductDetails(product) {
  const modal = document.getElementById('detailModal');
  const modalBody = document.getElementById('modalBody');
  
  if (!modal || !modalBody) return;

  const sellerName = product.sellerUsername || 'Unknown Seller';
  const photosHtml = product.photos && product.photos.length > 0 
    ? product.photos.map(photo => `<img src="${photo}" alt="Photo" class="detail-photo">`).join('')
    : '<p class="muted">No photos available</p>';

  modalBody.innerHTML = `
    <div class="detail-header">
      <h2>Product Details</h2>
    </div>
    <div class="detail-photos">
      ${photosHtml}
    </div>
    <div class="detail-info">
      <div class="detail-row seller-row">
        <span class="detail-label">Seller:</span>
        <span class="detail-value seller-name">👤 ${sellerName}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Fabric Type:</span>
        <span class="detail-value">${product.fabricType || 'N/A'}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Expected Cost:</span>
        <span class="detail-value">₹${product.expectedCost || '0'}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Condition:</span>
        <span class="detail-value">${product.clothCondition || 'N/A'}</span>
      </div>
    </div>
    <button class="chat-seller-btn" id="chatWithSellerBtn">💬 Chat with ${sellerName}</button>
    <button class="buy-product-btn" id="buyProductBtn">🛒 Buy Now - ₹${product.expectedCost || '0'}</button>
  `;

  // Add chat button handler
  const chatBtn = document.getElementById('chatWithSellerBtn');
  if (chatBtn) {
    chatBtn.addEventListener('click', () => {
      modal.style.display = 'none';
      startChatWithSeller(sellerName, product.id);
    });
  }

  // Add buy button handler
  const buyBtn = document.getElementById('buyProductBtn');
  if (buyBtn) {
    buyBtn.addEventListener('click', () => {
      modal.style.display = 'none';
      openPaymentModal(product);
    });
  }

  modal.style.display = 'flex';
}

// Start chat with seller
function startChatWithSeller(sellerUsername, productId) {
  const buyerUsername = localStorage.getItem('username') || 'Buyer';
  
  // Create chat request
  const chatRequest = {
    id: Date.now(),
    buyer: buyerUsername,
    seller: sellerUsername,
    productId: productId,
    timestamp: new Date().toISOString(),
    status: 'pending'
  };
  
  // Store chat request for seller notification
  let chatRequests = JSON.parse(localStorage.getItem('chatRequests') || '[]');
  
  // Check if chat already exists
  const existingChat = chatRequests.find(c => c.buyer === buyerUsername && c.seller === sellerUsername);
  if (!existingChat) {
    chatRequests.push(chatRequest);
    localStorage.setItem('chatRequests', JSON.stringify(chatRequests));
  }
  
  // Open chat section
  openChatWith(sellerUsername);
}

// Open chat with a specific user
function openChatWith(otherUsername) {
  // Store current chat partner
  localStorage.setItem('currentChatPartner', otherUsername);
  
  // Switch to chat section
  const chatMenuItem = document.querySelector('.menu-item[data-section="chat"]');
  if (chatMenuItem) {
    chatMenuItem.click();
  }
  
  // Load chat messages
  loadChatMessages(otherUsername);
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

// =====================
// Profile name/avatar from stored username
// =====================
const storedUsername = localStorage.getItem('username');
const profileNameEl = document.getElementById('profileName');
const avatarEl = document.getElementById('avatar');
if (storedUsername) {
  profileNameEl.textContent = storedUsername;
  const initial = storedUsername.trim().charAt(0).toUpperCase() || 'B';
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
    '--highlight-gradient-start': '#ffe7bd',
    '--highlight-gradient-end': '#ffd79a',
    '--btn-bg': '#ffffff',
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
    '--highlight-gradient-start': '#d5d5d5',
    '--highlight-gradient-end': '#c5c5c5',
    '--btn-bg': '#f5f5f5',
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
    '--highlight-gradient-start': '#3a3a40',
    '--highlight-gradient-end': '#2f2f35',
    '--btn-bg': '#2a2a30',
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
  localStorage.setItem('buyerTheme', name);
  themePills.forEach(p => p.classList.toggle('active', p.dataset.theme === name));
}

const savedTheme = localStorage.getItem('buyerTheme') || 'light';
applyTheme(savedTheme);

themePills.forEach(pill => {
  pill.addEventListener('click', () => applyTheme(pill.dataset.theme));
});

// =====================
// Settings toggles
// =====================
const notifyToggle = document.getElementById('notifyToggle');
if (notifyToggle) {
  const saved = localStorage.getItem('buyerNotify');
  if (saved !== null) notifyToggle.checked = saved === 'true';
  notifyToggle.addEventListener('change', () => {
    localStorage.setItem('buyerNotify', notifyToggle.checked ? 'true' : 'false');
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
    // Clear all localStorage data
    localStorage.removeItem('username');
    localStorage.removeItem('email');
    localStorage.removeItem('role');
    localStorage.removeItem('loggedIn');
    localStorage.removeItem('buyerWishlist');
    localStorage.removeItem('buyerOrders');
    localStorage.removeItem('buyerTheme');
    localStorage.removeItem('buyerNotify');
    
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

// =====================
// Chat Functionality
// =====================
let currentChatPartner = null;
let chatRefreshInterval = null;

function loadChatList() {
  const chatList = document.getElementById('chatList');
  if (!chatList) return;
  
  const myUsername = localStorage.getItem('username');
  const allChats = JSON.parse(localStorage.getItem('vastradoChats') || '{}');
  
  // Find all conversations for this user
  const myConversations = [];
  Object.keys(allChats).forEach(chatKey => {
    const [user1, user2] = chatKey.split('_');
    if (user1 === myUsername || user2 === myUsername) {
      const otherUser = user1 === myUsername ? user2 : user1;
      const messages = allChats[chatKey];
      const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;
      myConversations.push({
        chatKey,
        otherUser,
        lastMessage,
        lastTime: lastMessage ? new Date(lastMessage.timestamp).getTime() : 0
      });
    }
  });
  
  // Sort by last message time
  myConversations.sort((a, b) => b.lastTime - a.lastTime);
  
  if (myConversations.length === 0) {
    chatList.innerHTML = '<p class="muted" style="padding: 20px; text-align: center;">No conversations yet</p>';
    return;
  }
  
  chatList.innerHTML = myConversations.map(conv => `
    <div class="chat-list-item ${currentChatPartner === conv.otherUser ? 'active' : ''}" data-user="${conv.otherUser}">
      <div class="chat-avatar">${conv.otherUser.charAt(0).toUpperCase()}</div>
      <div class="chat-user-info">
        <p class="chat-username">${conv.otherUser}</p>
        <p class="chat-preview">${conv.lastMessage ? conv.lastMessage.text.substring(0, 30) + (conv.lastMessage.text.length > 30 ? '...' : '') : 'No messages yet'}</p>
      </div>
    </div>
  `).join('');
  
  // Add click handlers
  chatList.querySelectorAll('.chat-list-item').forEach(item => {
    item.addEventListener('click', () => {
      const otherUser = item.dataset.user;
      openChatWith(otherUser);
    });
  });
}

function loadChatMessages(otherUsername) {
  const chatMessages = document.getElementById('chatMessages');
  const chatHeader = document.getElementById('chatHeader');
  const chatInputArea = document.getElementById('chatInputArea');
  
  if (!chatMessages || !otherUsername) return;
  
  currentChatPartner = otherUsername;
  
  // Update header
  if (chatHeader) {
    chatHeader.innerHTML = `
      <div class="chat-avatar" style="width:36px;height:36px;border-radius:50%;background:var(--accent);display:flex;align-items:center;justify-content:center;font-weight:700;color:var(--primary-strong);">
        ${otherUsername.charAt(0).toUpperCase()}
      </div>
      <h4>${otherUsername}</h4>
    `;
  }
  
  // Show input area
  if (chatInputArea) {
    chatInputArea.style.display = 'flex';
  }
  
  // Get messages
  const myUsername = localStorage.getItem('username');
  const chatKey = [myUsername, otherUsername].sort().join('_');
  const allChats = JSON.parse(localStorage.getItem('vastradoChats') || '{}');
  const messages = allChats[chatKey] || [];
  
  if (messages.length === 0) {
    chatMessages.innerHTML = '<p class="muted" style="text-align:center;padding:40px;">No messages yet. Start the conversation!</p>';
  } else {
    chatMessages.innerHTML = messages.map(msg => `
      <div class="chat-message ${msg.sender === myUsername ? 'sent' : 'received'}">
        ${msg.text}
        <span class="message-time">${formatTime(msg.timestamp)}</span>
      </div>
    `).join('');
    
    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }
  
  // Update chat list to show active
  loadChatList();
  
  // Start refresh interval
  if (chatRefreshInterval) clearInterval(chatRefreshInterval);
  chatRefreshInterval = setInterval(() => {
    if (currentChatPartner) {
      refreshMessages();
    }
  }, 2000);
}

function refreshMessages() {
  const chatMessages = document.getElementById('chatMessages');
  if (!chatMessages || !currentChatPartner) return;
  
  const myUsername = localStorage.getItem('username');
  const chatKey = [myUsername, currentChatPartner].sort().join('_');
  const allChats = JSON.parse(localStorage.getItem('vastradoChats') || '{}');
  const messages = allChats[chatKey] || [];
  
  const currentCount = chatMessages.querySelectorAll('.chat-message').length;
  if (messages.length !== currentCount) {
    loadChatMessages(currentChatPartner);
  }
}

function sendMessage(text) {
  if (!text.trim() || !currentChatPartner) return;
  
  const myUsername = localStorage.getItem('username');
  const chatKey = [myUsername, currentChatPartner].sort().join('_');
  const allChats = JSON.parse(localStorage.getItem('vastradoChats') || '{}');
  
  if (!allChats[chatKey]) {
    allChats[chatKey] = [];
  }
  
  allChats[chatKey].push({
    sender: myUsername,
    text: text.trim(),
    timestamp: new Date().toISOString()
  });
  
  localStorage.setItem('vastradoChats', JSON.stringify(allChats));
  
  // Reload messages
  loadChatMessages(currentChatPartner);
  
  // Clear input
  const chatInput = document.getElementById('chatInput');
  if (chatInput) chatInput.value = '';
}

function formatTime(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// Chat input handlers
const chatInput = document.getElementById('chatInput');
const sendMessageBtn = document.getElementById('sendMessageBtn');

if (sendMessageBtn) {
  sendMessageBtn.addEventListener('click', () => {
    const text = chatInput ? chatInput.value : '';
    sendMessage(text);
  });
}

if (chatInput) {
  chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      sendMessage(chatInput.value);
    }
  });
}

// =====================
// Notifications Functionality
// =====================
function getBuyerNotifications() {
  const myUsername = localStorage.getItem('username');
  const allChats = JSON.parse(localStorage.getItem('vastradoChats') || '{}');
  
  // For buyers, notifications can be when a seller replies
  // Check for new messages from sellers
  const notifications = [];
  
  Object.keys(allChats).forEach(chatKey => {
    const [user1, user2] = chatKey.split('_');
    if (user1 === myUsername || user2 === myUsername) {
      const otherUser = user1 === myUsername ? user2 : user1;
      const messages = allChats[chatKey];
      const unreadMessages = messages.filter(m => 
        m.sender !== myUsername && 
        !m.readByBuyer
      );
      
      if (unreadMessages.length > 0) {
        notifications.push({
          from: otherUser,
          count: unreadMessages.length,
          lastMessage: messages[messages.length - 1]
        });
      }
    }
  });
  
  return notifications;
}

function displayNotifications() {
  const notificationsList = document.getElementById('notificationsList');
  const notifBadge = document.getElementById('notifBadge');
  
  if (!notificationsList) return;
  
  const notifications = getBuyerNotifications();
  const totalCount = notifications.reduce((sum, n) => sum + n.count, 0);
  
  // Update badge
  if (notifBadge) {
    if (totalCount > 0) {
      notifBadge.style.display = 'inline-flex';
      notifBadge.textContent = totalCount;
    } else {
      notifBadge.style.display = 'none';
    }
  }
  
  if (notifications.length === 0) {
    notificationsList.innerHTML = '<p class="muted" style="padding: 20px; text-align: center;">No new notifications</p>';
    return;
  }
  
  notificationsList.innerHTML = notifications.map(notif => {
    const timeAgo = getTimeAgo(notif.lastMessage.timestamp);
    
    return `
      <div class="notification-item notification-new" data-user="${notif.from}">
        <div class="notification-icon">💬</div>
        <div class="notification-content">
          <p class="notification-text"><strong>${notif.from}</strong> sent you ${notif.count} message${notif.count > 1 ? 's' : ''}</p>
          <p class="notification-time">${timeAgo}</p>
        </div>
        <button class="notification-action" data-user="${notif.from}">View</button>
      </div>
    `;
  }).join('');
  
  // Add click handlers
  notificationsList.querySelectorAll('.notification-action').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const sellerUsername = btn.dataset.user;
      openChatWith(sellerUsername);
    });
  });
  
  notificationsList.querySelectorAll('.notification-item').forEach(item => {
    item.addEventListener('click', () => {
      const sellerUsername = item.dataset.user;
      openChatWith(sellerUsername);
    });
  });
}

function getTimeAgo(timestamp) {
  const now = new Date();
  const then = new Date(timestamp);
  const diffMs = now - then;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

// Check notifications periodically
function checkNotifications() {
  const notifications = getBuyerNotifications();
  const totalCount = notifications.reduce((sum, n) => sum + n.count, 0);
  const notifBadge = document.getElementById('notifBadge');
  
  if (notifBadge) {
    if (totalCount > 0) {
      notifBadge.style.display = 'inline-flex';
      notifBadge.textContent = totalCount;
    } else {
      notifBadge.style.display = 'none';
    }
  }
}

// Check notifications every 2 seconds
setInterval(checkNotifications, 2000);

// =====================
// Payment Functionality
// =====================
let currentPaymentProduct = null;
let paymentScreenshotData = null;

function openPaymentModal(product) {
  currentPaymentProduct = product;
  paymentScreenshotData = null;
  
  const modal = document.getElementById('paymentModal');
  const productInfo = document.getElementById('paymentProductInfo');
  const submitBtn = document.getElementById('submitPaymentBtn');
  const preview = document.getElementById('paymentPreview');
  const dropzone = document.getElementById('paymentDropzone');
  
  if (!modal || !productInfo) return;
  
  // Reset state
  if (submitBtn) submitBtn.disabled = true;
  if (preview) preview.style.display = 'none';
  if (dropzone) dropzone.style.display = 'block';
  
  const mainImage = product.photos && product.photos.length > 0 ? product.photos[0] : '';
  const sellerName = product.sellerUsername || 'Unknown Seller';
  
  productInfo.innerHTML = `
    <img src="${mainImage}" alt="Product" class="payment-product-image" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'80\\' height=\\'80\\'%3E%3Crect fill=\\'%23ddd\\' width=\\'80\\' height=\\'80\\'/%3E%3C/svg%3E'">
    <div class="payment-product-details">
      <h4>${product.fabricType || 'Item'}</h4>
      <p>Seller: ${sellerName}</p>
      <p>Condition: ${product.clothCondition || 'N/A'}</p>
      <p class="payment-amount">₹${product.expectedCost || '0'}</p>
    </div>
  `;
  
  modal.style.display = 'flex';
}

// Payment modal elements
const paymentModal = document.getElementById('paymentModal');
const closePaymentModal = document.getElementById('closePaymentModal');
const paymentDropzone = document.getElementById('paymentDropzone');
const paymentScreenshotInput = document.getElementById('paymentScreenshot');
const paymentPreview = document.getElementById('paymentPreview');
const paymentPreviewImg = document.getElementById('paymentPreviewImg');
const removePaymentImg = document.getElementById('removePaymentImg');
const submitPaymentBtn = document.getElementById('submitPaymentBtn');

if (closePaymentModal) {
  closePaymentModal.addEventListener('click', () => {
    if (paymentModal) paymentModal.style.display = 'none';
    currentPaymentProduct = null;
    paymentScreenshotData = null;
  });
}

if (paymentModal) {
  paymentModal.addEventListener('click', (e) => {
    if (e.target === paymentModal) {
      paymentModal.style.display = 'none';
      currentPaymentProduct = null;
      paymentScreenshotData = null;
    }
  });
}

if (paymentDropzone && paymentScreenshotInput) {
  paymentDropzone.addEventListener('click', () => {
    paymentScreenshotInput.click();
  });
  
  paymentDropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    paymentDropzone.style.borderColor = 'var(--primary)';
    paymentDropzone.style.background = 'var(--accent)';
  });
  
  paymentDropzone.addEventListener('dragleave', () => {
    paymentDropzone.style.borderColor = '';
    paymentDropzone.style.background = '';
  });
  
  paymentDropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    paymentDropzone.style.borderColor = '';
    paymentDropzone.style.background = '';
    
    if (e.dataTransfer.files.length > 0) {
      handlePaymentScreenshot(e.dataTransfer.files[0]);
    }
  });
  
  paymentScreenshotInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      handlePaymentScreenshot(e.target.files[0]);
    }
  });
}

function handlePaymentScreenshot(file) {
  if (!file.type.startsWith('image/')) {
    alert('Please upload an image file');
    return;
  }
  
  const reader = new FileReader();
  reader.onload = (e) => {
    paymentScreenshotData = e.target.result;
    
    if (paymentPreviewImg) {
      paymentPreviewImg.src = paymentScreenshotData;
    }
    if (paymentPreview) {
      paymentPreview.style.display = 'block';
    }
    if (paymentDropzone) {
      paymentDropzone.style.display = 'none';
    }
    if (submitPaymentBtn) {
      submitPaymentBtn.disabled = false;
    }
  };
  reader.readAsDataURL(file);
}

if (removePaymentImg) {
  removePaymentImg.addEventListener('click', () => {
    paymentScreenshotData = null;
    if (paymentPreview) paymentPreview.style.display = 'none';
    if (paymentDropzone) paymentDropzone.style.display = 'block';
    if (submitPaymentBtn) submitPaymentBtn.disabled = true;
    if (paymentScreenshotInput) paymentScreenshotInput.value = '';
  });
}

if (submitPaymentBtn) {
  submitPaymentBtn.addEventListener('click', () => {
    if (!currentPaymentProduct || !paymentScreenshotData) return;
    
    submitPayment();
  });
}

function submitPayment() {
  const buyerUsername = localStorage.getItem('username') || 'Buyer';
  
  const payment = {
    id: Date.now(),
    productId: currentPaymentProduct.id,
    product: currentPaymentProduct,
    buyer: buyerUsername,
    seller: currentPaymentProduct.sellerUsername || 'Unknown Seller',
    amount: currentPaymentProduct.expectedCost || '0',
    screenshot: paymentScreenshotData,
    status: 'pending',
    timestamp: new Date().toISOString()
  };
  
  // Save to payments list
  let payments = JSON.parse(localStorage.getItem('vastradoPayments') || '[]');
  payments.push(payment);
  localStorage.setItem('vastradoPayments', JSON.stringify(payments));
  
  // Close modal
  if (paymentModal) paymentModal.style.display = 'none';
  currentPaymentProduct = null;
  paymentScreenshotData = null;
  
  // Update stats
  updateStats();
  
  // Show success modal
  showSuccessModal('Payment Submitted!', 'Your payment has been submitted successfully. Waiting for seller confirmation.');
  
  // After closing success modal, switch to payments section
  pendingAction = 'goToPayments';
}

// Success Modal functionality
let pendingAction = null;

function showSuccessModal(title, message) {
  const modal = document.getElementById('successModal');
  const titleEl = document.getElementById('successTitle');
  const messageEl = document.getElementById('successMessage');
  
  if (modal && titleEl && messageEl) {
    titleEl.textContent = title;
    messageEl.textContent = message;
    modal.style.display = 'flex';
  }
}

const successModal = document.getElementById('successModal');
const successOkBtn = document.getElementById('successOkBtn');

if (successOkBtn) {
  successOkBtn.addEventListener('click', () => {
    if (successModal) successModal.style.display = 'none';
    
    // Execute pending action
    if (pendingAction === 'goToPayments') {
      const paymentsMenuItem = document.querySelector('.menu-item[data-section="payments"]');
      if (paymentsMenuItem) {
        paymentsMenuItem.click();
      }
    }
    pendingAction = null;
  });
}

if (successModal) {
  successModal.addEventListener('click', (e) => {
    if (e.target === successModal) {
      successModal.style.display = 'none';
      
      if (pendingAction === 'goToPayments') {
        const paymentsMenuItem = document.querySelector('.menu-item[data-section="payments"]');
        if (paymentsMenuItem) {
          paymentsMenuItem.click();
        }
      }
      pendingAction = null;
    }
  });
}

function getBuyerPayments() {
  const buyerUsername = localStorage.getItem('username');
  const allPayments = JSON.parse(localStorage.getItem('vastradoPayments') || '[]');
  return allPayments.filter(p => p.buyer === buyerUsername);
}

function displayBuyerPayments() {
  const paymentsList = document.getElementById('buyerPaymentsList');
  if (!paymentsList) return;
  
  const payments = getBuyerPayments();
  
  if (payments.length === 0) {
    paymentsList.innerHTML = '<p class="muted" style="padding: 20px; text-align: center;">No payments yet. Buy a product to see your payments here.</p>';
    return;
  }
  
  // Sort by newest first
  payments.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  
  paymentsList.innerHTML = payments.map(payment => {
    const mainImage = payment.product.photos && payment.product.photos.length > 0 ? payment.product.photos[0] : '';
    const statusClass = payment.status;
    
    return `
      <div class="payment-item ${statusClass}">
        <img src="${mainImage}" alt="Product" class="payment-item-image" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'60\\' height=\\'60\\'%3E%3Crect fill=\\'%23ddd\\' width=\\'60\\' height=\\'60\\'/%3E%3C/svg%3E'">
        <div class="payment-item-info">
          <p class="payment-item-title">${payment.product.fabricType || 'Item'}</p>
          <p class="payment-item-seller">Seller: ${payment.seller}</p>
        </div>
        <div class="payment-item-amount">₹${payment.amount}</div>
        <span class="payment-status ${statusClass}">${payment.status}</span>
      </div>
    `;
  }).join('');
}

function getBuyerOrders() {
  const buyerUsername = localStorage.getItem('username');
  const allPayments = JSON.parse(localStorage.getItem('vastradoPayments') || '[]');
  return allPayments.filter(p => p.buyer === buyerUsername && p.status === 'confirmed');
}

function displayBuyerOrders() {
  const ordersGrid = document.getElementById('buyerOrdersList');
  if (!ordersGrid) return;
  
  const orders = getBuyerOrders();
  
  if (orders.length === 0) {
    ordersGrid.innerHTML = '<p class="muted" style="padding: 20px; text-align: center;">No orders yet. Once you make a purchase, you\'ll see them here.</p>';
    return;
  }
  
  // Sort by newest first
  orders.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  
  ordersGrid.innerHTML = orders.map(order => {
    const mainImage = order.product.photos && order.product.photos.length > 0 ? order.product.photos[0] : '';
    const date = new Date(order.timestamp).toLocaleDateString();
    
    return `
      <div class="order-item" data-id="${order.id}">
        <img src="${mainImage}" alt="Product" class="order-item-image" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'80\\' height=\\'80\\'%3E%3Crect fill=\\'%23ddd\\' width=\\'80\\' height=\\'80\\'/%3E%3C/svg%3E'">
        <div class="order-item-info">
          <p class="order-item-title">${order.product.fabricType || 'Item'}</p>
          <p class="order-item-seller">Seller: ${order.seller}</p>
          <p class="order-item-date">Ordered: ${date}</p>
          <span class="order-confirmed-badge">✓ Confirmed</span>
        </div>
        <div class="order-item-amount">₹${order.amount}</div>
      </div>
    `;
  }).join('');
}

// Check for payment status updates
function checkPaymentUpdates() {
  const paymentBadge = document.getElementById('paymentBadge');
  const payments = getBuyerPayments();
  const pendingCount = payments.filter(p => p.status === 'pending').length;
  
  if (paymentBadge) {
    if (pendingCount > 0) {
      paymentBadge.style.display = 'inline-flex';
      paymentBadge.textContent = pendingCount;
    } else {
      paymentBadge.style.display = 'none';
    }
  }
}

// Check payment updates every 2 seconds
setInterval(checkPaymentUpdates, 2000);

// =====================
// Initialize: show profile section by default
// =====================
document.addEventListener('DOMContentLoaded', () => {
  const profileSection = document.querySelector('.content-section[data-section="profile"]');
  if (profileSection) {
    profileSection.style.display = 'flex';
    profileSection.style.flexDirection = 'column';
    profileSection.style.gap = '16px';
  }
  
  // Update stats
  updateStats();
  
  // Load products
  displayProducts();
  
  // Load chat list
  loadChatList();
  
  // Display notifications
  displayNotifications();
  
  // Check for payment updates
  checkPaymentUpdates();
});

