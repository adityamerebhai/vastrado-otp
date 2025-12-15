(() => {
    const inputs = document.querySelectorAll(".otp-input");
    const verifyBtn = document.getElementById("verifyBtn");
  
    // Stop if not on verify page
    if (!inputs.length || !verifyBtn) {
      console.warn("verify.js loaded on non-verify page");
      return;
    }
  
    // Auto move & backspace
    inputs.forEach((input, index) => {
      input.addEventListener("input", () => {
        if (!/^\d$/.test(input.value)) {
          input.value = "";
          return;
        }
        if (index < inputs.length - 1) {
          inputs[index + 1].focus();
        }
      });
  
      input.addEventListener("keydown", e => {
        if (e.key === "Backspace" && !input.value && index > 0) {
          inputs[index - 1].focus();
        }
      });
    });
  
    // Paste full OTP
    inputs[0].addEventListener("paste", e => {
      const data = e.clipboardData.getData("text").trim();
      if (!/^\d{6}$/.test(data)) return;
  
      inputs.forEach((input, i) => input.value = data[i]);
      inputs[5].focus();
    });
  
    // Verify OTP
    verifyBtn.addEventListener("click", async () => {
      let otp = "";
      inputs.forEach(input => otp += input.value);
  
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
        alert("OTP Verified ✅");
  
        if (data.role === "buyer") location.href = "buyer-dashboard.html";
        if (data.role === "seller") location.href = "seller-dashboard.html";
        if (data.role === "ngo") location.href = "ngo-dashboard.html";
        if (data.role === "donation") location.href = "donation-dashboard.html";
      } else {
        alert("Invalid or expired OTP ❌");
      }
    });
  })();
  