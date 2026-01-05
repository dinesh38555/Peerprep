const db = require("../db"); // uses your db pool (db.js)
const DAY_MS = 24 * 60 * 60 * 1000;

function toDateString(d) {
  const dt = new Date(d);
  return dt.toISOString().slice(0, 10);
}

function movingAverage(arr, window) {
  if (!arr.length) return [];
  const out = new Array(arr.length).fill(0);
  let sum = 0, left = 0;
  for (let i = 0; i < arr.length; i++) {
    sum += arr[i];
    if (i - left + 1 > window) {
      sum -= arr[left];
      left++;
    }
    out[i] = +(sum / (i - left + 1)).toFixed(4);
  }
  return out;
}

exports.getProgress = async (req, res) => {
  try {
    const user_id = req.user?.user_id;
    if (!user_id) return res.status(401).json({ error: "Unauthorized" });

    const sheet_id = req.query.sheet_id || null;
    const days = parseInt(req.query.days || "30", 10);
    const startDate = new Date(Date.now() - (days - 1) * DAY_MS).toISOString().slice(0, 10);

    // Query: aggregate by date and problem_status
    let sql = `
      SELECT DATE(time_updated) AS d, problem_status, COUNT(*) AS cnt
      FROM user_progress up
      JOIN problems p ON p.problem_id = up.problem_id
      WHERE up.user_id = ?
        AND DATE(time_updated) >= ?
    `;
    const params = [user_id, startDate];
    if (sheet_id) {
      sql += " AND p.sheet_id = ?";
      params.push(sheet_id);
    }
    sql += " GROUP BY DATE(time_updated), problem_status ORDER BY DATE(time_updated) ASC";

    const [rows] = await db.execute(sql, params);

    // Normalize into time-series for the range
    const seriesMap = {};
    for (let i = 0; i < days; i++) {
      const date = toDateString(Date.now() - (days - 1 - i) * DAY_MS);
      seriesMap[date] = { Solved: 0, Attempted: 0, date };
    }

    rows.forEach((r) => {
      const d = toDateString(r.d);
      const status = r.problem_status || "Unsolved";
      if (!seriesMap[d]) {
        seriesMap[d] = { Solved: 0, Attempted: 0, date: d };
      }
      if (status === "Solved" || status === "Attempted") {
        seriesMap[d][status] += r.cnt;
      }
    });

    const series = Object.values(seriesMap).sort((a, b) => a.date.localeCompare(b.date));

    return res.json({ days, data: series });
  } catch (err) {
    console.error("analysis.getProgress err:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

exports.getSentiment = async (req, res) => {
  try {
    const user_id = req.user?.user_id;
    if (!user_id) return res.status(401).json({ error: "Unauthorized" });

    const days = parseInt(req.query.days || "30", 10);
    const window = parseInt(req.query.window || "7", 10);
    const startDate = new Date(Date.now() - (days - 1) * DAY_MS).toISOString().slice(0, 10);

    const sql = `
      SELECT DATE(created_at) AS d, sentiment, COUNT(*) AS cnt
      FROM reflections
      WHERE user_id = ?
        AND DATE(created_at) >= ?
      GROUP BY DATE(created_at), sentiment
      ORDER BY DATE(created_at) ASC
    `;
    const [rows] = await db.execute(sql, [user_id, startDate]);

    // Build date-indexed buckets
    const buckets = {};
    for (let i = 0; i < days; i++) {
      const date = toDateString(Date.now() - (days - 1 - i) * DAY_MS);
      buckets[date] = { date, Positive: 0, Neutral: 0, Negative: 0, total: 0 };
    }

    rows.forEach((r) => {
      const d = toDateString(r.d);
      if (!buckets[d]) buckets[d] = { date: d, Positive: 0, Neutral: 0, Negative: 0, total: 0 };
      const s = r.sentiment || "Neutral";
      buckets[d][s] = (buckets[d][s] || 0) + r.cnt;
      buckets[d].total += r.cnt;
    });

    const list = Object.values(buckets).sort((a, b) => a.date.localeCompare(b.date));

    // compute percent positives and rolling averages
    const positivePercents = list.map((d) => (d.total ? +(d.Positive / d.total).toFixed(4) : 0));
    const neutralPercents = list.map((d) => (d.total ? +(d.Neutral / d.total).toFixed(4) : 0));
    const negativePercents = list.map((d) => (d.total ? +(d.Negative / d.total).toFixed(4) : 0));

    const rollingPositive = movingAverage(positivePercents, window);
    const rollingNeutral = movingAverage(neutralPercents, window);
    const rollingNegative = movingAverage(negativePercents, window);

    return res.json({
      days,
      window,
      daily: list,
      percent_series: { positivePercents, neutralPercents, negativePercents },
      rolling: { rollingPositive, rollingNeutral, rollingNegative },
    });
  } catch (err) {
    console.error("analysis.getSentiment err:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

exports.getReviewStatus = async (req, res) => {
  try {
    const user_id = req.user?.user_id;
    if (!user_id) return res.status(401).json({ error: "Unauthorized" });

    // Validate and sanitize query parameters
    const daysAhead = parseInt(req.query.days || "14", 10);
    const limit = parseInt(req.query.limit || "100", 10);

    // Ensure valid values for daysAhead and limit
    if (isNaN(daysAhead) || daysAhead < 1 || isNaN(limit) || limit < 1) {
      return res.status(400).json({ error: "Invalid query parameters" });
    }

    const startDate = new Date().toISOString().slice(0, 10);
    const endDate = new Date(Date.now() + daysAhead * DAY_MS).toISOString().slice(0, 10);

    const sql = `
      SELECT r.reflection_id, r.problem_id, r.review_date, r.completed,
             r.sentiment, r.created_at, r.updated_at,
             p.title, p.difficulty
      FROM reflections r
      JOIN problems p ON p.problem_id = r.problem_id
      WHERE r.user_id = ?
        AND r.review_date IS NOT NULL
        AND DATE(r.review_date) BETWEEN ? AND ?
      ORDER BY r.review_date ASC
      LIMIT ?
    `;

    const [rows] = await db.query(sql, [user_id, startDate, endDate, limit]);

    return res.json({ daysAhead, count: rows.length, items: rows });
  } catch (err) {
    console.error("analysis.getReviewStatus err:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};
