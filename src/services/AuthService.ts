import axios from "axios";
import crypto from "crypto";
import { refreshTokenWithClient } from "../auth/confidentialClient";
import { UserService } from "./UserService";

export interface PKCEParams {
  codeVerifier: string;
  codeChallenge: string;
}

export interface AuthConfig {
  keycloakBaseUrl: string;
  keycloakRealm: string;
  publicClientId: string;
  frontendUrl: string;
}

export interface TokenData {
  access_token: string;
  refresh_token: string;
  id_token: string;
}

export interface UserInfo {
  [key: string]: any;
}

export class AuthService {
  private config: AuthConfig;
  private userService: UserService;

  constructor(config: AuthConfig) {
    this.config = config;
    this.userService = new UserService();
  }

  // Generate PKCE parameters
  generatePKCE(): PKCEParams {
    const codeVerifier = crypto.randomBytes(32).toString("base64url");
    const codeChallenge = crypto
      .createHash("sha256")
      .update(codeVerifier)
      .digest("base64url");

    return { codeVerifier, codeChallenge };
  }

  // Generate random state
  generateState(): string {
    return crypto.randomBytes(16).toString("hex");
  }

  // Build authorization URL
  buildAuthUrl(
    redirectUri: string,
    codeChallenge: string,
    state: string
  ): string {
    const authUrl = new URL(
      `${this.config.keycloakBaseUrl}/realms/${this.config.keycloakRealm}/protocol/openid-connect/auth`
    );

    authUrl.searchParams.set("client_id", this.config.publicClientId);
    authUrl.searchParams.set("redirect_uri", redirectUri);
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("scope", "openid profile email");
    authUrl.searchParams.set("code_challenge", codeChallenge);
    authUrl.searchParams.set("code_challenge_method", "S256");
    authUrl.searchParams.set("state", state);

    return authUrl.toString();
  }

  // Exchange authorization code for tokens
  async exchangeCodeForTokens(
    code: string,
    redirectUri: string,
    codeVerifier: string
  ): Promise<TokenData> {
    const tokenUrl = `${this.config.keycloakBaseUrl}/realms/${this.config.keycloakRealm}/protocol/openid-connect/token`;

    const response = await axios.post(
      tokenUrl,
      new URLSearchParams({
        grant_type: "authorization_code",
        client_id: this.config.publicClientId,
        code,
        redirect_uri: redirectUri,
        code_verifier: codeVerifier,
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    return response.data;
  }

  // Get user information using access token
  async getUserInfo(accessToken: string): Promise<UserInfo> {
    const userInfoUrl = `${this.config.keycloakBaseUrl}/realms/${this.config.keycloakRealm}/protocol/openid-connect/userinfo`;

    const response = await axios.get(userInfoUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    return response.data;
  }

  // Logout from Keycloak
  async logoutFromKeycloak(refreshToken: string): Promise<void> {
    const logoutUrl = `${this.config.keycloakBaseUrl}/realms/${this.config.keycloakRealm}/protocol/openid-connect/logout`;

    await axios.post(
      logoutUrl,
      new URLSearchParams({
        client_id: this.config.publicClientId,
        refresh_token: refreshToken,
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );
  }

  // Refresh access token
  async refreshToken(refreshToken: string): Promise<TokenData> {
    return await refreshTokenWithClient(refreshToken);
  }

  // Validate state parameter
  validateState(receivedState: string, sessionState: string): boolean {
    return receivedState === sessionState;
  }

  // Sync user with database and create session
  async syncUserAndCreateSession(
    userInfo: UserInfo,
    tokens: TokenData
  ): Promise<any> {
    // Kullanıcıyı veritabanında senkronize et
    const dbUser = await this.userService.syncKeycloakUser(userInfo);

    const sessionData = {
      ...userInfo,
      dbUserId: dbUser.id, // Veritabanındaki kullanıcı ID'si
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      id_token: tokens.id_token,
    };


    return sessionData;
  }

  // Create user session data (legacy method)
  createUserSession(userInfo: UserInfo, tokens: TokenData): any {
    return {
      ...userInfo,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      id_token: tokens.id_token,
    };
  }

  // Get sanitized user info (without tokens)
  getSanitizedUserInfo(user: any): any {
    const { access_token, refresh_token, id_token, ...userInfo } = user;
    return userInfo;
  }

  // Build redirect URLs
  getSuccessRedirectUrl(): string {
    return `${this.config.frontendUrl}/`;
  }

  getErrorRedirectUrl(error: string = "auth_failed"): string {
    return `${this.config.frontendUrl}/login?error=${error}`;
  }

  // Build redirect URI for OAuth flow
  buildRedirectUri(protocol: string, host: string): string {
    return `${protocol}://${host}/api/callback`;
  }

  // Update user session with new tokens
  updateUserSessionTokens(currentUser: any, newTokens: TokenData): any {
    return {
      ...currentUser,
      access_token: newTokens.access_token,
      refresh_token: newTokens.refresh_token || currentUser.refresh_token,
      id_token: newTokens.id_token,
    };
  }

  // Clean up temporary session data
  cleanupTemporarySessionData(session: any): void {
    delete session.codeVerifier;
    delete session.state;
  }

  // Login with username/password (Resource Owner Password Credentials flow)
  async loginWithCredentials(
    credentials: {
      username: string;
      password: string;
    },
    clientConfig: {
      clientId: string;
      clientSecret: string;
    }
  ): Promise<{ success: boolean; message: string; user: any }> {
    try {
      const { username, password } = credentials;

      const tokenUrl = `${this.config.keycloakBaseUrl}/realms/${this.config.keycloakRealm}/protocol/openid-connect/token`;

      // Authenticate with Keycloak using Resource Owner Password Credentials flow
      const tokenResponse = await axios.post(
        tokenUrl,
        new URLSearchParams({
          grant_type: "password",
          client_id: clientConfig.clientId,
          client_secret: clientConfig.clientSecret,
          username,
          password,
          scope: "openid profile email",
        }),
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          timeout: 10000,
          validateStatus: (status) => status < 500,
        }
      );

      if (tokenResponse.status !== 200) {
        throw new Error("Invalid username or password");
      }

      const tokens = tokenResponse.data;

      // Get user info using the access token
      const userInfo = await this.getUserInfo(tokens.access_token);

      // Sync user with local database and create session
      const userSession = await this.syncUserAndCreateSession(userInfo, tokens);

      return {
        success: true,
        message: "Login successful",
        user: userSession, // Return full session for internal use, sanitization happens in resolvers
      };
    } catch (error: any) {
      console.error(
        "❌ AuthService login error:",
        error.response?.data || error.message
      );

      if (error.response?.status === 401) {
        console.error("🚫 Authentication failed - Invalid credentials");
        throw new Error("Invalid username or password");
      }

      if (error.response?.status === 403) {
        console.error("🚫 Access forbidden - Check client configuration");
        throw new Error(
          "Access forbidden. Check Keycloak client configuration."
        );
      }

      console.error("💥 Unexpected login error:", error);
      throw new Error("Login failed");
    }
  }

  // Logout user from Keycloak and clear session
  async logoutUser(
    refreshToken?: string,
    clientConfig?: {
      clientId: string;
      clientSecret: string;
    }
  ): Promise<{ success: boolean; message: string }> {
    try {
      if (refreshToken && clientConfig) {
        // Logout from Keycloak directly
        await axios.post(
          `${this.config.keycloakBaseUrl}/realms/${this.config.keycloakRealm}/protocol/openid-connect/logout`,
          new URLSearchParams({
            client_id: clientConfig.clientId,
            client_secret: clientConfig.clientSecret,
            refresh_token: refreshToken,
          }),
          {
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
            },
          }
        );
      }

      return {
        success: true,
        message: "Logged out successfully",
        
      };
    } catch (error) {
      console.error("Logout error:", error);
      // Even if Keycloak logout fails, we still return success
      // because the session will be cleared anyway
      return {
        success: true,
        message: "Logged out successfully",
      };
    }
  }

  // Register new user in Keycloak and sync to local database
  async registerUser(
    userData: {
      username: string;
      email: string;
      password: string;
      firstName?: string;
      lastName?: string;
    },
    adminConfig: {
      clientId: string;
      clientSecret: string;
    }
  ): Promise<{ success: boolean; message: string; userId?: string }> {
    try {
      const { username, email, password, firstName, lastName } = userData;

      // Get admin token for user creation
      const adminTokenResponse = await axios.post(
        `${this.config.keycloakBaseUrl}/realms/${this.config.keycloakRealm}/protocol/openid-connect/token`,
        new URLSearchParams({
          grant_type: "client_credentials",
          client_id: adminConfig.clientId,
          client_secret: adminConfig.clientSecret,
        }),
        {
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
        }
      );

      const adminToken = adminTokenResponse.data.access_token;

      // Create user in Keycloak
      const createUserResponse = await axios.post(
        `${this.config.keycloakBaseUrl}/admin/realms/${this.config.keycloakRealm}/users`,
        {
          username,
          email,
          firstName: firstName || "",
          lastName: lastName || "",
          enabled: true,
          emailVerified: true,
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
            Authorization: `Bearer ${adminToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      // Get the created user's ID from Keycloak
      let keycloakUserId: string | null = null;

      if (createUserResponse.headers.location) {
        const locationParts = createUserResponse.headers.location.split("/");
        keycloakUserId = locationParts[locationParts.length - 1];
      }

      // If we couldn't get the ID from Location header, fetch the user by email
      if (!keycloakUserId) {
        const getUserResponse = await axios.get(
          `${this.config.keycloakBaseUrl}/admin/realms/${
            this.config.keycloakRealm
          }/users?email=${encodeURIComponent(email)}`,
          {
            headers: {
              Authorization: `Bearer ${adminToken}`,
            },
          }
        );

        if (getUserResponse.data && getUserResponse.data.length > 0) {
          keycloakUserId = getUserResponse.data[0].id;
        }
      }

      // Create user in local database
      if (keycloakUserId) {
        const fullName =
          firstName && lastName
            ? `${firstName} ${lastName}`
            : firstName || lastName || username;

        await this.userService.createUser({
          id: keycloakUserId, // Use Keycloak UUID as primary key
          email,
          name: fullName,
        });
      }

      return {
        success: true,
        message: "User registered successfully",
        userId: keycloakUserId || undefined,
      };
    } catch (error: any) {
      console.error(
        "Registration error:",
        error.response?.data || error.message
      );

      // Handle specific Keycloak errors
      if (error.response?.status === 409) {
        throw new Error("User already exists");
      }

      if (error.response?.status === 401) {
        throw new Error(
          "Admin authentication failed. Check client configuration."
        );
      }

      if (error.response?.status === 403) {
        throw new Error(
          "Client lacks required permissions. Assign manage-users role to service account."
        );
      }

      if (error.response?.data?.error === "unauthorized_client") {
        throw new Error(
          "Client configuration error: Enable service accounts and assign manage-users role."
        );
      }

      if (error.response?.data?.errorMessage) {
        throw new Error(error.response.data.errorMessage);
      }

      throw new Error("Registration failed");
    }
  }
}
