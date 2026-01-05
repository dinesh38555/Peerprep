// ============================
// reflectionController.js
// ============================
require("dotenv").config();
const db = require("../db");
const keyword_extractor = require("keyword-extractor");
const { HfInference } = require("@huggingface/inference");

// Initialize Hugging Face client
const hf = new HfInference(process.env.HF_TOKEN);

// -----------------------------
// Helper: Hugging Face Sentiment Analysis
// -----------------------------
async function analyzeSentimentHF(text) {
  try {
    const result = await hf.textClassification({
      model: "cardiffnlp/twitter-roberta-base-sentiment",
      inputs: text,
    });

    const { label, score } = result[0];
    const sentimentMap = {
      positive: "Positive",
      negative: "Negative",
      neutral: "Neutral",
    };

    const sentiment = sentimentMap[label.toLowerCase()] || "Neutral";
    const confidence = parseFloat(score.toFixed(3));

    return { sentiment, confidence };
  } catch (error) {
    console.error("Error calling Hugging Face API:", error.message);
    return { sentiment: "Neutral", confidence: 0.0 };
  }
}

// -----------------------------
// Add or Update Reflection
// -----------------------------
exports.addReflection = async (req, res) => {
  try {
    const user_id = req.user.user_id; // Extracted from JWT
    const { problem_id, reflection_text } = req.body;

    if (!reflection_text) {
      return res.status(400).json({ error: "Reflection text is required." });
    }

    if (!problem_id) {
      return res.status(400).json({ error: "Problem ID is required." });
    }

    // Analyze sentiment
    const { sentiment, confidence } = await analyzeSentimentHF(reflection_text);

    // Extract keywords
    const keywords = keyword_extractor.extract(reflection_text, {
      language: "english",
      remove_digits: true,
      return_changed_case: true,
      remove_duplicates: true,
    });

    // Fetch problem difficulty
    const difficultyQuery = `SELECT difficulty FROM problems WHERE problem_id = ?`;
    const [difficultyResult] = await db.query(difficultyQuery, [problem_id]);

    if (difficultyResult.length === 0) {
      return res.status(404).json({ error: "Problem not found." });
    }

    const difficulty = difficultyResult[0].difficulty;

    // Determine review date based on sentiment, difficulty, and confidence
    let reviewDate = null;
    const today = new Date();

    const sentimentDays = {
      Negative: 1,
      Neutral: 3,
      Positive: 5,
    };

    const difficultyDays = {
      easy: 5,
      medium: 2,
      hard: 2,
    };

    const baseDays = sentimentDays[sentiment] || 3;
    const difficultyAdjustment = difficultyDays[difficulty.toLowerCase()] || 0;
    const confidenceAdjustment = confidence < 0.5 ? 1 : 0;

    const totalDays = baseDays + difficultyAdjustment + confidenceAdjustment;
    reviewDate = new Date(today.setDate(today.getDate() + totalDays));

    const formattedReviewDate = reviewDate.toISOString().split("T")[0];

    // Insert or update reflection in the database
    const sql = `
      INSERT INTO reflections (user_id, problem_id, reflection_text, sentiment, keywords, confidence_score, review_date, completed)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        reflection_text = VALUES(reflection_text),
        sentiment = VALUES(sentiment),
        keywords = VALUES(keywords),
        confidence_score = VALUES(confidence_score),
        review_date = VALUES(review_date),
        completed = VALUES(completed),
        updated_at = CURRENT_TIMESTAMP
    `;

    await db.query(sql, [
      user_id,
      problem_id,
      reflection_text,
      sentiment,
      keywords.join(", "),
      confidence,
      formattedReviewDate,
      false, // Default value for completed
    ]);

    res.status(201).json({
      message: "Reflection analyzed and saved successfully.",
      sentiment,
      confidence_score: confidence,
      keywords,
      review_date: formattedReviewDate,
    });
  } catch (error) {
    console.error("Error in addReflection:", error);
    res.status(500).json({ error: "Internal server error while analyzing reflection." });
  }
};

// -----------------------------
// Get All Reflections for Logged-in User
// -----------------------------
exports.getUserReflections = async (req, res) => {
  try {
    const user_id = req.user.user_id;

    const sql = `
      SELECT * FROM reflections
      WHERE user_id = ?
      ORDER BY created_at DESC
    `;

    const [results] = await db.query(sql, [user_id]);
    res.json(results);
  } catch (err) {
    console.error("Error fetching reflections:", err);
    res.status(500).json({ error: "Database error while fetching reflections." });
  }
};

// -----------------------------
// Get Reflection for a Specific Problem
// -----------------------------
exports.getProblemReflection = async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const { problem_id } = req.params;

    const sql = `
      SELECT * FROM reflections
      WHERE user_id = ? AND problem_id = ?
    `;

    const [results] = await db.query(sql, [user_id, problem_id]);

    if (results.length === 0) {
      return res.status(404).json({ error: "Reflection not found for this problem." });
    }

    res.json(results[0]);
  } catch (err) {
    console.error("Error fetching reflection:", err);
    res.status(500).json({ error: "Database error while fetching reflection." });
  }
};

// -----------------------------
// Update Reflection (Re-analyze)
// -----------------------------
exports.updateReflection = async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const { problem_id } = req.params;
    const { reflection_text, completed } = req.body;

    if (!reflection_text) {
      return res.status(400).json({ error: "Reflection text is required." });
    }

    // Re-analyze the reflection text
    const { sentiment, confidence } = await analyzeSentimentHF(reflection_text);

    const keywords = keyword_extractor.extract(reflection_text, {
      language: "english",
      remove_digits: true,
      return_changed_case: true,
      remove_duplicates: true,
    });

    // Fetch problem difficulty
    const difficultyQuery = `SELECT difficulty FROM problems WHERE problem_id = ?`;
    const [difficultyResult] = await db.query(difficultyQuery, [problem_id]);

    if (difficultyResult.length === 0) {
      return res.status(404).json({ error: "Problem not found." });
    }

    const difficulty = difficultyResult[0].difficulty;

    // Determine review date based on sentiment, difficulty, and confidence
    let reviewDate = null;
    const today = new Date();

    const sentimentDays = {
      Negative: 1,
      Neutral: 3,
      Positive: 5,
    };

    const difficultyDays = {
      easy: 5,
      medium: 4,
      hard: 2,
    };

    const baseDays = sentimentDays[sentiment] || 3;
    const difficultyAdjustment = difficultyDays[difficulty.toLowerCase()] || 0;
    const confidenceAdjustment = confidence < 0.5 ? 1 : 0;

    const totalDays = baseDays + difficultyAdjustment + confidenceAdjustment;
    reviewDate = new Date(today.setDate(today.getDate() + totalDays));

    const formattedReviewDate = reviewDate.toISOString().split("T")[0];

    // Update the reflection in the database
    const sql = `
      UPDATE reflections
      SET reflection_text = ?, 
          sentiment = ?, 
          keywords = ?, 
          confidence_score = ?, 
          review_date = ?, 
          completed = IFNULL(?, completed), 
          updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ? AND problem_id = ?
    `;

    const [result] = await db.query(sql, [
      reflection_text,
      sentiment,
      keywords.join(", "),
      confidence,
      formattedReviewDate,
      completed,
      user_id,
      problem_id,
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Reflection not found for this problem." });
    }

    res.json({
      message: "✅ Reflection re-analyzed and updated successfully.",
      sentiment,
      confidence_score: confidence,
      keywords,
      review_date: formattedReviewDate,
    });
  } catch (error) {
    console.error("Error in updateReflection:", error);
    res.status(500).json({ error: "Internal server error while updating reflection." });
  }
};

// -----------------------------
// Delete Reflection
// -----------------------------
exports.deleteReflection = async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const { problem_id } = req.params;

    const sql = "DELETE FROM reflections WHERE user_id = ? AND problem_id = ?";
    const [result] = await db.query(sql, [user_id, problem_id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Reflection not found for this problem." });
    }

    res.json({ message: "🗑️ Reflection deleted successfully." });
  } catch (err) {
    console.error("Error deleting reflection:", err);
    res.status(500).json({ error: "Database error while deleting reflection." });
  }
};

// -----------------------------
// Get Today's Reviews
// -----------------------------
exports.getTodayReviews = async (req, res) => {
  try {
    const user_id = req.user.user_id;

    // Set specific date (November 11th)
    // const specificDate = '2025-11-11';

    const today = new Date().toISOString().split('T')[0];
    const sql = `
      SELECT 
        r.problem_id, 
        p.difficulty, 
        p.title,
        p.url,
        r.completed
      FROM reflections r
      JOIN problems p ON r.problem_id = p.problem_id
      WHERE r.user_id = ?
        AND r.review_date IS NOT NULL
        AND DATE(r.review_date) = ?
      ORDER BY r.completed ASC, r.created_at DESC
    `;

    // const [results] = await db.query(sql, [user_id, specificDate]);
    const [results] = await db.query(sql, [user_id, today]);

    res.status(200).json(results);
  } catch (err) {
    console.error("Error fetching today's reviews:", err);
    res.status(500).json({ 
      error: "Database error while fetching today's reviews.",
      details: process.env.NODE_ENV === "development" ? err.message : undefined
    });
  }
};

// -----------------------------
// Update completion status for a review
// -----------------------------
exports.updateReviewCompletion = async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const { problem_id, completed } = req.body;

    // Validate input
    if (!problem_id) {
      return res.status(400).json({ error: "problem_id is required" });
    }

    if (typeof completed !== "boolean") {
      return res.status(400).json({ error: "completed must be a boolean" });
    }

    const sql = `
      UPDATE reflections 
      SET completed = ? 
      WHERE user_id = ? AND problem_id = ?
    `;

    const [result] = await db.query(sql, [completed, user_id, problem_id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        error: "Review not found or unauthorized"
      });
    }

    res.status(200).json({
      success: true,
      message: "Review completion status updated",
      problem_id,
      completed
    });
  } catch (err) {
    console.error("Error updating review completion:", err);
    res.status(500).json({
      error: "Database error while updating review",
      details: process.env.NODE_ENV === "development" ? err.message : undefined
    });
  }
};


// -----------------------------
// Get all reviews for a user (optional - for history page)
// -----------------------------
exports.getAllReviews = async (req, res) => {
  try {
    const user_id = req.user.user_id;

    const sql = `
      SELECT 
        r.problem_id, 
        p.difficulty, 
        p.title,
        p.url,
        r.completed,
        r.review_date,
        r.created_at
      FROM reflections r
      JOIN problems p ON r.problem_id = p.problem_id
      WHERE r.user_id = ?
      ORDER BY r.review_date DESC, r.created_at DESC
    `;

    const [results] = await db.query(sql, [user_id]);
    res.status(200).json(results);
  } catch (err) {
    console.error("Error fetching all reviews:", err);
    res.status(500).json({ 
      error: "Database error while fetching reviews" 
    });
  }
};
