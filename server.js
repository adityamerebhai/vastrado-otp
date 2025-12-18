// =====================
// Simple Backend API for Cross-Device Sync
// =====================
// Run this server to enable cross-device listing sync
// Install dependencies: npm install express cors
// Run: node server.js

const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000; // Railway provides PORT environment variable

// In-memory storage (replace with database in production)
let listings = [];

app.use(cors());
app.use(express.json());

// OTP endpoints (MUST come before static files and other routes)
// In-memory storage for OTPs (replace with database in production)
const otpStore = new Map();

app.post('/send-otp', (req, res) => {
  try {
    const { email, role } = req.body;
    
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }
    
    // Generate a 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store OTP with expiration (5 minutes)
    otpStore.set(email, {
      otp,
      role: role || 'buyer',
      expiresAt: Date.now() + 5 * 60 * 1000 // 5 minutes
    });
    
    console.log(`OTP generated for ${email}: ${otp}`);
    
    res.json({ 
      success: true, 
      message: 'OTP sent successfully'
    });
  } catch (error) {
    console.error('Error sending OTP:', error);
    res.status(500).json({ success: false, message: 'Failed to send OTP' });
  }
});

app.post('/verify-otp', (req, res) => {
  try {
    const { email, otp } = req.body;
    
    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Email and OTP are required' });
    }
    
    const stored = otpStore.get(email);
    
    if (!stored) {
      return res.json({ success: false, message: 'OTP not found or expired' });
    }
    
    if (Date.now() > stored.expiresAt) {
      otpStore.delete(email);
      return res.json({ success: false, message: 'OTP expired' });
    }
    
    if (stored.otp !== otp) {
      return res.json({ success: false, message: 'Invalid OTP' });
    }
    
    // OTP verified - remove it
    otpStore.delete(email);
    
    res.json({ 
      success: true, 
      message: 'OTP verified successfully',
      role: stored.role
    });
  } catch (error) {
    console.error('Error verifying OTP:', error);
    res.status(500).json({ success: false, message: 'Failed to verify OTP' });
  }
});

app.post('/create-profile', (req, res) => {
  try {
    const { username } = req.body;
    console.log(`👤 Creating profile for: ${username}`);
    
    // In production, create user profile in database
    // For demo, just return success
    res.json({ success: true, message: 'Profile created' });
  } catch (error) {
    console.error('Error creating profile:', error);
    res.status(500).json({ success: false, message: 'Failed to create profile' });
  }
});

// API routes (must come before static files)
app.get('/api/listings', (req, res) => {
  console.log(`📥 GET /api/listings - Returning ${listings.length} listings`);
  res.json(listings);
});

app.post('/api/listings', (req, res) => {
  listings = req.body;
  console.log(`📤 POST /api/listings - Received ${Array.isArray(listings) ? listings.length : 0} listings`);
  res.json({ success: true, count: Array.isArray(listings) ? listings.length : 0 });
});

// Route handlers for panel pages (must come before static middleware)
app.get('/panel/seller', (req, res) => {
  res.sendFile(path.join(__dirname, 'panel', 'seller', 'index.html'));
});

app.get('/panel/seller/', (req, res) => {
  res.sendFile(path.join(__dirname, 'panel', 'seller', 'index.html'));
});

app.get('/panel/seller/index.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'panel', 'seller', 'index.html'));
});

app.get('/panel/buyer', (req, res) => {
  res.sendFile(path.join(__dirname, 'panel', 'buyer', 'index.html'));
});

app.get('/panel/buyer/', (req, res) => {
  res.sendFile(path.join(__dirname, 'panel', 'buyer', 'index.html'));
});

app.get('/panel/buyer/index.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'panel', 'buyer', 'index.html'));
});

// Serve static files from panel directory (CSS, JS files)
app.use('/panel', express.static(path.join(__dirname, 'panel'), {
  index: false // Don't serve index.html automatically
}));

// Serve static files from PUBLIC directory
app.use(express.static(path.join(__dirname, 'PUBLIC')));

// Serve root static files (if any)
app.use(express.static(__dirname));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`🚀 Vastrado API server running on port ${PORT}`);
  console.log(`📡 API Endpoints:`);
  console.log(`   GET  /api/listings - Get all listings`);
  console.log(`   POST /api/listings - Save listings`);
  console.log(`   POST /send-otp - Send OTP`);
  console.log(`   POST /verify-otp - Verify OTP`);
  console.log(`📄 Static Files:`);
  console.log(`   /panel/seller - Seller dashboard`);
  console.log(`   /panel/buyer - Buyer dashboard`);
  console.log(`   /PUBLIC/* - Public files`);
});
