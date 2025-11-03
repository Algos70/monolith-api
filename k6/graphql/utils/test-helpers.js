
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