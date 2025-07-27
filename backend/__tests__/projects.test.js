const request = require("supertest")
const express = require("express")
const jwt = require("jsonwebtoken")
const projectRoutes = require("../routes/projects")

const app = express()
app.use(express.json())
app.use("/projects", projectRoutes)

// Mock admin token
const adminToken = jwt.sign(
  { userId: 1, email: "admin@acme.com", role: "admin" },
  process.env.JWT_SECRET || "test-secret",
)

describe("Project Routes", () => {
  describe("GET /projects", () => {
    it("should get all projects for authenticated user", async () => {
      const response = await request(app).get("/projects").set("Authorization", `Bearer ${adminToken}`).expect(200)

      expect(response.body).toHaveProperty("projects")
      expect(Array.isArray(response.body.projects)).toBe(true)
    })

    it("should return 401 without token", async () => {
      await request(app).get("/projects").expect(401)
    })
  })

  describe("POST /projects", () => {
    it("should create a new project", async () => {
      const projectData = {
        name: "Test Project",
        description: "Test project description",
        status: "active",
      }

      const response = await request(app)
        .post("/projects")
        .set("Authorization", `Bearer ${adminToken}`)
        .send(projectData)
        .expect(201)

      expect(response.body.project.name).toBe(projectData.name)
      expect(response.body.project.description).toBe(projectData.description)
    })

    it("should return validation error for invalid data", async () => {
      const projectData = {
        name: "", // Invalid empty name
        description: "Test description",
      }

      await request(app).post("/projects").set("Authorization", `Bearer ${adminToken}`).send(projectData).expect(400)
    })
  })
})
