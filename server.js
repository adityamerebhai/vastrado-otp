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

// Serve static files from PUBLIC directory
app.use(express.static(path.join(__dirname, 'PUBLIC')));

// Serve static files from panel directory
app.use('/panel', express.static(path.join(__dirname, 'panel')));

// Serve root static files (if any)
app.use(express.static(__dirname));

// Get all listings
app.get('/api/listings', (req, res) => {
  res.json(listings);
});

// Save/update listings
app.post('/api/listings', (req, res) => {
  listings = req.body;
  res.json({ success: true, count: listings.length });
});

// Route handlers for panel pages
app.get('/panel/seller', (req, res) => {
  res.sendFile(path.join(__dirname, 'panel', 'seller', 'index.html'));
});

app.get('/panel/seller/', (req, res) => {
  res.sendFile(path.join(__dirname, 'panel', 'seller', 'index.html'));
});

app.get('/panel/buyer', (req, res) => {
  res.sendFile(path.join(__dirname, 'panel', 'buyer', 'index.html'));
});

app.get('/panel/buyer/', (req, res) => {
  res.sendFile(path.join(__dirname, 'panel', 'buyer', 'index.html'));
});

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
