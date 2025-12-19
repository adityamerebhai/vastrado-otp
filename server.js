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
  const { email, role } = req.body;
  if (!email || !role) return res.json({ success: false });

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
      html: `<h2>Your OTP: ${otp}</h2>`
    });
    res.json({ success: true });
  } catch {
    res.json({ success: false });
  }
});

// ================= VERIFY OTP =================
app.post("/verify-otp", (req, res) => {
  const { email, otp } = req.body;
  const data = otpStore[email];

  if (!data || Date.now() > data.expiry) {
    return res.json({ success: false });
  }

  if (Number(otp) === data.otp) {
    delete otpStore[email];
    return res.json({ success: true, role: data.role });
  }

  res.json({ success: false });
});

// ================= CREATE PROFILE =================
app.post("/create-profile", (req, res) => {
  res.json({ success: true });
});

// ================= PANEL ROUTES =================
app.get("/panel/buyer", (req, res) => {
  res.sendFile(path.join(__dirname, "panel", "buyer", "index.html"));
});

app.get("/panel/seller", (req, res) => {
  res.sendFile(path.join(__dirname, "panel", "seller", "index.html"));
});

app.use("/panel", express.static(path.join(__dirname, "panel"), { index: false }));

// ================= LISTINGS API =================
let listings = [];

app.get("/api/listings", (req, res) => {
  res.json(listings);
});

app.post("/api/listings", (req, res) => {
  listings = req.body;
  res.json({ success: true });
});

// =================================================
// ================= CHAT FIX START =================
// =================================================

// 🔥 MISSING STORE (THIS WAS THE MAIN BUG)
let chats = {}; 
// key: buyer_seller → [{ from, text, createdAt }]

// 👉 Get chat users for buyer
app.get("/api/chat/buyer/:buyer", (req, res) => {
  const buyer = req.params.buyer;
  const users = new Set();

  Object.keys(chats).forEach(key => {
    if (key.startsWith(buyer + "_")) {
      users.add(key.split("_")[1]);
    }
  });

  res.json([...users]);
});

// 👉 Get messages (USED BY BUYER SCRIPT)
app.get("/api/chat/messages", (req, res) => {
  const { buyer, seller } = req.query;
  const key = [buyer, seller].sort().join("_");
  res.json(chats[key] || []);
});

// 👉 Send message
app.post("/api/chat/send", (req, res) => {
  const { from, to, text } = req.body;
  if (!from || !to || !text) {
    return res.status(400).json({ success: false });
  }

  const key = [from, to].sort().join("_");

  if (!chats[key]) chats[key] = [];

  chats[key].push({
    from,
    text,
    createdAt: new Date().toISOString()
  });

  res.json({ success: true });
});

// =================================================
// ================= CHAT FIX END ===================
// =================================================

// ================= START SERVER =================
const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log("🚀 Server running on port", PORT);
});
