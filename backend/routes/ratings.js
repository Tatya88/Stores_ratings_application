const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
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

// Submit or modify rating
router.post("/", authenticateToken, async (req, res) => {
  const { store_id, rating } = req.body;
  const user_id = req.user.id;

  if (!store_id || rating == null) return res.status(400).json({ error: "Missing store_id or rating" });
  if (rating < 1 || rating > 5) return res.status(400).json({ error: "Rating must be 1-5" });

  try {
    const existing = await pool.query(
      "SELECT * FROM ratings WHERE user_id=$1 AND store_id=$2",
      [user_id, store_id]
    );

    if (existing.rows.length > 0) {
      const result = await pool.query(
        "UPDATE ratings SET rating=$1 WHERE user_id=$2 AND store_id=$3 RETURNING *",
        [rating, user_id, store_id]
      );
      res.json({ message: "Rating updated", rating: result.rows[0] });
    } else {
      const result = await pool.query(
        "INSERT INTO ratings (user_id, store_id, rating) VALUES ($1, $2, $3) RETURNING *",
        [user_id, store_id, rating]
      );
      res.json({ message: "Rating submitted", rating: result.rows[0] });
    }
  } catch (err) {
    console.error("Ratings error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
