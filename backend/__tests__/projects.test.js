const request = require("supertest")
const app = require("../server")

describe("Projects", () => {
  let adminToken
  let userToken

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
  })

  describe("GET /api/projects", () => {
    it("should get projects for authenticated user", async () => {
      const response = await request(app).get("/api/projects").set("Authorization", `Bearer ${adminToken}`).expect(200)

      expect(response.body).toHaveProperty("projects")
      expect(Array.isArray(response.body.projects)).toBe(true)
    })

    it("should not get projects without authentication", async () => {
      await request(app).get("/api/projects").expect(401)
    })
  })

  describe("POST /api/projects", () => {
    it("should create project as admin", async () => {
      const projectData = {
        name: "Test Project",
        description: "Test project description",
        status: "active",
      }

      const response = await request(app)
        .post("/api/projects")
        .set("Authorization", `Bearer ${adminToken}`)
        .send(projectData)
        .expect(201)

      expect(response.body).toHaveProperty("project")
      expect(response.body.project.name).toBe(projectData.name)
    })

    it("should not create project as user", async () => {
      const projectData = {
        name: "Test Project",
        description: "Test project description",
      }

      await request(app).post("/api/projects").set("Authorization", `Bearer ${userToken}`).send(projectData).expect(403)
    })
  })
})
