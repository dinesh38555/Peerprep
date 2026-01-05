const nodemailer = require("nodemailer");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const db = require("../db");

let otpStore = {}; // Temporary in-memory storage

// -----------------------------
// Send OTP
// -----------------------------
const sendOTP = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email required" });

    const [user] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
    if (user.length === 0) {
      return res.status(404).json({ message: "User not found." });
    }

    const otp = crypto.randomInt(100000, 999999);
    otpStore[email] = { otp, expiresAt: Date.now() + 5 * 60 * 1000 };

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: `"PeerPrep" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "PeerPrep - Verify your email",
      text: `Your OTP is ${otp}\nIt will expire in 5 minutes.`,
    };

    await transporter.sendMail(mailOptions);
    res.json({ message: "OTP sent successfully" });
  } catch (err) {
    console.error("OTP Send Error:", err);
    res.status(500).json({ message: "Failed to send OTP" });
  }
};

// -----------------------------
// Verify OTP
// -----------------------------
const verifyOTP = (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) {
    return res.status(400).json({ success: false, message: "Email and OTP required" });
  }

  const record = otpStore[email];
  if (!record) {
    return res.status(400).json({ success: false, message: "No OTP found or expired" });
  }
  if (Date.now() > record.expiresAt) {
    return res.status(400).json({ success: false, message: "OTP expired." });
  }
  if (record.otp.toString() !== otp.toString()) {
    return res.status(400).json({ success: false, message: "Invalid OTP." });
  }

  delete otpStore[email];
  return res.json({ success: true, message: "OTP verified successfully" });
};

// -----------------------------
// Reset Password
// -----------------------------
const resetPassword = async (req, res) => {
  const { email, otp, newPassword } = req.body;

  // Validate input
  if (!email || !otp || !newPassword) {
    return res.status(400).json({ message: "All fields are required." });
  }

  const record = otpStore[email];
  if (!record || Date.now() > record.expiresAt) {
    return res.status(400).json({ message: "OTP expired or not found." });
  }
  if (record.otp.toString() !== otp.toString()) {
    return res.status(400).json({ message: "Invalid OTP." });
  }

  // Validate password strength
  const passwordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])[A-Za-z\d!@#$%^&*(),.?":{}|<>]{8,}$/;
  if (!passwordRegex.test(newPassword)) {
    return res.status(400).json({
      message: "Password must include uppercase, lowercase, number, and special character.",
    });
  }

  // Update password in the database
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await db.query("UPDATE users SET user_password = ? WHERE email = ?", [hashedPassword, email]);

  // Clear OTP after successful reset
  delete otpStore[email];

  res.status(200).json({ message: "Password reset successfully." });
};

// -----------------------------
// Auto cleanup expired OTPs every 10 min
// -----------------------------
setInterval(() => {
  const now = Date.now();
  for (const email in otpStore) {
    if (otpStore[email].expiresAt < now) {
      delete otpStore[email];
    }
  }
}, 10 * 60 * 1000);

// ✅ Export functions and otpStore
module.exports = { sendOTP, verifyOTP, resetPassword, otpStore };
