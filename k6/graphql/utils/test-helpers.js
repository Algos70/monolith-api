import { check } from 'k6';

export function generateTestUser() {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  
  return {
    username: `testuser_${timestamp}_${random}`,
    email: `test_${timestamp}_${random}@example.com`,
    password: "TestPassword123!",
    firstName: "Test",
    lastName: "User",
  };
}

export function extractSessionCookie(response) {
  const cookies = response.headers['Set-Cookie'];
  if (!cookies) return null;
  
  // Extract connect.sid cookie
  const sessionCookie = cookies.split(';').find(cookie => 
    cookie.trim().startsWith('connect.sid=')
  );
  
  return sessionCookie ? cookies : null;
}

export function createSessionHeaders(sessionCookie) {
  return sessionCookie ? { Cookie: sessionCookie } : {};
}

export function logTestStep(stepName, response, data = null) {
  console.log(`\n=== ${stepName} ===`);
  console.log(`Status: ${response.status}`);
  console.log(`Response: ${response.body}`);
  if (data) {
    console.log(`Parsed Data:`, JSON.stringify(data, null, 2));
  }
}

export function checkGraphQLResponse(response, checks, stepName = 'GraphQL Request') {
  const result = check(response, {
    [`${stepName} - HTTP 200`]: (r) => r.status === 200,
    ...checks,
  });
  
  return result;
}

export function checkAuthenticatedResponse(response, expectedData, stepName) {
  const parsed = response.parsed;
  
  return checkGraphQLResponse(response, {
    [`${stepName} - No GraphQL errors`]: () => parsed.success,
    [`${stepName} - Has data`]: () => !!parsed.data,
    [`${stepName} - Data matches expectation`]: () => {
      if (typeof expectedData === 'function') {
        return expectedData(parsed.data);
      }
      return true;
    },
  }, stepName);
}