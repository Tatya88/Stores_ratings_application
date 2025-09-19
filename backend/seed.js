require("dotenv").config();
const { Pool } = require("pg");
const bcrypt = require("bcrypt");

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function seed() {
  try {
    // Clear existing data
    await pool.query("TRUNCATE ratings, stores, users RESTART IDENTITY CASCADE");

    // Create a store owner user
    const hashedPassword = await bcrypt.hash("password123", 10);
    const userResult = await pool.query(
      "INSERT INTO users (name, email, password, address, role) VALUES ($1, $2, $3, $4, $5) RETURNING id",
      ["Store Owner", "store@example.com", hashedPassword, "123 Store St", "store"]
    );
    const ownerId = userResult.rows[0].id;

    // Create 10 stores for the owner
    const storeNames = [
      "Starbucks",
      "McDonald's",
      "Walmart",
      "Target",
      "Home Depot",
      "KFC",
      "Subway",
      "Pizza Hut",
      "Burger King",
      "Taco Bell"
    ];
    const stores = [];
    for (let i = 0; i < 10; i++) {
      const storeResult = await pool.query(
        "INSERT INTO stores (name, address, owner_id) VALUES ($1, $2, $3) RETURNING id",
        [storeNames[i], `${(i+1)*100} Store St`, ownerId]
      );
      stores.push(storeResult.rows[0].id);
    }
    const storeId = stores[0]; // Use first store for ratings

    // Create some normal users
    const user1Result = await pool.query(
      "INSERT INTO users (name, email, password, address, role) VALUES ($1, $2, $3, $4, $5) RETURNING id",
      ["User One", "user1@example.com", hashedPassword, "789 User Rd", "normal"]
    );
    const user1Id = user1Result.rows[0].id;

    const user2Result = await pool.query(
      "INSERT INTO users (name, email, password, address, role) VALUES ($1, $2, $3, $4, $5) RETURNING id",
      ["User Two", "user2@example.com", hashedPassword, "101 User Ln", "normal"]
    );
    const user2Id = user2Result.rows[0].id;

    // Add ratings
    await pool.query(
      "INSERT INTO ratings (user_id, store_id, rating) VALUES ($1, $2, $3)",
      [user1Id, storeId, 5]
    );
    await pool.query(
      "INSERT INTO ratings (user_id, store_id, rating) VALUES ($1, $2, $3)",
      [user2Id, storeId, 4]
    );

    // Create an admin user
    const adminResult = await pool.query(
      "INSERT INTO users (name, email, password, address, role) VALUES ($1, $2, $3, $4, $5) RETURNING id",
      ["Admin User", "admin@example.com", hashedPassword, "Admin St", "admin"]
    );

    console.log("Test data seeded successfully!");
    console.log("Store Owner Login: store@example.com / password123");
    console.log("Admin Login: admin@example.com / password123");
    console.log("Normal User Login: user1@example.com / password123");
  } catch (err) {
    console.error("Seeding error:", err);
  } finally {
    pool.end();
  }
}

seed();
