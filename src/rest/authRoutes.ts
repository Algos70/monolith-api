import { Router, Request, Response } from "express";
import { SessionService } from "../services/SessionService";
import { AuthService } from "../services/AuthService";
import { rateLimitMiddleware } from "../cache/RateLimitMiddleware";

const router = Router();

// Keycloak configuration - these should be in your .env file
const getKeycloakConfig = () => ({
  baseUrl: process.env.KEYCLOAK_BASE_URL || "http://localhost:8080",
  realm: process.env.KEYCLOAK_REALM || "shop",
  clientId: process.env.KEYCLOAK_CLIENT_ID || "monolith-api",
  clientSecret: process.env.KEYCLOAK_CLIENT_SECRET,
});

// Extend session interface
declare module "express-session" {
  interface SessionData {
    user?: any;
  }
}

// Direct login with credentials (new approach)
router.post(
  "/login",
  rateLimitMiddleware.createAuthRateLimit(),
  async (req: Request, res: Response) => {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ 
        success: false,
        message: "Username and password are required"
      });
    }

    const config = getKeycloakConfig();

    if (!config.clientSecret) {
      return res.status(500).json({
        success: false,
        message: "Server configuration error: Missing client secret"
      });
    }

    // Use AuthService for login
    const authService = new AuthService({
      keycloakBaseUrl: config.baseUrl,
      keycloakRealm: config.realm,
      publicClientId: config.clientId,
      frontendUrl: process.env.FRONTEND_URL || "http://localhost:3000",
    });

    const result = await authService.loginWithCredentials(
      { username, password },
      { clientId: config.clientId, clientSecret: config.clientSecret }
    );

    if (!result.success) {
      const statusCode = result.message.includes("Invalid username or password") ? 401 : 500;
      return res.status(statusCode).json({
        success: result.success,
        message: result.message
      });
    }

    // Store user session
    SessionService.storeUser(req, result.user);
    await SessionService.saveSession(req);

    // Return sanitized result
    const { access_token, refresh_token, id_token, ...sanitizedUser } = result.user;
    res.json({
      success: result.success,
      message: result.message,
      user: sanitizedUser,
    });
  }
);

// Register new user
router.post(
  "/register",
  rateLimitMiddleware.createAuthRateLimit(),
  async (req: Request, res: Response) => {
    const { username, email, password, firstName, lastName } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Username, email, and password are required"
      });
    }

    const config = getKeycloakConfig();

    if (!config.clientSecret) {
      return res.status(500).json({
        success: false,
        message: "Server configuration error: Missing client secret"
      });
    }

    // Use AuthService for registration
    const authService = new AuthService({
      keycloakBaseUrl: config.baseUrl,
      keycloakRealm: config.realm,
      publicClientId: config.clientId,
      frontendUrl: process.env.FRONTEND_URL || "http://localhost:3000",
    });

    const result = await authService.registerUser(
      { username, email, password, firstName, lastName },
      { clientId: config.clientId, clientSecret: config.clientSecret }
    );

    if (!result.success) {
      let statusCode = 500;
      
      // Handle specific errors
      if (result.message.includes("User already exists")) {
        statusCode = 409;
      } else if (result.message.includes("authentication failed") || 
                 result.message.includes("configuration error")) {
        statusCode = 500;
      }

      return res.status(statusCode).json(result);
    }

    res.json(result);
  }
);

// Logout route
router.post("/logout", async (req: Request, res: Response) => {
  try {
    const user = SessionService.getUser(req);
    const config = getKeycloakConfig();

    // Use AuthService for logout
    const authService = new AuthService({
      keycloakBaseUrl: config.baseUrl,
      keycloakRealm: config.realm,
      publicClientId: config.clientId,
      frontendUrl: process.env.FRONTEND_URL || "http://localhost:3000",
    });

    const result = await authService.logoutUser(
      undefined, // No refresh token needed for session-based auth
      config.clientSecret ? { clientId: config.clientId, clientSecret: config.clientSecret } : undefined
    );

    // Clear session
    await SessionService.destroySession(req, res);
    res.json(result);
  } catch (error) {
    console.error("Logout error:", error);
    // Even if logout fails, clear the session
    await SessionService.destroySession(req, res);
    res.json({
      success: true,
      message: "Logged out successfully",
    });
  }
});

// Get current user
router.get("/me", (req: Request, res: Response) => {
  if (!SessionService.isAuthenticated(req)) {
    return res.status(401).json({ 
      success: false,
      message: "Not authenticated"
    });
  }

  // Return user info without sensitive tokens (same as GraphQL)
  const user = SessionService.getUser(req);
  const { access_token, refresh_token, id_token, ...sanitizedUser } = user;
  res.json(sanitizedUser);
});

export default router;