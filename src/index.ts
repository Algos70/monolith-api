import "reflect-metadata";
import express from "express";
import cors from "cors";
import session from "express-session";
import RedisStore from "connect-redis";
import { config } from "dotenv";
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@as-integrations/express5";
import { AppDataSource } from "./repositories/data-source";
import { RedisClient } from "./cache/RedisClient";
import { verifyBearer, requireBearerRoles } from "./auth/middleware";
import {
  authRoutes,
  productRoutes,
  categoryRoutes,
  cartRoutes,
  walletRoutes,
  orderRoutes,
  adminUserRoutes,
  adminCategoryRoutes,
  adminProductRoutes,
  adminWalletRoutes,
  adminOrderRoutes,
  adminOrderItemRoutes,
  adminCartRoutes,
} from "./rest";
import { typeDefs, resolvers } from "./graphql";
import { rateLimitMiddleware } from "./cache/RateLimitMiddleware";
import { createGraphQLRateLimitPlugin } from "./graphql/plugins/rateLimitPlugin";
import { formatError } from "./graphql/utils/errorFormatter";
import { DatabaseSeeder } from "./repositories/seeds";

config();

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(
  cors({
    origin: ["http://localhost:3000", "http://web-client:3000"],
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
  (_req, res) => res.json({ ok: true })
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

    // Run pending migrations automatically
    console.log("🔄 Running database migrations...");
    await AppDataSource.runMigrations();
    console.log("✅ Database migrations completed successfully");

    // Run database seeding (only once)
    await DatabaseSeeder.run();

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
        secure: false,
        sameSite: "lax", // Development için "lax" kullan, production'da "none" olabilir
        maxAge: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
      },
    });

    // Apply session middleware
    app.use(sessionMiddleware);

    // Apply general rate limiting (before routes)
    app.use(
      "/api",
      rateLimitMiddleware.createIPRateLimit({
        windowMs: 60000, // 1 minute
        maxRequests: 300, // 300 requests per minute per IP (3x)
        message: "Too many API requests",
      })
    );

    // Create Apollo Server
    const server = new ApolloServer({
      typeDefs,
      resolvers,
      plugins: [
        createGraphQLRateLimitPlugin({
          generalLimit: { windowMs: 60000, maxRequests: 600 }, // 600 GraphQL req/min (3x)
          // queryLimits are now defined in the plugin constructor with all operations
        }),
      ],
      formatError,
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
    app.use("/api/cart", cartRoutes);
    app.use("/api/wallets", walletRoutes);
    app.use("/api/orders", orderRoutes);

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
