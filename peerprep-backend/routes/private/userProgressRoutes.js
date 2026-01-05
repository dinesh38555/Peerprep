const express = require("express");
const router = express.Router();
const userProgressController = require("../../controllers/userProgressController");
const verifyToken = require("../../middleware/authMiddleware");

// Fetch all problems (with user progress) for a given sheet
router.get("/sheet/:sheet_id", verifyToken, userProgressController.getProblemsWithProgress);

// Update user progress
router.post("/update", verifyToken, userProgressController.updateProgress);

// Get sheet progress summary for the authenticated user (alias used by frontend)
router.get("/summary", verifyToken, userProgressController.getSheetProgress);

// Keep existing public route if needed
router.get("/user/:user_id/sheets", verifyToken, userProgressController.getSheetProgress);

module.exports = router;
