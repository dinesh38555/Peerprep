const db = require("../db");

// ---------------------------
// Update or Insert Progress
// ---------------------------
// ---------------------------
// Update or Insert Progress (async version)
// ---------------------------
exports.updateProgress = async (req, res) => {
  try {
    const { problem_id, problem_status } = req.body;
    const user_id = req.user.user_id;

    if (!problem_id || !problem_status) {
      return res.status(400).json({ error: "problem_id and problem_status are required" });
    }

    const [rows] = await db.execute(
      `SELECT problem_status FROM user_progress WHERE user_id = ? AND problem_id = ?`,
      [user_id, problem_id]
    );

    const currentStatus = rows.length ? rows[0].problem_status : "Unsolved";
    let newStatus = problem_status;
    if (problem_status === "Solved" && currentStatus === "Solved") newStatus = "Unsolved";

    await db.execute(
      `
        INSERT INTO user_progress (user_id, problem_id, problem_status)
        VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE problem_status = ?, time_updated = CURRENT_TIMESTAMP
      `,
      [user_id, problem_id, newStatus, newStatus]
    );

    return res.json({ message: `Progress set to ${newStatus}`, newStatus });
  } catch (err) {
    console.error("DB Error:", err);
    return res.status(500).json({ error: err.message });
  }
};

// ---------------------------
// Get Problems for a Sheet (with progress)
// ---------------------------
exports.getProblemsWithProgress = async (req, res) => {
  try {
    const sheet_id = parseInt(req.params.sheet_id, 10);
    const user_id = req.user.user_id;

    const page = Math.max(1, parseInt(req.query.page || "1", 10));
    const limit = Math.max(1, parseInt(req.query.limit || "50", 10));
    const offset = (page - 1) * limit;
    const difficultyFilter = req.query.difficulty ? String(req.query.difficulty).trim() : null;

    // Count total problems (respecting optional difficulty filter)
    let countSql = `
      SELECT COUNT(*) AS total
      FROM problem_sheets ps
      JOIN problems p ON p.problem_id = ps.problem_id
      WHERE ps.sheet_id = ?
    `;
    const countParams = [sheet_id];
    if (difficultyFilter) {
      countSql += " AND p.difficulty = ?";
      countParams.push(difficultyFilter);
    }

    const [countRows] = await db.execute(countSql, countParams);
    const totalProblems = countRows[0]?.total || 0;
    const totalPages = Math.ceil(totalProblems / limit);

    // Fetch page of problems with user progress
    let query = `
      SELECT 
        p.*,
        ps.sheet_order,
        ps.sheet_title,
        up.problem_status,
        up.user_id as progress_user_id
      FROM problem_sheets ps
      JOIN problems p ON p.problem_id = ps.problem_id
      LEFT JOIN user_progress up 
        ON up.problem_id = p.problem_id 
        AND up.user_id = ?
      WHERE ps.sheet_id = ?
    `;
    const params = [user_id, sheet_id];
    if (difficultyFilter) {
      query += " AND p.difficulty = ?";
      params.push(difficultyFilter);
    }
    query += " ORDER BY ps.sheet_order LIMIT ? OFFSET ?";
    params.push(limit, offset);

    // const [problems] = await db.execute(query, params);
    const [problems] = await db.query(query, params);
    // Map defaults and shape response to frontend expectation
    const mapped = problems.map(p => ({
      problem_id: p.problem_id,
      title: p.title,
      URL: p.URL || p.url || null,
      platform: p.platform || null,
      difficulty: p.difficulty || null,
      category: p.category || null,
      sheet_order: p.sheet_order,
      sheet_title: p.sheet_title,
      problem_status: p.problem_status
    }));

    return res.json({
      currentPage: page,
      pageSize: limit,
      totalProblems,
      totalPages,
      problems: mapped
    });

  } catch (err) {
    console.error("DB Error:", err);
    res.status(500).json({ error: "Failed to fetch problems" });
  }
};

// ---------------------------
// Get Sheet Progress Summary (for dashboard)
// ---------------------------
exports.getSheetProgress = async (req, res) => {
  try {
    const user_id = req.user?.user_id;
    if (!user_id) return res.status(401).json({ error: "Unauthorized" });

    // If frontend requests an overall overview for the dashboard chart
    if (req.query.overview === "true") {
      const totalsSql = `
        SELECT 
          COUNT(DISTINCT ps.problem_id) AS total,
          COUNT(DISTINCT CASE WHEN up.problem_status = 'Solved' THEN ps.problem_id END) AS solved,
          COUNT(DISTINCT CASE WHEN up.problem_status = 'Attempted' THEN ps.problem_id END) AS attempted
        FROM problem_sheets ps
        LEFT JOIN user_progress up 
          ON ps.problem_id = up.problem_id AND up.user_id = ?
      `;
      const [totalsRows] = await db.execute(totalsSql, [user_id]);
      const totals = totalsRows[0] || { total: 0, solved: 0, attempted: 0 };
      const total = Number(totals.total || 0);
      const solved = Number(totals.solved || 0);
      const attempted = Number(totals.attempted || 0);
      const unsolved = Math.max(0, total - solved - attempted);

      return res.json({ total, solved, attempted, unsolved });
    }

    // existing per-sheet response (unchanged)
    const sql = `
      SELECT 
        ps.sheet_id,
        s.name AS sheet_name,
        COUNT(DISTINCT ps.problem_id) AS total_problems,
        COUNT(DISTINCT CASE 
          WHEN up.problem_status = 'Solved' 
          THEN ps.problem_id 
        END) AS solved_problems
      FROM problem_sheets ps
      JOIN sheets s ON s.sheet_id = ps.sheet_id
      LEFT JOIN user_progress up ON ps.problem_id = up.problem_id 
        AND up.user_id = ?
      GROUP BY ps.sheet_id, s.name
      ORDER BY ps.sheet_id
    `;

    const [rows] = await db.execute(sql, [user_id]);

    if (!rows || !rows.length) {
      return res.json([]);
    }

    return res.json(rows);
  } catch (err) {
    console.error("DB Error:", err);
    return res.status(500).json({ error: "Failed to fetch sheet progress" });
  }
};
