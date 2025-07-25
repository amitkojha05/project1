const request = require("supertest")
const app = require("../server")

describe("Tasks", () => {
  let adminToken
  let userToken
  let projectId

  beforeAll(async () => {
    // Login as admin
    const adminLogin = await request(app).post("/api/auth/login").send({
      email: "admin@acme.com",
      password: "admin123",
    })
    adminToken = adminLogin.body.token

    // Login as user
    const userLogin = await request(app).post("/api/auth/login").send({
      email: "user@acme.com",
      password: "admin123",
    })
    userToken = userLogin.body.token

    // Create a test project
    const projectResponse = await request(app).post("/api/projects").set("Authorization", `Bearer ${adminToken}`).send({
      name: "Test Project for Tasks",
      description: "Test project description",
    })
    projectId = projectResponse.body.project.id
  })

  describe("GET /api/tasks/project/:projectId", () => {
    it("should get tasks for authenticated user", async () => {
      const response = await request(app)
        .get(`/api/tasks/project/${projectId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200)

      expect(response.body).toHaveProperty("tasks")
      expect(Array.isArray(response.body.tasks)).toBe(true)
    })

    it("should not get tasks without authentication", async () => {
      await request(app).get(`/api/tasks/project/${projectId}`).expect(401)
    })
  })

  describe("POST /api/tasks/project/:projectId", () => {
    it("should create task as admin", async () => {
      const taskData = {
        title: "Test Task",
        description: "Test task description",
        status: "todo",
        priority: "medium",
      }

      const response = await request(app)
        .post(`/api/tasks/project/${projectId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send(taskData)
        .expect(201)

      expect(response.body).toHaveProperty("task")
      expect(response.body.task.title).toBe(taskData.title)
    })

    it("should not create task as user", async () => {
      const taskData = {
        title: "Test Task",
        description: "Test task description",
      }

      await request(app)
        .post(`/api/tasks/project/${projectId}`)
        .set("Authorization", `Bearer ${userToken}`)
        .send(taskData)
        .expect(403)
    })
  })
})
