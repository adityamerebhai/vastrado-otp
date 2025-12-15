(() => {
    const inputs = document.querySelectorAll(".otp-input");
    const verifyBtn = document.getElementById("verifyBtn");
  
    if (!inputs.length || !verifyBtn) return;
  
    inputs.forEach((input, index) => {
      input.addEventListener("input", () => {
        if (!/^\d$/.test(input.value)) {
          input.value = "";
          return;
        }
        if (index < inputs.length - 1) inputs[index + 1].focus();
      });
  
      input.addEventListener("keydown", e => {
        if (e.key === "Backspace" && !input.value && index > 0) {
          inputs[index - 1].focus();
        }
      });
    });
  
    verifyBtn.addEventListener("click", async () => {
      let otp = "";
      inputs.forEach(i => otp += i.value);
  
      if (otp.length !== 6) {
        alert("Enter full OTP");
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
        if (data.role === "buyer") location.href = "buyer-dashboard.html";
        if (data.role === "seller") location.href = "seller-dashboard.html";
        if (data.role === "ngo") location.href = "ngo-dashboard.html";
        if (data.role === "donation") location.href = "donation-dashboard.html";
      } else {
        alert("Invalid or expired OTP");
      }
    });
  })();
  