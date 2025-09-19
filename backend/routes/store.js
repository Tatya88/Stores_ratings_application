const express = require("express");
const router = express.Router();
const { Pool } = require("pg");
const jwt = require("jsonwebtoken");

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// Middleware to verify JWT
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

// Store owner dashboard
router.get("/dashboard", authenticateToken, async (req, res) => {
  if (req.user.role !== "store") {
    return res.status(403).json({ error: "Access denied" });
  }

  try {
    // Get store owned by this user
    const storeRes = await pool.query(
      "SELECT id, name, address FROM stores WHERE owner_id = $1",
      [req.user.id]
    );

    if (storeRes.rows.length === 0) {
      return res.status(404).json({ error: "Store not found" });
    }

    const store = storeRes.rows[0];

    // Get ratings for the store
    const ratingsRes = await pool.query(
      `SELECT r.id, r.rating, u.name AS user_name
       FROM ratings r
       JOIN users u ON r.user_id = u.id
       WHERE r.store_id = $1`,
      [store.id]
    );

    // Average rating
    const avgRes = await pool.query(
      "SELECT AVG(rating)::numeric(10,2) AS avg FROM ratings WHERE store_id = $1",
      [store.id]
    );

    res.json({
      store: { ...store, average_rating: avgRes.rows[0].avg || null },
      ratings: ratingsRes.rows,
    });
  } catch (err) {
    console.error("Store dashboard error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
