const express = require("express")
const Joi = require("joi")
const { pool } = require("../config/database")
const { publishEvent } = require("../config/kafka")
const { authenticateToken, requireRole } = require("../middleware/auth")

const router = express.Router()

const taskSchema = Joi.object({
  title: Joi.string().required(),
  description: Joi.string().allow(""),
  status: Joi.string().valid("todo", "in_progress", "completed").default("todo"),
  priority: Joi.string().valid("low", "medium", "high").default("medium"),
  due_date: Joi.date().allow(null),
})

// Apply authentication to all routes
router.use(authenticateToken)

// Get all tasks for a project
router.get("/project/:projectId", async (req, res, next) => {
  try {
    // Verify project belongs to user's tenant
    const projectCheck = await pool.query("SELECT id FROM projects WHERE id = $1 AND tenant_id = $2", [
      req.params.projectId,
      req.user.tenant_id,
    ])

    if (projectCheck.rows.length === 0) {
      return res.status(404).json({ error: "Project not found" })
    }

    const result = await pool.query(
      "SELECT id, title, description, status, priority, due_date, created_at, updated_at FROM tasks WHERE project_id = $1 ORDER BY created_at DESC",
      [req.params.projectId],
    )

    res.json({ tasks: result.rows })
  } catch (error) {
    next(error)
  }
})

// Get single task
router.get("/:id", async (req, res, next) => {
  try {
    const result = await pool.query(
      `
      SELECT t.id, t.title, t.description, t.status, t.priority, t.due_date, t.created_at, t.updated_at, t.project_id
      FROM tasks t
      JOIN projects p ON t.project_id = p.id
      WHERE t.id = $1 AND p.tenant_id = $2
    `,
      [req.params.id, req.user.tenant_id],
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Task not found" })
    }

    res.json({ task: result.rows[0] })
  } catch (error) {
    next(error)
  }
})

// Create task (admin only)
router.post("/project/:projectId", requireRole(["admin"]), async (req, res, next) => {
  try {
    const { error, value } = taskSchema.validate(req.body)
    if (error) throw error

    // Verify project belongs to user's tenant
    const projectCheck = await pool.query("SELECT id FROM projects WHERE id = $1 AND tenant_id = $2", [
      req.params.projectId,
      req.user.tenant_id,
    ])

    if (projectCheck.rows.length === 0) {
      return res.status(404).json({ error: "Project not found" })
    }

    const { title, description, status, priority, due_date } = value

    const result = await pool.query(
      "INSERT INTO tasks (title, description, status, priority, due_date, project_id, created_by, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW()) RETURNING *",
      [title, description, status, priority, due_date, req.params.projectId, req.user.id],
    )

    const task = result.rows[0]

    // Publish event
    await publishEvent("task.created", {
      taskId: task.id,
      title: task.title,
      projectId: req.params.projectId,
      tenantId: req.user.tenant_id,
      createdBy: req.user.id,
      timestamp: new Date().toISOString(),
    })

    res.status(201).json({
      message: "Task created successfully",
      task,
    })
  } catch (error) {
    next(error)
  }
})

// Update task (admin only)
router.put("/:id", requireRole(["admin"]), async (req, res, next) => {
  try {
    const { error, value } = taskSchema.validate(req.body)
    if (error) throw error

    const { title, description, status, priority, due_date } = value

    const result = await pool.query(
      `
      UPDATE tasks SET 
        title = $1, 
        description = $2, 
        status = $3, 
        priority = $4, 
        due_date = $5, 
        updated_at = NOW() 
      FROM projects p 
      WHERE tasks.id = $6 
        AND tasks.project_id = p.id 
        AND p.tenant_id = $7 
      RETURNING tasks.*
    `,
      [title, description, status, priority, due_date, req.params.id, req.user.tenant_id],
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Task not found" })
    }

    const task = result.rows[0]

    // Publish event
    await publishEvent("task.updated", {
      taskId: task.id,
      title: task.title,
      projectId: task.project_id,
      tenantId: req.user.tenant_id,
      updatedBy: req.user.id,
      timestamp: new Date().toISOString(),
    })

    res.json({
      message: "Task updated successfully",
      task,
    })
  } catch (error) {
    next(error)
  }
})

// Delete task (admin only)
router.delete("/:id", requireRole(["admin"]), async (req, res, next) => {
  try {
    const result = await pool.query(
      `
      DELETE FROM tasks 
      USING projects p 
      WHERE tasks.id = $1 
        AND tasks.project_id = p.id 
        AND p.tenant_id = $2 
      RETURNING tasks.id, tasks.title, tasks.project_id
    `,
      [req.params.id, req.user.tenant_id],
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Task not found" })
    }

    const task = result.rows[0]

    // Publish event
    await publishEvent("task.deleted", {
      taskId: task.id,
      title: task.title,
      projectId: task.project_id,
      tenantId: req.user.tenant_id,
      deletedBy: req.user.id,
      timestamp: new Date().toISOString(),
    })

    res.json({ message: "Task deleted successfully" })
  } catch (error) {
    next(error)
  }
})

module.exports = router
