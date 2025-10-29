import { Router, Request, Response } from "express";
import { AuthService } from "../services/AuthService";
import { SessionService } from "../services/SessionService";

const router = Router();

// Keycloak configuration - these should be in your .env file
const KEYCLOAK_BASE_URL =
  process.env.KEYCLOAK_BASE_URL || "http://localhost:8080";
const KEYCLOAK_REALM = process.env.KEYCLOAK_REALM || "shop";
const KEYCLOAK_PUBLIC_CLIENT_ID =
  process.env.KEYCLOAK_PUBLIC_CLIENT_ID || "web-client";
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

// Initialize AuthService
const authService = new AuthService({
  keycloakBaseUrl: KEYCLOAK_BASE_URL,
  keycloakRealm: KEYCLOAK_REALM,
  publicClientId: KEYCLOAK_PUBLIC_CLIENT_ID,
  frontendUrl: FRONTEND_URL,
});

// Extend session interface
declare module "express-session" {
  interface SessionData {
    user?: any;
    codeVerifier?: string;
    state?: string;
  }
}

// Login route - redirect to Keycloak with PKCE
router.get("/login", async (req: Request, res: Response) => {
  try {
    const { codeVerifier, codeChallenge } = authService.generatePKCE();
    const state = authService.generateState();

    // Store PKCE data in session
    SessionService.storePKCEData(req, codeVerifier, state);

    // Save session before redirect
    await SessionService.saveSession(req);

    const redirectUri = authService.buildRedirectUri(
      req.protocol,
      req.get("host") || ""
    );
    const authUrl = authService.buildAuthUrl(redirectUri, codeChallenge, state);

    res.redirect(authUrl);
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Login failed" });
  }
});

// Callback route - handle Keycloak callback
router.get("/callback", async (req: Request, res: Response) => {
  try {
    const { code, state } = req.query;
    const pkceData = SessionService.getPKCEData(req);

    // Verify state parameter
    if (
      !state ||
      !authService.validateState(state as string, pkceData.state || "")
    ) {
      return res.status(400).json({ error: "Invalid state parameter" });
    }

    if (!code || !pkceData.codeVerifier) {
      return res
        .status(400)
        .json({ error: "Missing authorization code or code verifier" });
    }

    const redirectUri = authService.buildRedirectUri(
      req.protocol,
      req.get("host") || ""
    );

    // Exchange code for tokens
    const tokens = await authService.exchangeCodeForTokens(
      code as string,
      redirectUri,
      pkceData.codeVerifier
    );

    // Get user info
    const userInfo = await authService.getUserInfo(tokens.access_token);

    // Sync user with database and create session
    const userSession = await authService.syncUserAndCreateSession(
      userInfo,
      tokens
    );
    SessionService.storeUser(req, userSession);

    // Clean up temporary session data
    SessionService.clearTemporaryData(req);

    // Redirect to frontend
    res.redirect(authService.getSuccessRedirectUrl());
  } catch (error) {
    console.error("Auth callback error:", error);
    res.redirect(authService.getErrorRedirectUrl());
  }
});

// Logout route
router.post("/logout", async (req: Request, res: Response) => {
  try {
    const user = SessionService.getUser(req);

    if (user?.refresh_token) {
      // Logout from Keycloak
      await authService.logoutFromKeycloak(user.refresh_token);
    }

    // Clear session
    await SessionService.destroySession(req, res);
    res.json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ error: "Logout failed" });
  }
});

// Get current user
router.get("/me", (req: Request, res: Response) => {
  if (!SessionService.isAuthenticated(req)) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  // Return user info without sensitive tokens
  const user = SessionService.getUser(req);
  const userInfo = authService.getSanitizedUserInfo(user);
  res.json(userInfo);
});

// Refresh token endpoint
router.post("/refresh", async (req: Request, res: Response) => {
  try {
    const user = SessionService.getUser(req);

    if (!user?.refresh_token) {
      return res.status(401).json({ error: "No refresh token available" });
    }

    // Use AuthService to refresh token
    const tokenData = await authService.refreshToken(user.refresh_token);

    // Update session with new tokens
    const updatedUser = authService.updateUserSessionTokens(user, tokenData);
    SessionService.storeUser(req, updatedUser);

    res.json({ message: "Token refreshed successfully" });
  } catch (error) {
    console.error("Token refresh error:", error);
    // Clear invalid session
    req.session.destroy(() => {});
    res.status(401).json({ error: "Token refresh failed" });
  }
});

export default router;
