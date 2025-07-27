const { Kafka } = require("kafkajs")
const logger = require("./logger") // Assuming you have a logger config

const kafka = new Kafka({
  clientId: "projecthub-backend",
  brokers: [process.env.KAFKA_BROKER || "localhost:9092"],
})

const producer = kafka.producer()

// Connect producer on module load
producer
  .connect()
  .then(() => {
    logger.info("Kafka Producer connected")
  })
  .catch((err) => {
    logger.error("Kafka Producer connection failed", err)
  })

// Disconnect producer on process exit
process.on("beforeExit", async () => {
  try {
    await producer.disconnect()
    logger.info("Kafka Producer disconnected")
  } catch (error) {
    logger.error("Error disconnecting Kafka Producer", error)
  }
})

module.exports = producer
