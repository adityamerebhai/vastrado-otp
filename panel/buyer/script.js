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

/* ===============================
   API CONFIG
================================ */
const API_BASE_URL = "https://vastrado-otp-production.up.railway.app/api";

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
  return p.filter(x => x.buyer === u);
}

/* ===============================
   PROFILE STATS
================================ */
function updateStats() {
  const wishlist = getWishlist();
  const payments = getBuyerPayments();

  const confirmed = payments.filter(p => p.status === "confirmed").length;
  const pending = payments.filter(p => p.status === "pending").length;

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
    }
  } catch (err) {
    addDebugLog("Cloud sync failed, using localStorage", "warning");
  }
}

/* ===============================
   DISPLAY PRODUCTS
================================ */
function displayProducts() {
  const grid = document.getElementById("productsGrid");
  if (!grid) return;

  const products = getAvailableProducts();
  const wishlist = getWishlist();
  grid.innerHTML = "";

  if (products.length === 0) {
    grid.innerHTML = `<p class="muted" style="padding:40px;text-align:center">
      No products available
    </p>`;
    return;
  }

  products.forEach(p => {
    const card = document.createElement("div");
    card.className = "product-card";
    const liked = wishlist.some(w => w.id === p.id);

    card.innerHTML = `
      <button class="wishlist-btn ${liked ? "active" : ""}">❤</button>
      <img src="${p.photos?.[0] || ""}" />
      <p><strong>${p.fabricType || "Item"}</strong></p>
      <p>₹${p.expectedCost || 0}</p>
      <p>👤 ${p.sellerUsername || "Seller"}</p>
    `;

    card.querySelector(".wishlist-btn").onclick = e => {
      e.stopPropagation();
      toggleWishlist(p);
    };

    grid.appendChild(card);
  });
}

function toggleWishlist(product) {
  const list = getWishlist();
  const i = list.findIndex(p => p.id === product.id);
  if (i >= 0) list.splice(i, 1);
  else list.push(product);
  saveWishlist(list);
  displayProducts();
}

/* ===============================
   CHAT (LOCAL)
================================ */
function loadChatList() {
  const el = document.getElementById("chatList");
  if (!el) return;

  const me = localStorage.getItem("username");
  const chats = JSON.parse(localStorage.getItem("vastradoChats") || "{}");

  const items = Object.keys(chats)
    .filter(k => k.includes(me))
    .map(k => {
      const [a, b] = k.split("_");
      return a === me ? b : a;
    });

  el.innerHTML = items.length
    ? items.map(u => `<div>${u}</div>`).join("")
    : `<p class="muted">No chats yet</p>`;
}

/* ===============================
   LOGOUT
================================ */
document.getElementById("logoutBtn")?.addEventListener("click", () => {
  [
    "username",
    "email",
    "role",
    "loggedIn",
    "buyerWishlist",
    "vastradoPayments",
    "vastradoChats"
  ].forEach(k => localStorage.removeItem(k));

  window.location.href = "/";
});

/* ===============================
   INIT
================================ */
document.addEventListener("DOMContentLoaded", async () => {
  const username = localStorage.getItem("username");
  document.getElementById("profileName")?.textContent = username;
  document.getElementById("avatar")?.textContent =
    username?.charAt(0).toUpperCase() || "U";

  updateStats();
  displayProducts();
  loadChatList();

  await syncProductsFromCloud();
  displayProducts();

  setInterval(syncProductsFromCloud, 2000);
});
