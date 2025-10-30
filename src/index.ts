import "reflect-metadata";
import express from "express";
import cors from "cors";
import session from "express-session";
import RedisStore from "connect-redis";
import { config } from "dotenv";
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@as-integrations/express5";
import { AppDataSource } from "./data-source";
import { RedisClient } from "./cache/RedisClient";
import { verifyBearer, requireBearerRoles } from "./auth/middleware";
import { authRoutes, productRoutes, categoryRoutes, adminUserRoutes, adminCategoryRoutes, adminProductRoutes, adminWalletRoutes, adminOrderRoutes, adminOrderItemRoutes, adminCartRoutes } from "./rest";
import { typeDefs, resolvers } from "./graphql";

config();

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session middleware with Redis - will be set up after Redis connection
let sessionMiddleware: any;

// Health check endpoint
app.get("/health", (_, res) => {
  const redis = RedisClient.getInstance();
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    database: AppDataSource.isInitialized ? "connected" : "disconnected",
    redis: redis.getClient().status,
  });
});

// Routes will be added after session middleware is set up

// Legacy JWT route (keeping for backward compatibility)
app.get(
  "/api/testRole",
  verifyBearer,
  requireBearerRoles(["admin"]),
  (req, res) => res.json({ ok: true })
);

// Basic route
app.get("/", (_, res) => {
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
    const redisClient = redis.getClient();

    // Test Redis connection
    await redisClient.ping();
    console.log("🔴 Redis connected successfully");

    // Set up session middleware after Redis is connected
    const RedisStoreClass = RedisStore(session);
    sessionMiddleware = session({
      store: new RedisStoreClass({
        client: redisClient,
        prefix: "sess:",
        ttl: 24 * 60 * 60, // 24 hours in seconds
      }),
      secret:
        process.env.SESSION_SECRET || "your-secret-key-change-in-production",
      resave: false,
      saveUninitialized: false,
      name: "connect.sid",
      cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
      },
    });

    // Apply session middleware
    app.use(sessionMiddleware);

    // Create Apollo Server
    const server = new ApolloServer({
      typeDefs,
      resolvers,
    });

    // Start Apollo Server
    await server.start();

    // Apply GraphQL middleware
    app.use(
      "/graphql",
      cors<cors.CorsRequest>({
        origin: true,
        credentials: true,
      }),
      express.json(),
      expressMiddleware(server, {
        context: async ({ req, res }) => {
          return {
            req,
            res,
            session: req.session,
            user: req.session?.user || null,
          };
        },
      })
    );

    // Add routes after session middleware
    app.use("/api", authRoutes);
    
    // Public/User routes
    app.use("/api/products", productRoutes);
    app.use("/api/categories", categoryRoutes);
    
    // Admin routes
    app.use("/api/admin/users", adminUserRoutes);
    app.use("/api/admin/categories", adminCategoryRoutes);
    app.use("/api/admin/products", adminProductRoutes);
    app.use("/api/admin/wallets", adminWalletRoutes);
    app.use("/api/admin/orders", adminOrderRoutes);
    app.use("/api/admin/order-items", adminOrderItemRoutes);
    app.use("/api/admin/carts", adminCartRoutes);

    // Start the Express server
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log(`🚀 GraphQL endpoint: http://localhost:${PORT}/graphql`);
    });
  } catch (error) {
    console.error("❌ Error during initialization:", error);
    process.exit(1);
  }
};

startServer();

export default app;
