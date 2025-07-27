const express = require("express")
const Joi = require("joi")
const { authenticateToken, authorizeRole } = require("../middleware/auth")
const logger = require("../config/logger") // Assuming you have a logger config

const router = express.Router()

// Joi schema for project creation/update
const projectSchema = Joi.object({
  name: Joi.string().min(3).max(255).required(),
  description: Joi.string().max(1000).allow(""),
  status: Joi.string().valid("pending", "in-progress", "completed").default("pending"),
})

// Get all projects (with Redis caching)
router.get("/", authenticateToken, async (req, res, next) => {
  try {
    const { pool, redisClient } = req
    const userId = req.user.id
    const userRole = req.user.role

    const cacheKey = `projects:${userId}`

    // Try to get from cache
    const cachedProjects = await redisClient.get(cacheKey)
    if (cachedProjects) {
      logger.info(`Projects for user ${userId} served from Redis cache`)
      return res.status(200).json(JSON.parse(cachedProjects))
    }

    let query =
      "SELECT id, name, description, status, created_at, updated_at FROM projects WHERE user_id = $1 ORDER BY created_at DESC"
    let params = [userId]

    // Admins can see all projects
    if (userRole === "admin") {
      query = "SELECT id, name, description, status, created_at, updated_at FROM projects ORDER BY created_at DESC"
      params = []
    }

    const result = await pool.query(query, params)
    const projects = result.rows

    // Cache the result for 1 minute (60 seconds)
    await redisClient.setEx(cacheKey, 60, JSON.stringify(projects))
    logger.info(`Projects for user ${userId} fetched from DB and cached`)

    res.status(200).json(projects)
  } catch (err) {
    next(err)
  }
})

// Get a single project
router.get("/:id", authenticateToken, async (req, res, next) => {
  try {
    const { pool } = req
    const { id } = req.params
    const userId = req.user.id
    const userRole = req.user.role

    let query =
      "SELECT id, name, description, status, created_at, updated_at FROM projects WHERE id = $1 AND user_id = $2"
    let params = [id, userId]

    if (userRole === "admin") {
      query = "SELECT id, name, description, status, created_at, updated_at FROM projects WHERE id = $1"
      params = [id]
    }

    const result = await pool.query(query, params)
    const project = result.rows[0]

    if (!project) {
      return res.status(404).json({ message: "Project not found or you do not have access" })
    }

    res.status(200).json(project)
  } catch (err) {
    next(err)
  }
})

// Create a new project (Admin only)
router.post("/", authenticateToken, authorizeRole(["admin"]), async (req, res, next) => {
  try {
    const { error, value } = projectSchema.validate(req.body)
    if (error) {
      error.statusCode = 400
      throw error
    }

    const { name, description, status } = value
    const { pool, redisClient, kafkaProducer } = req
    const userId = req.user.id // Associate project with the creating admin user

    const result = await pool.query(
      "INSERT INTO projects (name, description, status, user_id) VALUES ($1, $2, $3, $4) RETURNING id, name, description, status, created_at, updated_at",
      [name, description, status, userId],
    )
    const newProject = result.rows[0]

    // Invalidate cache for all users (or specific user if not admin)
    await redisClient.del(`projects:${userId}`) // Invalidate cache for the creating user
    // If admin creates, it might affect other admin views, so a more general invalidation might be needed
    // For simplicity, we'll just invalidate the creating user's cache.

    // Publish Kafka event
    await kafkaProducer.send({
      topic: "project-events",
      messages: [
        {
          key: newProject.id.toString(),
          value: JSON.stringify({
            type: "PROJECT_CREATED",
            projectId: newProject.id,
            projectName: newProject.name,
            userId: userId,
            timestamp: new Date().toISOString(),
          }),
        },
      ],
    })
    logger.info(`Project created: ${newProject.name} by user ${userId}`)

    res.status(201).json(newProject)
  } catch (err) {
    next(err)
  }
})

// Update a project (Admin only)
router.put("/:id", authenticateToken, authorizeRole(["admin"]), async (req, res, next) => {
  try {
    const { error, value } = projectSchema.validate(req.body)
    if (error) {
      error.statusCode = 400
      throw error
    }

    const { name, description, status } = value
    const { pool, redisClient, kafkaProducer } = req
    const { id } = req.params
    const userId = req.user.id

    const result = await pool.query(
      "UPDATE projects SET name = $1, description = $2, status = $3, updated_at = NOW() WHERE id = $4 RETURNING id, name, description, status, created_at, updated_at",
      [name, description, status, id],
    )
    const updatedProject = result.rows[0]

    if (!updatedProject) {
      return res.status(404).json({ message: "Project not found" })
    }

    // Invalidate cache for all users (or specific user if not admin)
    await redisClient.del(`projects:${userId}`) // Invalidate cache for the updating user

    // Publish Kafka event
    await kafkaProducer.send({
      topic: "project-events",
      messages: [
        {
          key: updatedProject.id.toString(),
          value: JSON.stringify({
            type: "PROJECT_UPDATED",
            projectId: updatedProject.id,
            projectName: updatedProject.name,
            userId: userId,
            timestamp: new Date().toISOString(),
          }),
        },
      ],
    })
    logger.info(`Project updated: ${updatedProject.name} (ID: ${updatedProject.id}) by user ${userId}`)

    res.status(200).json(updatedProject)
  } catch (err) {
    next(err)
  }
})

// Delete a project (Admin only)
router.delete("/:id", authenticateToken, authorizeRole(["admin"]), async (req, res, next) => {
  try {
    const { pool, redisClient, kafkaProducer } = req
    const { id } = req.params
    const userId = req.user.id

    // First, delete associated tasks
    await pool.query("DELETE FROM tasks WHERE project_id = $1", [id])

    const result = await pool.query("DELETE FROM projects WHERE id = $1 RETURNING id, name", [id])
    const deletedProject = result.rows[0]

    if (!deletedProject) {
      return res.status(404).json({ message: "Project not found" })
    }

    // Invalidate cache for all users (or specific user if not admin)
    await redisClient.del(`projects:${userId}`) // Invalidate cache for the deleting user

    // Publish Kafka event
    await kafkaProducer.send({
      topic: "project-events",
      messages: [
        {
          key: deletedProject.id.toString(),
          value: JSON.stringify({
            type: "PROJECT_DELETED",
            projectId: deletedProject.id,
            projectName: deletedProject.name,
            userId: userId,
            timestamp: new Date().toISOString(),
          }),
        },
      ],
    })
    logger.info(`Project deleted: ${deletedProject.name} (ID: ${deletedProject.id}) by user ${userId}`)

    res.status(204).send() // No content
  } catch (err) {
    next(err)
  }
})

module.exports = router
