require("dotenv").config();
const express = require("express");
const nodemailer = require("nodemailer");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("PUBLIC"));

let otpStore = {}; // email → { otp, role, expiry }

// Gmail transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL,
    pass: process.env.EMAIL_PASS
  }
});

// Generate 6-digit OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000);
}

// ================= SEND OTP =================
app.post("/send-otp", async (req, res) => {
  console.log("🔥 /send-otp API CALLED");

  const { email, role } = req.body;
  console.log("EMAIL:", email, "ROLE:", role);

  if (!email || !role) {
    console.log("❌ Missing email or role");
    return res.json({ success: false });
  }

  const otp = generateOTP();
  console.log("OTP GENERATED:", otp);

  otpStore[email] = {
    otp,
    role,
    expiry: Date.now() + 5 * 60 * 1000 // 5 minutes
  };

  try {
    await transporter.sendMail({
      from: `"Vastrado" <${process.env.EMAIL}>`,
      to: email,
      subject: "Your Vastrado OTP",
      html: `<h2>Your OTP: ${otp}</h2><p>Valid for 5 minutes</p>`
    });

    console.log("✅ OTP email sent");
    res.json({ success: true });
  } catch (err) {
    console.error("❌ Email error:", err);
    res.json({ success: false });
  }
});

// ================= VERIFY OTP =================
app.post("/verify-otp", (req, res) => {
  console.log("🔐 /verify-otp API CALLED");

  const { email, otp } = req.body;
  console.log("VERIFY EMAIL:", email, "OTP:", otp);

  const data = otpStore[email];

  if (!data) {
    console.log("❌ No OTP found for email");
    return res.json({ success: false });
  }

  if (Date.now() > data.expiry) {
    console.log("❌ OTP expired");
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

// ================= START SERVER =================
app.listen(3000, () => {
  console.log("Server running on port 3000");
});
