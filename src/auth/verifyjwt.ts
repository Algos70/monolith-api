// src/auth/verify-jwt.ts
import { createRemoteJWKSet, jwtVerify } from "jose";

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
