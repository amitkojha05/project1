const { Kafka } = require("kafkajs")

let kafka
let producer
let consumer

const connectKafka = async () => {
  try {
    kafka = new Kafka({
      clientId: "projecthub-api",
      brokers: [process.env.KAFKA_BROKERS || "localhost:9092"],
    })

    producer = kafka.producer()
    await producer.connect()

    consumer = kafka.consumer({ groupId: "projecthub-group" })
    await consumer.connect()

    console.log("✅ Kafka connected successfully")
  } catch (error) {
    console.error("❌ Kafka connection failed:", error)
    throw error
  }
}

const publishEvent = async (topic, message) => {
  try {
    await producer.send({
      topic,
      messages: [
        {
          key: message.id || Date.now().toString(),
          value: JSON.stringify(message),
          timestamp: Date.now().toString(),
        },
      ],
    })
  } catch (error) {
    console.error("Failed to publish event:", error)
  }
}

module.exports = { connectKafka, publishEvent }
