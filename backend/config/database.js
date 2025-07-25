const { Pool } = require("pg")

const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || "projecthub",
  user: process.env.DB_USER || "admin",
  password: process.env.DB_PASSWORD || "password123",
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
})

const connectDB = async () => {
  try {
    await pool.connect()
    console.log("✅ PostgreSQL connected successfully")
  } catch (error) {
    console.error("❌ PostgreSQL connection failed:", error)
    throw error
  }
}

module.exports = { pool, connectDB }
