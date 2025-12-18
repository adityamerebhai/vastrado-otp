// =====================
// Simple Backend API for Cross-Device Sync
// =====================
// Run this server to enable cross-device listing sync
// Install dependencies: npm install express cors
// Run: node server.js

const express = require('express');
const cors = require('cors');
const path = require('path');
const nodemailer = require('nodemailer');
const app = express();
const PORT = process.env.PORT || 3000; // Railway provides PORT environment variable

// In-memory storage (replace with database in production)
let listings = [];

app.use(cors());
app.use(express.json());

// Email configuration
// Use environment variables for email credentials
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER || process.env.EMAIL_USER,
    pass: process.env.SMTP_PASS || process.env.EMAIL_PASS
  }
});

// Verify email configuration
transporter.verify(function(error, success) {
  if (error) {
    console.log('⚠️ Email server not configured:', error.message);
    console.log('💡 Set SMTP_USER and SMTP_PASS environment variables to enable email sending');
  } else {
    console.log('✅ Email server is ready to send messages');
  }
});

// OTP endpoints (MUST come before static files and other routes)
// In-memory storage for OTPs (replace with database in production)
const otpStore = new Map();

app.post('/send-otp', async (req, res) => {
  try {
    const { email, role } = req.body;
    
    console.log(`📧 Sending OTP request for: ${email}, role: ${role || 'buyer'}`);
    
    if (!email) {
      console.log('❌ Email missing in request');
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
    
    console.log(`✅ OTP generated for ${email}: ${otp} (Role: ${role || 'buyer'})`);
    
    // Send OTP via email
    try {
      const mailOptions = {
        from: process.env.SMTP_USER || process.env.EMAIL_USER || 'noreply@vastrado.com',
        to: email,
        subject: 'Your Vastrado OTP Verification Code',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #f7b731;">Vastrado OTP Verification</h2>
            <p>Hello,</p>
            <p>Your OTP verification code is:</p>
            <div style="background: #f7b731; color: white; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; border-radius: 8px; margin: 20px 0;">
              ${otp}
            </div>
            <p>This code will expire in 5 minutes.</p>
            <p>If you didn't request this code, please ignore this email.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="color: #999; font-size: 12px;">© Vastrado - All rights reserved</p>
          </div>
        `
      };
      
      const info = await transporter.sendMail(mailOptions);
      console.log(`✅ OTP email sent successfully to ${email}:`, info.messageId);
      
      res.json({ 
        success: true, 
        message: 'OTP sent successfully to your email'
      });
    } catch (emailError) {
      console.error('❌ Error sending email:', emailError);
      // Still return success and include OTP in response if email fails
      // This allows testing even without email configured
      res.json({ 
        success: true, 
        message: 'OTP generated (email sending failed - check server logs)',
        otp: otp // Include OTP in response if email fails
      });
    }
  } catch (error) {
    console.error('❌ Error sending OTP:', error);
    res.status(500).json({ success: false, message: 'Failed to send OTP' });
  }
});

app.post('/verify-otp', (req, res) => {
  try {
    const { email, otp } = req.body;
    
    console.log(`🔐 Verifying OTP for ${email}: ${otp}`);
    
    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Email and OTP are required' });
    }
    
    const stored = otpStore.get(email);
    
    if (!stored) {
      console.log(`❌ OTP not found for ${email}`);
      return res.json({ success: false, message: 'OTP not found or expired' });
    }
    
    if (Date.now() > stored.expiresAt) {
      console.log(`❌ OTP expired for ${email}`);
      otpStore.delete(email);
      return res.json({ success: false, message: 'OTP expired' });
    }
    
    if (stored.otp !== otp) {
      console.log(`❌ Invalid OTP for ${email}. Expected: ${stored.otp}, Got: ${otp}`);
      return res.json({ success: false, message: 'Invalid OTP' });
    }
    
    // OTP verified - remove it
    otpStore.delete(email);
    console.log(`✅ OTP verified successfully for ${email}, role: ${stored.role}`);
    
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
    
    console.log(`📧 OTP generated for ${email}: ${otp} (Role: ${role || 'buyer'})`);
    console.log(`💡 In production, send this OTP via email service`);
    
    // In production, send OTP via email service here
    // For demo purposes, we'll just return success
    // The OTP will be visible in server logs for testing
    
    res.json({ 
      success: true, 
      message: 'OTP sent successfully',
      // For demo: include OTP in response (remove in production!)
      otp: otp // REMOVE THIS IN PRODUCTION - only for testing
    });
  } catch (error) {
    console.error('Error sending OTP:', error);
    res.status(500).json({ success: false, message: 'Failed to send OTP' });
  }
});

app.post('/verify-otp', (req, res) => {
  try {
    const { email, otp } = req.body;
    
    console.log(`🔐 Verifying OTP for ${email}: ${otp}`);
    
    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Email and OTP are required' });
    }
    
    const stored = otpStore.get(email);
    
    if (!stored) {
      console.log(`❌ OTP not found for ${email}`);
      return res.json({ success: false, message: 'OTP not found or expired' });
    }
    
    if (Date.now() > stored.expiresAt) {
      console.log(`❌ OTP expired for ${email}`);
      otpStore.delete(email);
      return res.json({ success: false, message: 'OTP expired' });
    }
    
    if (stored.otp !== otp) {
      console.log(`❌ Invalid OTP for ${email}. Expected: ${stored.otp}, Got: ${otp}`);
      return res.json({ success: false, message: 'Invalid OTP' });
    }
    
    // OTP verified - remove it
    otpStore.delete(email);
    console.log(`✅ OTP verified successfully for ${email}, role: ${stored.role}`);
    
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
