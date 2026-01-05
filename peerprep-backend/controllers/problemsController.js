const db = require("../db");

// Get all problems in a sheet (with optional difficulty filter + pagination)
exports.getProblemsBySheet = async (req, res) => {
  try {
    const sheet_id = parseInt(req.params.sheet_id, 10);
    const difficulty = req.query.difficulty;
    let limit = parseInt(req.query.limit, 10) || 10;
    let page = parseInt(req.query.page, 10) || 1;

    if (isNaN(sheet_id)) return res.status(400).json({ message: "Invalid sheet_id" });

    // sanitize pagination
    limit = Math.max(1, Math.min(limit, 100)); // clamp limit 1..100
    page = Math.max(1, page);
    const offset = (page - 1) * limit;

    // verify sheet exists
    const checkQuery = `SELECT COUNT(*) as count FROM problem_sheets WHERE sheet_id = ?`;
    const [checkResult] = await db.execute(checkQuery, [sheet_id]);
    if (checkResult[0].count === 0) return res.status(404).json({ message: "Sheet not found or has no problems" });

    // detect primary column in problems table
    const [cols] = await db.execute("SHOW COLUMNS FROM problems");
    const fieldNames = cols.map(c => c.Field);
    const problemsKey = fieldNames.includes('problem_id') ? 'problem_id' : (fieldNames.includes('id') ? 'id' : null);
    if (!problemsKey) {
      console.error("Couldn't find 'problem_id' or 'id' column in problems table", fieldNames);
      return res.status(500).json({ message: "Unexpected schema: problems table key not found" });
    }

    // Build main query — inject validated integers for LIMIT/OFFSET to avoid statement binding issues
    let query = `
      SELECT
        p.*,
        ps.sheet_order,
        ps.sheet_title
      FROM problem_sheets ps
      JOIN problems p ON p.${problemsKey} = ps.problem_id
      WHERE ps.sheet_id = ?
    `;
    const params = [sheet_id];

    if (difficulty) {
      query += ` AND p.difficulty = ?`;
      params.push(difficulty);
    }

    query += ` ORDER BY ps.sheet_order LIMIT ${limit} OFFSET ${offset}`;

    const [results] = await db.execute(query, params);

    if (!results || results.length === 0) {
      return res.status(404).json({ message: "No problems found" });
    }

    // total count for pagination (use bound params)
    const countQuery = `
      SELECT COUNT(*) as total
      FROM problem_sheets ps
      JOIN problems p ON p.${problemsKey} = ps.problem_id
      WHERE ps.sheet_id = ?
      ${difficulty ? 'AND p.difficulty = ?' : ''}
    `;
    const countParams = difficulty ? [sheet_id, difficulty] : [sheet_id];
    const [countResult] = await db.execute(countQuery, countParams);

    res.json({
      currentPage: page,
      pageSize: limit,
      totalProblems: countResult[0].total,
      totalPages: Math.ceil(countResult[0].total / limit),
      problems: results
    });
  } catch (err) {
    console.error("DB Error:", err);
    res.status(500).json({ message: "Error fetching problems", error: err.message });
  }
};

// Get a single problem by ID
exports.getProblemByID = (req, res) => {
  const id = parseInt(req.params.id, 10);

  // Validatng input problem ID
  if (isNaN(id)) {
    return res.status(400).json({ message: "Invalid problem ID" });
  }

  // As query doesn't change later, we use "const" instead of "let"
  const query = `SELECT * FROM problems WHERE problem_id = ?`;
  const params = [id];

  db.query(query, params, (err, results) => {
    if (err) {
      console.error("DB Error:", err);
      return res.status(500).json({ message: "Error fetching problem" });
    }

    if (!results || results.length === 0) {
      return res.status(404).json({ message: "Problem not found" });
    }

    res.json(results[0]);
  });
};
