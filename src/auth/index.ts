export { default as authRoutes } from "../rest/authRoutes";
export {
  // Session-based middlewares
  requireAuth,
  optionalAuth,
  requireSessionRoles,
  requireSessionAdmin,
  requireSessionUser,

  // Bearer token middlewares
  verifyBearer,
  verifyBearerWithIntrospection,
  requireBearerRoles,
  requireBearerAdmin,
  requireBearerUser,

  // Hybrid middlewares (session + bearer)
  requireAuthHybrid,
  requireRolesHybrid,
} from "./middleware";
