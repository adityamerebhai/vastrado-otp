/* ===============================
   GLOBAL SAFETY CHECK
================================ */
(() => {
  const username = localStorage.getItem("username");
  const loggedIn = localStorage.getItem("loggedIn");

  if (!username || loggedIn !== "true") {
    console.warn("Session missing. Redirecting to login.");
    window.location.href = "/";
  }
})();

/* ===============================
   API CONFIG
================================ */
const API_BASE_URL = "https://vastrado-otp-production.up.railway.app/api";

/* ===============================
   MENU NAVIGATION
================================ */
document.querySelectorAll(".menu-item").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".menu-item").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");

    const targetSection = btn.dataset.section;
    document.querySelectorAll(".content-section").forEach((section) => {
      if (section.dataset.section === targetSection) {
        section.style.display = "flex";
        section.style.flexDirection = "column";
        section.style.gap = "16px";

        if (targetSection === "browse") {
          displayProducts();
        }
        if (targetSection === "wishlist") {
          displayWishlist();
        }
        if (targetSection === "profile") {
          updateStats();
        }
        if (targetSection === "chat") {
          loadChatList();
        }
        if (targetSection === "notifications") {
          displayNotifications();
        }
        if (targetSection === "payments") {
          displayBuyerPayments();
        }
        if (targetSection === "orders") {
          displayBuyerOrders();
        }
      } else {
        section.style.display = "none";
      }
    });
  });
});

/* ===============================
   PROFILE DROPDOWN
================================ */
const profileDropdown = document.getElementById("profileDropdown");
const profileDropdownMenu = document.getElementById("profileDropdownMenu");

if (profileDropdown) {
  const toggleDropdown = (e) => {
    e.stopPropagation();
    if (profileDropdownMenu) {
      profileDropdownMenu.style.display =
        profileDropdownMenu.style.display === "none" ? "block" : "none";
    }
  };
  
  profileDropdown.addEventListener("click", toggleDropdown);
  // Mobile touch support
  profileDropdown.addEventListener('touchend', (e) => {
    e.preventDefault();
    toggleDropdown(e);
  }, { passive: false });
}

document.addEventListener("click", () => {
  if (profileDropdownMenu) {
    profileDropdownMenu.style.display = "none";
  }
});

/* ===============================
   WISHLIST / ORDERS
================================ */
function getWishlist() {
  return JSON.parse(localStorage.getItem("buyerWishlist") || "[]");
}

function saveWishlist(list) {
  localStorage.setItem("buyerWishlist", JSON.stringify(list));
  updateStats();
}

function getBuyerPayments() {
  const u = localStorage.getItem("username");
  const p = JSON.parse(localStorage.getItem("vastradoPayments") || "[]");
  return p.filter((x) => x.buyer === u);
}

function getBuyerOrders() {
  return getBuyerPayments().filter((p) => p.status === "confirmed");
}

/* ===============================
   PROFILE STATS
================================ */
function updateStats() {
  const wishlist = getWishlist();
  const payments = getBuyerPayments();

  const confirmed = payments.filter((p) => p.status === "confirmed").length;
  const pending = payments.filter((p) => p.status === "pending").length;

  const wishlistCountEl = document.getElementById("wishlistCount");
  const ordersCountEl = document.getElementById("ordersCount");
  const pendingCountEl = document.getElementById("pendingCount");
  
  if (wishlistCountEl) wishlistCountEl.textContent = wishlist.length;
  if (ordersCountEl) ordersCountEl.textContent = confirmed;
  if (pendingCountEl) pendingCountEl.textContent = pending;
}

/* ===============================
   PRODUCTS (LOCAL + CLOUD)
================================ */
function getAvailableProducts() {
  try {
    return JSON.parse(localStorage.getItem("sellerListings") || "[]");
  } catch {
    return [];
  }
}

async function syncProductsFromCloud() {
  try {
    const url = `${API_BASE_URL}/listings`;
    console.log(`🔄 Fetching products from: ${url}`);
    
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
      console.warn(`❌ Failed to fetch listings: ${res.status} ${res.statusText}`);
      // Don't break the loop, just return false
      return false;
    }
    
    const data = await res.json();
    console.log(`📦 Received ${Array.isArray(data) ? data.length : 0} products from server`);
    
    if (Array.isArray(data)) {
      const oldData = localStorage.getItem("sellerListings");
      const oldProducts = oldData ? JSON.parse(oldData) : [];
      localStorage.setItem("sellerListings", JSON.stringify(data));
      
      // If data changed, trigger display update
      if (oldData !== JSON.stringify(data)) {
        console.log(`✅ Synced ${data.length} products from server (was ${oldProducts.length})`);
        // Force display update
        if (typeof displayProducts === 'function') {
          displayProducts();
        }
        // Also trigger hash check
        if (typeof checkProductUpdates === 'function') {
          checkProductUpdates();
        }
      }
      return true;
    } else {
      console.warn("❌ Server returned non-array data:", data);
      return false;
    }
  } catch (err) {
    // Network errors are expected sometimes, don't spam the console
    if (err.name === 'TypeError' && err.message.includes('fetch')) {
      // Only log network errors occasionally to avoid spam
      if (Math.random() < 0.1) { // Log 10% of network errors
        console.warn("⚠️ Network error fetching products (this is normal if server is unreachable)");
      }
    } else {
      console.error("❌ Failed to sync products from cloud:", err);
    }
    // Continue using localStorage data, don't break the sync loop
    return false;
  }
}

/* ===============================
   DISPLAY PRODUCTS
================================ */
function displayProducts() {
  const grid = document.getElementById("productsGrid");
  const countEl = document.getElementById("productCount");
  if (!grid) return;

  const products = getAvailableProducts();
  const wishlist = getWishlist();
  grid.innerHTML = "";

  if (countEl) {
    countEl.textContent = products.length > 0 ? `(${products.length} items available)` : "";
  }

  if (products.length === 0) {
    grid.innerHTML = `<p class="muted" style="padding:40px;text-align:center">
      No products available yet. Check back soon!
    </p>`;
    return;
  }

  products.forEach((p) => {
    const card = document.createElement("div");
    card.className = "product-card";
    const liked = wishlist.some((w) => w.id === p.id);

    card.innerHTML = `
      <button class="wishlist-btn ${liked ? "active" : ""}" data-id="${p.id}">❤</button>
      <div class="product-image">
        <img src="${p.photos?.[0] || ""}" alt="${p.fabricType || "Product"}" />
      </div>
      <div class="product-info">
        <p class="product-seller"><span class="seller-badge">👤 ${p.sellerUsername || "Seller"}</span></p>
        <p class="product-fabric"><strong>Fabric:</strong> ${p.fabricType || "N/A"}</p>
        <p class="product-cost"><strong>Cost:</strong> ₹${p.expectedCost || 0}</p>
        <p class="product-condition"><strong>Condition:</strong> ${p.clothCondition || "N/A"}</p>
      </div>
    `;

    card.querySelector(".wishlist-btn").onclick = (e) => {
      e.stopPropagation();
      toggleWishlist(p);
    };

    card.onclick = () => showProductDetails(p);
    grid.appendChild(card);
  });
}

window.toggleWishlist = function(product) {
  const list = getWishlist();
  const i = list.findIndex((p) => p.id === product.id);
  if (i >= 0) list.splice(i, 1);
  else list.push(product);
  saveWishlist(list);
  displayProducts();
  displayWishlist();
}

/* ===============================
   PRODUCT DETAILS MODAL
================================ */
window.showProductDetails = function(product) {
  const modal = document.getElementById("detailModal");
  const modalBody = document.getElementById("modalBody");
  if (!modal || !modalBody) return;

  const wishlist = getWishlist();
  const isInWishlist = wishlist.some((w) => w.id === product.id);

  modalBody.innerHTML = `
    <div class="detail-header">
      <h2>Product Details</h2>
    </div>
    <div class="detail-photos">
      ${(product.photos || []).map((photo) => `<img src="${photo}" class="detail-photo" alt="Product photo">`).join("")}
    </div>
    <div class="detail-info">
      <div class="detail-row">
        <span class="detail-label">Seller:</span>
        <span class="detail-value">${product.sellerUsername || "Unknown Seller"}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Fabric Type:</span>
        <span class="detail-value">${product.fabricType || "N/A"}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Expected Cost:</span>
        <span class="detail-value">₹${product.expectedCost || "0"}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Condition:</span>
        <span class="detail-value">${product.clothCondition || "N/A"}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Phone:</span>
        <span class="detail-value">${product.phoneNumber || "N/A"}</span>
      </div>
    </div>
    <div class="detail-actions">
      <button class="chat-seller-btn" data-seller-username="${product.sellerUsername || ""}">💬 Chat with Seller</button>
      <button class="buy-now-btn" data-product-id="${product.id}">🛒 Buy Now</button>
    </div>
  `;

  // Attach event listeners
  const buyBtn = modalBody.querySelector('.buy-now-btn');
  if (buyBtn) {
    buyBtn.onclick = (e) => {
      e.stopPropagation();
      openPaymentModal(product);
    };
  }
  
  const chatBtn = modalBody.querySelector('.chat-seller-btn');
  if (chatBtn) {
    const sellerUsername = product.sellerUsername || "";
    let touchHandled = false;
    
    chatBtn.onclick = (e) => {
      if (touchHandled) {
        touchHandled = false;
        return;
      }
      e.stopPropagation();
      openChatWithSeller(sellerUsername);
    };
    
    // Mobile touch support
    chatBtn.addEventListener('touchend', (e) => {
      e.preventDefault();
      e.stopPropagation();
      touchHandled = true;
      openChatWithSeller(sellerUsername);
      // Reset after a short delay
      setTimeout(() => { touchHandled = false; }, 300);
    }, { passive: false });
  }

  modal.style.display = "flex";
}

// Make functions global for onclick handlers
window.openChatWithSeller = function (sellerUsername) {
  if (!sellerUsername || sellerUsername.trim() === "") {
    console.warn("No seller username provided");
    return;
  }
  
  // Close product detail modal if open
  const detailModal = document.getElementById("detailModal");
  if (detailModal && detailModal.style.display !== "none") {
    detailModal.style.display = "none";
  }
  
  // Create chat if doesn't exist
  const buyerUsername = localStorage.getItem("username");
  if (!buyerUsername) {
    console.warn("Buyer username not found");
    return;
  }
  
  const chatKey = [buyerUsername, sellerUsername].sort().join("_");
  const chats = JSON.parse(localStorage.getItem("vastradoChats") || "{}");
  if (!chats[chatKey]) {
    chats[chatKey] = [];
    localStorage.setItem("vastradoChats", JSON.stringify(chats));
  }
  
  // Switch to chat section
  const chatMenuItem = document.querySelector('.menu-item[data-section="chat"]');
  if (chatMenuItem) {
    // Remove active class from all menu items
    document.querySelectorAll('.menu-item').forEach(item => {
      item.classList.remove('active');
    });
    // Add active class to chat menu item
    chatMenuItem.classList.add('active');
    // Hide all sections
    document.querySelectorAll('.content-section').forEach(section => {
      section.style.display = "none";
    });
    // Show chat section
    const chatSection = document.querySelector('.content-section[data-section="chat"]');
    if (chatSection) {
      chatSection.style.display = "block";
    }
  }
  
  // Wait a bit for section to show, then load chat
  setTimeout(() => {
    loadChatList();
    loadChatMessages(sellerUsername);
    // Scroll to top on mobile
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, 150);
};

window.openPaymentModal = function (product) {
  const modal = document.getElementById("paymentModal");
  const productInfo = document.getElementById("paymentProductInfo");
  if (!modal || !productInfo) return;

  productInfo.innerHTML = `
    <h4>${product.fabricType || "Product"}</h4>
    <p><strong>Seller:</strong> ${product.sellerUsername || "Unknown"}</p>
    <p><strong>Price:</strong> ₹${product.expectedCost || "0"}</p>
  `;

  modal.style.display = "flex";
  currentPaymentProduct = product;
};

let currentPaymentProduct = null;

/* ===============================
   PAYMENT MODAL
================================ */
const paymentModal = document.getElementById("paymentModal");
const closePaymentModal = document.getElementById("closePaymentModal");
const paymentDropzone = document.getElementById("paymentDropzone");
const paymentScreenshot = document.getElementById("paymentScreenshot");
const paymentPreview = document.getElementById("paymentPreview");
const paymentPreviewImg = document.getElementById("paymentPreviewImg");
const removePaymentImg = document.getElementById("removePaymentImg");
const submitPaymentBtn = document.getElementById("submitPaymentBtn");

if (closePaymentModal) {
  closePaymentModal.onclick = () => {
    if (paymentModal) paymentModal.style.display = "none";
    if (paymentScreenshot) paymentScreenshot.value = "";
    if (paymentPreview) paymentPreview.style.display = "none";
    if (submitPaymentBtn) submitPaymentBtn.disabled = true;
    currentPaymentProduct = null;
  };
}

if (paymentDropzone) {
  paymentDropzone.onclick = () => paymentScreenshot?.click();
  
  paymentDropzone.ondragover = (e) => {
    e.preventDefault();
    paymentDropzone.style.background = "#f0f0f0";
  };
  
  paymentDropzone.ondragleave = () => {
    paymentDropzone.style.background = "";
  };
  
  paymentDropzone.ondrop = (e) => {
    e.preventDefault();
    paymentDropzone.style.background = "";
    if (e.dataTransfer.files.length > 0) {
      handlePaymentScreenshot(e.dataTransfer.files[0]);
    }
  };
}

if (paymentScreenshot) {
  paymentScreenshot.onchange = (e) => {
    if (e.target.files.length > 0) {
      handlePaymentScreenshot(e.target.files[0]);
    }
  };
}

function handlePaymentScreenshot(file) {
  if (!file.type.startsWith("image/")) {
    alert("Please upload an image file");
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    if (paymentPreviewImg) paymentPreviewImg.src = e.target.result;
    if (paymentPreview) paymentPreview.style.display = "block";
    if (submitPaymentBtn) submitPaymentBtn.disabled = false;
  };
  reader.readAsDataURL(file);
}

if (removePaymentImg) {
  removePaymentImg.onclick = () => {
    if (paymentPreview) paymentPreview.style.display = "none";
    if (paymentScreenshot) paymentScreenshot.value = "";
    if (submitPaymentBtn) submitPaymentBtn.disabled = true;
  };
}

if (submitPaymentBtn) {
  submitPaymentBtn.onclick = () => {
    if (!currentPaymentProduct || !paymentPreviewImg?.src) return;

    const buyerUsername = localStorage.getItem("username");
    const payment = {
      id: Date.now(),
      buyer: buyerUsername,
      seller: currentPaymentProduct.sellerUsername || "Unknown",
      productId: currentPaymentProduct.id,
      productName: currentPaymentProduct.fabricType || "Product",
      amount: currentPaymentProduct.expectedCost || "0",
      screenshot: paymentPreviewImg.src,
      status: "pending",
      createdAt: new Date().toISOString()
    };

    const payments = JSON.parse(localStorage.getItem("vastradoPayments") || "[]");
    payments.push(payment);
    localStorage.setItem("vastradoPayments", JSON.stringify(payments));

    // Sync to API if needed
    paymentModal.style.display = "none";
    paymentScreenshot.value = "";
    paymentPreview.style.display = "none";
    submitPaymentBtn.disabled = true;
    currentPaymentProduct = null;

    showSuccessModal("Payment Submitted!", "Your payment has been submitted. The seller will review it shortly.");
    updateStats();
    displayBuyerPayments();
  };
}

/* ===============================
   DISPLAY PAYMENTS
================================ */
function displayBuyerPayments() {
  const list = document.getElementById("buyerPaymentsList");
  if (!list) return;

  const payments = getBuyerPayments();
  if (payments.length === 0) {
    list.innerHTML = '<p class="muted" style="padding: 20px; text-align: center;">No payments yet. Buy a product to see your payments here.</p>';
    return;
  }

  list.innerHTML = payments.map((p) => {
    const statusClass = p.status === "confirmed" ? "confirmed" : p.status === "rejected" ? "rejected" : "pending";
    return `
      <div class="payment-item">
        <div class="payment-info">
          <h4>${p.productName}</h4>
          <p>Seller: ${p.seller}</p>
          <p>Amount: ₹${p.amount}</p>
          <span class="payment-status ${statusClass}">${p.status}</span>
        </div>
      </div>
    `;
  }).join("");
}

/* ===============================
   DISPLAY ORDERS
================================ */
function displayBuyerOrders() {
  const list = document.getElementById("buyerOrdersList");
  if (!list) return;

  const orders = getBuyerOrders();
  if (orders.length === 0) {
    list.innerHTML = '<p class="muted" style="padding: 20px; text-align: center;">No orders yet. Once you make a purchase, you\'ll see them here.</p>';
    return;
  }

  list.innerHTML = orders.map((order) => {
    return `
      <div class="order-item">
        <div class="order-info">
          <h4>${order.productName}</h4>
          <p>Seller: ${order.seller}</p>
          <p>Amount: ₹${order.amount}</p>
          <span class="order-confirmed-badge">✓ Confirmed</span>
        </div>
      </div>
    `;
  }).join("");
}

/* ===============================
   DISPLAY WISHLIST
================================ */
function displayWishlist() {
  const grid = document.getElementById("wishlistGrid");
  if (!grid) return;

  const wishlist = getWishlist();
  if (wishlist.length === 0) {
    grid.innerHTML = '<p class="muted" style="text-align: center; padding: 40px;">Your wishlist is empty. Browse products and add items you like!</p>';
    return;
  }

  grid.innerHTML = "";
  
  wishlist.forEach((product) => {
    const card = document.createElement("div");
    card.className = "product-card";
    
    card.innerHTML = `
      <button class="wishlist-btn active" data-product-id="${product.id}">❤</button>
      <div class="product-image">
        <img src="${product.photos?.[0] || ""}" alt="${product.fabricType || "Product"}" />
      </div>
      <div class="product-info">
        <p class="product-seller"><span class="seller-badge">👤 ${product.sellerUsername || "Seller"}</span></p>
        <p class="product-fabric"><strong>Fabric:</strong> ${product.fabricType || "N/A"}</p>
        <p class="product-cost"><strong>Cost:</strong> ₹${product.expectedCost || 0}</p>
      </div>
    `;
    
    // Attach event listeners
    const wishlistBtn = card.querySelector(".wishlist-btn");
    if (wishlistBtn) {
      wishlistBtn.onclick = (e) => {
        e.stopPropagation();
        toggleWishlist(product);
      };
    }
    
    card.onclick = () => showProductDetails(product);
    grid.appendChild(card);
  });
}

/* ===============================
   CHAT FUNCTIONALITY
================================ */
let currentChatUser = null;

async function loadChatList() {
  const el = document.getElementById("chatList");
  if (!el) return;
  
  const buyer = localStorage.getItem("username");
  if (!buyer) {
    el.innerHTML = '<p class="muted">Please log in to view chats</p>';
    return;
  }
  
  try {
    const res = await fetch(`${API_BASE_URL}/chat/buyer/${encodeURIComponent(buyer)}`);
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    const users = await res.json();
    
    if (!users || !users.length) {
      el.innerHTML = '<p class="muted" style="padding:20px;text-align:center">No chats yet</p>';
      return;
    }
    
    el.innerHTML = "";
    users.forEach((seller) => {
      const div = document.createElement("div");
      div.className = "chat-list-item";
      div.textContent = seller;
      div.onclick = () => loadChatMessages(seller);
      // Mobile touch support
      div.addEventListener('touchend', (e) => {
        e.preventDefault();
        loadChatMessages(seller);
      }, { passive: false });
      el.appendChild(div);
    });
  } catch (e) {
    console.error("Failed to load chat list:", e);
    el.innerHTML = '<p class="muted">Chat service unavailable. Please try again later.</p>';
  }
}
  
  
  /* ===============================
  LOAD CHAT MESSAGES (FROM API)
  ================================ */
  async function loadChatMessages(seller) {
  currentChatUser = seller;
  
  
  const buyer = localStorage.getItem("username");
  const header = document.getElementById("chatHeader");
  const messagesEl = document.getElementById("chatMessages");
  const inputArea = document.getElementById("chatInputArea");
  
  
  if (header) header.innerHTML = `<h4>Chat with ${seller}</h4>`;
  if (inputArea) inputArea.style.display = "flex";
  
  
  try {
    const res = await fetch(`${API_BASE_URL}/chat/messages?buyer=${encodeURIComponent(buyer)}&seller=${encodeURIComponent(seller)}`);
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    const messages = await res.json();
    
    if (messagesEl) {
      if (!messages || messages.length === 0) {
        messagesEl.innerHTML = '<p class="muted" style="padding: 20px; text-align: center;">No messages yet. Start the conversation!</p>';
      } else {
        messagesEl.innerHTML = messages.map(m => `
          <div class="chat-message ${m.from === buyer ? 'sent' : 'received'}">
            <p>${m.text}</p>
            <span class="chat-time">${new Date(m.createdAt).toLocaleTimeString()}</span>
          </div>
        `).join("");
        // Scroll to bottom after a short delay to ensure DOM is updated
        setTimeout(() => {
          if (messagesEl) messagesEl.scrollTop = messagesEl.scrollHeight;
        }, 100);
      }
    }
  } catch (e) {
    console.error("Failed to load messages:", e);
    if (messagesEl) {
      messagesEl.innerHTML = '<p class="muted">Failed to load messages. Please refresh.</p>';
    }
  }
  }
  
  
  /* ===============================
  SEND MESSAGE (API)
  ================================ */
  const sendMessageBtn = document.getElementById("sendMessageBtn");
  const chatInput = document.getElementById("chatInput");
  
  async function sendMessage() {
    if (!currentChatUser || !chatInput || !chatInput.value.trim()) {
      console.warn("Cannot send: missing chat user or empty message");
      return;
    }
  
    const buyer = localStorage.getItem("username");
    if (!buyer) {
      console.error("Buyer username not found");
      return;
    }
    
    const seller = currentChatUser;
    const text = chatInput.value.trim();
  
    try {
      const response = await fetch(`${API_BASE_URL}/chat/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ buyer, seller, text })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      if (!result.success) {
        throw new Error("Server returned error");
      }
  
      chatInput.value = "";
      // Reload messages to show the new one
      await loadChatMessages(seller);
    } catch (err) {
      console.error("❌ Failed to send message", err);
      alert("Failed to send message. Please try again.");
    }
  }  

  if (sendMessageBtn) {
  sendMessageBtn.onclick = sendMessage;
  sendMessageBtn.addEventListener("touchend", (e) => {
  e.preventDefault();
  sendMessage();
  });
  }
  
  
  if (chatInput) {
    chatInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        sendMessage();
      }
    });
  }
  

/* ===============================
   NOTIFICATIONS
================================ */
function displayNotifications() {
  const list = document.getElementById("notificationsList");
  if (!list) return;

  const notifications = JSON.parse(localStorage.getItem("vastradoNotifications") || "[]");
  const buyerUsername = localStorage.getItem("username");
  const userNotifications = notifications.filter((n) => n.user === buyerUsername);

  if (userNotifications.length === 0) {
    list.innerHTML = '<p class="muted" style="padding: 20px; text-align: center;">No notifications yet</p>';
    return;
  }

  list.innerHTML = userNotifications.map((n) => `
    <div class="notification-item">
      <p>${n.message}</p>
      <span class="notification-time">${new Date(n.timestamp).toLocaleString()}</span>
    </div>
  `).join("");
}

/* ===============================
   MODAL CLOSE HANDLERS
================================ */
const closeModal = document.getElementById("closeModal");
if (closeModal) {
  closeModal.onclick = () => {
    const modal = document.getElementById("detailModal");
    if (modal) modal.style.display = "none";
  };
}

/* ===============================
   SUCCESS MODAL
================================ */
function showSuccessModal(title, message) {
  const modal = document.getElementById("successModal");
  const titleEl = document.getElementById("successTitle");
  const messageEl = document.getElementById("successMessage");
  if (!modal) return;

  if (titleEl) titleEl.textContent = title;
  if (messageEl) messageEl.textContent = message;
  modal.style.display = "flex";
}

const successOkBtn = document.getElementById("successOkBtn");
if (successOkBtn) {
  successOkBtn.onclick = () => {
    const modal = document.getElementById("successModal");
    if (modal) modal.style.display = "none";
  };
}

/* ===============================
   REFRESH BUTTON
================================ */
const refreshProducts = document.getElementById("refreshProducts");
if (refreshProducts) {
  refreshProducts.onclick = async () => {
    refreshProducts.textContent = "⏳ Fetching...";
    refreshProducts.disabled = true;
    try {
      // Only fetch products from server
      const success = await syncProductsFromCloud();
      // Update display with fetched products
      displayProducts();
      if (success) {
        refreshProducts.textContent = "✓ Refreshed!";
      } else {
        refreshProducts.textContent = "⚠️ Check connection";
      }
    } catch (err) {
      console.error('Refresh error:', err);
      refreshProducts.textContent = "❌ Error";
    }
    setTimeout(() => {
      refreshProducts.textContent = "🔄 Refresh";
      refreshProducts.disabled = false;
    }, 2000);
  };
}

/* ===============================
   BROWSE ACTION BUTTON
================================ */
const browseAction = document.getElementById("browseAction");
if (browseAction) {
  browseAction.onclick = () => {
    const browseMenuItem = document.querySelector('.menu-item[data-section="browse"]');
    if (browseMenuItem) browseMenuItem.click();
  };
}

/* ===============================
   LOGOUT CONFIRMATION
================================ */
const logoutBtn = document.getElementById("logoutBtn");
const logoutConfirmModal = document.getElementById("logoutConfirmModal");
const confirmLogoutBtn = document.getElementById("confirmLogoutBtn");
const cancelLogoutBtn = document.getElementById("cancelLogoutBtn");

if (logoutBtn) {
  logoutBtn.onclick = (e) => {
    e.stopPropagation();
    if (logoutConfirmModal) logoutConfirmModal.style.display = "flex";
  };
  // Mobile touch support
  logoutBtn.addEventListener('touchend', (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (logoutConfirmModal) logoutConfirmModal.style.display = "flex";
  }, { passive: false });
}

if (confirmLogoutBtn) {
  const handleLogout = () => {
    [
      "username",
      "email",
      "role",
      "loggedIn",
      "buyerWishlist",
      "vastradoPayments",
      "vastradoChats",
      "vastradoNotifications"
    ].forEach((k) => localStorage.removeItem(k));
    window.location.href = "/";
  };
  
  confirmLogoutBtn.onclick = (e) => {
    e.stopPropagation();
    handleLogout();
  };
  // Mobile touch support
  confirmLogoutBtn.addEventListener('touchend', (e) => {
    e.preventDefault();
    e.stopPropagation();
    handleLogout();
  }, { passive: false });
}

if (cancelLogoutBtn) {
  cancelLogoutBtn.onclick = (e) => {
    e.stopPropagation();
    if (logoutConfirmModal) logoutConfirmModal.style.display = "none";
  };
  // Mobile touch support
  cancelLogoutBtn.addEventListener('touchend', (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (logoutConfirmModal) logoutConfirmModal.style.display = "none";
  }, { passive: false });
}

/* ===============================
   SETTINGS
================================ */
const themePills = document.querySelectorAll("#themePills .pill");
themePills.forEach((pill) => {
  pill.onclick = () => {
    themePills.forEach((p) => p.classList.remove("active"));
    pill.classList.add("active");
    const theme = pill.dataset.theme;
    document.body.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  };
});

const savedTheme = localStorage.getItem("theme") || "light";
document.body.setAttribute("data-theme", savedTheme);
themePills.forEach((p) => {
  if (p.dataset.theme === savedTheme) p.classList.add("active");
});

/* ===============================
   PAYMENT UPDATES CHECK
================================ */
let lastPaymentHash = "";

function getPaymentHash() {
  const payments = getBuyerPayments();
  return payments.map((p) => `${p.id}:${p.status}`).sort().join(",");
}

function checkPaymentUpdates() {
  const currentHash = getPaymentHash();
  if (currentHash !== lastPaymentHash) {
    lastPaymentHash = currentHash;
    updateStats();
    displayBuyerPayments();
    displayBuyerOrders();
  }
}

setInterval(checkPaymentUpdates, 500);

/* ===============================
   PRODUCT UPDATES CHECK
================================ */
let lastProductHash = "";

function getProductHash() {
  const products = getAvailableProducts();
  return products.map((p) => `${p.id}:${p.dateAdded || ""}`).sort().join(",");
}

function checkProductUpdates() {
  const currentHash = getProductHash();
  if (currentHash !== lastProductHash) {
    lastProductHash = currentHash;
    console.log("🔄 Products updated, refreshing display");
    displayProducts();
  }
}

// No automatic syncing - products are fetched only when refresh button is clicked
// Initial display on page load (from localStorage, no API call)
(function() {
  console.log('🚀 [INIT] Buyer panel initializing...');
  displayProducts();
  console.log('✅ [INIT] Buyer panel initialized (products will load from server when you click refresh)');
})();

/* ===============================
   INIT
================================ */
document.addEventListener("DOMContentLoaded", () => {
  const username = localStorage.getItem("username");

  const profileNameEl = document.getElementById("profileName");
  const avatarEl = document.getElementById("avatar");

  if (profileNameEl) {
    profileNameEl.textContent = username || "";
  }

  if (avatarEl) {
    avatarEl.textContent = username
      ? username.charAt(0).toUpperCase()
      : "U";
  }

  loadChatList();
});