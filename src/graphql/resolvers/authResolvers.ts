import { SessionService } from "../../services/SessionService";
import { AuthService } from "../../services/AuthService";
import { GraphQLContext } from "../utils/permissions";
import { AuthenticationError, UserInputError } from "../utils/permissions";

// Keycloak configuration
const getKeycloakConfig = () => ({
  baseUrl: process.env.KEYCLOAK_BASE_URL || "http://localhost:8080",
  realm: process.env.KEYCLOAK_REALM || "shop",
  clientId: process.env.KEYCLOAK_CLIENT_ID || "monolith-api",
  clientSecret: process.env.KEYCLOAK_CLIENT_SECRET,
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
        SessionService.storeUser(context.req, result.user);
        await SessionService.saveSession(context.req);

        // Return sanitized result
        const { access_token, refresh_token, id_token, ...sanitizedUser } =
          result.user;
        return {
          ...result,
          user: sanitizedUser,
        };
      } catch (error: any) {
        if (error.message.includes("Invalid username or password")) {
          throw new AuthenticationError(error.message);
        }

        throw new Error(error.message || "Login failed");
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

        if (!config.clientSecret) {
          throw new Error("Server configuration error: Missing client secret");
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

        return result;
      } catch (error: any) {
        console.error("GraphQL Registration error:", error.message);

        // Handle specific errors
        if (error.message.includes("User already exists")) {
          throw new UserInputError(error.message);
        }

        throw new Error(error.message || "Registration failed");
      }
    },

    // Logout mutation
    logout: async (_: any, __: any, context: GraphQLContext) => {
      try {
        const user = SessionService.getUser(context.req);
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
          config.clientSecret
            ? { clientId: config.clientId, clientSecret: config.clientSecret }
            : undefined
        );

        // Clear session
        await SessionService.destroySession(context.req, context.res);
        return result;
      } catch (error) {
        console.error("GraphQL Logout error:", error);
        // Even if logout fails, clear the session
        await SessionService.destroySession(context.req, context.res);
        return {
          success: true,
          message: "Logged out successfully",
        };
      }
    },
  },
};
