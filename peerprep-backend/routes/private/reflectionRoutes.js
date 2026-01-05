const express = require("express");
const router = express.Router();
const reflectionController = require("../../controllers/reflectionController");
const verifyToken = require("../../middleware/authMiddleware");

// Add new reflection
router.post("/add", verifyToken, reflectionController.addReflection);

// Get all reflections for logged-in user
router.get("/user/:user_id", verifyToken, reflectionController.getUserReflections);

// Get reflection for a specific problem
router.get("/user/:user_id/:problem_id", verifyToken, reflectionController.getProblemReflection);

// Update reflection for a specific problem
router.put("/user/:user_id/:problem_id", verifyToken, reflectionController.updateReflection);

// Delete reflection for a specific problem
router.delete("/user/:user_id/:problem_id", verifyToken, reflectionController.deleteReflection);

// Get today's reviews
router.get("/review-today", verifyToken, reflectionController.getTodayReviews);

// Update completion status route
router.patch("/update-completion", verifyToken, async (req, res) => {
  try {
    const { problem_id, completed } = req.body;

    // Add validation
    if (!problem_id) {
      return res.status(400).json({ message: "Problem ID is required" });
    }

    // Your database update logic here
    // Example:
    // await Reflection.findOneAndUpdate(
    //   { problem_id, user_id: req.user.id },
    //   { completed }
    // );

    return res.status(200).json({ message: "Update successful" });
  } catch (error) {
    console.error("Update completion error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/all-reviews", reflectionController.getAllReviews);

module.exports = router;
