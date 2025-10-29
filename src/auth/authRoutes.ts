import { Router, Request, Response } from "express";
import axios from "axios";
import crypto from "crypto";
import { refreshTokenWithClient } from "./confidentialClient";

const router = Router();

// Keycloak configuration - these should be in your .env file
const KEYCLOAK_BASE_URL =
  process.env.KEYCLOAK_BASE_URL || "http://localhost:8080";
const KEYCLOAK_REALM = process.env.KEYCLOAK_REALM || "shop";
const KEYCLOAK_PUBLIC_CLIENT_ID =
  process.env.KEYCLOAK_PUBLIC_CLIENT_ID || "web-client";
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

// Extend session interface
declare module "express-session" {
  interface SessionData {
    user?: any;
    codeVerifier?: string;
    state?: string;
  }
}

// Helper function to generate PKCE parameters
function generatePKCE() {
  const codeVerifier = crypto.randomBytes(32).toString("base64url");
  const codeChallenge = crypto
    .createHash("sha256")
    .update(codeVerifier)
    .digest("base64url");

  return { codeVerifier, codeChallenge };
}

// Generate random state
function generateState() {
  return crypto.randomBytes(16).toString("hex");
}

// Login route - redirect to Keycloak with PKCE
router.get("/login", (req: Request, res: Response) => {
  const { codeVerifier, codeChallenge } = generatePKCE();
  const state = generateState();

  // Store PKCE verifier and state in session
  req.session.codeVerifier = codeVerifier;
  req.session.state = state;
  
  console.log('Login - storing state:', state);
  console.log('Session ID:', req.sessionID);

  // Save session before redirect
  req.session.save((err) => {
    if (err) {
      console.error('Session save error:', err);
      return res.status(500).json({ error: 'Session save failed' });
    }
    
    const authUrl = new URL(
      `${KEYCLOAK_BASE_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/auth`
    );
    authUrl.searchParams.set("client_id", KEYCLOAK_PUBLIC_CLIENT_ID);
    authUrl.searchParams.set(
      "redirect_uri",
      `${req.protocol}://${req.get("host")}/api/callback`
    );
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("scope", "openid profile email");
    authUrl.searchParams.set("code_challenge", codeChallenge);
    authUrl.searchParams.set("code_challenge_method", "S256");
    authUrl.searchParams.set("state", state);

    res.redirect(authUrl.toString());
  });
});

// Callback route - handle Keycloak callback
router.get("/callback", async (req: Request, res: Response) => {
  try {
    const { code, state } = req.query;
    
    console.log('Callback - received state:', state);
    console.log('Callback - session state:', req.session.state);
    console.log('Session ID:', req.sessionID);
    console.log('Session data:', req.session);

    // Verify state parameter
    if (!state || state !== req.session.state) {
      return res.status(400).json({ error: "Invalid state parameter" });
    }

    if (!code || !req.session.codeVerifier) {
      return res
        .status(400)
        .json({ error: "Missing authorization code or code verifier" });
    }

    // Exchange code for tokens
    const tokenUrl = `${KEYCLOAK_BASE_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/token`;
    const tokenResponse = await axios.post(
      tokenUrl,
      new URLSearchParams({
        grant_type: "authorization_code",
        client_id: KEYCLOAK_PUBLIC_CLIENT_ID,
        code: code as string,
        redirect_uri: `${req.protocol}://${req.get("host")}/api/callback`,
        code_verifier: req.session.codeVerifier,
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    const { access_token, refresh_token, id_token } = tokenResponse.data;

    // Get user info
    const userInfoResponse = await axios.get(
      `${KEYCLOAK_BASE_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/userinfo`,
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }
    );

    // Store user and tokens in session
    req.session.user = {
      ...userInfoResponse.data,
      access_token,
      refresh_token,
      id_token,
    };

    // Clean up temporary session data
    delete req.session.codeVerifier;
    delete req.session.state;

    // Redirect to frontend
    res.redirect(`${FRONTEND_URL}/dashboard`);
  } catch (error) {
    console.error("Auth callback error:", error);
    res.redirect(`${FRONTEND_URL}/login?error=auth_failed`);
  }
});

// Logout route
router.post("/logout", async (req: Request, res: Response) => {
  try {
    const user = req.session.user;

    if (user?.refresh_token) {
      // Logout from Keycloak
      const logoutUrl = `${KEYCLOAK_BASE_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/logout`;
      await axios.post(
        logoutUrl,
        new URLSearchParams({
          client_id: KEYCLOAK_PUBLIC_CLIENT_ID,
          refresh_token: user.refresh_token,
        }),
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );
    }

    // Clear session
    req.session.destroy((err) => {
      if (err) {
        console.error("Session destruction error:", err);
        return res.status(500).json({ error: "Logout failed" });
      }

      res.clearCookie("connect.sid"); // Default session cookie name
      res.json({ message: "Logged out successfully" });
    });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ error: "Logout failed" });
  }
});

// Get current user
router.get("/me", (req: Request, res: Response) => {
  if (!req.session.user) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  // Return user info without sensitive tokens
  const { access_token, refresh_token, id_token, ...userInfo } =
    req.session.user;
  res.json(userInfo);
});

// Refresh token endpoint
router.post("/refresh", async (req: Request, res: Response) => {
  try {
    if (!req.session.user?.refresh_token) {
      return res.status(401).json({ error: "No refresh token available" });
    }

    // Use confidential client to refresh token
    const tokenData = await refreshTokenWithClient(req.session.user.refresh_token);

    // Update session with new tokens
    req.session.user = {
      ...req.session.user,
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token || req.session.user.refresh_token,
      id_token: tokenData.id_token,
    };

    res.json({ message: "Token refreshed successfully" });
  } catch (error) {
    console.error("Token refresh error:", error);
    // Clear invalid session
    req.session.destroy(() => {});
    res.status(401).json({ error: "Token refresh failed" });
  }
});

// Middleware to check if user is authenticated
export const requireAuth = (req: Request, res: Response, next: any) => {
  if (!req.session.user) {
    return res.status(401).json({ error: "Authentication required" });
  }
  next();
};

export default router;
