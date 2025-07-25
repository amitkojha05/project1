const request = require("supertest")
const app = require("../server")

describe("Authentication", () => {
  describe("POST /api/auth/register", () => {
    it("should register a new user", async () => {
      const userData = {
        email: "test@example.com",
        password: "password123",
        role: "user",
        tenant_name: "Test Company",
      }

      const response = await request(app).post("/api/auth/register").send(userData).expect(201)

      expect(response.body).toHaveProperty("token")
      expect(response.body).toHaveProperty("user")
      expect(response.body.user.email).toBe(userData.email)
    })

    it("should not register user with invalid email", async () => {
      const userData = {
        email: "invalid-email",
        password: "password123",
        tenant_name: "Test Company",
      }

      const response = await request(app).post("/api/auth/register").send(userData).expect(400)

      expect(response.body).toHaveProperty("error")
    })
  })

  describe("POST /api/auth/login", () => {
    it("should login with valid credentials", async () => {
      const loginData = {
        email: "admin@acme.com",
        password: "admin123",
      }

      const response = await request(app).post("/api/auth/login").send(loginData).expect(200)

      expect(response.body).toHaveProperty("token")
      expect(response.body).toHaveProperty("user")
    })

    it("should not login with invalid credentials", async () => {
      const loginData = {
        email: "admin@acme.com",
        password: "wrongpassword",
      }

      const response = await request(app).post("/api/auth/login").send(loginData).expect(401)

      expect(response.body).toHaveProperty("error")
    })
  })
})
