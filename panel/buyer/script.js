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
   DEBUG PANEL
================================ */
let debugLogs = [];
const MAX_DEBUG_LOGS = 50;

function addDebugLog(message, type = "info") {
  const timestamp = new Date().toLocaleTimeString();
  const entry = `[${timestamp}] ${type.toUpperCase()}: ${message}`;
  debugLogs.push(entry);
  if (debugLogs.length > MAX_DEBUG_LOGS) debugLogs.shift();
  updateDebugPanel();
  console.log(entry);
}

function updateDebugPanel() {
  const el = document.getElementById("debugContent");
  if (el) el.textContent = debugLogs.join("\n");
}

function showDebugPanel() {
  const panel = document.getElementById("debugPanel");
  if (panel) {
    panel.style.display = "block";
    updateDebugPanel();
  }
}

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
  profileDropdown.addEventListener("click", (e) => {
    e.stopPropagation();
    if (profileDropdownMenu) {
      profileDropdownMenu.style.display =
        profileDropdownMenu.style.display === "none" ? "block" : "none";
    }
  });
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

  document.getElementById("wishlistCount")?.textContent = wishlist.length;
  document.getElementById("ordersCount")?.textContent = confirmed;
  document.getElementById("pendingCount")?.textContent = pending;
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
    const res = await fetch(`${API_BASE_URL}/listings`, { cache: "no-cache" });
    if (!res.ok) return;
    const data = await res.json();
    if (Array.isArray(data)) {
      localStorage.setItem("sellerListings", JSON.stringify(data));
      addDebugLog(`Synced ${data.length} products`, "success");
      return true;
    }
  } catch (err) {
    addDebugLog("Cloud sync failed, using localStorage", "warning");
  }
  return false;
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
      <button class="chat-seller-btn" onclick="openChatWithSeller('${product.sellerUsername || ""}')">💬 Chat with Seller</button>
      <button class="buy-now-btn" onclick="openPaymentModal(${JSON.stringify(product).replace(/"/g, "&quot;")})">🛒 Buy Now</button>
    </div>
  `;

  modal.style.display = "flex";
}

// Make functions global for onclick handlers
window.openChatWithSeller = function (sellerUsername) {
  const chatSection = document.querySelector('.content-section[data-section="chat"]');
  const browseMenuItem = document.querySelector('.menu-item[data-section="chat"]');
  if (browseMenuItem) browseMenuItem.click();
  
  // Create chat if doesn't exist
  const buyerUsername = localStorage.getItem("username");
  const chatKey = [buyerUsername, sellerUsername].sort().join("_");
  const chats = JSON.parse(localStorage.getItem("vastradoChats") || "{}");
  if (!chats[chatKey]) {
    chats[chatKey] = [];
    localStorage.setItem("vastradoChats", JSON.stringify(chats));
  }
  
  loadChatList();
  loadChatMessages(sellerUsername);
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

  grid.innerHTML = wishlist.map((product) => {
    return `
      <div class="product-card" onclick="showProductDetails(${JSON.stringify(product).replace(/"/g, "&quot;")})">
        <button class="wishlist-btn active" onclick="event.stopPropagation(); toggleWishlist(${JSON.stringify(product).replace(/"/g, "&quot;")})">❤</button>
        <div class="product-image">
          <img src="${product.photos?.[0] || ""}" alt="${product.fabricType || "Product"}" />
        </div>
        <div class="product-info">
          <p class="product-seller"><span class="seller-badge">👤 ${product.sellerUsername || "Seller"}</span></p>
          <p class="product-fabric"><strong>Fabric:</strong> ${product.fabricType || "N/A"}</p>
          <p class="product-cost"><strong>Cost:</strong> ₹${product.expectedCost || 0}</p>
        </div>
      </div>
    `;
  }).join("");
}

/* ===============================
   CHAT FUNCTIONALITY
================================ */
let currentChatUser = null;

function loadChatList() {
  const el = document.getElementById("chatList");
  if (!el) return;

  const me = localStorage.getItem("username");
  const chats = JSON.parse(localStorage.getItem("vastradoChats") || "{}");

  const items = [...new Set(Object.keys(chats)
    .filter((k) => k.includes(me))
    .map((k) => {
      const [a, b] = k.split("_");
      return a === me ? b : a;
    }))];

  if (items.length === 0) {
    el.innerHTML = '<p class="muted" style="padding: 20px; text-align: center;">No conversations yet</p>';
    return;
  }

  el.innerHTML = items.map((u) => `
    <div class="chat-list-item" onclick="loadChatMessages('${u}')">
      ${u}
    </div>
  `).join("");
}

function loadChatMessages(otherUser) {
  currentChatUser = otherUser;
  const buyerUsername = localStorage.getItem("username");
  const chatKey = [buyerUsername, otherUser].sort().join("_");
  const chats = JSON.parse(localStorage.getItem("vastradoChats") || "{}");
  const messages = chats[chatKey] || [];

  const header = document.getElementById("chatHeader");
  const messagesEl = document.getElementById("chatMessages");
  const inputArea = document.getElementById("chatInputArea");

  if (header) header.innerHTML = `<h4>Chat with ${otherUser}</h4>`;
  if (messagesEl) {
    messagesEl.innerHTML = messages.map((msg) => `
      <div class="chat-message ${msg.sender === buyerUsername ? "sent" : "received"}">
        <p>${msg.text}</p>
        <span class="chat-time">${new Date(msg.timestamp).toLocaleTimeString()}</span>
      </div>
    `).join("");
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }
  if (inputArea) inputArea.style.display = "flex";
}

const sendMessageBtn = document.getElementById("sendMessageBtn");
const chatInput = document.getElementById("chatInput");

if (sendMessageBtn && chatInput) {
  sendMessageBtn.onclick = () => sendMessage();
  chatInput.onkeypress = (e) => {
    if (e.key === "Enter") sendMessage();
  };
}

function sendMessage() {
  if (!currentChatUser || !chatInput?.value.trim()) return;

  const buyerUsername = localStorage.getItem("username");
  const chatKey = [buyerUsername, currentChatUser].sort().join("_");
  const chats = JSON.parse(localStorage.getItem("vastradoChats") || "{}");
  if (!chats[chatKey]) chats[chatKey] = [];

  const message = {
    sender: buyerUsername,
    text: chatInput.value.trim(),
    timestamp: new Date().toISOString()
  };

  chats[chatKey].push(message);
  localStorage.setItem("vastradoChats", JSON.stringify(chats));

  chatInput.value = "";
  loadChatMessages(currentChatUser);
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
    refreshProducts.textContent = "⏳ Syncing...";
    refreshProducts.disabled = true;
    await syncProductsFromCloud();
    displayProducts();
    refreshProducts.textContent = "✓ Refreshed!";
    setTimeout(() => {
      refreshProducts.textContent = "🔄 Refresh";
      refreshProducts.disabled = false;
    }, 1500);
  };
}

/* ===============================
   DEBUG BUTTON
================================ */
const debugBtn = document.getElementById("debugBtn");
if (debugBtn) {
  debugBtn.onclick = () => {
    showDebugPanel();
    addDebugLog("Debug panel opened", "info");
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
  logoutBtn.onclick = () => {
    if (logoutConfirmModal) logoutConfirmModal.style.display = "flex";
  };
}

if (confirmLogoutBtn) {
  confirmLogoutBtn.onclick = () => {
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
}

if (cancelLogoutBtn) {
  cancelLogoutBtn.onclick = () => {
    if (logoutConfirmModal) logoutConfirmModal.style.display = "none";
  };
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
    displayProducts();
  }
}

setInterval(checkProductUpdates, 1000);
setInterval(syncProductsFromCloud, 2000);

/* ===============================
   INIT
================================ */
document.addEventListener("DOMContentLoaded", async () => {
  const username = localStorage.getItem("username");
  document.getElementById("profileName")?.textContent = username;
  document.getElementById("avatar")?.textContent = username?.charAt(0).toUpperCase() || "U";

  updateStats();
  displayProducts();
  loadChatList();
  displayBuyerPayments();
  displayBuyerOrders();
  displayWishlist();
  displayNotifications();

  await syncProductsFromCloud();
  displayProducts();

  addDebugLog("Buyer panel initialized", "info");
  addDebugLog(`API URL: ${API_BASE_URL}`, "info");
});
