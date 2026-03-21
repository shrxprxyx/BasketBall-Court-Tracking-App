const express = require("express");
const router = express.Router();
const pool = require("../db/pool");

// Get all courts
router.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM basketball_courts ORDER BY id ASC");
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching courts" });
  }
});

module.exports = router;
