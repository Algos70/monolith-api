import { Request, Response, NextFunction } from "express";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { SessionService } from "../services/SessionService";
import { introspectToken } from "./confidentialClient";
import type { Permission, SessionUser } from "./types";

// Types
interface AuthenticatedRequest extends Request {
  user?: any;
}

// JWKS setup for JWT verification
let jwks: any = null;
let issuer: string = "";

function initializeJWKS() {
  if (!jwks) {
    issuer = process.env.KEYCLOAK_ISSUER!;
    if (!issuer) {
      throw new Error("KEYCLOAK_ISSUER environment variable is not set");
    }
    console.log("Initializing JWKS with issuer:", issuer);
    jwks = createRemoteJWKSet(
      new URL(`${issuer}/protocol/openid-connect/certs`)
    );
  }
}

// Helper function to extract roles from payload
function extractRoles(payload: any): string[] {
  return payload?.realm_access?.roles ?? [];
}

// Helper function to extract permissions from session user
function extractPermissions(user: SessionUser | undefined): string[] {
  return user?.permissions ?? [];
}

// ============================================================================
// SESSION-BASED AUTHENTICATION MIDDLEWARES
// ============================================================================

// Basic session authentication check
export const requireAuth = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!SessionService.isAuthenticated(req)) {
    return res.status(401).json({ error: "Authentication required" });
  }
  next();
};

// Optional session authentication (doesn't block if not authenticated)
export const optionalAuth = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // This middleware doesn't block the request if user is not authenticated
  // but makes user info available if they are authenticated
  next();
};

// Session-based role checking
export const requireSessionRoles = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!SessionService.isAuthenticated(req)) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const user = SessionService.getUser(req);
    const userRoles = extractRoles(user);
    const hasRequiredRole = roles.some((role) => userRoles.includes(role));

    if (!hasRequiredRole) {
      return res.status(403).json({
        error: "Insufficient permissions",
        required: roles,
        userRoles,
      });
    }

    next();
  };
};

// Session-based permission checking - requires ANY of the permissions
export const requireSessionPermissions = (permissions: Permission[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!SessionService.isAuthenticated(req)) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const user: SessionUser = SessionService.getUser(req);
    const userPermissions = extractPermissions(user);
    const hasRequiredPermission = permissions.some((permission) =>
      userPermissions.includes(permission)
    );

    if (!hasRequiredPermission) {
      return res.status(403).json({
        error: "Insufficient permissions",
        required: permissions,
        userPermissions,
      });
    }

    next();
  };
};

// Session-based permission checking - requires ALL of the permissions
export const requireSessionAllPermissions = (permissions: Permission[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!SessionService.isAuthenticated(req)) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const user: SessionUser = SessionService.getUser(req);
    const userPermissions = extractPermissions(user);
    const hasAllPermissions = permissions.every((permission) =>
      userPermissions.includes(permission)
    );

    if (!hasAllPermissions) {
      const missingPermissions = permissions.filter(
        (permission) => !userPermissions.includes(permission)
      );
      return res.status(403).json({
        error: "Missing required permissions",
        required: permissions,
        missing: missingPermissions,
        userPermissions,
      });
    }

    next();
  };
};

// ============================================================================
// JWT BEARER TOKEN AUTHENTICATION MIDDLEWARES
// ============================================================================

// JWT Bearer token verification
export const verifyBearer = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    initializeJWKS();

    const auth = req.headers.authorization || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;

    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    const { payload } = await jwtVerify(token, jwks, {
      issuer,
      audience: process.env.KEYCLOAK_AUDIENCE || undefined,
    });

    req.user = payload;
    next();
  } catch (error) {
    console.error("JWT verification failed:", error);
    return res.status(401).json({ error: "Invalid token" });
  }
};

// Bearer token verification using introspection (for opaque tokens)
export const verifyBearerWithIntrospection = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const auth = req.headers.authorization || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;

    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    const introspectionResult = await introspectToken(token);

    if (!introspectionResult.active) {
      return res.status(401).json({ error: "Token is not active" });
    }

    req.user = {
      sub: introspectionResult.sub,
      realm_access: { roles: introspectionResult.realm_access?.roles || [] },
      scope: introspectionResult.scope,
      client_id: introspectionResult.client_id,
      username: introspectionResult.username,
      email: introspectionResult.email,
    };

    next();
  } catch (error) {
    console.error("Token introspection failed:", error);
    return res.status(401).json({ error: "Token validation failed" });
  }
};

// JWT Bearer token role checking
export const requireBearerRoles = (roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const userRoles = extractRoles(req.user);
    const hasAllRequiredRoles = roles.every((role) => userRoles.includes(role));

    if (!hasAllRequiredRoles) {
      return res.status(403).json({
        error: "Insufficient role permissions",
        required: roles,
        userRoles,
      });
    }

    next();
  };
};

// ============================================================================
// CONVENIENCE MIDDLEWARES (PRE-CONFIGURED ROLE CHECKS)
// ============================================================================

// Session-based convenience middlewares
export const requireSessionAdmin = requireSessionRoles(["admin"]);
export const requireSessionUser = requireSessionRoles(["user"]);

// Permission-based convenience middlewares

export const requireAdminPanelReadPermissionForUser = requireSessionPermissions([
  "user_read", "admin_read"
]);
export const requireAdminPanelWritePermissionForUser = requireSessionPermissions([
  "user_write", "admin_write"
]);

export const requireAdminPanelReadPermissionForCategory = requireSessionPermissions([
  "categories_read", "admin_read"
]);
export const requireAdminPanelWritePermissionForCategory = requireSessionPermissions([
  "categories_write", "admin_write"
]);

export const requireAdminPanelReadPermissionForProducts = requireSessionPermissions([
  "products_read", "admin_read"
]);
export const requireAdminPanelWritePermissionForProducts = requireSessionPermissions([
  "products_write", "admin_write"
]);

export const requireAdminPanelReadPermissionForWallets = requireSessionPermissions([
  "wallet_read", "admin_read"
]);
export const requireAdminPanelWritePermissionForWallets = requireSessionPermissions([
  "wallet_write", "admin_write"
]);

export const requireAdminPanelReadPermissionForOrders = requireSessionPermissions([
  "orders_read", "admin_read"
]);
export const requireAdminPanelWritePermissionForOrders = requireSessionPermissions([
  "orders_write", "admin_write"
]);

export const requireAdminPanelReadPermissionForOrderItems = requireSessionPermissions([
  "orders_read", "admin_read"
]);
export const requireAdminPanelWritePermissionForOrderItems = requireSessionPermissions([
  "orders_write", "admin_write"
]);

export const requireWalletReadPermission = requireSessionPermissions([
  "wallet_read",
]);
export const requireWalletWritePermission = requireSessionPermissions([
  "wallet_write",
]);
export const requireCartPermissions = requireSessionPermissions([
  "cart_read",
  "cart_write",
]);
export const requireProductsReadPermission = requireSessionPermissions([
  "products_read",
]);
export const requireProductsWritePermission = requireSessionPermissions([
  "products_write",
]);
export const requireOrdersReadPermission = requireSessionPermissions([
  "orders_read",
]);
export const requireOrdersWritePermission = requireSessionPermissions([
  "orders_write",
]);
export const requireCategoriesReadPermission = requireSessionPermissions([
  "categories_read",
]);
export const requireCategoriesWritePermission = requireSessionPermissions([
  "categories_write",
]);

// Bearer token convenience middlewares
export const requireBearerAdmin = requireBearerRoles(["admin"]);
export const requireBearerUser = requireBearerRoles(["user"]);

// ============================================================================
// HYBRID MIDDLEWARES (SUPPORT BOTH SESSION AND BEARER)
// ============================================================================

// Check authentication from either session or bearer token
export const requireAuthHybrid = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  // Check session first
  if (SessionService.isAuthenticated(req)) {
    return next();
  }

  // If no session, try bearer token
  const auth = req.headers.authorization || "";
  if (auth.startsWith("Bearer ")) {
    return verifyBearer(req, res, next);
  }

  return res.status(401).json({ error: "Authentication required" });
};

// Hybrid role checking (works with both session and bearer token)
export const requireRolesHybrid = (roles: string[]) => {
  return async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) => {
    let userRoles: string[] = [];

    // Check session first
    if (SessionService.isAuthenticated(req)) {
      const user = SessionService.getUser(req);
      userRoles = extractRoles(user);
    }
    // Try bearer token
    else {
      const auth = req.headers.authorization || "";
      if (auth.startsWith("Bearer ")) {
        try {
          await verifyBearer(req, res, () => {
            userRoles = extractRoles(req.user);
          });
        } catch (error) {
          return res.status(401).json({ error: "Authentication failed" });
        }
      } else {
        return res.status(401).json({ error: "Authentication required" });
      }
    }

    const hasRequiredRole = roles.some((role) => userRoles.includes(role));
    if (!hasRequiredRole) {
      return res.status(403).json({
        error: "Insufficient permissions",
        required: roles,
        userRoles,
      });
    }

    next();
  };
};

// Hybrid permission checking (works with both session and bearer token)
export const requirePermissionsHybrid = (permissions: Permission[]) => {
  return async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) => {
    let userPermissions: string[] = [];

    // Check session first
    if (SessionService.isAuthenticated(req)) {
      const user: SessionUser = SessionService.getUser(req);
      userPermissions = extractPermissions(user);
    }
    // Try bearer token (if it has permissions in payload)
    else {
      const auth = req.headers.authorization || "";
      if (auth.startsWith("Bearer ")) {
        try {
          await verifyBearer(req, res, () => {
            // Bearer tokens might have permissions in different format
            userPermissions = req.user?.permissions || [];
          });
        } catch (error) {
          return res.status(401).json({ error: "Authentication failed" });
        }
      } else {
        return res.status(401).json({ error: "Authentication required" });
      }
    }

    const hasRequiredPermission = permissions.some((permission) =>
      userPermissions.includes(permission)
    );
    if (!hasRequiredPermission) {
      return res.status(403).json({
        error: "Insufficient permissions",
        required: permissions,
        userPermissions,
      });
    }

    next();
  };
};
