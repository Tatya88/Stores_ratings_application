require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const app = express();
app.use(cors());
app.use(express.json());

// ------------------- PostgreSQL Connection -------------------
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// Make pool available to routes
app.set('pool', pool);

// ------------------- Middleware for JWT -------------------
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Token missing" });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: "Invalid token" });
    req.user = user; // {id, role}
    next();
  });
};

// ------------------- TEST ROUTE -------------------
app.get("/", (req, res) => {
  res.send("Backend is working!");
});

// ------------------- AUTH ROUTES -------------------
app.post("/api/signup", async (req, res) => {
  let { name, email, password, address, role } = req.body;

  try {
    if (!role) role = "normal"; // default role
    if (!["normal", "store", "admin"].includes(role)) role = "normal";

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      "INSERT INTO users (name,email,password,address,role) VALUES ($1,$2,$3,$4,$5) RETURNING id,name,email,role",
      [name, email, hashedPassword, address, role]
    );

    res.json({
      message: "User registered successfully",
      user: result.rows[0],
    });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ error: "Error registering user" });
  }
});

app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await pool.query("SELECT * FROM users WHERE email=$1", [email]);
    if (result.rows.length === 0) return res.status(400).json({ error: "User not found" });

    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ error: "Invalid password" });

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({
      message: "Login successful",
      token,
      role: user.role,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ------------------- PROFILE ROUTE -------------------
app.get("/api/auth/profile", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id,name,email,role,address FROM users WHERE id=$1",
      [req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: "User not found" });
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Profile error:", err);
    res.status(500).json({ error: "Failed to fetch profile" });
  }
});

// ------------------- ADMIN ROUTES -------------------
app.get("/api/admin/dashboard", authenticateToken, async (req, res) => {
  if (req.user.role !== "admin") return res.status(403).json({ error: "Access denied" });

  try {
    const totalUsersRes = await pool.query("SELECT COUNT(*) FROM users");
    const totalStoresRes = await pool.query("SELECT COUNT(*) FROM stores");
    const totalRatingsRes = await pool.query("SELECT COUNT(*) FROM ratings");

    const roleCountRes = await pool.query(`
      SELECT role, COUNT(*)::int as count
      FROM users
      GROUP BY role
    `);

    const roleCounts = {};
    roleCountRes.rows.forEach(r => {
      roleCounts[r.role] = r.count;
    });

    res.json({
      totalUsers: parseInt(totalUsersRes.rows[0].count, 10),
      totalStores: parseInt(totalStoresRes.rows[0].count, 10),
      totalRatings: parseInt(totalRatingsRes.rows[0].count, 10),
      roleCounts
    });
  } catch (err) {
    console.error("Dashboard stats error:", err);
    res.status(500).json({ message: "Failed to fetch dashboard stats" });
  }
});

app.get("/api/admin/users", authenticateToken, async (req, res) => {
  if (req.user.role !== "admin") return res.status(403).json({ error: "Access denied" });

  try {
    const result = await pool.query("SELECT id,name,email,address,role FROM users");
    res.json(result.rows);
  } catch (err) {
    console.error("Get users error:", err);
    res.status(500).json({ error: "Error fetching users" });
  }
});

app.get("/api/admin/stores", authenticateToken, async (req, res) => {
  if (req.user.role !== "admin") return res.status(403).json({ error: "Access denied" });

  try {
    const result = await pool.query(
      "SELECT s.id, s.name, s.address, u.name AS owner_name FROM stores s JOIN users u ON s.owner_id = u.id"
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Get stores error:", err);
    res.status(500).json({ error: "Error fetching stores" });
  }
});

// ------------------- ADD USER (Admin only) -------------------
app.post("/api/admin/users", authenticateToken, async (req, res) => {
  if (req.user.role !== "admin") return res.status(403).json({ error: "Access denied" });

  let { name, email, password, address, role } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      "INSERT INTO users (name,email,password,address,role) VALUES ($1,$2,$3,$4,$5) RETURNING id,name,email,role",
      [name, email, hashedPassword, address, role]
    );
    res.json({ message: "User added successfully", user: result.rows[0] });
  } catch (err) {
    console.error("Add user error:", err);
    res.status(500).json({ error: "Error adding user" });
  }
});

// ------------------- MOUNT ROUTES -------------------
app.use('/api/stores', require('./routes/store'));
app.use('/api/ratings', require('./routes/ratings'));
app.use('/api/user', require('./routes/user'));

// ------------------- START SERVER -------------------
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
