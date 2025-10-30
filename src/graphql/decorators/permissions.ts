import type { Permission } from "../../auth/types";
import {
  requireAuth,
  requirePermission,
  requireAnyPermission,
  requireAllPermissions,
  requireAdmin,
  requireUserManagementRead,
  requireUserManagementWrite,
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
  requireWalletRead,
  requireWalletWrite,
  type GraphQLContext,
} from "../utils/permissions";

// Decorator factory for authentication
export function Auth() {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const [, , context] = args; // [parent, args, context, info]
      requireAuth(context as GraphQLContext);
      return originalMethod.apply(this, args);
    };

    return descriptor;
  };
}

// Decorator factory for single permission
export function RequirePermission(permission: Permission) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const [, , context] = args;
      requirePermission(context as GraphQLContext, permission);
      return originalMethod.apply(this, args);
    };

    return descriptor;
  };
}

// Decorator factory for multiple permissions (ANY)
export function RequireAnyPermission(permissions: Permission[]) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const [, , context] = args;
      requireAnyPermission(context as GraphQLContext, permissions);
      return originalMethod.apply(this, args);
    };

    return descriptor;
  };
}

// Decorator factory for multiple permissions (ALL)
export function RequireAllPermissions(permissions: Permission[]) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const [, , context] = args;
      requireAllPermissions(context as GraphQLContext, permissions);
      return originalMethod.apply(this, args);
    };

    return descriptor;
  };
}

// Decorator for admin access
export function RequireAdmin() {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const [, , context] = args;
      requireAdmin(context as GraphQLContext);
      return originalMethod.apply(this, args);
    };

    return descriptor;
  };
}

// Decorator for user management read
export function RequireUserManagementRead() {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const [, , context] = args;
      requireUserManagementRead(context as GraphQLContext);
      return originalMethod.apply(this, args);
    };

    return descriptor;
  };
}

// Decorator for user management write
export function RequireUserManagementWrite() {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const [, , context] = args;
      requireUserManagementWrite(context as GraphQLContext);
      return originalMethod.apply(this, args);
    };

    return descriptor;
  };
}

// Decorator for admin panel read permission (matching REST API)
export function RequireAdminPanelReadPermissionForUser() {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      const [, , context] = args;
      requireAdminPanelReadPermissionForUser(context as GraphQLContext);
      return originalMethod.apply(this, args);
    };
    
    return descriptor;
  };
}

// Decorator for admin panel write permission (matching REST API)
export function RequireAdminPanelWritePermissionForUser() {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      const [, , context] = args;
      requireAdminPanelWritePermissionForUser(context as GraphQLContext);
      return originalMethod.apply(this, args);
    };
    
    return descriptor;
  };
}

// Decorator for admin panel read permission for categories (matching REST API)
export function RequireAdminPanelReadPermissionForCategory() {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      const [, , context] = args;
      requireAdminPanelReadPermissionForCategory(context as GraphQLContext);
      return originalMethod.apply(this, args);
    };
    
    return descriptor;
  };
}

// Decorator for admin panel write permission for categories (matching REST API)
export function RequireAdminPanelWritePermissionForCategory() {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      const [, , context] = args;
      requireAdminPanelWritePermissionForCategory(context as GraphQLContext);
      return originalMethod.apply(this, args);
    };
    
    return descriptor;
  };
}

// Decorator for admin panel read permission for products (matching REST API)
export function RequireAdminPanelReadPermissionForProducts() {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      const [, , context] = args;
      requireAdminPanelReadPermissionForProducts(context as GraphQLContext);
      return originalMethod.apply(this, args);
    };
    
    return descriptor;
  };
}

// Decorator for admin panel write permission for products (matching REST API)
export function RequireAdminPanelWritePermissionForProducts() {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      const [, , context] = args;
      requireAdminPanelWritePermissionForProducts(context as GraphQLContext);
      return originalMethod.apply(this, args);
    };
    
    return descriptor;
  };
}

// Decorator for admin panel read permission for wallets (matching REST API)
export function RequireAdminPanelReadPermissionForWallets() {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      const [, , context] = args;
      requireAdminPanelReadPermissionForWallets(context as GraphQLContext);
      return originalMethod.apply(this, args);
    };
    
    return descriptor;
  };
}

// Decorator for admin panel write permission for wallets (matching REST API)
export function RequireAdminPanelWritePermissionForWallets() {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      const [, , context] = args;
      requireAdminPanelWritePermissionForWallets(context as GraphQLContext);
      return originalMethod.apply(this, args);
    };
    
    return descriptor;
  };
}

// Decorator for admin panel read permission for orders (matching REST API)
export function RequireAdminPanelReadPermissionForOrders() {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      const [, , context] = args;
      requireAdminPanelReadPermissionForOrders(context as GraphQLContext);
      return originalMethod.apply(this, args);
    };
    
    return descriptor;
  };
}

// Decorator for admin panel write permission for orders (matching REST API)
export function RequireAdminPanelWritePermissionForOrders() {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      const [, , context] = args;
      requireAdminPanelWritePermissionForOrders(context as GraphQLContext);
      return originalMethod.apply(this, args);
    };
    
    return descriptor;
  };
}

// Decorator for admin panel read permission for order items (matching REST API)
export function RequireAdminPanelReadPermissionForOrderItems() {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      const [, , context] = args;
      requireAdminPanelReadPermissionForOrderItems(context as GraphQLContext);
      return originalMethod.apply(this, args);
    };
    
    return descriptor;
  };
}

// Decorator for admin panel write permission for order items (matching REST API)
export function RequireAdminPanelWritePermissionForOrderItems() {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      const [, , context] = args;
      requireAdminPanelWritePermissionForOrderItems(context as GraphQLContext);
      return originalMethod.apply(this, args);
    };
    
    return descriptor;
  };
}

// Decorator for admin panel read permission for carts (matching REST API)
export function RequireAdminPanelReadPermissionForCarts() {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      const [, , context] = args;
      requireAdminPanelReadPermissionForCarts(context as GraphQLContext);
      return originalMethod.apply(this, args);
    };
    
    return descriptor;
  };
}

// Decorator for admin panel write permission for carts (matching REST API)
export function RequireAdminPanelWritePermissionForCarts() {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      const [, , context] = args;
      requireAdminPanelWritePermissionForCarts(context as GraphQLContext);
      return originalMethod.apply(this, args);
    };
    
    return descriptor;
  };
}

// Decorator for user wallet read permission (matching REST API)
export function RequireWalletReadPermission() {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      const [, , context] = args;
      requireWalletRead(context as GraphQLContext);
      return originalMethod.apply(this, args);
    };
    
    return descriptor;
  };
}

// Decorator for user wallet write permission (matching REST API)
export function RequireWalletWritePermission() {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      const [, , context] = args;
      requireWalletWrite(context as GraphQLContext);
      return originalMethod.apply(this, args);
    };
    
    return descriptor;
  };
}

