// ================= SELECT ELEMENTS =================
const cards = document.querySelectorAll(".card");
const rightHalf = document.querySelector(".right-half");

let isAnimating = false;

// ================= CARD CLICK + ANIMATION =================
cards.forEach((card, index) => {
  card.addEventListener("click", () => {
    if (isAnimating) return;
    isAnimating = true;

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
          ? () => loadDashboard(index)
          : null
      });
    });
  });
});

// ================= LOAD DASHBOARD =================
function loadDashboard(index) {
  let dashboardFile = "";
  let role = "";

  if (index === 0) { dashboardFile = "buyer-dashboard.html"; role = "buyer"; }
  if (index === 1) { dashboardFile = "seller-dashboard.html"; role = "seller"; }
  if (index === 2) { dashboardFile = "ngo-dashboard.html"; role = "ngo"; }
  if (index === 3) { dashboardFile = "donation-dashboard.html"; role = "donation"; }

  // ✅ ROLE IS STORED HERE (VERY IMPORTANT)
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

      // ✅ Attach signup button AFTER HTML load
      const signupBtn = document.getElementById("signupBtn");
      if (signupBtn) signupBtn.addEventListener("click", sendOTP);
    });
}

// ================= SEND OTP =================
async function sendOTP() {
  const emailInput = document.getElementById("email");
  const role = localStorage.getItem("role");

  if (!emailInput || !emailInput.value.trim()) {
    alert("Enter email");
    return;
  }

  if (!role) {
    alert("Role missing");
    return;
  }

  const email = emailInput.value.trim();
  localStorage.setItem("email", email);

  try {
    const res = await fetch("/send-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, role })
    });

    const data = await res.json();
    if (data.success) {
      window.location.href = "verify.html";
    } else {
      alert("OTP send failed");
    }
  } catch (err) {
    console.error(err);
    alert("Server error");
  }
}
