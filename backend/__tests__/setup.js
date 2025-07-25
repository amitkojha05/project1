const { pool } = require("../config/database")
const { beforeAll, afterAll } = require("@jest/globals")

// Setup test database
beforeAll(async () => {
  // Run migrations or setup test data if needed
})

// Cleanup after tests
afterAll(async () => {
  await pool.end()
})
