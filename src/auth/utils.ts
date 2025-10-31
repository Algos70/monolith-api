import type { SessionUser, Permission, PermissionChecker } from "./types";

/**
 * Creates a permission checker for a user
 */
export function createPermissionChecker(user: SessionUser): PermissionChecker {
  return {
    hasPermission(permission: Permission): boolean {
      return user.permissions?.includes(permission) ?? false;
    },

    hasAnyPermission(permissions: Permission[]): boolean {
      return permissions.some(
        (permission) => user.permissions?.includes(permission) ?? false
      );
    },

    hasAllPermissions(permissions: Permission[]): boolean {
      return permissions.every(
        (permission) => user.permissions?.includes(permission) ?? false
      );
    },
  };
}

/**
 * Helper function to check if user has specific permission
 */
export function hasPermission(
  user: SessionUser | undefined,
  permission: Permission
): boolean {
  if (!user?.permissions) return false;
  return user.permissions.includes(permission);
}

/**
 * Helper function to check if user has any of the specified permissions
 */
export function hasAnyPermission(
  user: SessionUser | undefined,
  permissions: Permission[]
): boolean {
  if (!user?.permissions) return false;
  return permissions.some((permission) =>
    user.permissions!.includes(permission)
  );
}

/**
 * Helper function to check if user has all specified permissions
 */
export function hasAllPermissions(
  user: SessionUser | undefined,
  permissions: Permission[]
): boolean {
  if (!user?.permissions) return false;
  return permissions.every((permission) =>
    user.permissions!.includes(permission)
  );
}

/**
 * Helper function to check if user is admin
 */
export function isAdmin(user: SessionUser | undefined): boolean {
  return (
    hasPermission(user, "admin_read") && hasPermission(user, "admin_write")
  );
}

/**
 * Helper function to get user's role-based permissions
 */
export function getUserRolePermissions(user: SessionUser): {
  canReadUsers: boolean;
  canWriteUsers: boolean;
  canReadWallet: boolean;
  canWriteWallet: boolean;
  canReadCart: boolean;
  canWriteCart: boolean;
  canReadProducts: boolean;
  canWriteProducts: boolean;
  canReadOrders: boolean;
  canWriteOrders: boolean;
  canReadCategories: boolean;
  canWriteCategories: boolean;
  isAdmin: boolean;
} {
  return {
    canReadUsers: hasPermission(user, "user_read"),
    canWriteUsers: hasPermission(user, "user_write"),
    canReadWallet: hasPermission(user, "wallet_read"),
    canWriteWallet: hasPermission(user, "wallet_write"),
    canReadCart: hasPermission(user, "cart_read"),
    canWriteCart: hasPermission(user, "cart_write"),
    canReadProducts: hasPermission(user, "products_read"),
    canWriteProducts: hasPermission(user, "products_write"),
    canReadOrders: hasPermission(user, "orders_read"),
    canWriteOrders: hasPermission(user, "orders_write"),
    canReadCategories: hasPermission(user, "categories_read"),
    canWriteCategories: hasPermission(user, "categories_write"),
    isAdmin: isAdmin(user),
  };
}
