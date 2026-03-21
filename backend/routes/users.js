const express = require("express");
const router  = require("express").Router();
const pool    = require("../db/pool");
const bcrypt  = require("bcrypt");

// ✅ GET all users
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, name, email, role FROM users ORDER BY id ASC"
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).json({ message: "Error fetching users" });
  }
});

// ✅ PUT update user profile (name, email, optional new password)
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { name, email, password } = req.body;

  if (!name || !email) {
    return res.status(400).json({ message: "Name and email are required." });
  }

  try {
    // Check email isn't already taken by a different user
    const existing = await pool.query(
      "SELECT id FROM users WHERE email = $1 AND id != $2",
      [email, id]
    );
    if (existing.rows.length > 0) {
      return res.status(400).json({ message: "Email is already in use." });
    }

    let result;
    if (password) {
      const hashed = await bcrypt.hash(password, 10);
      result = await pool.query(
        "UPDATE users SET name=$1, email=$2, password=$3 WHERE id=$4 RETURNING id, name, email, role",
        [name, email, hashed, id]
      );
    } else {
      result = await pool.query(
        "UPDATE users SET name=$1, email=$2 WHERE id=$3 RETURNING id, name, email, role",
        [name, email, id]
      );
    }

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found." });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error updating user:", err);
    res.status(500).json({ message: "Error updating user." });
  }
});

module.exports = router;