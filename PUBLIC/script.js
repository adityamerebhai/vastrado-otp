// ================= SELECT ELEMENTS =================
const cards = document.querySelectorAll(".card");
const rightHalf = document.querySelector(".right-half");

// ================= CARD CLICK + ANIMATION =================
cards.forEach((clickedCard, clickedIndex) => {
  clickedCard.addEventListener("click", () => {

    const logo = document.querySelector(".vastrado-logo");
    const heading = document.querySelector(".main-heading");
    const subHeading = document.querySelector(".sub-heading");

    // Hide header elements safely
    if (logo) {
      gsap.to(logo, {
        x: -100,
        opacity: 0,
        duration: 0.5,
        onComplete: () => (logo.style.display = "none")
      });
    }

    if (heading) {
      gsap.to(heading, {
        y: -100,
        opacity: 0,
        duration: 0.5,
        onComplete: () => (heading.style.display = "none")
      });
    }

    if (subHeading) {
      gsap.to(subHeading, {
        y: -100,
        opacity: 0,
        duration: 0.5,
        onComplete: () => (subHeading.style.display = "none")
      });
    }

    // Animate cards out
    gsap.to(cards[0], { x: "-100vw", opacity: 0, duration: 0.8 });
    gsap.to(cards[1], { x: "-100vw", opacity: 0, duration: 0.8 });
    gsap.to(cards[2], { x: "100vw", opacity: 0, duration: 0.8 });
    gsap.to(cards[3], {
      x: "100vw",
      opacity: 0,
      duration: 0.8,
      onComplete: () => loadDashboard(clickedIndex)
    });
  });
});

// ================= LOAD DASHBOARD =================
function loadDashboard(index) {
  let dashboardFile = "";
  let role = "";

  if (index === 0) {
    dashboardFile = "buyer-dashboard.html";
    role = "buyer";
  } else if (index === 1) {
    dashboardFile = "seller-dashboard.html";
    role = "seller";
  } else if (index === 2) {
    dashboardFile = "ngo-dashboard.html";
    role = "ngo";
  } else if (index === 3) {
    dashboardFile = "donation-dashboard.html";
    role = "donation";
  }

  // Save role globally
  localStorage.setItem("role", role);

  // Load dashboard HTML
  fetch(dashboardFile)
    .then(res => res.text())
    .then(html => {
      rightHalf.innerHTML = html;

      gsap.fromTo(
        rightHalf.children,
        { opacity: 0, y: 50 },
        { opacity: 1, y: 0, duration: 0.8, stagger: 0.15 }
      );
    });
}

// ================= SEND OTP =================
async function sendOTP() {
  const emailInput = document.getElementById("email");
  if (!emailInput) {
    alert("Email input not found");
    return;
  }

  const email = emailInput.value.trim();
  const role = localStorage.getItem("role");

  if (!email || !role) {
    alert("Email or role missing");
    return;
  }

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
