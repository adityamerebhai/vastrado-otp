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
  console.log(`📄 Static Files:`);
  console.log(`   /panel/seller - Seller dashboard`);
  console.log(`   /panel/buyer - Buyer dashboard`);
  console.log(`   /PUBLIC/* - Public files`);
});
