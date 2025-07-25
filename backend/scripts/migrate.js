const fs = require("fs")
const path = require("path")
const { pool } = require("../config/database")

async function runMigrations() {
  try {
    console.log("🔄 Running database migrations...")

    const migrationsDir = path.join(__dirname, "../migrations")
    const migrationFiles = fs
      .readdirSync(migrationsDir)
      .filter((file) => file.endsWith(".sql"))
      .sort()

    for (const file of migrationFiles) {
      console.log(`📄 Running migration: ${file}`)
      const sql = fs.readFileSync(path.join(migrationsDir, file), "utf8")
      await pool.query(sql)
      console.log(`✅ Migration ${file} completed`)
    }

    console.log("🎉 All migrations completed successfully")
  } catch (error) {
    console.error("❌ Migration failed:", error)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

runMigrations()
