const express = require("express");
const router = express.Router();
const verifyToken = require("../../middleware/authMiddleware");
const { signup, login } = require("../../controllers/authController");
const { sendOTP, verifyOTP, resetPassword } = require("../../controllers/otpController");

// OTP routes
router.post("/send-otp", sendOTP);
router.post("/verify-otp", verifyOTP);
router.post("/reset-password", resetPassword);

// Auth routes
router.post("/signup", signup);
router.post("/login", login);

// Protected route example
router.get("/profile", verifyToken, (req, res) => {
  res.json({
    message: "Protected route accessed successfully!",
    user_id: req.user.id,
  });
});

module.exports = router;
