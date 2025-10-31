import { Router, Request, Response } from "express";
import { SessionService } from "../services/SessionService";
import { rateLimitMiddleware } from "../cache/RateLimitMiddleware";
import { refreshTokenWithClient } from "../auth/confidentialClient";
import axios from "axios";
import qs from "qs";

const router = Router();

// Keycloak configuration - these should be in your .env file
const getKeycloakConfig = () => ({
  baseUrl: process.env.KEYCLOAK_BASE_URL || "http://localhost:8080",
  realm: process.env.KEYCLOAK_REALM || "shop",
  clientId: process.env.KEYCLOAK_CLIENT_ID || "monolith-api",
  clientSecret: process.env.KEYCLOAK_CLIENT_SECRET,
  adminSecret: process.env.KEYCLOAK_ADMIN_SECRET,
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

      // Prepare request data
      const requestData = {
        grant_type: "password",
        client_id: config.clientId,
        client_secret: config.clientSecret,
        username,
        password,
        scope: "openid profile email", // Add required scopes
      };

      const requestUrl = `${config.baseUrl}/realms/${config.realm}/protocol/openid-connect/token`;
      const encodedData = qs.stringify(requestData);

      // Authenticate with Keycloak using Resource Owner Password Credentials flow
      const response = await axios({
        method: "POST",
        url: requestUrl,
        data: encodedData,
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Content-Length": Buffer.byteLength(encodedData),
        },
        timeout: 10000,
        maxRedirects: 0,
        validateStatus: (status) => status < 500, // Don't throw on 4xx errors
      });

      if (response.status !== 200) {
        return res.status(response.status).json({
          error: "Authentication failed",
          details: response.data,
        });
      }

      const tokens = response.data;

      // Get user info using the access token
      const userInfoResponse = await axios.get(
        `${config.baseUrl}/realms/${config.realm}/protocol/openid-connect/userinfo`,
        {
          headers: { Authorization: `Bearer ${tokens.access_token}` },
        }
      );

      const userInfo = userInfoResponse.data;

      // Create user session
      const userSession = {
        ...userInfo,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        id_token: tokens.id_token,
      };

      SessionService.storeUser(req, userSession);

      // Save session to ensure it's persisted
      await SessionService.saveSession(req);

      // Return success response (without sensitive tokens)
      const { access_token, refresh_token, id_token, ...sanitizedUser } =
        userSession;
      res.json({
        success: true,
        message: "Login successful",
        user: sanitizedUser,
      });
    } catch (error: any) {
      console.error("Login error:", error.response?.data || error.message);

      if (error.response?.status === 401) {
        const errorData = error.response.data;
        if (errorData?.error === "unauthorized_client") {
          return res.status(401).json({
            error:
              "Client authentication failed. Check Keycloak client configuration.",
            details: errorData.error_description,
          });
        }
        return res.status(401).json({ error: "Invalid username or password" });
      }

      if (error.response?.status === 403) {
        const errorData = error.response.data;
        return res.status(403).json({
          error: "Access forbidden. Direct Access Grants might not be enabled.",
          details:
            errorData?.error_description ||
            "Check Keycloak client configuration",
          keycloakError: errorData,
        });
      }

      res.status(500).json({ error: "Login failed" });
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

      if (!config.adminSecret) {
        return res.status(500).json({
          error: "Server configuration error: Missing admin secret",
        });
      }

      // Get admin token for user creation
      const adminToken = await axios.post(
        `${config.baseUrl}/realms/master/protocol/openid-connect/token`,
        qs.stringify({
          grant_type: "client_credentials",
          client_id: "admin-cli",
          client_secret: config.adminSecret,
        }),
        {
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
        }
      );

      // Create user in Keycloak
      await axios.post(
        `${config.baseUrl}/admin/realms/${config.realm}/users`,
        {
          username,
          email,
          firstName: firstName || "",
          lastName: lastName || "",
          enabled: true,
          credentials: [
            {
              type: "password",
              value: password,
              temporary: false,
            },
          ],
        },
        {
          headers: {
            Authorization: `Bearer ${adminToken.data.access_token}`,
            "Content-Type": "application/json",
          },
        }
      );

      res.json({
        success: true,
        message: "User registered successfully",
      });
    } catch (error: any) {
      console.error("Registration error:", error);

      if (error.response?.status === 409) {
        return res.status(409).json({ error: "User already exists" });
      }

      if (error.response?.data?.errorMessage) {
        return res
          .status(400)
          .json({ error: error.response.data.errorMessage });
      }

      res.status(500).json({ error: "Registration failed" });
    }
  }
);

// Logout route
router.post("/logout", async (req: Request, res: Response) => {
  try {
    const user = SessionService.getUser(req);

    if (user?.refresh_token) {
      // Logout from Keycloak directly
      const config = getKeycloakConfig();
      const logoutUrl = `${config.baseUrl}/realms/${config.realm}/protocol/openid-connect/logout`;

      if (config.clientSecret) {
        await axios.post(
          logoutUrl,
          qs.stringify({
            client_id: config.clientId,
            client_secret: config.clientSecret,
            refresh_token: user.refresh_token,
          }),
          {
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
          }
        );
      }
    }

    // Clear session
    await SessionService.destroySession(req, res);
    res.json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    console.error("Logout error:", error);
    // Even if Keycloak logout fails, clear the session
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

    // Refresh token using confidential client
    const tokenData = await refreshTokenWithClient(user.refresh_token);

    // Update session with new tokens
    const updatedUser = {
      ...user,
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token || user.refresh_token,
      id_token: tokenData.id_token,
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
