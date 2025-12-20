const express = require("express");
const cors = require("cors");
const path = require("path");
const { Resend } = require("resend");

const app = express();

// ================= MIDDLEWARE =================
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
// Increase body parser limit to handle base64-encoded images (50MB)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ================= STATIC FILES =================
app.use(express.static(path.join(__dirname, "PUBLIC")));

// ================= ROOT =================
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

app.use("/panel", express.static(path.join(__dirname, "panel"), {
  index: false
}));

// ================= LISTINGS API =================
let listings = [];

app.get("/api/listings", (req, res) => {
  console.log(`📤 GET /api/listings - Returning ${listings.length} listings`);
  res.json(listings);
});

app.post("/api/listings", (req, res) => {
  console.log(`📥 POST /api/listings - Received request`);
  console.log(`📥 Request body type:`, typeof req.body, Array.isArray(req.body));
  console.log(`📥 Request body length:`, Array.isArray(req.body) ? req.body.length : 'not an array');
  
  if (Array.isArray(req.body)) {
    listings = req.body;
    console.log(`💾 POST /api/listings - Saved ${listings.length} listings`);
    // Log first listing if exists
    if (listings.length > 0) {
      console.log(`📦 First listing:`, JSON.stringify(listings[0]).substring(0, 100) + '...');
    }
  } else {
    console.error(`❌ POST /api/listings - Invalid data format, expected array, got:`, typeof req.body);
    listings = [];
  }
  
  res.json({ success: true, count: listings.length });
});

// =================================================
// ================= CHAT SYSTEM ===================
// =================================================

// ================= NOTIFICATIONS STORE =================
let notifications = [];

// Get notifications for a user
app.get("/api/notifications/:username", (req, res) => {
  const { username } = req.params;
  const userNotifications = notifications.filter(
    n => n.to === username && !n.read
  );
  res.json(userNotifications);
});

// Mark notification as read
app.post("/api/notifications/read", (req, res) => {
  const { id } = req.body;

  notifications = notifications.map(n =>
    n.id === id ? { ...n, read: true } : n
  );

  res.json({ success: true });
});


// 🔥 Chat store (FIXED)
let chats = {}; 
// key: buyer_seller → [{ from, text, createdAt }]
  

// ================= NGO ORDERS =================
let ngoOrders = [];

app.get("/api/ngo-orders", (req, res) => {
  console.log(`📤 GET /api/ngo-orders - Returning ${ngoOrders.length} orders`);
  res.json(ngoOrders);
});

app.post("/api/ngo-orders", (req, res) => {
  console.log(`📥 POST /api/ngo-orders - Received request`);
  console.log(`📥 Request body type:`, typeof req.body, Array.isArray(req.body));
  console.log(`📥 Request body length:`, Array.isArray(req.body) ? req.body.length : 'not an array');
  
  if (Array.isArray(req.body)) {
    ngoOrders = req.body;
    console.log(`💾 POST /api/ngo-orders - Saved ${ngoOrders.length} orders`);
    // Log first order if exists
    if (ngoOrders.length > 0) {
      console.log(`📦 First order:`, JSON.stringify(ngoOrders[0]).substring(0, 100) + '...');
    }
  } else {
    console.error(`❌ POST /api/ngo-orders - Invalid data format, expected array, got:`, typeof req.body);
    ngoOrders = [];
  }
  
  res.json({ success: true, count: ngoOrders.length });
});


// 👉 Buyer chat list
app.get("/api/chat/buyer/:buyer", (req, res) => {
  const buyer = req.params.buyer;
  const users = new Set();

  Object.keys(chats).forEach(key => {
    const [u1, u2] = key.split("_");
    if (u1 === buyer) users.add(u2);
    if (u2 === buyer) users.add(u1);
  });

  res.json([...users]);
});

// 👉 Seller chat list
app.get("/api/chat/seller/:seller", (req, res) => {
  const seller = req.params.seller;
  const users = new Set();

  Object.keys(chats).forEach(key => {
    const [u1, u2] = key.split("_");
    if (u1 === seller) users.add(u2);
    if (u2 === seller) users.add(u1);
  });

  res.json([...users]);
});

// 👉 Load messages
app.get("/api/chat/messages", (req, res) => {
  const { buyer, seller } = req.query;
  const key = [buyer, seller].sort().join("_");
  res.json(chats[key] || []);
});

// 👉 Send message
app.post("/api/chat/send", (req, res) => {
  const from = req.body.from || req.body.buyer;
  const to = req.body.to || req.body.seller;
  const text = req.body.text;

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
// ================= PAYMENTS SYSTEM ==================
// =================================================

let payments = []; // Store all payments

app.post("/api/payments", (req, res) => {
  const payment = req.body;
  if (!payment.id || !payment.buyer || !payment.seller) {
    return res.status(400).json({ success: false, message: "Invalid payment data" });
  }
  
  // Check if payment already exists
  const existingIndex = payments.findIndex(p => p.id === payment.id);
  if (existingIndex >= 0) {
    // Update existing payment
    payments[existingIndex] = { ...payments[existingIndex], ...payment };
    console.log(`💳 Updated payment ${payment.id} from ${payment.buyer} to ${payment.seller}`);
  } else {
    // Add new payment
    payments.push(payment);
    console.log(`💳 New payment ${payment.id} from ${payment.buyer} to ${payment.seller}`);
  }
  
  res.json({ success: true, payment });
});

app.get("/api/payments", (req, res) => {
  const { seller, buyer } = req.query;
  
  let filteredPayments = payments;
  
  if (seller) {
    filteredPayments = payments.filter(p => p.seller === seller);
  } else if (buyer) {
    filteredPayments = payments.filter(p => p.buyer === buyer);
  }
  
  console.log(`💳 GET /api/payments - Returning ${filteredPayments.length} payments (seller: ${seller || 'all'}, buyer: ${buyer || 'all'})`);
  res.json(filteredPayments);
});

app.put("/api/payments/:id", (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  
  const paymentIndex = payments.findIndex(p => p.id === parseInt(id));
  if (paymentIndex < 0) {
    return res.status(404).json({ success: false, message: "Payment not found" });
  }
  
  payments[paymentIndex] = { ...payments[paymentIndex], ...updates };
  console.log(`💳 Updated payment ${id}:`, updates);
  
  res.json({ success: true, payment: payments[paymentIndex] });
});

// =================================================
// ================= USERS SYSTEM ==================
// =================================================

let users = [];

// Save user
app.post("/api/users", (req, res) => {
  const { username, role, email } = req.body;
  if (!username) return res.json({ success: false });

  const exists = users.find(u => u.username === username);
  if (exists) return res.json({ success: true });

  users.push({
    username,
    role: role || "unknown",
    email: email || "",
    createdAt: new Date().toISOString()
  });

  res.json({ success: true });
});

// Get all users
app.get("/api/users", (req, res) => {
  res.json(users);
});

// Delete user
app.delete("/api/users/:username", (req, res) => {
  const { username } = req.params;
  users = users.filter(u => u.username !== username);
  res.json({ success: true });
});

// ================= START SERVER =================
const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log("🚀 Server running on port", PORT);
});
