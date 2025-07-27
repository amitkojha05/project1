require("dotenv").config()
const express = require("express")
const cors = require("cors")
const helmet = require("helmet")
const rateLimit = require("express-rate-limit")
const { Pool } = require("pg")
const redis = require("redis")
const { Kafka } = require("kafkajs")
const authRoutes = require("./routes/auth")
const projectRoutes = require("./routes/projects")
const taskRoutes = require("./routes/tasks")
const errorHandler = require("./middleware/errorHandler")
const logger = require("./config/logger") // Assuming you have a logger config

const app = express()
const PORT = process.env.PORT || 5000

// Database Pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

// Redis Client
const redisClient = redis.createClient({
  url: process.env.REDIS_URL,
})
redisClient.on("error", (err) => logger.error("Redis Client Error", err))
redisClient
  .connect()
  .then(() => logger.info("Connected to Redis"))
  .catch((err) => logger.error("Redis connection failed", err))

// Kafka Producer
const kafka = new Kafka({
  clientId: "projecthub-backend",
  brokers: [process.env.KAFKA_BROKER || "localhost:9092"],
})
const producer = kafka.producer()

producer
  .connect()
  .then(() => logger.info("Connected to Kafka Producer"))
  .catch((err) => logger.error("Kafka producer connection failed", err))

// Middleware
app.use(cors())
app.use(helmet())
app.use(express.json()) // For parsing application/json

// Rate limiting to prevent brute-force attacks
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Max 100 requests per 15 minutes per IP
  message: "Too many requests from this IP, please try again after 15 minutes",
})
app.use("/api/", apiLimiter)

// Pass pool, redisClient, and producer to routes
app.use((req, res, next) => {
  req.pool = pool
  req.redisClient = redisClient
  req.kafkaProducer = producer
  next()
})

// Routes
app.use("/api/auth", authRoutes)
app.use("/api/projects", projectRoutes)
app.use("/api/tasks", taskRoutes)

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ status: "UP", message: "Backend is healthy" })
})

// Error handling middleware
app.use(errorHandler)

// Start server
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`)
})

// Graceful shutdown
process.on("SIGTERM", async () => {
  logger.info("SIGTERM signal received: closing HTTP server")
  await producer.disconnect()
  await redisClient.disconnect()
  pool.end()
  process.exit(0)
})
