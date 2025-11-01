import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 1,
  iterations: 1,
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:4000/graphql';

// Helper: GraphQL isteği
function graphqlRequest(query, variables = {}, headers = {}) {
  return http.post(BASE_URL, JSON.stringify({ query, variables }), {
    headers: { 'Content-Type': 'application/json', ...headers },
  });
}

export default function () {
  // 1️⃣ REGISTER
  const registerMutation = `
    mutation Register($input: RegisterInput!) {
      register(input: $input) {
        success
        message
      }
    }
  `;
  const user = {
    username: "testuser_" + Math.floor(Math.random() * 10000),
    email: "test" + Math.floor(Math.random() * 10000) + "@example.com",
    password: "123456",
    firstName: "Test",
    lastName: "User",
  };

  const registerRes = graphqlRequest(registerMutation, { input: user });
  check(registerRes, {
    'register - 200': (r) => r.status === 200,
    'register - success': (r) => JSON.parse(r.body).data.register.success === true,
  });

  sleep(1);

  // 2️⃣ LOGIN
  const loginMutation = `
    mutation Login($input: LoginInput!) {
      login(input: $input) {
        success
        message
        user {
          username
        }
      }
    }
  `;
  const loginRes = graphqlRequest(loginMutation, {
    input: { username: user.username, password: user.password },
  });

  const loginData = JSON.parse(loginRes.body);
  check(loginRes, {
    'login - 200': (r) => r.status === 200,
    'login - success': (r) => loginData.data.login.success === true,
  });

  // 🔹 SESSION COOKIE'YI AL
  const cookieHeader = loginRes.headers['Set-Cookie'];
  check(cookieHeader, {
    'cookie set edildi': (c) => c && c.includes('connect.sid'),
  });

  const sessionHeaders = {
    Cookie: cookieHeader, // sonraki isteklerde bu cookie’yi gönder
  };

  sleep(1);

  // 3️⃣ ME Query (session’la kimlik doğrulama testi)
  const meQuery = `
    query {
      me {
        username
        email
      }
    }
  `;
  const meRes = graphqlRequest(meQuery, {}, sessionHeaders);
  const meData = JSON.parse(meRes.body);
  check(meRes, {
    'me - 200': (r) => r.status === 200,
    'me - doğru kullanıcı': (r) =>
      meData.data.me?.username === user.username,
  });

  sleep(1);

  // 4️⃣ LOGOUT
  const logoutMutation = `
    mutation {
      logout {
        success
        message
      }
    }
  `;
  const logoutRes = graphqlRequest(logoutMutation, {}, sessionHeaders);
  const logoutData = JSON.parse(logoutRes.body);
  check(logoutRes, {
    'logout - 200': (r) => r.status === 200,
    'logout - success': (r) => logoutData.data.logout.success === true,
  });

  sleep(1);
}
