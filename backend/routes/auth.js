const express = require("express")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const Joi = require("joi")
const logger = require("../config/logger") // Assuming you have a logger config

const router = express.Router()

// Joi schema for user registration
const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  role: Joi.string().valid("admin", "user").default("user"),
})

// Joi schema for user login
const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
})

// Register a new user
router.post("/register", async (req, res, next) => {
  try {
    const { error, value } = registerSchema.validate(req.body)
    if (error) {
      error.statusCode = 400
      throw error
    }

    const { email, password, role } = value
    const { pool } = req

    const existingUser = await pool.query("SELECT * FROM users WHERE email = $1", [email])
    if (existingUser.rows.length > 0) {
      return res.status(409).json({ message: "User with this email already exists" })
    }

    const hashedPassword = await bcrypt.hash(password, 10)
    const result = await pool.query(
      "INSERT INTO users (email, password, role) VALUES ($1, $2, $3) RETURNING id, email, role",
      [email, hashedPassword, role],
    )

    const user = result.rows[0]
    logger.info(`User registered: ${user.email} (${user.role})`)
    res
      .status(201)
      .json({ message: "User registered successfully", user: { id: user.id, email: user.email, role: user.role } })
  } catch (err) {
    next(err)
  }
})

// Login user
router.post("/login", async (req, res, next) => {
  try {
    const { error, value } = loginSchema.validate(req.body)
    if (error) {
      error.statusCode = 400
      throw error
    }

    const { email, password } = value
    const { pool } = req

    const result = await pool.query("SELECT * FROM users WHERE email = $1", [email])
    const user = result.rows[0]

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" })
    }

    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" })
    }

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    })

    logger.info(`User logged in: ${user.email} (${user.role})`)
    res
      .status(200)
      .json({ message: "Logged in successfully", token, user: { id: user.id, email: user.email, role: user.role } })
  } catch (err) {
    next(err)
  }
})

module.exports = router
