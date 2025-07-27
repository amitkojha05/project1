const request = require("supertest")
const express = require("express")
const jwt = require("jsonwebtoken")
const taskRoutes = require("../routes/tasks")

const app = express()
app.use(express.json())
app.use("/tasks", taskRoutes)

// Mock admin token
const adminToken = jwt.sign(
  { userId: 1, email: "admin@acme.com", role: "admin" },
  process.env.JWT_SECRET || "test-secret",
)

describe("Task Routes", () => {
  describe("GET /tasks/project/:projectId", () => {
    it("should get all tasks for a project", async () => {
      const response = await request(app)
        .get("/tasks/project/1")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200)

      expect(response.body).toHaveProperty("tasks")
      expect(Array.isArray(response.body.tasks)).toBe(true)
    })

    it("should return 401 without token", async () => {
      await request(app).get("/tasks/project/1").expect(401)
    })
  })

  describe("POST /tasks/project/:projectId", () => {
    it("should create a new task", async () => {
      const taskData = {
        title: "Test Task",
        description: "Test task description",
        status: "todo",
        priority: "medium",
      }

      const response = await request(app)
        .post("/tasks/project/1")
        .set("Authorization", `Bearer ${adminToken}`)
        .send(taskData)
        .expect(201)

      expect(response.body.task.title).toBe(taskData.title)
      expect(response.body.task.description).toBe(taskData.description)
    })

    it("should return validation error for invalid data", async () => {
      const taskData = {
        title: "", // Invalid empty title
        description: "Test description",
      }

      await request(app)
        .post("/tasks/project/1")
        .set("Authorization", `Bearer ${adminToken}`)
        .send(taskData)
        .expect(400)
    })
  })
})
