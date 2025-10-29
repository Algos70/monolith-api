import axios from 'axios';

const KEYCLOAK_BASE_URL = process.env.KEYCLOAK_BASE_URL || "http://localhost:8080";
const KEYCLOAK_REALM = process.env.KEYCLOAK_REALM || "shop";
const KEYCLOAK_CLIENT_ID = process.env.KEYCLOAK_CLIENT_ID || "monolith-api";
const KEYCLOAK_CLIENT_SECRET = process.env.KEYCLOAK_CLIENT_SECRET;

// Not needed for monolithic service - removed

// Token introspection for validating tokens
export async function introspectToken(token: string) {
  const introspectUrl = `${KEYCLOAK_BASE_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/token/introspect`;
  
  const response = await axios.post(
    introspectUrl,
    new URLSearchParams({
      token,
      client_id: KEYCLOAK_CLIENT_ID!,
      client_secret: KEYCLOAK_CLIENT_SECRET!,
    }),
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    }
  );

  return response.data;
}

// Refresh token using confidential client
export async function refreshTokenWithClient(refreshToken: string) {
  const tokenUrl = `${KEYCLOAK_BASE_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/token`;
  
  const response = await axios.post(
    tokenUrl,
    new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: KEYCLOAK_CLIENT_ID!,
      client_secret: KEYCLOAK_CLIENT_SECRET!,
    }),
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    }
  );

  return response.data;
}