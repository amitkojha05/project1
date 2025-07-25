const redis = require("redis")

let client

const connectRedis = async () => {
  try {
    client = redis.createClient({
      url: process.env.REDIS_URL || "redis://localhost:6379",
    })

    client.on("error", (err) => {
      console.error("Redis Client Error:", err)
    })

    await client.connect()
    console.log("✅ Redis connected successfully")
  } catch (error) {
    console.error("❌ Redis connection failed:", error)
    throw error
  }
}

const getRedisClient = () => {
  if (!client) {
    throw new Error("Redis client not initialized")
  }
  return client
}

module.exports = { connectRedis, getRedisClient }
