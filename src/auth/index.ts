export { default as authRoutes } from "../rest/authRoutes";
export {
  // Session-based middlewares
  requireAuth,
  optionalAuth,
  requireSessionRoles,
  requireSessionAdmin,
  requireSessionUser,

  // Session-based permission middlewares
  requireSessionPermissions,
  requireSessionAllPermissions,

  // Permission convenience middlewares
  requireAdminPanelReadPermissionForUser,
  requireAdminPanelWritePermissionForUser,
  requireAdminPanelReadPermissionForCategory,
  requireAdminPanelWritePermissionForCategory,
  requireAdminPanelReadPermissionForProducts,
  requireAdminPanelWritePermissionForProducts,
  requireAdminPanelReadPermissionForWallets,
  requireAdminPanelWritePermissionForWallets,
  requireAdminPanelReadPermissionForOrders,
  requireAdminPanelWritePermissionForOrders,
  requireAdminPanelReadPermissionForOrderItems,
  requireAdminPanelWritePermissionForOrderItems,
  requireAdminPanelReadPermissionForCarts,
  requireAdminPanelWritePermissionForCarts,
  requireAdminPanelReadPermissionForCartsItem,
  requireAdminPanelWritePermissionForCartsItem,
  requireWalletReadPermission,
  requireWalletWritePermission,
  requireCartReadPermissions,
  requireCartWritePermissions,
  requireProductsReadPermission,
  requireProductsWritePermission,
  requireOrdersReadPermission,
  requireOrdersWritePermission,
  requireCategoriesReadPermission,
  requireCategoriesWritePermission,

  // Bearer token middlewares
  verifyBearer,
  verifyBearerWithIntrospection,
  requireBearerRoles,
  requireBearerAdmin,
  requireBearerUser,

  // Hybrid middlewares (session + bearer)
  requireAuthHybrid,
  requireRolesHybrid,
  requirePermissionsHybrid,
} from "./middleware";

// Export types
export type {
  KeycloakTokenPayload,
  SessionUser,
  AppSession,
  Permission,
  Role,
  PermissionChecker,
} from "./types";

// Export utilities
export {
  createPermissionChecker,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  isAdmin,
  getUserRolePermissions,
} from "./utils";
