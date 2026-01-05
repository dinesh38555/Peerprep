require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const http = require("http");
const { WebSocketServer } = require("ws");
const jwt = require("jsonwebtoken");

const app = express();
const PORT = 5000;

// -----------------------------
// Middleware
// -----------------------------
app.use(cors());
app.use(bodyParser.json());
app.use(express.json());

// -----------------------------
// Import routes
// -----------------------------
const sheetsRoutes = require("./routes/public/sheets");
const problemsRoutes = require("./routes/public/problems");
const authRoutes = require("./routes/private/authRoutes");
const userProgressRoutes = require("./routes/private/userProgressRoutes");
const reflectionRoutes = require("./routes/private/reflectionRoutes");
const analysisRoutes = require("./routes/private/analysisRoutes");

// -----------------------------
// Route registration
// -----------------------------
app.use("/sheets", sheetsRoutes);
app.use("/problems", problemsRoutes);
app.use("/auth", authRoutes);
app.use("/progress", userProgressRoutes);
app.use("/reflections", reflectionRoutes);
app.use("/analysis", analysisRoutes);


// -----------------------------
// Root test route
// -----------------------------
app.get("/", (_req, res) => {
  res.send("Hello, PeerPrep backend is running");
});

// -----------------------------
// Wrap Express in HTTP server
// -----------------------------
const server = http.createServer(app);

// -----------------------------
// WebSocket server
// -----------------------------
const wss = new WebSocketServer({ server, path: "/ws" });

// Keep track of connected clients
const clients = new Set();

wss.on("connection", (ws, req) => {
  try {
    // Expect token in URL query: ws://localhost:5000/ws?token=<jwt>
    const token = req.url.split("token=")[1];
    if (!token) throw new Error("No token provided");

    const user = jwt.verify(token, process.env.JWT_SECRET);
    ws.user = user; // attach user info to ws
    clients.add(ws);

    console.log(`User ${user.username} connected via WebSocket`);
  } catch (err) {
    ws.close(); // reject connection if JWT invalid
  }

  ws.on("close", () => clients.delete(ws));
});

// -----------------------------
// Export clients set for broadcasting
// -----------------------------
module.exports = { app, server, wss, clients };

// -----------------------------
// Start server
// -----------------------------
server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
});
