// src/auth/verify-jwt.ts
import { createRemoteJWKSet, jwtVerify } from "jose";
import { introspectToken } from "./confidentialClient";

// Move the initialization inside the function to ensure env vars are loaded
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

export async function verifyBearer(req: any, res: any, next: any) {
  try {
    // Initialize JWKS if not already done
    initializeJWKS();

    const auth = req.headers.authorization || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
    if (!token) return res.status(401).json({ error: "No token" });

    const { payload } = await jwtVerify(token, jwks, {
      issuer,
      audience: process.env.KEYCLOAK_AUDIENCE || undefined,
    });
    // payload.scope (string, space-separated) + realm_access.roles
    (req as any).user = payload;
    next();
  } catch (e) {
    return res.status(401).json({ error: "Invalid token" });
  }
}

// Alternative verification using token introspection (for opaque tokens)
export async function verifyBearerWithIntrospection(
  req: any,
  res: any,
  next: any
) {
  try {
    const auth = req.headers.authorization || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
    if (!token) return res.status(401).json({ error: "No token" });

    const introspectionResult = await introspectToken(token);

    if (!introspectionResult.active) {
      return res.status(401).json({ error: "Token is not active" });
    }

    // Set user info from introspection result
    (req as any).user = {
      sub: introspectionResult.sub,
      realm_access: { roles: introspectionResult.realm_access?.roles || [] },
      scope: introspectionResult.scope,
      client_id: introspectionResult.client_id,
      username: introspectionResult.username,
      email: introspectionResult.email,
    };

    next();
  } catch (e) {
    console.error("Token introspection failed:", e);
    return res.status(401).json({ error: "Token validation failed" });
  }
}
