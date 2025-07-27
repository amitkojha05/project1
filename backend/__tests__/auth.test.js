const request = require("supertest")
const express = require("express")
const authRoutes = require("../routes/auth")

const app = express()
app.use(express.json())
app.use("/auth", authRoutes)

describe("Auth Routes", () => {
  describe("POST /auth/register", () => {
    it("should register a new user", async () => {
      const userData = {
        email: "test@example.com",
        password: "password123",
        role: "user",
      }

      const response = await request(app).post("/auth/register").send(userData).expect(201)

      expect(response.body).toHaveProperty("token")
      expect(response.body.user.email).toBe(userData.email)
      expect(response.body.user.role).toBe(userData.role)
    })

    it("should return validation error for invalid email", async () => {
      const userData = {
        email: "invalid-email",
        password: "password123",
      }

      const response = await request(app).post("/auth/register").send(userData).expect(400)

      expect(response.body).toHaveProperty("error")
    })
  })

  describe("POST /auth/login", () => {
    it("should login with valid credentials", async () => {
      const loginData = {
        email: "admin@acme.com",
        password: "admin123",
      }

      const response = await request(app).post("/auth/login").send(loginData).expect(200)

      expect(response.body).toHaveProperty("token")
      expect(response.body.user.email).toBe(loginData.email)
    })

    it("should return error for invalid credentials", async () => {
      const loginData = {
        email: "admin@acme.com",
        password: "wrongpassword",
      }

      const response = await request(app).post("/auth/login").send(loginData).expect(401)

      expect(response.body).toHaveProperty("error")
    })
  })
})
