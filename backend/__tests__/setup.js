const { connectDB } = require("../config/database")
const jest = require("jest")

beforeAll(async () => {
  await connectDB()
})

// Mock Redis for tests
jest.mock("../config/redis", () => ({
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
  flushPattern: jest.fn(),
}))

// Mock Kafka for tests
jest.mock("../config/kafka", () => ({
  publishEvent: jest.fn(),
}))
