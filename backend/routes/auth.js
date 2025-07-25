const express = require("express")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const Joi = require("joi")
const { pool } = require("../config/database")
const { publishEvent } = require("../config/kafka")

const router = express.Router()

const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  role: Joi.string().valid("admin", "user").default("user"),
  tenant_name: Joi.string().required(),
})

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
})

// Register
router.post("/register", async (req, res, next) => {
  try {
    const { error, value } = registerSchema.validate(req.body)
    if (error) throw error

    const { email, password, role, tenant_name } = value

    // Check if user exists
    const existingUser = await pool.query("SELECT id FROM users WHERE email = $1", [email])

    if (existingUser.rows.length > 0) {
      return res.status(409).json({ error: "User already exists" })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create tenant and user in transaction
    const client = await pool.connect()
    try {
      await client.query("BEGIN")

      // Create tenant
      const tenantResult = await client.query(
        "INSERT INTO tenants (name, created_at) VALUES ($1, NOW()) RETURNING id",
        [tenant_name],
      )
      const tenantId = tenantResult.rows[0].id

      // Create user
      const userResult = await client.query(
        "INSERT INTO users (email, password, role, tenant_id, created_at) VALUES ($1, $2, $3, $4, NOW()) RETURNING id, email, role, tenant_id",
        [email, hashedPassword, role, tenantId],
      )

      await client.query("COMMIT")

      const user = userResult.rows[0]

      // Generate JWT
      const token = jwt.sign({ userId: user.id, role: user.role, tenantId: user.tenant_id }, process.env.JWT_SECRET, {
        expiresIn: "24h",
      })

      // Publish event
      await publishEvent("user.registered", {
        userId: user.id,
        email: user.email,
        tenantId: user.tenant_id,
        timestamp: new Date().toISOString(),
      })

      res.status(201).json({
        message: "User registered successfully",
        token,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          tenant_id: user.tenant_id,
        },
      })
    } catch (error) {
      await client.query("ROLLBACK")
      throw error
    } finally {
      client.release()
    }
  } catch (error) {
    next(error)
  }
})

// Login
router.post("/login", async (req, res, next) => {
  try {
    const { error, value } = loginSchema.validate(req.body)
    if (error) throw error

    const { email, password } = value

    // Find user
    const result = await pool.query("SELECT id, email, password, role, tenant_id FROM users WHERE email = $1", [email])

    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Invalid credentials" })
    }

    const user = result.rows[0]

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password)
    if (!isValidPassword) {
      return res.status(401).json({ error: "Invalid credentials" })
    }

    // Generate JWT
    const token = jwt.sign({ userId: user.id, role: user.role, tenantId: user.tenant_id }, process.env.JWT_SECRET, {
      expiresIn: "24h",
    })

    // Publish event
    await publishEvent("user.logged_in", {
      userId: user.id,
      email: user.email,
      timestamp: new Date().toISOString(),
    })

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        tenant_id: user.tenant_id,
      },
    })
  } catch (error) {
    next(error)
  }
})

module.exports = router
