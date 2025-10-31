import axios from "axios";
import qs from "qs";
import { SessionService } from "../../services/SessionService";
import { refreshTokenWithClient } from "../../auth/confidentialClient";
import { GraphQLContext } from "../utils/permissions";
import { AuthenticationError, UserInputError } from "../utils/permissions";

// Keycloak configuration
const getKeycloakConfig = () => ({
  baseUrl: process.env.KEYCLOAK_BASE_URL || "http://localhost:8080",
  realm: process.env.KEYCLOAK_REALM || "shop",
  clientId: process.env.KEYCLOAK_CLIENT_ID || "monolith-api",
  clientSecret: process.env.KEYCLOAK_CLIENT_SECRET,
  adminSecret: process.env.KEYCLOAK_ADMIN_SECRET,
});

export const authResolvers = {
  Query: {
    // Get current authenticated user
    me: (_: any, __: any, context: GraphQLContext) => {

      if (!SessionService.isAuthenticated(context.req)) {
        console.log("Not authenticated - throwing error");
        throw new AuthenticationError("Not authenticated");
      }

      // Return user info without sensitive tokens
      const user = SessionService.getUser(context.req);
      const { access_token, refresh_token, id_token, ...sanitizedUser } = user;
      return sanitizedUser;
    },
  },

  Mutation: {
    // Login mutation
    login: async (
      _: any,
      { input }: { input: { username: string; password: string } },
      context: GraphQLContext
    ) => {
      try {
        const { username, password } = input;

        if (!username || !password) {
          throw new UserInputError("Username and password are required");
        }

        const config = getKeycloakConfig();

        if (!config.clientSecret) {
          throw new Error("Server configuration error: Missing client secret");
        }

        // Prepare request data
        const requestData = {
          grant_type: "password",
          client_id: config.clientId,
          client_secret: config.clientSecret,
          username,
          password,
          scope: "openid profile email",
        };

        const requestUrl = `${config.baseUrl}/realms/${config.realm}/protocol/openid-connect/token`;
        const encodedData = qs.stringify(requestData);

        // Authenticate with Keycloak
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
          validateStatus: (status) => status < 500,
        });

        if (response.status !== 200) {
          throw new AuthenticationError("Invalid username or password");
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

        // Create user session (userInfo already contains permissions from Keycloak)
        const userSession = {
          ...userInfo,
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          id_token: tokens.id_token,
        };
        SessionService.storeUser(context.req, userSession);

        // Save session to ensure it's persisted
        await SessionService.saveSession(context.req);

        // Return success response (without sensitive tokens)
        const { access_token, refresh_token, id_token, ...sanitizedUser } =
          userSession;


        return {
          success: true,
          message: "Login successful",
          user: sanitizedUser,
        };
      } catch (error: any) {
        console.error(
          "GraphQL Login error:",
          error.response?.data || error.message
        );

        if (error.response?.status === 401) {
          throw new AuthenticationError("Invalid username or password");
        }

        if (error.response?.status === 403) {
          throw new AuthenticationError(
            "Access forbidden. Check Keycloak client configuration."
          );
        }

        throw new Error("Login failed");
      }
    },

    // Register mutation
    register: async (
      _: any,
      {
        input,
      }: {
        input: {
          username: string;
          email: string;
          password: string;
          firstName?: string;
          lastName?: string;
        };
      },
      context: GraphQLContext
    ) => {
      try {
        const { username, email, password, firstName, lastName } = input;

        if (!username || !email || !password) {
          throw new UserInputError(
            "Username, email, and password are required"
          );
        }

        const config = getKeycloakConfig();

        if (!config.adminSecret) {
          throw new Error("Server configuration error: Missing admin secret");
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

        return {
          success: true,
          message: "User registered successfully",
        };
      } catch (error: any) {
        console.error(
          "GraphQL Registration error:",
          error.response?.data || error.message
        );

        if (error.response?.status === 409) {
          throw new UserInputError("User already exists");
        }

        if (error.response?.data?.errorMessage) {
          throw new UserInputError(error.response.data.errorMessage);
        }

        throw new Error("Registration failed");
      }
    },

    // Logout mutation
    logout: async (_: any, __: any, context: GraphQLContext) => {
      try {
        const user = SessionService.getUser(context.req);

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
                headers: {
                  "Content-Type": "application/x-www-form-urlencoded",
                },
              }
            );
          }
        }

        // Clear session
        await SessionService.destroySession(context.req, context.res);

        return {
          success: true,
          message: "Logged out successfully",
        };
      } catch (error) {
        console.error("GraphQL Logout error:", error);
        // Even if Keycloak logout fails, clear the session
        await SessionService.destroySession(context.req, context.res);
        return {
          success: true,
          message: "Logged out successfully",
        };
      }
    },

    // Refresh token mutation
    refreshToken: async (_: any, __: any, context: GraphQLContext) => {
      try {
        const user = SessionService.getUser(context.req);

        if (!user?.refresh_token) {
          throw new AuthenticationError("No refresh token available");
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
        SessionService.storeUser(context.req, updatedUser);

        // Return success response (without sensitive tokens)
        const { access_token, refresh_token, id_token, ...sanitizedUser } =
          updatedUser;

        return {
          success: true,
          message: "Token refreshed successfully",
          user: sanitizedUser,
        };
      } catch (error) {
        console.error("GraphQL Token refresh error:", error);
        // Clear invalid session
        context.req.session.destroy(() => {});
        throw new AuthenticationError("Token refresh failed");
      }
    },
  },
};
