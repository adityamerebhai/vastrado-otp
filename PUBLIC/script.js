// ================= SELECT ELEMENTS =================
const cards = document.querySelectorAll(".card");
const rightHalf = document.querySelector(".right-half");

let isAnimating = false;

// ================= CARD CLICK + ANIMATION =================
cards.forEach((card, index) => {
  card.addEventListener("click", () => {
    if (isAnimating) return;
    isAnimating = true;

    // Get role directly from data attribute
    const clickedRole = card.dataset.role;
    console.log("Card clicked, role:", clickedRole);

    const logo = document.querySelector(".vastrado-logo");
    const heading = document.querySelector(".main-heading");
    const subHeading = document.querySelector(".sub-heading");

    if (logo) gsap.to(logo, { x: -100, opacity: 0, duration: 0.4 });
    if (heading) gsap.to(heading, { y: -100, opacity: 0, duration: 0.4 });
    if (subHeading) gsap.to(subHeading, { y: -100, opacity: 0, duration: 0.4 });

    cards.forEach((c, i) => {
      gsap.to(c, {
        x: i < 2 ? "-100vw" : "100vw",
        opacity: 0,
        duration: 0.7,
        onComplete: i === cards.length - 1
          ? () => loadDashboard(clickedRole)
          : null
      });
    });
  });
});

// ================= LOAD DASHBOARD =================
function loadDashboard(role) {
  // Get dashboard file based on role
  const dashboardFiles = {
    buyer: "buyer-dashboard.html",
    seller: "seller-dashboard.html",
    ngo: "ngo-dashboard.html",
    donation: "donation-dashboard.html"
  };

  const dashboardFile = dashboardFiles[role] || "buyer-dashboard.html";
  
  console.log("Loading dashboard for role:", role, "File:", dashboardFile);

  // ✅ STORE ROLE
  localStorage.setItem("role", role);

  fetch(dashboardFile)
    .then(res => res.text())
    .then(html => {
      rightHalf.innerHTML = html;

      gsap.fromTo(
        rightHalf.children,
        { opacity: 0, y: 40 },
        { opacity: 1, y: 0, duration: 0.6, stagger: 0.1 }
      );

      // ✅ Attach signup button AFTER HTML load - find by class
      const signupBtn = rightHalf.querySelector(".signup-button");
      if (signupBtn) {
        console.log("Found signup button, attaching click handler");
        signupBtn.addEventListener("click", function(e) {
          e.preventDefault();
          console.log("Signup button clicked via attached handler");
          sendOTP();
        });
      } else {
        console.log("Signup button not found!");
      }
    });
}

// ================= SEND OTP =================
async function sendOTP(roleParam) {
  const emailInput = document.getElementById("email");
  const usernameInput = document.getElementById("username");
  const storedRole = localStorage.getItem("role");
  const role = roleParam || storedRole;

  console.log("sendOTP called - Role from param:", roleParam, "Role from storage:", storedRole, "Final role:", role);

  // Persist role if passed explicitly
  if (roleParam) {
    localStorage.setItem("role", roleParam);
  }

  if (!usernameInput || !usernameInput.value.trim()) {
    alert("Enter username");
    return;
  }

  if (!emailInput || !emailInput.value.trim()) {
    alert("Enter email");
    return;
  }

  if (!role) {
    alert("Role missing - please go back and select a role");
    return;
  }

  const username = usernameInput.value.trim();
  const email = emailInput.value.trim();

  console.log("Sending OTP for:", { email, username, role });

  // ✅ SAVE FOR VERIFY.JS
  localStorage.setItem("username", username);
  localStorage.setItem("email", email);

  try {
    const res = await fetch("/send-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, role })
    });

    console.log("Response status:", res.status, res.statusText);
    console.log("Response headers:", Object.fromEntries(res.headers.entries()));
    
    // Check if response is OK
    if (!res.ok) {
      const errorText = await res.text();
      console.error("Server error response:", errorText);
      alert(`Server error (${res.status}): ${errorText || res.statusText}`);
      return;
    }
    
    // Check content type
    const contentType = res.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      const textResponse = await res.text();
      console.error("Non-JSON response:", textResponse);
      alert("Server returned non-JSON response. Please check server configuration.");
      return;
    }

    const data = await res.json();
    console.log("Send OTP response:", data);
    
    if (data.success) {
      console.log("OTP sent successfully, redirecting to verify.html");
      console.log("localStorage state:", {
        email: localStorage.getItem("email"),
        username: localStorage.getItem("username"),
        role: localStorage.getItem("role")
      });
      window.location.href = "verify.html";
    } else {
      alert(data.message || "OTP send failed - please try again");
    }
  } catch (err) {
    console.error("sendOTP error:", err);
    console.error("Error details:", err.message, err.stack);
    
    // More specific error message
    if (err instanceof SyntaxError) {
      alert("Server returned invalid response. The /send-otp endpoint may not be configured correctly.");
    } else if (err instanceof TypeError && err.message.includes("fetch")) {
      alert("Network error. Please check your connection and ensure the server is running.");
    } else {
      alert(`Error sending OTP: ${err.message}`);
    }
  }
}
