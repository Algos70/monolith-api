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
    const response = await axios.get(
      `${this.config.keycloakBaseUrl}/realms/${this.config.keycloakRealm}/protocol/openid-connect/userinfo`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

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
  async syncUserAndCreateSession(userInfo: UserInfo, tokens: TokenData): Promise<any> {
    // Kullanıcıyı veritabanında senkronize et
    const dbUser = await this.userService.syncKeycloakUser(userInfo);
    
    return {
      ...userInfo,
      dbUserId: dbUser.id, // Veritabanındaki kullanıcı ID'si
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      id_token: tokens.id_token,
    };
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
}
