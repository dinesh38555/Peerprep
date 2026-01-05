const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../db");
const JWT_SECRET = process.env.JWT_SECRET;

// -----------------------------
// Signup (after OTP verification)
// -----------------------------
const { otpStore } = require("./otpController"); // export otpStore from otpController

exports.signup = async (req, res) => {
  const { username, first_name, last_name, email, user_password, user_role, otp } = req.body;

  try {
    if (!username || !first_name || !last_name || !email || !user_password || !otp) {
      return res.status(400).json({ error: "All fields including OTP are required" });
    }

    const record = otpStore[email];
    if (!record || Date.now() > record.expiresAt) {
      return res.status(400).json({ error: "OTP expired or not found" });
    }
    if (record.otp.toString() !== otp.toString()) {
      return res.status(400).json({ error: "Invalid OTP" });
    }

    // delete OTP once verified
    delete otpStore[email];

    const [existingUser] = await db.query(
      "SELECT * FROM users WHERE email = ? OR username = ?",
      [email, username]
    );
    if (existingUser.length > 0) {
      return res.status(400).json({ error: "Username or email already exists" });
    }

    const hashedPassword = await bcrypt.hash(user_password, 10);
    await db.query(
      `INSERT INTO users (username, first_name, last_name, email, user_password, user_role)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [username, first_name, last_name, email, hashedPassword, user_role || "Student"]
    );

    res.status(201).json({ message: "Signup successful" });
  } catch (error) {
    console.error("Signup Error:", error);
    res.status(500).json({ error: "Signup failed" });
  }
};


// -----------------------------
// Login
// -----------------------------
const { sendOTP } = require("./otpController");

exports.login = async (req, res) => {
  const { usernameOrEmail, user_password, otp } = req.body;
  if (!usernameOrEmail || !user_password) {
    return res.status(400).json({ error: "Username/Email and password required" });
  }

  const [results] = await db.query(
    "SELECT * FROM users WHERE email = ? OR username = ?",
    [usernameOrEmail, usernameOrEmail]
  );

  if (results.length === 0) return res.status(401).json({ error: "User not found" });

  const user = results[0];
  const valid = await bcrypt.compare(user_password, user.user_password);
  if (!valid) return res.status(401).json({ error: "Invalid credentials" });

  // Step 1: Send OTP if not provided yet
  if (!otp) {
    await sendOTP({ body: { email: user.email } }, { json: (m) => console.log("OTP sent", m) });
    return res.status(200).json({ message: "OTP sent to your email. Please verify OTP to continue." });
  }

  // Step 2: Verify OTP
  const record = otpStore[user.email];
  if (!record || Date.now() > record.expiresAt) {
    return res.status(400).json({ error: "OTP expired or not found" });
  }
  if (record.otp.toString() !== otp.toString()) {
    return res.status(400).json({ error: "Invalid OTP" });
  }
  delete otpStore[user.email];

  // Step 3: Issue JWT
  const token = jwt.sign({ id: user.user_id }, JWT_SECRET, { expiresIn: "7d" });
  res.json({
    message: "Login successful",
    token,
    user: {
      user_id: user.user_id,
      username: user.username,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      user_role: user.user_role,
    },
  });
};
