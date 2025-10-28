import "reflect-metadata";
import express from "express";
import { config } from "dotenv";
import { AppDataSource } from "./data-source";
import { RedisClient } from "./cache/RedisClient";

// Load environment variables
config();

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get("/health", (req, res) => {
  const redis = RedisClient.getInstance();
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    database: AppDataSource.isInitialized ? "connected" : "disconnected",
    redis: redis.getClient().status,
  });
});

// Basic route
app.get("/", (req, res) => {
  res.json({ message: "Express Monolith API" });
});

// Initialize database and start server
const startServer = async () => {
  try {
    // Initialize the database connection
    await AppDataSource.initialize();
    console.log("📊 Database connected successfully");

    // Initialize Redis connection
    const redis = RedisClient.getInstance();
    await redis.getClient().ping();
    console.log("🔴 Redis connected successfully");

    // Start the Express server
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error("❌ Error during initialization:", error);
    process.exit(1);
  }
};

startServer();

export default app;
