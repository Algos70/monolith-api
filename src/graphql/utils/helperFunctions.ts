import { SessionService } from "../../services/SessionService";
import { GraphQLContext } from "./permissions";

/**
 * Helper function to get current user ID from GraphQL context
 * Uses SessionService.getUser for consistent user retrieval
 */
export const getCurrentUserId = (context: GraphQLContext): string => {
  const user = SessionService.getUser(context.req);
  return user?.dbUserId || user?.sub || "";
};

/**
 * Helper function to get current user from GraphQL context
 * Uses SessionService.getUser for consistent user retrieval
 */
export const getCurrentUser = (context: GraphQLContext) => {
  return SessionService.getUser(context.req);
};