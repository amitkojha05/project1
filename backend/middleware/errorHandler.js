const logger = require("../config/logger") // Assuming you have a logger config

const errorHandler = (err, req, res, next) => {
  logger.error(`Error: ${err.message}`, { stack: err.stack, path: req.path, method: req.method })

  if (err.name === "ValidationError") {
    return res.status(400).json({ message: err.message, details: err.details })
  }

  if (err.name === "UnauthorizedError") {
    // For JWT errors from express-jwt if used
    return res.status(401).json({ message: "Unauthorized: Invalid token" })
  }

  // Generic error response
  res.status(err.statusCode || 500).json({
    message: err.message || "An unexpected error occurred",
    error: process.env.NODE_ENV === "development" ? err.stack : {}, // Only send stack in dev
  })
}

module.exports = errorHandler
