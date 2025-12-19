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
   MENU NAVIGATION
================================ */
document.querySelectorAll(".menu-item").forEach((btn) => {
  const handleMenuClick = () => {
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
        if (targetSection === "settings") {
          // Settings section is already visible
        }
      } else {
        section.style.display = "none";
      }
    });
  };
  
  btn.addEventListener("click", handleMenuClick);
  // Mobile touch support
  btn.addEventListener("touchend", (e) => {
    e.preventDefault();
    handleMenuClick();
  }, { passive: false });
});

/* ===============================
   WISHLIST
================================ */
function getWishlist() {
  return JSON.parse(localStorage.getItem("buyerWishlist") || "[]");
}

function saveWishlist(list) {
  localStorage.setItem("buyerWishlist", JSON.stringify(list));
  updateStats();
}

/* ===============================
   PROFILE STATS
================================ */
function updateStats() {
  const wishlist = getWishlist();
  const wishlistCountEl = document.getElementById("wishlistCount");
  
  if (wishlistCountEl) wishlistCountEl.textContent = wishlist.length;
}

/* ===============================
   PRODUCTS (LOCAL STORAGE ONLY)
================================ */
function getAvailableProducts() {
  try {
    return JSON.parse(localStorage.getItem("sellerListings") || "[]");
  } catch {
    return [];
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

    const wishlistBtn = card.querySelector(".wishlist-btn");
    if (wishlistBtn) {
      wishlistBtn.onclick = (e) => {
        e.stopPropagation();
        toggleWishlist(p);
      };
      // Mobile touch support
      wishlistBtn.addEventListener('touchend', (e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleWishlist(p);
      }, { passive: false });
    }

    card.onclick = () => showProductDetails(p);
    // Mobile touch support for card
    card.addEventListener('touchend', (e) => {
      e.preventDefault();
      showProductDetails(p);
    }, { passive: false });
    
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
  `;

  modal.style.display = "flex";
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
      // Mobile touch support
      wishlistBtn.addEventListener('touchend', (e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleWishlist(product);
      }, { passive: false });
    }
    
    card.onclick = () => showProductDetails(product);
    // Mobile touch support for card
    card.addEventListener('touchend', (e) => {
      e.preventDefault();
      showProductDetails(product);
    }, { passive: false });
    
    grid.appendChild(card);
  });
}

/* ===============================
   MODAL CLOSE HANDLERS
================================ */
const closeModal = document.getElementById("closeModal");
if (closeModal) {
  const closeDetailModal = () => {
    const modal = document.getElementById("detailModal");
    if (modal) modal.style.display = "none";
  };
  
  closeModal.onclick = closeDetailModal;
  // Mobile touch support
  closeModal.addEventListener('touchend', (e) => {
    e.preventDefault();
    closeDetailModal();
  }, { passive: false });
}

// Close modal on overlay click
const detailModal = document.getElementById("detailModal");
if (detailModal) {
  detailModal.addEventListener("click", (e) => {
    if (e.target === detailModal) {
      detailModal.style.display = "none";
    }
  });
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
  const closeSuccessModal = () => {
    const modal = document.getElementById("successModal");
    if (modal) modal.style.display = "none";
  };
  
  successOkBtn.onclick = closeSuccessModal;
  // Mobile touch support
  successOkBtn.addEventListener('touchend', (e) => {
    e.preventDefault();
    closeSuccessModal();
  }, { passive: false });
}

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

// Close dropdown when clicking outside
document.addEventListener("click", (e) => {
  if (profileDropdownMenu && profileDropdown && !profileDropdown.contains(e.target)) {
    profileDropdownMenu.style.display = "none";
  }
});

/* ===============================
   LOGOUT CONFIRMATION
================================ */
const logoutBtn = document.getElementById("logoutBtn");
const logoutConfirmModal = document.getElementById("logoutConfirmModal");
const confirmLogoutBtn = document.getElementById("confirmLogoutBtn");
const cancelLogoutBtn = document.getElementById("cancelLogoutBtn");

if (logoutBtn) {
  const showLogoutModal = (e) => {
    e.stopPropagation();
    if (profileDropdownMenu) profileDropdownMenu.style.display = "none";
    if (logoutConfirmModal) logoutConfirmModal.style.display = "flex";
  };
  
  logoutBtn.onclick = showLogoutModal;
  // Mobile touch support
  logoutBtn.addEventListener('touchend', (e) => {
    e.preventDefault();
    e.stopPropagation();
    showLogoutModal(e);
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
      "sellerListings"
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
  const hideLogoutModal = (e) => {
    e.stopPropagation();
    if (logoutConfirmModal) logoutConfirmModal.style.display = "none";
  };
  
  cancelLogoutBtn.onclick = hideLogoutModal;
  // Mobile touch support
  cancelLogoutBtn.addEventListener('touchend', (e) => {
    e.preventDefault();
    e.stopPropagation();
    hideLogoutModal(e);
  }, { passive: false });
}

// Close logout modal on overlay click
if (logoutConfirmModal) {
  logoutConfirmModal.addEventListener("click", (e) => {
    if (e.target === logoutConfirmModal) {
      logoutConfirmModal.style.display = "none";
    }
  });
}

/* ===============================
   BROWSE ACTION BUTTON
================================ */
const browseAction = document.getElementById("browseAction");
if (browseAction) {
  const handleBrowse = () => {
    const browseMenuItem = document.querySelector('.menu-item[data-section="browse"]');
    if (browseMenuItem) browseMenuItem.click();
  };
  
  browseAction.onclick = handleBrowse;
  // Mobile touch support
  browseAction.addEventListener('touchend', (e) => {
    e.preventDefault();
    handleBrowse();
  }, { passive: false });
}

/* ===============================
   REFRESH PRODUCTS BUTTON
================================ */
const refreshProducts = document.getElementById("refreshProducts");
if (refreshProducts) {
  const handleRefresh = () => {
    refreshProducts.textContent = "⏳ Refreshing...";
    refreshProducts.disabled = true;
    displayProducts();
    checkProductUpdates();
    refreshProducts.textContent = "✓ Refreshed!";
    setTimeout(() => {
      refreshProducts.textContent = "🔄 Refresh";
      refreshProducts.disabled = false;
    }, 1500);
  };
  
  refreshProducts.onclick = handleRefresh;
  // Mobile touch support
  refreshProducts.addEventListener('touchend', (e) => {
    e.preventDefault();
    handleRefresh();
  }, { passive: false });
}

/* ===============================
   SETTINGS
================================ */
const themePills = document.querySelectorAll("#themePills .pill");
themePills.forEach((pill) => {
  const handleThemeChange = () => {
    themePills.forEach((p) => p.classList.remove("active"));
    pill.classList.add("active");
    const theme = pill.dataset.theme;
    document.body.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  };
  
  pill.onclick = handleThemeChange;
  // Mobile touch support
  pill.addEventListener('touchend', (e) => {
    e.preventDefault();
    handleThemeChange();
  }, { passive: false });
});

const savedTheme = localStorage.getItem("theme") || "light";
document.body.setAttribute("data-theme", savedTheme);
themePills.forEach((p) => {
  if (p.dataset.theme === savedTheme) p.classList.add("active");
});

// Notification toggle
const notifyToggle = document.getElementById("notifyToggle");
if (notifyToggle) {
  const saved = localStorage.getItem("buyerNotify");
  if (saved !== null) notifyToggle.checked = saved === 'true';
  notifyToggle.addEventListener('change', () => {
    localStorage.setItem("buyerNotify", notifyToggle.checked ? 'true' : 'false');
  });
}

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

// Check for product updates every second
setInterval(checkProductUpdates, 1000);

/* ===============================
   INIT
================================ */
document.addEventListener("DOMContentLoaded", () => {
  console.log('🚀 [INIT] Buyer panel initializing...');
  
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

  // Initial display
  displayProducts();
  updateStats();
  checkProductUpdates();
  
  console.log('✅ [INIT] Buyer panel initialized');
});
