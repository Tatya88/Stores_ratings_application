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

// List all stores
router.get("/", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT s.id, s.name, s.address, AVG(r.rating)::numeric(10,2) AS average_rating
       FROM stores s
       LEFT JOIN ratings r ON s.id = r.store_id
       GROUP BY s.id, s.name, s.address`
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Get stores error:", err);
    res.status(500).json({ error: "Error fetching stores" });
  }
});

// Store owner dashboard
router.get("/dashboard", authenticateToken, async (req, res) => {
  if (req.user.role !== "store") {
    return res.status(403).json({ error: "Access denied" });
  }

  try {
    // Get all stores owned by this user with average rating
    const storesRes = await pool.query(
      `SELECT s.id, s.name, s.address, AVG(r.rating)::numeric(10,2) AS average_rating
       FROM stores s
       LEFT JOIN ratings r ON s.id = r.store_id
       WHERE s.owner_id = $1
       GROUP BY s.id, s.name, s.address`,
      [req.user.id]
    );

    if (storesRes.rows.length === 0) {
      return res.status(404).json({ error: "No stores found" });
    }

    res.json({
      stores: storesRes.rows,
    });
  } catch (err) {
    console.error("Store dashboard error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get ratings for a specific store
router.get("/:storeId/ratings", authenticateToken, async (req, res) => {
  if (req.user.role !== "store") {
    return res.status(403).json({ error: "Access denied" });
  }

  const { storeId } = req.params;

  try {
    // Check if the store belongs to the user
    const storeCheck = await pool.query(
      "SELECT id FROM stores WHERE id = $1 AND owner_id = $2",
      [storeId, req.user.id]
    );

    if (storeCheck.rows.length === 0) {
      return res.status(404).json({ error: "Store not found" });
    }

    // Get ratings for the store
    const ratingsRes = await pool.query(
      `SELECT r.id, r.rating, u.name AS user_name
       FROM ratings r
       JOIN users u ON r.user_id = u.id
       WHERE r.store_id = $1`,
      [storeId]
    );

    res.json({
      ratings: ratingsRes.rows,
    });
  } catch (err) {
    console.error("Get store ratings error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
