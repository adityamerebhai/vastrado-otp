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

      // ✅ Redirect based on role (prefer panel if available)
      const role = data.role || localStorage.getItem("role");
      const panelMap = {
        buyer: "/panel/buyer/index.html",
        seller: "/panel/seller/index.html",
        ngo: "/panel/ngo/index.html",
        donation: "/panel/donation/index.html"
      };
      if (role && panelMap[role]) {
        location.href = panelMap[role];
      } else if (role) {
        location.href = `${role}-dashboard.html`;
      } else {
        location.href = "index.html";
      }

    } else {
      alert("Invalid or expired OTP");
    }
  });
})();
