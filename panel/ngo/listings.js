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
   GET DONATIONS
================================ */
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

/* ===============================
   FETCH DONATIONS FROM SERVER
================================ */
async function fetchDonationsFromServer() {
  try {
    const response = await fetch(`${API_BASE_URL}/ngo-donations`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      },
      cache: 'no-cache'
    });

    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data)) {
        // Merge with local storage
        const localDonations = getStoredDonations();
        const merged = [...localDonations, ...data];
        // Remove duplicates based on id
        const unique = merged.filter((item, index, self) =>
          index === self.findIndex((t) => t.id === item.id)
        );
        localStorage.setItem('ngoDonations', JSON.stringify(unique));
        return unique;
      }
    }
  } catch (error) {
    console.error('Failed to fetch donations from server:', error);
  }
  return getStoredDonations();
}

/* ===============================
   DISPLAY DONATIONS
================================ */
function displayDonations() {
  const grid = document.getElementById("donationsGrid");
  const countEl = document.getElementById("donationCount");
  if (!grid) return;

  const donations = getStoredDonations();
  grid.innerHTML = "";

  if (countEl) {
    countEl.textContent = donations.length > 0 ? `(${donations.length} donations available)` : "";
  }

  if (donations.length === 0) {
    grid.innerHTML = `<p class="muted" style="padding:40px;text-align:center">
      No donations available yet. Check back soon!
    </p>`;
    return;
  }

  donations.forEach((donation, index) => {
    const card = document.createElement("div");
    card.className = "donation-card";
    
    const mainImage = donation.photos && donation.photos.length > 0 ? donation.photos[0] : '';

    card.innerHTML = `
      <div class="donation-image">
        <img src="${mainImage}" alt="Donation ${index + 1}" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'200\' height=\'200\'%3E%3Crect fill=\'%23ddd\' width=\'200\' height=\'200\'/%3E%3Ctext fill=\'%23999\' font-family=\'sans-serif\' font-size=\'18\' dy=\'10.5\' font-weight=\'bold\' x=\'50%25\' y=\'50%25\' text-anchor=\'middle\'%3ENo Image%3C/text%3E%3C/svg%3E'">
      </div>
      <div class="donation-info">
        <p class="donation-fabric"><strong>Type:</strong> ${donation.donationType || "N/A"}</p>
        <p class="donation-cost"><strong>Quality:</strong> ${donation.clothCondition || "N/A"}</p>
        <p class="donation-condition"><strong>Donor:</strong> ${donation.donor || "Anonymous"}</p>
      </div>
    `;

    card.onclick = () => showDonationDetails(donation);
    grid.appendChild(card);
  });
}

/* ===============================
   DONATION DETAILS MODAL
================================ */
function showDonationDetails(donation) {
  const modal = document.getElementById("detailModal");
  const modalBody = document.getElementById("modalBody");
  if (!modal || !modalBody) return;

  const photosHtml = donation.photos && donation.photos.length > 0 
    ? donation.photos.map((photo) => `<img src="${photo}" class="detail-photo" alt="Donation photo">`).join("")
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
        <span class="detail-label">Donor:</span>
        <span class="detail-value">${donation.donor || "Anonymous"}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Cloth Type:</span>
        <span class="detail-value">${donation.donationType || "N/A"}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Quality:</span>
        <span class="detail-value">${donation.clothCondition || "N/A"}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Description:</span>
        <span class="detail-value">${donation.description || "N/A"}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Date:</span>
        <span class="detail-value">${new Date(donation.dateAdded || Date.now()).toLocaleDateString()}</span>
      </div>
    </div>
  `;

  modal.style.display = "flex";
}

// Close modal
const closeModal = document.getElementById("closeModal");
const detailModal = document.getElementById("detailModal");

if (closeModal) {
  closeModal.addEventListener("click", () => {
    if (detailModal) {
      detailModal.style.display = "none";
    }
  });
}

if (detailModal) {
  detailModal.addEventListener("click", (e) => {
    if (e.target === detailModal) {
      detailModal.style.display = "none";
    }
  });
}

/* ===============================
   REFRESH BUTTON
================================ */
const refreshDonationsBtn = document.getElementById("refreshDonations");

if (refreshDonationsBtn) {
  refreshDonationsBtn.addEventListener("click", async () => {
    refreshDonationsBtn.disabled = true;
    refreshDonationsBtn.innerHTML = '<img src="images/icons8-refresh-48.png" alt="Refresh" class="refresh-icon"> ⏳ Fetching...';
    
    try {
      await fetchDonationsFromServer();
      displayDonations();
      refreshDonationsBtn.innerHTML = '<img src="images/icons8-refresh-48.png" alt="Refresh" class="refresh-icon"> ✓ Refreshed!';
    } catch (error) {
      console.error('Error refreshing donations:', error);
      refreshDonationsBtn.innerHTML = '<img src="images/icons8-refresh-48.png" alt="Refresh" class="refresh-icon"> ⚠️ Check connection';
    }
    
    setTimeout(() => {
      refreshDonationsBtn.disabled = false;
      refreshDonationsBtn.innerHTML = '<img src="images/icons8-refresh-48.png" alt="Refresh" class="refresh-icon"> Refresh';
    }, 2000);
  });
  
  // Mobile touch support
  refreshDonationsBtn.addEventListener('touchend', (e) => {
    e.preventDefault();
    refreshDonationsBtn.click();
  }, { passive: false });
}

/* ===============================
   INITIALIZE
================================ */
document.addEventListener("DOMContentLoaded", () => {
  const username = localStorage.getItem("username");
  const profileName = document.getElementById("profileName");
  const avatar = document.getElementById("avatar");
  
  if (profileName) {
    profileName.textContent = username || "NGO";
  }
  if (avatar) {
    avatar.textContent = (username || "N").charAt(0).toUpperCase();
  }
  
  displayDonations();
});

