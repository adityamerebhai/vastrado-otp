require("dotenv").config();
const express = require("express");
const nodemailer = require("nodemailer");
const cors = require("cors");
const path = require("path");

const app = express();

app.use(cors());
app.use(express.json());

// ✅ SERVE STATIC FILES CORRECTLY (RAILWAY SAFE)
app.use(express.static(path.join(__dirname, "PUBLIC")));

// ✅ FORCE ROOT (/) TO LOAD index.html
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "PUBLIC", "index.html"));
});

let otpStore = {}; // email → { otp, role, expiry }

// ================= MAIL TRANSPORT =================
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL,
    pass: process.env.EMAIL_PASS
  }
});

// ================= OTP GENERATOR =================
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000);
}

// ================= SEND OTP =================
app.post("/send-otp", async (req, res) => {
  console.log("🔥 /send-otp API CALLED");

  const { email, role } = req.body;

  if (!email || !role) {
    console.log("❌ Missing email or role");
    return res.json({ success: false });
  }

  const otp = generateOTP();
  console.log("OTP GENERATED:", otp);

  otpStore[email] = {
    otp,
    role,
    expiry: Date.now() + 5 * 60 * 1000
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
  const data = otpStore[email];

  if (!data) {
    console.log("❌ No OTP found");
    return res.json({ success: false });
  }

  if (Date.now() > data.expiry) {
    console.log("❌ OTP expired");
    return res.json({ success: false });
  }

  if (Number(otp) === data.otp) {
    delete otpStore[email];
    console.log("✅ OTP verified");
    return res.json({ success: true, role: data.role });
  }

  console.log("❌ OTP mismatch");
  res.json({ success: false });
});

// ================= START SERVER =================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
