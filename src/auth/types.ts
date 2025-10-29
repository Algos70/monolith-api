import { Session } from "express-session";

// Keycloak token payload interface
export interface KeycloakTokenPayload {
  exp: number;
  iat: number;
  auth_time: number;
  jti: string;
  iss: string;
  aud: string[];
  sub: string;
  typ: string;
  azp: string;
  sid: string;
  acr: string;
  "allowed-origins": string[];
  realm_access: {
    roles: string[];
  };
  resource_access: {
    [key: string]: {
      roles: string[];
    };
  };
  scope: string;
  email_verified: boolean;
  permissions: string[];
  name: string;
  preferred_username: string;
  given_name: string;
  family_name: string;
  email: string;
}

// Session user data interface
export interface SessionUser {
  sub: string; // Keycloak user ID
  email_verified: boolean;
  permissions: string[];
  name: string;
  preferred_username: string;
  given_name: string;
  family_name: string;
  email: string;
  dbUserId: string; // Database user ID
  access_token: string;
  refresh_token: string;
  id_token: string;
}

// Extended session interface
export interface AppSession extends Session {
  user?: SessionUser;
}

// Permission types for better type safety
export type Permission = 
  | "user_write"
  | "wallet_read" 
  | "admin_read"
  | "cart_read"
  | "wallet_write"
  | "cart_write"
  | "admin_write"
  | "user_read"
  | "products_read"
  | "orders_read"
  | "categories_read"
  | "orders_write"
  | "categories_write"
  | "products_write";

// Role types
export type Role = "admin" | "user" | "offline_access" | "default-roles-shop" | "uma_authorization";

// Helper type for checking permissions
export interface PermissionChecker {
  hasPermission(permission: Permission): boolean;
  hasAnyPermission(permissions: Permission[]): boolean;
  hasAllPermissions(permissions: Permission[]): boolean;
}