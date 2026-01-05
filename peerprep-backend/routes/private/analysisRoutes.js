const express = require("express");
const router = express.Router();
const analysisController = require("../../controllers/analysisController");
const verifyToken = require("../../middleware/authMiddleware");

// GET aggregated progress (query: ?sheet_id=123&days=30)
router.get("/progress", verifyToken, analysisController.getProgress);

// GET sentiment time series (query: ?days=30&window=7)
router.get("/sentiment", verifyToken, analysisController.getSentiment);

// GET upcoming reviews (query: ?days=14&limit=100)
router.get("/review-status", verifyToken, analysisController.getReviewStatus);

module.exports = router;
