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
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res
          .status(400)
          .json({ error: "Username and password are required" });
      }

      const config = getKeycloakConfig();

      if (!config.clientSecret) {
        return res.status(500).json({
          error: "Server configuration error: Missing client secret",
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

      // Store user session
      SessionService.storeUser(req, result.user);
      await SessionService.saveSession(req);

      // Return sanitized result
      const { access_token, refresh_token, id_token, ...sanitizedUser } = result.user;
      res.json({
        ...result,
        user: sanitizedUser,
      });
    } catch (error: any) {
      console.error("Login error:", error.message);

      if (error.message.includes("Invalid username or password")) {
        return res.status(401).json({ error: error.message });
      }

      res.status(500).json({ error: error.message || "Login failed" });
    }
  }
);

// Register new user
router.post(
  "/register",
  rateLimitMiddleware.createAuthRateLimit(),
  async (req: Request, res: Response) => {
    try {
      const { username, email, password, firstName, lastName } = req.body;

      if (!username || !email || !password) {
        return res.status(400).json({
          error: "Username, email, and password are required",
        });
      }

      const config = getKeycloakConfig();

      if (!config.clientSecret) {
        return res.status(500).json({
          error: "Server configuration error: Missing client secret",
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

      res.json(result);
    } catch (error: any) {
      console.error("Registration error:", error.message);

      // Handle specific errors
      if (error.message.includes("User already exists")) {
        return res.status(409).json({ error: error.message });
      }

      if (error.message.includes("authentication failed") || 
          error.message.includes("configuration error")) {
        return res.status(500).json({ error: error.message });
      }

      res.status(500).json({ error: error.message || "Registration failed" });
    }
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
      user?.refresh_token,
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
    return res.status(401).json({ error: "Not authenticated" });
  }

  // Return user info without sensitive tokens
  const user = SessionService.getUser(req);
  const { access_token, refresh_token, id_token, ...sanitizedUser } = user;
  res.json(sanitizedUser);
});

// Refresh token endpoint
router.post("/refresh", async (req: Request, res: Response) => {
  try {
    const user = SessionService.getUser(req);

    if (!user?.refresh_token) {
      return res.status(401).json({ error: "No refresh token available" });
    }

    // Use AuthService for token refresh
    const authService = new AuthService({
      keycloakBaseUrl: process.env.KEYCLOAK_BASE_URL || "http://localhost:8080",
      keycloakRealm: process.env.KEYCLOAK_REALM || "shop",
      publicClientId: process.env.KEYCLOAK_CLIENT_ID || "monolith-api",
      frontendUrl: process.env.FRONTEND_URL || "http://localhost:3000",
    });

    const result = await authService.refreshUserToken(user.refresh_token);

    // Update session with new tokens
    const updatedUser = {
      ...user,
      ...result.user,
    };
    SessionService.storeUser(req, updatedUser);

    res.json({
      success: true,
      message: "Token refreshed successfully",
    });
  } catch (error) {
    console.error("Token refresh error:", error);
    // Clear invalid session
    req.session.destroy(() => {});
    res.status(401).json({ error: "Token refresh failed" });
  }
});

export default router;
