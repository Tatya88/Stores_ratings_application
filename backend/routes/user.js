const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { Pool } = require("pg");

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Token missing" });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: "Invalid token" });
    req.user = user;
    next();
  });
};

// Update password
router.post("/update-password", authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    return res.status(400).json({ error: "Please provide both old and new passwords." });
  }

  try {
    const userRes = await pool.query("SELECT password FROM users WHERE id = $1", [userId]);
    if (userRes.rows.length === 0) {
      return res.status(404).json({ error: "User not found." });
    }

    const user = userRes.rows[0];
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Old password is incorrect." });
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await pool.query("UPDATE users SET password = $1 WHERE id = $2", [hashed, userId]);

    res.json({ message: "Password updated successfully." });
  } catch (err) {
    console.error("Update password error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get current user's ratings
router.get("/ratings", authenticateToken, async (req, res) => {
  const userId = req.user.id;
  try {
    const result = await pool.query(
      "SELECT store_id, rating FROM ratings WHERE user_id = $1",
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Get user ratings error:", err);
    res.status(500).json({ error: "Failed to fetch user ratings" });
  }
});

module.exports = router;
