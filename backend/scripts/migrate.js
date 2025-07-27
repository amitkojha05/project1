const fs = require("fs")
const path = require("path")
const { query } = require("../config/database")

async function runMigrations() {
  try {
    const migrationsDir = path.join(__dirname, "../migrations")
    const files = fs.readdirSync(migrationsDir).sort()

    console.log("Running database migrations...")

    for (const file of files) {
      if (file.endsWith(".sql")) {
        console.log(`Running migration: ${file}`)
        const sql = fs.readFileSync(path.join(migrationsDir, file), "utf8")
        await query(sql)
        console.log(`✅ Migration ${file} completed`)
      }
    }

    console.log("All migrations completed successfully")
    process.exit(0)
  } catch (error) {
    console.error("Migration failed:", error)
    process.exit(1)
  }
}

runMigrations()
