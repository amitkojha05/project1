const express = require("express")
const Joi = require("joi")
const { pool } = require("../config/database")
const { getRedisClient } = require("../config/redis")
const { publishEvent } = require("../config/kafka")
const { authenticateToken, requireRole } = require("../middleware/auth")

const router = express.Router()

const projectSchema = Joi.object({
  name: Joi.string().required(),
  description: Joi.string().allow(""),
  status: Joi.string().valid("active", "completed", "on_hold").default("active"),
})

// Apply authentication to all routes
router.use(authenticateToken)

// Get all projects (with caching)
router.get("/", async (req, res, next) => {
  try {
    const cacheKey = `projects:${req.user.tenant_id}`
    const redis = getRedisClient()

    // Try to get from cache
    const cached = await redis.get(cacheKey)
    if (cached) {
      return res.json({
        projects: JSON.parse(cached),
        cached: true,
      })
    }

    // Get from database
    const result = await pool.query(
      "SELECT id, name, description, status, created_at, updated_at FROM projects WHERE tenant_id = $1 ORDER BY created_at DESC",
      [req.user.tenant_id],
    )

    const projects = result.rows

    // Cache for 1 minute
    await redis.setEx(cacheKey, 60, JSON.stringify(projects))

    res.json({ projects, cached: false })
  } catch (error) {
    next(error)
  }
})

// Get single project
router.get("/:id", async (req, res, next) => {
  try {
    const result = await pool.query(
      "SELECT id, name, description, status, created_at, updated_at FROM projects WHERE id = $1 AND tenant_id = $2",
      [req.params.id, req.user.tenant_id],
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Project not found" })
    }

    res.json({ project: result.rows[0] })
  } catch (error) {
    next(error)
  }
})

// Create project (admin only)
router.post("/", requireRole(["admin"]), async (req, res, next) => {
  try {
    const { error, value } = projectSchema.validate(req.body)
    if (error) throw error

    const { name, description, status } = value

    const result = await pool.query(
      "INSERT INTO projects (name, description, status, tenant_id, created_by, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, NOW(), NOW()) RETURNING *",
      [name, description, status, req.user.tenant_id, req.user.id],
    )

    const project = result.rows[0]

    // Clear cache
    const redis = getRedisClient()
    await redis.del(`projects:${req.user.tenant_id}`)

    // Publish event
    await publishEvent("project.created", {
      projectId: project.id,
      name: project.name,
      tenantId: req.user.tenant_id,
      createdBy: req.user.id,
      timestamp: new Date().toISOString(),
    })

    res.status(201).json({
      message: "Project created successfully",
      project,
    })
  } catch (error) {
    next(error)
  }
})

// Update project (admin only)
router.put("/:id", requireRole(["admin"]), async (req, res, next) => {
  try {
    const { error, value } = projectSchema.validate(req.body)
    if (error) throw error

    const { name, description, status } = value

    const result = await pool.query(
      "UPDATE projects SET name = $1, description = $2, status = $3, updated_at = NOW() WHERE id = $4 AND tenant_id = $5 RETURNING *",
      [name, description, status, req.params.id, req.user.tenant_id],
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Project not found" })
    }

    const project = result.rows[0]

    // Clear cache
    const redis = getRedisClient()
    await redis.del(`projects:${req.user.tenant_id}`)

    // Publish event
    await publishEvent("project.updated", {
      projectId: project.id,
      name: project.name,
      tenantId: req.user.tenant_id,
      updatedBy: req.user.id,
      timestamp: new Date().toISOString(),
    })

    res.json({
      message: "Project updated successfully",
      project,
    })
  } catch (error) {
    next(error)
  }
})

// Delete project (admin only)
router.delete("/:id", requireRole(["admin"]), async (req, res, next) => {
  try {
    const result = await pool.query("DELETE FROM projects WHERE id = $1 AND tenant_id = $2 RETURNING id, name", [
      req.params.id,
      req.user.tenant_id,
    ])

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Project not found" })
    }

    const project = result.rows[0]

    // Clear cache
    const redis = getRedisClient()
    await redis.del(`projects:${req.user.tenant_id}`)

    // Publish event
    await publishEvent("project.deleted", {
      projectId: project.id,
      name: project.name,
      tenantId: req.user.tenant_id,
      deletedBy: req.user.id,
      timestamp: new Date().toISOString(),
    })

    res.json({ message: "Project deleted successfully" })
  } catch (error) {
    next(error)
  }
})

module.exports = router
