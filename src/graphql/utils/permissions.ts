import type { SessionUser, Permission } from "../../auth/types";
import {
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  isAdmin,
} from "../../auth/utils";

// Custom GraphQL error classes
export class AuthenticationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthenticationError";
  }
}

export class ForbiddenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ForbiddenError";
  }
}

export class UserInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UserInputError";
  }
}

// GraphQL Context interface
export interface GraphQLContext {
  user?: SessionUser;
  session?: any;
  req?: any;
  res?: any;
}

// Helper function to get user from context
function getUserFromContext(context: GraphQLContext): SessionUser | undefined {
  // Try to get user from context.user first (if set by middleware)
  if (context.user) {
    return context.user;
  }

  // Try to get user from session if available
  if (context.session?.user) {
    return context.session.user;
  }

  // Try to get user from request session
  if (context.req?.session?.user) {
    return context.req.session.user;
  }

  return undefined;
}

// Basic authentication check
export const requireAuth = (context: GraphQLContext) => {
  const user = getUserFromContext(context);
  if (!user) {
    throw new AuthenticationError("Authentication required");
  }
  return user;
};

// Permission-based authorization
export const requirePermission = (
  context: GraphQLContext,
  permission: Permission
) => {
  const user = requireAuth(context);

  if (!hasPermission(user, permission)) {
    throw new ForbiddenError(`Permission required: ${permission}`);
  }

  return user;
};

// Multiple permissions (ANY)
export const requireAnyPermission = (
  context: GraphQLContext,
  permissions: Permission[]
) => {
  const user = requireAuth(context);

  if (!hasAnyPermission(user, permissions)) {
    throw new ForbiddenError(
      `One of these permissions required: ${permissions.join(", ")}`
    );
  }

  return user;
};

// Multiple permissions (ALL)
export const requireAllPermissions = (
  context: GraphQLContext,
  permissions: Permission[]
) => {
  const user = requireAuth(context);

  if (!hasAllPermissions(user, permissions)) {
    throw new ForbiddenError(
      `All of these permissions required: ${permissions.join(", ")}`
    );
  }

  return user;
};

// Admin check
export const requireAdmin = (context: GraphQLContext) => {
  const user = requireAuth(context);

  if (!isAdmin(user)) {
    throw new ForbiddenError("Admin access required");
  }

  return user;
};

// Combined permission checks for user management (same as REST API)
export const requireUserManagementRead = (context: GraphQLContext) => {
  return requireAnyPermission(context, ["admin_read", "user_read"]);
};

export const requireUserManagementWrite = (context: GraphQLContext) => {
  return requireAnyPermission(context, ["admin_write", "user_write"]);
};

// Admin panel permission checks (matching REST API middleware names)
export const requireAdminPanelReadPermissionForUser = (
  context: GraphQLContext
) => {
  return requireAnyPermission(context, ["admin_read", "user_read"]);
};

export const requireAdminPanelWritePermissionForUser = (
  context: GraphQLContext
) => {
  return requireAnyPermission(context, ["admin_write", "user_write"]);
};

// Admin panel permission checks for categories (matching REST API middleware names)
export const requireAdminPanelReadPermissionForCategory = (
  context: GraphQLContext
) => {
  return requireAnyPermission(context, ["categories_read", "admin_read"]);
};

export const requireAdminPanelWritePermissionForCategory = (
  context: GraphQLContext
) => {
  return requireAnyPermission(context, ["categories_write", "admin_write"]);
};

// Specific permission helpers
export const requireAdminRead = (context: GraphQLContext) => {
  return requirePermission(context, "admin_read");
};

export const requireAdminWrite = (context: GraphQLContext) => {
  return requirePermission(context, "admin_write");
};

export const requireUserRead = (context: GraphQLContext) => {
  return requirePermission(context, "user_read");
};

export const requireUserWrite = (context: GraphQLContext) => {
  return requirePermission(context, "user_write");
};

export const requireWalletRead = (context: GraphQLContext) => {
  return requirePermission(context, "wallet_read");
};

export const requireWalletWrite = (context: GraphQLContext) => {
  return requirePermission(context, "wallet_write");
};

export const requireProductsRead = (context: GraphQLContext) => {
  return requirePermission(context, "products_read");
};

export const requireProductsWrite = (context: GraphQLContext) => {
  return requirePermission(context, "products_write");
};

export const requireOrdersRead = (context: GraphQLContext) => {
  return requirePermission(context, "orders_read");
};

export const requireOrdersWrite = (context: GraphQLContext) => {
  return requirePermission(context, "orders_write");
};

export const requireCategoriesRead = (context: GraphQLContext) => {
  return requirePermission(context, "categories_read");
};

export const requireCategoriesWrite = (context: GraphQLContext) => {
  return requirePermission(context, "categories_write");
};

export const requireCartRead = (context: GraphQLContext) => {
  return requirePermission(context, "cart_read");
};

export const requireCartWrite = (context: GraphQLContext) => {
  return requirePermission(context, "cart_write");
};

// Admin panel permission checks for products (matching REST API middleware names)
export const requireAdminPanelReadPermissionForProducts = (
  context: GraphQLContext
) => {
  return requireAnyPermission(context, ["products_read", "admin_read"]);
};

export const requireAdminPanelWritePermissionForProducts = (
  context: GraphQLContext
) => {
  return requireAnyPermission(context, ["products_write", "admin_write"]);
};

// Admin panel permission checks for wallets (matching REST API middleware names)
export const requireAdminPanelReadPermissionForWallets = (
  context: GraphQLContext
) => {
  return requireAnyPermission(context, ["wallet_read", "admin_read"]);
};

export const requireAdminPanelWritePermissionForWallets = (
  context: GraphQLContext
) => {
  return requireAnyPermission(context, ["wallet_write", "admin_write"]);
};
// Admin panel permission checks for orders (matching REST API middleware names)
export const requireAdminPanelReadPermissionForOrders = (
  context: GraphQLContext
) => {
  return requireAnyPermission(context, ["orders_read", "admin_read"]);
};

export const requireAdminPanelWritePermissionForOrders = (
  context: GraphQLContext
) => {
  return requireAnyPermission(context, ["orders_write", "admin_write"]);
};

