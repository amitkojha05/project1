const errorHandler = (err, req, res, next) => {
  console.error("Error:", err)

  // Joi validation errors
  if (err.isJoi) {
    return res.status(400).json({
      error: "Validation error",
      details: err.details.map((detail) => detail.message),
    })
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({ error: "Invalid token" })
  }

  if (err.name === "TokenExpiredError") {
    return res.status(401).json({ error: "Token expired" })
  }

  // Database errors
  if (err.code === "23505") {
    return res.status(409).json({ error: "Resource already exists" })
  }

  if (err.code === "23503") {
    return res.status(400).json({ error: "Referenced resource not found" })
  }

  // Default error
  res.status(err.status || 500).json({
    error: err.message || "Internal server error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  })
}

module.exports = errorHandler
