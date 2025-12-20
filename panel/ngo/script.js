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
        // Chat section needs 'block' display, others use 'flex'
        if (targetSection === 'chat') {
          section.style.display = 'block';
        } else {
          section.style.display = 'flex';
          section.style.flexDirection = 'column';
          section.style.gap = '16px';
        }
        
        // Refresh donations when donations section is shown
        if (targetSection === 'donations') {
          displayDonations();
        }
        
        // Update stats when profile section is shown
        if (targetSection === 'profile') {
          updateStats();
        }
        
        // Load chat list when chat section is shown
        if (targetSection === 'chat') {
          setTimeout(() => {
            console.log('💬 Loading chat list for NGO...');
            loadChatList();
          }, 100);
        }
        
        // Load notifications when notifications section is shown
        if (targetSection === 'notifications') {
          displayNotifications();
        }
        
        // Load payments when payments section is shown
        if (targetSection === 'payments') {
          displayNgoPayments();
        }
        
        // Load orders when orders section is shown
        if (targetSection === 'orders') {
          displayNgoOrders();
        }
      } else {
        section.style.display = 'none';
      }
    });
    
    // Hide request form when switching sections
    if (requestFormCard && targetSection !== 'request') {
      requestFormCard.style.display = 'none';
    }
  });
});

// =====================
// Request form handling
// =====================
const requestAction = document.getElementById('requestAction');
const requestFormCard = document.getElementById('requestFormCard');
const closeFormBtn = document.getElementById('closeFormBtn');
const cancelBtn = document.getElementById('cancelBtn');
const requestForm = document.getElementById('requestForm');

// Open request form when + button is clicked
if (requestAction) {
  requestAction.addEventListener('click', () => {
    if (requestFormCard) {
      const requestSection = document.querySelector('.content-section[data-section="request"]');
      if (requestSection) {
        requestSection.style.display = 'flex';
        requestSection.style.flexDirection = 'column';
        requestSection.style.gap = '16px';
      }
      requestFormCard.style.display = 'block';
    }
  });
}

// Close form handlers
function closeRequestForm() {
  if (requestFormCard) {
    requestFormCard.style.display = 'none';
  }
  if (requestForm) {
    requestForm.reset();
  }
  const requestSection = document.querySelector('.content-section[data-section="request"]');
  if (requestSection) {
    requestSection.style.display = 'none';
  }
}

if (closeFormBtn) {
  closeFormBtn.addEventListener('click', closeRequestForm);
}

if (cancelBtn) {
  cancelBtn.addEventListener('click', closeRequestForm);
}

// =====================
// Store and display donation requests
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
          console.log(`✅ Synced ${donations.length} donation requests to backend API`);
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
      console.log('✅ Successfully synced donation request to API');
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
  const ngoUsername = localStorage.getItem('username');
  
  // Get payments for this NGO
  const allPayments = JSON.parse(localStorage.getItem('vastradoPayments') || '[]');
  const ngoPayments = allPayments.filter(p => p.ngo === ngoUsername);
  const itemsCount = ngoPayments.filter(p => p.status === 'confirmed').length;
  const pendingCount = ngoPayments.filter(p => p.status === 'pending').length;
  
  const donationsCountEl = document.getElementById('donationsCount');
  const itemsCountEl = document.getElementById('itemsCount');
  const pendingCountEl = document.getElementById('pendingCount');
  
  if (donationsCountEl) {
    donationsCountEl.textContent = donationsCount;
  }
  if (itemsCountEl) {
    itemsCountEl.textContent = itemsCount;
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
    donationsGrid.innerHTML = '<p class="muted" style="text-align: center; padding: 40px;">No donation requests yet. Create your first request!</p>';
    return;
  }

  donations.forEach((donation, index) => {
    const card = document.createElement('div');
    card.className = 'listing-card';
    card.dataset.index = index;
    
    card.innerHTML = `
      <button class="delete-listing-btn" data-index="${index}" aria-label="Delete request">×</button>
      <div class="listing-info">
        <p class="listing-category"><strong>Category:</strong> ${donation.category || 'N/A'}</p>
        <p class="listing-quantity"><strong>Item:</strong> ${donation.itemName || 'N/A'}</p>
        <p class="listing-condition"><strong>Quantity:</strong> ${donation.quantity || '0'}</p>
        <p style="margin-top: 8px; font-size: 0.85rem; color: var(--muted);">${donation.description ? (donation.description.substring(0, 100) + (donation.description.length > 100 ? '...' : '')) : 'No description'}</p>
      </div>
    `;

    const deleteBtn = card.querySelector('.delete-listing-btn');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        removeDonation(index);
      });
    }

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

  modalBody.innerHTML = `
    <div class="detail-header">
      <h2>Donation Request Details</h2>
    </div>
    <div class="detail-info">
      <div class="detail-row">
        <span class="detail-label">Item Name:</span>
        <span class="detail-value">${donation.itemName || 'N/A'}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Category:</span>
        <span class="detail-value">${donation.category || 'N/A'}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Quantity Needed:</span>
        <span class="detail-value">${donation.quantity || '0'}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Description:</span>
        <span class="detail-value">${donation.description || 'N/A'}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Contact Number:</span>
        <span class="detail-value">${donation.phoneNumber || 'N/A'}</span>
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
if (requestForm) {
  requestForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const itemName = document.getElementById('itemName').value;
    const description = document.getElementById('description').value;
    const category = document.getElementById('category').value;
    const quantity = document.getElementById('quantity').value;
    const phoneNumber = document.getElementById('phoneNumber').value;
    
    if (!itemName || !description || !category || !quantity || !phoneNumber) {
      alert('Please fill in all fields');
      return;
    }
    
    const donation = {
      itemName,
      description,
      category,
      quantity: parseInt(quantity),
      phoneNumber,
      date: new Date().toISOString(),
      ngo: localStorage.getItem('username') || 'NGO'
    };
    
    await saveDonation(donation);
    closeRequestForm();
    
    // Show success modal
    const successModal = document.getElementById('successModal');
    const successTitle = document.getElementById('successTitle');
    const successMessage = document.getElementById('successMessage');
    if (successModal && successTitle && successMessage) {
      successTitle.textContent = 'Request Created!';
      successMessage.textContent = 'Your donation request has been created successfully.';
      successModal.style.display = 'flex';
    }
  });
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
// Chat
// =====================
let currentChatUser = null;

function loadChatList() {
  const chatList = document.getElementById('chatList');
  if (!chatList) return;
  
  const chats = JSON.parse(localStorage.getItem('ngoChats') || '[]');
  
  if (chats.length === 0) {
    chatList.innerHTML = '<p class="muted" style="padding: 20px; text-align: center;">No conversations yet</p>';
    return;
  }
  
  chatList.innerHTML = chats.map(chat => `
    <div class="chat-list-item" data-user="${chat.user}">
      <div class="chat-avatar">${chat.user.charAt(0).toUpperCase()}</div>
      <div class="chat-user-info">
        <p class="chat-username">${chat.user}</p>
        <p class="chat-preview">${chat.lastMessage || 'No messages'}</p>
      </div>
    </div>
  `).join('');
  
  // Add click handlers
  chatList.querySelectorAll('.chat-list-item').forEach(item => {
    item.addEventListener('click', () => {
      const user = item.dataset.user;
      openChat(user);
    });
  });
}

function openChat(user) {
  currentChatUser = user;
  const chatHeader = document.getElementById('chatHeader');
  const chatMessages = document.getElementById('chatMessages');
  const chatInputArea = document.getElementById('chatInputArea');
  
  if (chatHeader) {
    chatHeader.innerHTML = `<h4>Chat with ${user}</h4>`;
  }
  
  if (chatInputArea) {
    chatInputArea.style.display = 'flex';
  }
  
  // Load messages
  const chats = JSON.parse(localStorage.getItem('ngoChats') || '[]');
  const chat = chats.find(c => c.user === user);
  
  if (chatMessages) {
    if (chat && chat.messages) {
      chatMessages.innerHTML = chat.messages.map(msg => `
        <div class="chat-message ${msg.sender === 'ngo' ? 'sent' : 'received'}">
          ${msg.text}
          <span class="message-time">${new Date(msg.time).toLocaleTimeString()}</span>
        </div>
      `).join('');
      chatMessages.scrollTop = chatMessages.scrollHeight;
    } else {
      chatMessages.innerHTML = '<p class="muted" style="text-align: center; padding: 20px;">No messages yet</p>';
    }
  }
  
  // Update active chat
  document.querySelectorAll('.chat-list-item').forEach(item => {
    item.classList.remove('active');
    if (item.dataset.user === user) {
      item.classList.add('active');
    }
  });
}

const sendMessageBtn = document.getElementById('sendMessageBtn');
const chatInput = document.getElementById('chatInput');

if (sendMessageBtn && chatInput) {
  sendMessageBtn.addEventListener('click', sendMessage);
  chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  });
}

function sendMessage() {
  if (!currentChatUser || !chatInput.value.trim()) return;
  
  const chats = JSON.parse(localStorage.getItem('ngoChats') || '[]');
  let chat = chats.find(c => c.user === currentChatUser);
  
  if (!chat) {
    chat = { user: currentChatUser, messages: [] };
    chats.push(chat);
  }
  
  chat.messages.push({
    text: chatInput.value,
    sender: 'ngo',
    time: new Date().toISOString()
  });
  
  chat.lastMessage = chatInput.value;
  
  localStorage.setItem('ngoChats', JSON.stringify(chats));
  chatInput.value = '';
  openChat(currentChatUser);
}

// =====================
// Payments
// =====================
function getNgoPayments() {
  const allPayments = JSON.parse(localStorage.getItem('vastradoPayments') || '[]');
  const ngoUsername = localStorage.getItem('username');
  return allPayments.filter(p => p.ngo === ngoUsername);
}

function displayNgoPayments() {
  const paymentsList = document.getElementById('ngoPaymentsList');
  if (!paymentsList) return;
  
  const payments = getNgoPayments();
  
  if (payments.length === 0) {
    paymentsList.innerHTML = '<p class="muted" style="padding: 20px; text-align: center;">No pending payments.</p>';
    return;
  }
  
  paymentsList.innerHTML = payments.map(payment => `
    <div class="payment-item ${payment.status}" onclick="showPaymentDetails('${payment.id}')">
      <div class="payment-item-info">
        <p class="payment-item-title">${payment.itemName || 'Donation'}</p>
        <p class="payment-item-buyer">From: ${payment.donor || 'Unknown'}</p>
      </div>
      <div>
        <p class="payment-item-amount">₹${payment.amount || '0'}</p>
        <span class="payment-status ${payment.status}">${payment.status}</span>
      </div>
    </div>
  `).join('');
}

function showPaymentDetails(paymentId) {
  const payments = getNgoPayments();
  const payment = payments.find(p => p.id === paymentId);
  if (!payment) return;
  
  const modal = document.getElementById('paymentDetailModal');
  const modalBody = document.getElementById('paymentDetailBody');
  
  if (!modal || !modalBody) return;
  
  modalBody.innerHTML = `
    <h2>Payment Details</h2>
    <div class="payment-detail-section">
      <h4>Donation Information</h4>
      <p><strong>Item:</strong> ${payment.itemName || 'N/A'}</p>
      <p><strong>Amount:</strong> <span class="payment-amount-display">₹${payment.amount || '0'}</span></p>
    </div>
    <div class="payment-detail-section">
      <h4>Donor Information</h4>
      <div class="buyer-info">
        <div class="buyer-avatar">${(payment.donor || 'D').charAt(0).toUpperCase()}</div>
        <div class="buyer-name">${payment.donor || 'Unknown'}</div>
      </div>
    </div>
    <div class="payment-actions">
      <button class="confirm-payment-btn" onclick="confirmPayment('${payment.id}')">Confirm Payment</button>
      <button class="reject-payment-btn" onclick="rejectPayment('${payment.id}')">Reject</button>
    </div>
  `;
  
  modal.style.display = 'flex';
}

window.confirmPayment = function(paymentId) {
  const allPayments = JSON.parse(localStorage.getItem('vastradoPayments') || '[]');
  const payment = allPayments.find(p => p.id === paymentId);
  if (payment) {
    payment.status = 'confirmed';
    localStorage.setItem('vastradoPayments', JSON.stringify(allPayments));
    displayNgoPayments();
    updateStats();
    
    const modal = document.getElementById('paymentDetailModal');
    if (modal) modal.style.display = 'none';
    
    const successModal = document.getElementById('successModal');
    const successTitle = document.getElementById('successTitle');
    const successMessage = document.getElementById('successMessage');
    if (successModal && successTitle && successMessage) {
      successTitle.textContent = 'Payment Confirmed!';
      successMessage.textContent = 'The payment has been confirmed successfully.';
      successModal.style.display = 'flex';
    }
  }
};

window.rejectPayment = function(paymentId) {
  const allPayments = JSON.parse(localStorage.getItem('vastradoPayments') || '[]');
  const payment = allPayments.find(p => p.id === paymentId);
  if (payment) {
    payment.status = 'rejected';
    localStorage.setItem('vastradoPayments', JSON.stringify(allPayments));
    displayNgoPayments();
    updateStats();
    
    const modal = document.getElementById('paymentDetailModal');
    if (modal) modal.style.display = 'none';
  }
};

const closePaymentDetailModal = document.getElementById('closePaymentDetailModal');
const paymentDetailModal = document.getElementById('paymentDetailModal');

if (closePaymentDetailModal) {
  closePaymentDetailModal.addEventListener('click', () => {
    if (paymentDetailModal) {
      paymentDetailModal.style.display = 'none';
    }
  });
}

if (paymentDetailModal) {
  paymentDetailModal.addEventListener('click', (e) => {
    if (e.target === paymentDetailModal) {
      paymentDetailModal.style.display = 'none';
    }
  });
}

// Refresh payments button
const refreshNgoPaymentsBtn = document.getElementById('refreshNgoPaymentsBtn');
if (refreshNgoPaymentsBtn) {
  refreshNgoPaymentsBtn.addEventListener('click', async () => {
    refreshNgoPaymentsBtn.disabled = true;
    refreshNgoPaymentsBtn.innerHTML = '<img src="images/icons8-refresh-48.png" alt="Refresh" class="refresh-icon"> ⏳ Fetching...';
    
    try {
      // Fetch from server if needed
      displayNgoPayments();
      refreshNgoPaymentsBtn.innerHTML = '<img src="images/icons8-refresh-48.png" alt="Refresh" class="refresh-icon"> ✓ Refreshed!';
    } catch (error) {
      refreshNgoPaymentsBtn.innerHTML = '<img src="images/icons8-refresh-48.png" alt="Refresh" class="refresh-icon"> ❌ Error';
    }
    
    setTimeout(() => {
      refreshNgoPaymentsBtn.disabled = false;
      refreshNgoPaymentsBtn.innerHTML = '<img src="images/icons8-refresh-48.png" alt="Refresh" class="refresh-icon"> Refresh';
    }, 2000);
  });
  
  refreshNgoPaymentsBtn.addEventListener('touchend', (e) => {
    e.preventDefault();
    refreshNgoPaymentsBtn.click();
  }, { passive: false });
}

// =====================
// Orders
// =====================
function displayNgoOrders() {
  const ordersList = document.getElementById('ngoOrdersList');
  if (!ordersList) return;
  
  const payments = getNgoPayments();
  const confirmedPayments = payments.filter(p => p.status === 'confirmed');
  
  if (confirmedPayments.length === 0) {
    ordersList.innerHTML = '<p class="muted" style="padding: 20px; text-align: center;">No completed donations yet.</p>';
    return;
  }
  
  ordersList.innerHTML = confirmedPayments.map(payment => `
    <div class="order-item">
      <div class="order-item-info">
        <p class="order-item-title">${payment.itemName || 'Donation'}</p>
        <p class="order-item-buyer">From: ${payment.donor || 'Unknown'}</p>
        <p class="order-item-date">${new Date(payment.date || Date.now()).toLocaleString()}</p>
        <span class="sale-confirmed-badge">✓ Confirmed</span>
      </div>
      <div class="order-item-amount">₹${payment.amount || '0'}</div>
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

