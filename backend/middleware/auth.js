const jwt = require("jsonwebtoken")
const logger = require("../config/logger") // Assuming you have a logger config

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"]
  const token = authHeader && authHeader.split(" ")[1]

  if (!token) {
    logger.warn("Authentication attempt without token")
    return res.status(401).json({ message: "Authentication token required" })
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      logger.warn(`Token verification failed: ${err.message}`)
      return res.status(403).json({ message: "Invalid or expired token" })
    }
    req.user = user
    next()
  })
}

const authorizeRole = (roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      logger.warn(
        `Unauthorized access attempt by user ${req.user ? req.user.id : "unknown"} with role ${req.user ? req.user.role : "none"}`,
      )
      return res.status(403).json({ message: "Access denied: Insufficient permissions" })
    }
    next()
  }
}

module.exports = { authenticateToken, authorizeRole }
