
const express = require("express");
const cors = require("cors");
const path = require("path");
const { Resend } = require("resend");

const app = express();

// ================= MIDDLEWARE =================
app.use(cors());
app.use(express.json());

// ================= STATIC FILES =================
app.use(express.static(path.join(__dirname, "PUBLIC")));

// ================= ROOT =================
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "PUBLIC", "index.html"));
});

// ================= RESEND =================
const resend = new Resend(process.env.RESEND_API_KEY);

// ================= OTP STORE =================
// email → { otp, role, expiry }
let otpStore = {};

// ================= OTP GENERATOR =================
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000);
}

// ================= SEND OTP =================
app.post("/send-otp", async (req, res) => {
  console.log("🔥 /send-otp called");

  const { email, role } = req.body;

  if (!email || !role) {
    console.log("❌ Missing email or role");
    return res.json({ success: false });
  }

  const otp = generateOTP();

  otpStore[email] = {
    otp,
    role,
    expiry: Date.now() + 5 * 60 * 1000 // 5 minutes
  };

  console.log("🔐 OTP GENERATED:", otp);

  try {
    await resend.emails.send({
      from: "Vastrado <onboarding@resend.dev>",
      to: email,
      subject: "Your Vastrado OTP",
      html: `
        <h2>Your OTP: ${otp}</h2>
        <p>This OTP is valid for 5 minutes.</p>
      `
    });

    console.log("✅ OTP sent");
    res.json({ success: true });

  } catch (err) {
    console.error("❌ Resend error:", err);
    res.json({ success: false });
  }
});

// ================= VERIFY OTP =================
app.post("/verify-otp", (req, res) => {
  console.log("🔐 /verify-otp called");

  const { email, otp } = req.body;
  const data = otpStore[email];

  if (!data) {
    console.log("❌ OTP not found");
    return res.json({ success: false });
  }

  if (Date.now() > data.expiry) {
    console.log("❌ OTP expired");
    delete otpStore[email];
    return res.json({ success: false });
  }

  if (Number(otp) === data.otp) {
    console.log("✅ OTP verified");
    delete otpStore[email];
    return res.json({ success: true, role: data.role });
  }

  console.log("❌ OTP mismatch");
  res.json({ success: false });
});

// ================= CREATE PROFILE =================
app.post("/create-profile", (req, res) => {
  console.log("👤 /create-profile called");
  const { username } = req.body;
  // In production, create user profile in database
  // For demo, just return success
  res.json({ success: true, message: "Profile created" });
});

// ================= PANEL ROUTES =================
app.get("/panel/buyer", (req, res) => {
  res.sendFile(path.join(__dirname, "panel", "buyer", "index.html"));
});

app.get("/panel/buyer/", (req, res) => {
  res.sendFile(path.join(__dirname, "panel", "buyer", "index.html"));
});

app.get("/panel/buyer/index.html", (req, res) => {
  res.sendFile(path.join(__dirname, "panel", "buyer", "index.html"));
});

app.get("/panel/seller", (req, res) => {
  res.sendFile(path.join(__dirname, "panel", "seller", "index.html"));
});

app.get("/panel/seller/", (req, res) => {
  res.sendFile(path.join(__dirname, "panel", "seller", "index.html"));
});

app.get("/panel/seller/index.html", (req, res) => {
  res.sendFile(path.join(__dirname, "panel", "seller", "index.html"));
});

// ================= STATIC FILES FOR PANEL =================
app.use("/panel", express.static(path.join(__dirname, "panel"), {
  index: false
}));

// ================= API ROUTES FOR LISTINGS =================
let listings = [];

app.get("/api/listings", (req, res) => {
  console.log(`📥 GET /api/listings - Returning ${listings.length} listings`);
  res.json(listings);
});

app.post("/api/listings", (req, res) => {
  listings = req.body;
  console.log(`📤 POST /api/listings - Received ${Array.isArray(listings) ? listings.length : 0} listings`);
  res.json({ success: true, count: Array.isArray(listings) ? listings.length : 0 });
});

// ================= CHAT APIs =================

// Send message
app.post("/api/chat/send", (req, res) => {
  const { from, to, text } = req.body;
  if (!from || !to || !text) {
    return res.json({ success: false });
  }

  const chatKey = [from, to].sort().join("_");

  if (!chats[chatKey]) chats[chatKey] = [];

  chats[chatKey].push({
    sender: from,
    text,
    timestamp: new Date().toISOString()
  });

  res.json({ success: true });
});

// Get chat messages
app.get("/api/chat/:user1/:user2", (req, res) => {
  const { user1, user2 } = req.params;
  const chatKey = [user1, user2].sort().join("_");
  res.json(chats[chatKey] || []);
});

// ================= START SERVER =================
const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log("🚀 Server running on port", PORT);
});
