const cards = document.querySelectorAll('.card');
const rightHalf = document.querySelector('.right-half');

cards.forEach((clickedCard, clickedIndex) => {
    clickedCard.addEventListener('click', () => {
        // Animate out existing elements
        gsap.to(document.querySelector('.vastrado-logo'), { x: -100, opacity: 0, duration: 0.5, ease: "power2.in", onComplete: () => document.querySelector('.vastrado-logo').style.display = 'none' });
        gsap.to(document.querySelector('.main-heading'), { y: -100, opacity: 0, duration: 0.5, ease: "power2.in", onComplete: () => document.querySelector('.main-heading').style.display = 'none' });
        gsap.to(document.querySelector('.sub-heading'), { y: -100, opacity: 0, duration: 0.5, ease: "power2.in", onComplete: () => document.querySelector('.sub-heading').style.display = 'none' });
        gsap.to(cards[0], { x: "-100vw", opacity: 0, duration: 0.8, ease: "power2.in", onComplete: () => cards[0].style.display = 'none' });
        gsap.to(cards[1], { x: "-100vw", opacity: 0, duration: 0.8, ease: "power2.in", onComplete: () => cards[1].style.display = 'none' });
        gsap.to(cards[2], { x: "100vw", opacity: 0, duration: 0.8, ease: "power2.in", onComplete: () => cards[2].style.display = 'none' });
        gsap.to(cards[3], { x: "100vw", opacity: 0, duration: 0.8, ease: "power2.in", onComplete: () => {
            cards[3].style.display = 'none'; // Ensure the last card is hidden

            // Display new content
            rightHalf.innerHTML = ''; // Clear existing content
            let dashboardFile = '';
            if (clickedIndex === 0) {
                dashboardFile = 'buyer-dashboard.html';
            } else if (clickedIndex === 1) {
                dashboardFile = 'seller-dashboard.html';
            } else if (clickedIndex === 2) {
                dashboardFile = 'ngo-dashboard.html';
            } else if (clickedIndex === 3) {
                dashboardFile = 'donation-dashboard.html';
            }

            fetch(dashboardFile)
                .then(response => response.text())
                .then(html => {
                    rightHalf.innerHTML = html;
                    gsap.fromTo(rightHalf.children, { opacity: 0, y: 50 }, { opacity: 1, y: 0, duration: 0.8, stagger: 0.2, ease: "power2.out" });

                    // Add event listener for the new back button
                    const backButton = document.querySelector('.back-button');
                    if (backButton) {
                        backButton.addEventListener('click', () => {
                            location.reload(); // Simple reload to go back to initial state
                        });
                    }
                });
        }});
    });
});



async function sendOTP(role) {
    const email = document.getElementById("email").value;
    localStorage.setItem("email", email);
  
    const res = await fetch("/send-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, role })
    });
  
    const data = await res.json();
    if (data.success) location.href = "verify.html";
    else alert("OTP send failed");
  }


  document.querySelectorAll(".card").forEach(card => {
    card.addEventListener("click", () => {
      const role = card.getAttribute("data-role");
  
      console.log("Role selected:", role);
  
      localStorage.setItem("role", role);
      window.location.href = role + "-dashboard.html";
    });
  });