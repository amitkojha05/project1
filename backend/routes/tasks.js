const express = require("express")
const Joi = require("joi")
const { authenticateToken, authorizeRole } = require("../middleware/auth")
const logger = require("../config/logger") // Assuming you have a logger config

const router = express.Router()

// Joi schema for task creation/update
const taskSchema = Joi.object({
  project_id: Joi.number().integer().required(),
  title: Joi.string().min(3).max(255).required(),
  description: Joi.string().max(1000).allow(""),
  status: Joi.string().valid("todo", "in-progress", "done").default("todo"),
  due_date: Joi.date().allow(null),
})

// Get all tasks for a project (User and Admin)
router.get("/project/:projectId", authenticateToken, async (req, res, next) => {
  try {
    const { pool } = req
    const { projectId } = req.params
    const userId = req.user.id
    const userRole = req.user.role

    // First, verify user has access to the project
    let projectQuery = "SELECT id FROM projects WHERE id = $1 AND user_id = $2"
    let projectParams = [projectId, userId]

    if (userRole === "admin") {
      projectQuery = "SELECT id FROM projects WHERE id = $1"
      projectParams = [projectId]
    }

    const projectResult = await pool.query(projectQuery, projectParams)
    if (projectResult.rows.length === 0) {
      return res.status(404).json({ message: "Project not found or you do not have access" })
    }

    const result = await pool.query(
      "SELECT id, project_id, title, description, status, due_date, created_at, updated_at FROM tasks WHERE project_id = $1 ORDER BY created_at DESC",
      [projectId],
    )
    res.status(200).json(result.rows)
  } catch (err) {
    next(err)
  }
})

// Get a single task (User and Admin)
router.get("/:id", authenticateToken, async (req, res, next) => {
  try {
    const { pool } = req
    const { id } = req.params
    const userId = req.user.id
    const userRole = req.user.role

    const result = await pool.query(
      `SELECT t.id, t.project_id, t.title, t.description, t.status, t.due_date, t.created_at, t.updated_at
       FROM tasks t
       JOIN projects p ON t.project_id = p.id
       WHERE t.id = $1 AND (p.user_id = $2 OR $3 = 'admin')`,
      [id, userId, userRole],
    )
    const task = result.rows[0]

    if (!task) {
      return res.status(404).json({ message: "Task not found or you do not have access" })
    }

    res.status(200).json(task)
  } catch (err) {
    next(err)
  }
})

// Create a new task (Admin only)
router.post("/", authenticateToken, authorizeRole(["admin"]), async (req, res, next) => {
  try {
    const { error, value } = taskSchema.validate(req.body)
    if (error) {
      error.statusCode = 400
      throw error
    }

    const { project_id, title, description, status, due_date } = value
    const { pool, kafkaProducer } = req
    const userId = req.user.id

    // Verify project exists and belongs to an admin (or is generally accessible if admin creates)
    const projectResult = await pool.query("SELECT id FROM projects WHERE id = $1", [project_id])
    if (projectResult.rows.length === 0) {
      return res.status(404).json({ message: "Project not found" })
    }

    const result = await pool.query(
      "INSERT INTO tasks (project_id, title, description, status, due_date) VALUES ($1, $2, $3, $4, $5) RETURNING id, project_id, title, description, status, due_date, created_at, updated_at",
      [project_id, title, description, status, due_date],
    )
    const newTask = result.rows[0]

    // Publish Kafka event
    await kafkaProducer.send({
      topic: "task-events",
      messages: [
        {
          key: newTask.id.toString(),
          value: JSON.stringify({
            type: "TASK_CREATED",
            taskId: newTask.id,
            projectId: newTask.project_id,
            title: newTask.title,
            userId: userId,
            timestamp: new Date().toISOString(),
          }),
        },
      ],
    })
    logger.info(`Task created: ${newTask.title} for project ${newTask.project_id} by user ${userId}`)

    res.status(201).json(newTask)
  } catch (err) {
    next(err)
  }
})

// Update a task (Admin only)
router.put("/:id", authenticateToken, authorizeRole(["admin"]), async (req, res, next) => {
  try {
    const { error, value } = taskSchema.validate(req.body)
    if (error) {
      error.statusCode = 400
      throw error
    }

    const { project_id, title, description, status, due_date } = value
    const { pool, kafkaProducer } = req
    const { id } = req.params
    const userId = req.user.id

    // Verify project exists and belongs to an admin (or is generally accessible if admin updates)
    const projectResult = await pool.query("SELECT id FROM projects WHERE id = $1", [project_id])
    if (projectResult.rows.length === 0) {
      return res.status(404).json({ message: "Project not found" })
    }

    const result = await pool.query(
      "UPDATE tasks SET project_id = $1, title = $2, description = $3, status = $4, due_date = $5, updated_at = NOW() WHERE id = $6 RETURNING id, project_id, title, description, status, due_date, created_at, updated_at",
      [project_id, title, description, status, due_date, id],
    )
    const updatedTask = result.rows[0]

    if (!updatedTask) {
      return res.status(404).json({ message: "Task not found" })
    }

    // Publish Kafka event
    await kafkaProducer.send({
      topic: "task-events",
      messages: [
        {
          key: updatedTask.id.toString(),
          value: JSON.stringify({
            type: "TASK_UPDATED",
            taskId: updatedTask.id,
            projectId: updatedTask.project_id,
            title: updatedTask.title,
            userId: userId,
            timestamp: new Date().toISOString(),
          }),
        },
      ],
    })
    logger.info(
      `Task updated: ${updatedTask.title} (ID: ${updatedTask.id}) for project ${updatedTask.project_id} by user ${userId}`,
    )

    res.status(200).json(updatedTask)
  } catch (err) {
    next(err)
  }
})

// Delete a task (Admin only)
router.delete("/:id", authenticateToken, authorizeRole(["admin"]), async (req, res, next) => {
  try {
    const { pool, kafkaProducer } = req
    const { id } = req.params
    const userId = req.user.id

    const result = await pool.query("DELETE FROM tasks WHERE id = $1 RETURNING id, title, project_id", [id])
    const deletedTask = result.rows[0]

    if (!deletedTask) {
      return res.status(404).json({ message: "Task not found" })
    }

    // Publish Kafka event
    await kafkaProducer.send({
      topic: "task-events",
      messages: [
        {
          key: deletedTask.id.toString(),
          value: JSON.stringify({
            type: "TASK_DELETED",
            taskId: deletedTask.id,
            projectId: deletedTask.project_id,
            title: deletedTask.title,
            userId: userId,
            timestamp: new Date().toISOString(),
          }),
        },
      ],
    })
    logger.info(
      `Task deleted: ${deletedTask.title} (ID: ${deletedTask.id}) from project ${deletedTask.project_id} by user ${userId}`,
    )

    res.status(204).send() // No content
  } catch (err) {
    next(err)
  }
})

module.exports = router
