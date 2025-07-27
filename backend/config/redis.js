const redis = require("redis")
const logger = require("./logger") // Assuming you have a logger config

let client

async function connectRedis() {
  try {
    client = redis.createClient({
      url: process.env.REDIS_URL || "redis://localhost:6379",
    })

    client.on("connect", () => {
      logger.info("Connected to Redis")
    })

    client.on("error", (err) => {
      logger.error("Redis Client Error", err)
    })

    await client.connect()
    return client
  } catch (error) {
    logger.error("Redis connection failed:", error)
    throw error
  }
}

async function get(key) {
  try {
    return await client.get(key)
  } catch (error) {
    logger.error("Redis GET error:", error)
    return null
  }
}

async function set(key, value, expireInSeconds = 60) {
  try {
    return await client.setEx(key, expireInSeconds, JSON.stringify(value))
  } catch (error) {
    logger.error("Redis SET error:", error)
    return null
  }
}

async function del(key) {
  try {
    return await client.del(key)
  } catch (error) {
    logger.error("Redis DEL error:", error)
    return null
  }
}

async function flushPattern(pattern) {
  try {
    const keys = await client.keys(pattern)
    if (keys.length > 0) {
      return await client.del(keys)
    }
    return 0
  } catch (error) {
    logger.error("Redis FLUSH error:", error)
    return null
  }
}

// Connect to Redis when the module is imported
connectRedis().catch((err) => logger.error("Failed to connect to Redis on startup", err))

module.exports = {
  connectRedis,
  get,
  set,
  del,
  flushPattern,
  client: () => client,
}
