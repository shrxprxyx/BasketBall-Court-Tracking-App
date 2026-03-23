const express = require("express");
const router = express.Router();
const pool = require("../db/pool");
const multer = require("multer");
const { getIO } = require("../socket");

// Multer config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({ storage });

// TEMP: Admin auth (bypass for testing)
const adminAuth = (req, res, next) => next(); 

// -------------------
// Add a new court
// -------------------
router.post("/", adminAuth, upload.single("photo"), async (req, res) => {
  const { name, surface, status, distance, players } = req.body;
  const photo = req.file ? `/uploads/${req.file.filename}` : null;

  try {
    const result = await pool.query(
      "INSERT INTO basketball_courts (name, surface, status, distance, players, photo) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *",
      [name, surface, status || "AVAILABLE", distance || 0, players || 0, photo]
    );

    const io = getIO();
    const allCourts = await pool.query("SELECT * FROM basketball_courts");
    io.emit("courtsUpdated", allCourts.rows);

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error adding court" });
  }
});

// -------------------
// Update court
// -------------------
router.put("/:id", adminAuth, async (req, res) => {
  const { name, surface, status } = req.body;
  const { id } = req.params;

  try {
    const result = await pool.query(
      "UPDATE basketball_courts SET name=$1, surface=$2, status=$3 WHERE id=$4 RETURNING *",
      [name, surface, status, id]
    );

    const io = getIO();
    const allCourts = await pool.query("SELECT * FROM basketball_courts");
    io.emit("courtsUpdated", allCourts.rows);

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error updating court" });
  }
});

// -------------------
// Delete court
// -------------------
router.delete("/:id", adminAuth, async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query("DELETE FROM basketball_courts WHERE id=$1", [id]);

    const io = getIO();
    const allCourts = await pool.query("SELECT * FROM basketball_courts");
    io.emit("courtsUpdated", allCourts.rows);

    res.json({ message: "Court deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error deleting court" });
  }
});

module.exports = router;
