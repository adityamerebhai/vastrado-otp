(() => {
  const inputs = document.querySelectorAll(".otp-input");
  const verifyBtn = document.getElementById("verifyBtn");

  if (!inputs.length || !verifyBtn) return;

  verifyBtn.addEventListener("click", async () => {
    let otp = "";
    inputs.forEach(i => otp += i.value);

    if (otp.length !== 6) {
      alert("Enter complete OTP");
      return;
    }

    const email = localStorage.getItem("email");

    const res = await fetch("/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, otp })
    });

    const data = await res.json();

    // ================= ORIGINAL BLOCK (DO NOT TOUCH LOGIC) =================
    if (data.success) {

      // ✅ PROFILE ADDITION (SAFE)
      const username = localStorage.getItem("username");
      if (username) {
        await fetch("/create-profile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username })
        });
        localStorage.setItem("loggedIn", "true");
      }

      // ✅ ORIGINAL REDIRECTS (UNCHANGED)
      if (data.role === "buyer") location.href = "buyer-dashboard.html";
      if (data.role === "seller") location.href = "seller-dashboard.html";
      if (data.role === "ngo") location.href = "ngo-dashboard.html";
      if (data.role === "donation") location.href = "donation-dashboard.html";

    } else {
      alert("Invalid or expired OTP");
    }
  });
})();
