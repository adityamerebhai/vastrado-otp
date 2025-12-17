(() => {
  const inputs = document.querySelectorAll(".otp-input");
  const verifyBtn = document.getElementById("verifyBtn");

  if (!inputs.length || !verifyBtn) return;

  // =====================
  // OTP Input Handling - Auto cursor movement & Paste support
  // =====================
  
  inputs.forEach((input, index) => {
    // Focus first input on page load
    if (index === 0) {
      input.focus();
    }

    // Handle input - move to next on valid digit
    input.addEventListener("input", (e) => {
      const value = e.target.value;
      
      // Only allow digits
      if (!/^\d*$/.test(value)) {
        e.target.value = value.replace(/\D/g, '');
        return;
      }

      // If user typed a digit, move to next input
      if (value.length === 1 && index < inputs.length - 1) {
        inputs[index + 1].focus();
      }
    });

    // Handle keydown for backspace navigation
    input.addEventListener("keydown", (e) => {
      // Backspace - move to previous input if current is empty
      if (e.key === "Backspace") {
        if (input.value === "" && index > 0) {
          inputs[index - 1].focus();
          inputs[index - 1].value = "";
        }
      }
      
      // Arrow Left - move to previous input
      if (e.key === "ArrowLeft" && index > 0) {
        e.preventDefault();
        inputs[index - 1].focus();
      }
      
      // Arrow Right - move to next input
      if (e.key === "ArrowRight" && index < inputs.length - 1) {
        e.preventDefault();
        inputs[index + 1].focus();
      }

      // Enter key - trigger verify
      if (e.key === "Enter") {
        e.preventDefault();
        verifyBtn.click();
      }
    });

    // Handle paste - distribute digits across all inputs
    input.addEventListener("paste", (e) => {
      e.preventDefault();
      const pastedData = (e.clipboardData || window.clipboardData).getData("text");
      
      // Extract only digits from pasted content
      const digits = pastedData.replace(/\D/g, '').slice(0, 6);
      
      if (digits.length > 0) {
        // Fill inputs starting from the first one
        digits.split('').forEach((digit, i) => {
          if (i < inputs.length) {
            inputs[i].value = digit;
          }
        });
        
        // Focus the next empty input or the last one
        const nextEmptyIndex = Math.min(digits.length, inputs.length - 1);
        inputs[nextEmptyIndex].focus();
      }
    });

    // Select all text on focus for easy replacement
    input.addEventListener("focus", () => {
      input.select();
    });

    // Prevent non-numeric input
    input.addEventListener("keypress", (e) => {
      if (!/\d/.test(e.key) && e.key !== "Backspace" && e.key !== "Tab" && e.key !== "Enter") {
        e.preventDefault();
      }
    });
  });

  // =====================
  // Verify Button Click Handler
  // =====================
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
