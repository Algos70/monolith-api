import { check } from 'k6';
import { GraphQLClient } from '../utils/graphql-client.js';
import { AUTH_QUERIES } from '../queries/auth-queries.js';
import { 
  generateTestUser, 
  extractSessionCookie, 
  createSessionHeaders,
} from '../utils/test-helpers.js';

export class AuthService {
  constructor(client = new GraphQLClient()) {
    this.client = client;
    this.sessionCookie = null;
    this.currentUser = null;
  }

  async register(userData = null) {
    const user = userData || generateTestUser();
    
    const response = this.client.requestWithParsing(
      AUTH_QUERIES.REGISTER, 
      { input: user }
    );

    const success = check(response, {
    'register: response parsed': (r) => r.parsed !== null,
    'register: success true': (r) => r.parsed?.data?.register?.success === true,
    'register: correct message': (r) =>
      r.parsed?.data?.register?.message === 'User registered successfully',
    });

    if (success) {
      this.currentUser = user;
    }

    return { response, user, success };
  }

  async login(credentials = null) {
    const loginData = credentials || {
      username: this.currentUser?.username,
      password: this.currentUser?.password,
    };

    if (!loginData.username || !loginData.password) {
      throw new Error('Login credentials are required');
    }

    const response = this.client.requestWithParsing(
      AUTH_QUERIES.LOGIN,
      { input: loginData }
    );

    // Extract session cookie
    this.sessionCookie = extractSessionCookie(response);
    const success = check(response, {
    'login: response parsed': (r) => r.parsed !== null,
    'login: success true': (r) => r.parsed?.data?.login?.success === true,
    'login: correct message': (r) =>
      r.parsed?.data?.login?.message === 'Login successful',
    'login: correct user': (r) => r.parsed?.data?.login?.user?.preferred_username === this.currentUser?.username,
    });

    return { response, success, sessionCookie: this.sessionCookie };
  }

  async me() {
    if (!this.sessionCookie) {
      throw new Error('No active session. Please login first.');
    }

    const headers = createSessionHeaders(this.sessionCookie);
    const response = this.client.requestWithParsing(
      AUTH_QUERIES.ME,
      {},
      headers
    );
    const success = check(response, {
        'me: response parsed': (r) => r.parsed !== null,
        'me: correct user': (r) => r.parsed?.data?.me?.preferred_username === this.currentUser?.username,
        });
    return { response, success };
  }

  async logout() {
    if (!this.sessionCookie) {
      throw new Error('No active session. Please login first.');
    }

    const headers = createSessionHeaders(this.sessionCookie);
    const response = this.client.requestWithParsing(
      AUTH_QUERIES.LOGOUT,
      {},
      headers
    );

    const success = check(response, {
        'logout: response parsed': (r) => r.parsed !== null,
        'logout: success true': (r) => r.parsed?.data?.logout?.success === true,
        'logout: correct user': (r) => r.parsed?.data?.logout?.message === "Logged out successfully",
        });

    // Clear session on successful logout
    if (success) {
      this.sessionCookie = null;
    }

    return { response, success };
  }
  
  getSessionHeaders() {
    return createSessionHeaders(this.sessionCookie);
  }

  isAuthenticated() {
    return !!this.sessionCookie;
  }
}