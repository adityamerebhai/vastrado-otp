// =====================
// Simple Backend API for Cross-Device Sync
// =====================
// Run this server to enable cross-device listing sync
// Install dependencies: npm install express cors
// Run: node server.js

const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000; // Railway provides PORT environment variable

// In-memory storage (replace with database in production)
let listings = [];

app.use(cors());
app.use(express.json());

// Get all listings
app.get('/api/listings', (req, res) => {
  res.json(listings);
});

// Save/update listings
app.post('/api/listings', (req, res) => {
  listings = req.body;
  res.json({ success: true, count: listings.length });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`🚀 Vastrado API server running on http://localhost:${PORT}`);
  console.log(`📡 Endpoints:`);
  console.log(`   GET  /api/listings - Get all listings`);
  console.log(`   POST /api/listings - Save listings`);
});
