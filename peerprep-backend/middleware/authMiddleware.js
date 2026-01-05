const jwt = require("jsonwebtoken");
const JWT_SECRET = "your_secret_key";

module.exports = function (req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Access denied. No token provided." });
  }

  try {
    const verified = jwt.verify(token, JWT_SECRET);
    // ✅ rename decoded.id to user_id for consistency
    req.user = { user_id: verified.id };
    next();
  } catch (err) {
    return res.status(403).json({ error: "Invalid or expired token." });
  }
};
