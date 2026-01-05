const db = require("../db");

exports.getAllSheets = async (req, res) => {
  try {
    const [results] = await db.promise().query("SELECT * FROM sheets");
    if (results.length === 0) {
      return res.status(404).json({ message: "No sheets found" });
    }
    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching sheets" });
  }
};
