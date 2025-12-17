require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const { Resend } = require("resend");

const app = express();

// ================= MIDDLEWARE =================
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "PUBLIC")));
app.use("/panel", express.static(path.join(__dirname, "panel")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "PUBLIC", "index.html"));
});

// ================= RESEND =================
const resend = new Resend(process.env.RESEND_API_KEY);

// ================= OTP STORE =================
let otpStore = {};

// ================= OTP GENERATOR =================
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000);
}

// ================= SEND OTP =================
app.post("/send-otp", async (req, res) => {
  const { email, role } = req.body;

  console.log("📧 Send OTP request:", { email, role });

  if (!email || !role) {
    console.log("❌ Missing email or role");
    return res.json({ success: false, error: "Missing email or role" });
  }

  const otp = generateOTP();

  otpStore[email] = {
    otp,
    role,
    expiry: Date.now() + 5 * 60 * 1000
  };

  console.log("✅ OTP stored for", email, "- Role:", role, "- OTP:", otp);
  console.log("📦 Current otpStore keys:", Object.keys(otpStore));

  try {
    await resend.emails.send({
      from: "Vastrado <onboarding@resend.dev>",
      to: email,
      subject: "Your Vastrado OTP",
      html: `<h2>Your OTP: ${otp}</h2><p>Valid for 5 minutes</p>`
    });

    console.log("📬 Email sent successfully to", email);
    res.json({ success: true });
  } catch (err) {
    console.error("❌ Email send error:", err);
    res.json({ success: false, error: "Email send failed" });
  }
});

// ================= VERIFY OTP =================
app.post("/verify-otp", (req, res) => {
  const { email, otp } = req.body;
  
  console.log("🔐 Verify OTP request:", { email, otp });
  console.log("📦 Current otpStore keys:", Object.keys(otpStore));
  
  const data = otpStore[email];

  if (!data) {
    console.log("❌ No OTP found for email:", email);
    return res.json({ success: false, error: "No OTP found for this email" });
  }

  console.log("📋 Stored data for", email, ":", { storedOTP: data.otp, role: data.role, expiry: new Date(data.expiry).toISOString() });

  if (Date.now() > data.expiry) {
    console.log("❌ OTP expired for", email);
    delete otpStore[email];
    return res.json({ success: false, error: "OTP expired" });
  }

  if (Number(otp) === data.otp) {
    console.log("✅ OTP verified successfully for", email, "- Role:", data.role);
    delete otpStore[email];
    return res.json({ success: true, role: data.role });
  }

  console.log("❌ OTP mismatch for", email, "- Entered:", otp, "Expected:", data.otp);
  res.json({ success: false, error: "Invalid OTP" });
});

// ================= START =================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("🚀 Server running on port", PORT);
});


// ================= PROFILE (USERNAME ONLY – PROTOTYPE) =================

// In-memory store (resets if server restarts – OK for prototype)
const profiles = {}; // username -> { username, createdAt }

app.post("/create-profile", (req, res) => {
  const { username } = req.body;

  if (!username) {
    return res.json({ success: false, message: "Username required" });
  }

  // Optional: prevent duplicate usernames
  if (profiles[username]) {
    return res.json({ success: false, message: "Username already exists" });
  }

  profiles[username] = {
    username,
    createdAt: Date.now()
  };

  console.log("👤 Profile created:", username);
  res.json({ success: true });
});
