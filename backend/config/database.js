const { Pool } = require("pg")
const logger = require("./logger") // Assuming you have a logger config

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10, // maximum number of clients in the pool
  idleTimeoutMillis: 30000, // how long a client is allowed to remain idle before being closed
  connectionTimeoutMillis: 2000, // how long to wait for a connection to be established
})

pool.on("connect", () => {
  logger.info("New client connected to PostgreSQL")
})

pool.on("error", (err, client) => {
  logger.error("Unexpected error on idle PostgreSQL client", err)
  process.exit(-1) // Exit process if a critical database error occurs
})

module.exports = pool
