import { GraphQLClient } from '../utils/graphql-client.js';
import { AUTH_QUERIES } from '../queries/auth-queries.js';
import { 
  generateTestUser, 
  extractSessionCookie, 
  createSessionHeaders,
  logTestStep,
  checkAuthenticatedResponse 
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

    logTestStep('REGISTER', response, response.parsed);

    const success = checkAuthenticatedResponse(
      response,
      (data) => data.register?.success === true,
      'Register'
    );

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

    logTestStep('LOGIN', response, response.parsed);

    // Extract session cookie
    this.sessionCookie = extractSessionCookie(response);

    const success = checkAuthenticatedResponse(
      response,
      (data) => {
        const loginResult = data.login;
        return loginResult?.success === true && 
               loginResult?.user?.preferred_username === loginData.username;
      },
      'Login'
    );

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

    logTestStep('ME QUERY', response, response.parsed);

    const success = checkAuthenticatedResponse(
      response,
      (data) => data.me?.preferred_username === this.currentUser?.username,
      'Me Query'
    );

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

    logTestStep('LOGOUT', response, response.parsed);

    const success = checkAuthenticatedResponse(
      response,
      (data) => data.logout?.success === true,
      'Logout'
    );

    // Clear session on successful logout
    if (success) {
      this.sessionCookie = null;
    }

    return { response, success };
  }

  async refreshToken() {
    if (!this.sessionCookie) {
      throw new Error('No active session. Please login first.');
    }

    const headers = createSessionHeaders(this.sessionCookie);
    const response = this.client.requestWithParsing(
      AUTH_QUERIES.REFRESH_TOKEN,
      {},
      headers
    );

    logTestStep('REFRESH TOKEN', response, response.parsed);

    const success = checkAuthenticatedResponse(
      response,
      (data) => data.refreshToken?.success === true,
      'Refresh Token'
    );

    return { response, success };
  }

  getSessionHeaders() {
    return createSessionHeaders(this.sessionCookie);
  }

  isAuthenticated() {
    return !!this.sessionCookie;
  }
}