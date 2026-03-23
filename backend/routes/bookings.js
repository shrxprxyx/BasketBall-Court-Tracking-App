const express = require("express");
const router = express.Router();
const pool = require("../db/pool");
const { getIO } = require("../socket");

// broadcast latest bookings (includes user_id for frontend matching)
const emitBookingsUpdate = async () => {
  try {
    const result = await pool.query(
      `SELECT b.id, b.user_id, u.name AS user, c.name AS court, b.timeslot, b.status
       FROM bookings b
       JOIN users u ON b.user_id = u.id
       JOIN basketball_courts c ON b.court_id = c.id
       ORDER BY b.id DESC`
    );
    const io = getIO();
    io.emit("bookingsUpdated", result.rows);
  } catch (err) {
    console.warn("Socket emit (bookingsUpdated) failed:", err.message);
  }
};

// GET all bookings
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT b.id, b.user_id, u.name AS user, c.name AS court, b.timeslot, b.status
       FROM bookings b
       JOIN users u ON b.user_id = u.id
       JOIN basketball_courts c ON b.court_id = c.id
       ORDER BY b.id DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching bookings:", err);
    res.status(500).json({ message: "Error fetching bookings" });
  }
});

// POST create a new booking
router.post("/", async (req, res) => {
  const { user_id, court_id, timeslot, status } = req.body;
  try {
    const result = await pool.query(
      "INSERT INTO bookings (user_id, court_id, timeslot, status) VALUES ($1,$2,$3,$4) RETURNING *",
      [user_id, court_id, timeslot, status || "pending"]
    );
    await emitBookingsUpdate();
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Error creating booking:", err);
    res.status(500).json({ message: "Error creating booking" });
  }
});

// PUT update booking status
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    const result = await pool.query(
      "UPDATE bookings SET status=$1 WHERE id=$2 RETURNING *",
      [status, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: "Booking not found" });
    await emitBookingsUpdate();
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error updating booking:", err);
    res.status(500).json({ message: "Error updating booking" });
  }
});

// DELETE a booking
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query("DELETE FROM bookings WHERE id=$1", [id]);
    await emitBookingsUpdate();
    res.json({ message: "Booking deleted successfully" });
  } catch (err) {
    console.error("Error deleting booking:", err);
    res.status(500).json({ message: "Error deleting booking" });
  }
});

module.exports = router;