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

  if (!email || !role) {
    return res.json({ success: false });
  }

  const otp = generateOTP();

  otpStore[email] = {
    otp,
    role,
    expiry: Date.now() + 5 * 60 * 1000
  };

  try {
    await resend.emails.send({
      from: "Vastrado <onboarding@resend.dev>",
      to: email,
      subject: "Your Vastrado OTP",
      html: `<h2>Your OTP: ${otp}</h2><p>Valid for 5 minutes</p>`
    });

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.json({ success: false });
  }
});

// ================= VERIFY OTP =================
app.post("/verify-otp", (req, res) => {
  const { email, otp } = req.body;
  const data = otpStore[email];

  if (!data) return res.json({ success: false });

  if (Date.now() > data.expiry) {
    delete otpStore[email];
    return res.json({ success: false });
  }

  if (Number(otp) === data.otp) {
    delete otpStore[email];
    return res.json({ success: true, role: data.role });
  }

  res.json({ success: false });
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
