import { check } from 'k6';
import { 
  generateTestUser, 
  extractSessionCookie, 
  createSessionHeaders,
} from '../graphql/utils/test-helpers.js';

export class AuthService {
  constructor(client, queries = null) {
    this.client = client;
    this.queries = queries;
    this.sessionCookie = null;
    this.currentUser = null;
    this.isGraphQLClient = this.client.constructor.name === 'GraphQLClient';
  }

  // Determine request method based on client type
  makeRequest(query, variables = {}, headers = {}) {
    if (this.isGraphQLClient) {
      // GraphQL request
      return this.client.requestWithParsing(query, variables, headers);
    } else {
      // REST request - query should be an object with method, url, body
      return this.client.requestWithParsing(query, variables, headers);
    }
  }

  async register(userData = null) {
    const user = userData || generateTestUser();
    
    const query = this.isGraphQLClient 
      ? this.queries.REGISTER 
      : {
          method: 'POST',
          url: '/register',
          body: user
        };

    const variables = this.isGraphQLClient ? { input: user } : {};
    const response = this.makeRequest(query, variables);

    const success = check(response, {
      'register: response parsed': (r) => r.parsed !== null,
      'register: success true': (r) => r.parsed?.data?.register?.success === true || r.parsed?.success === true,
      'register: correct message': (r) =>
        r.parsed?.data?.register?.message === 'User registered successfully' ||
        r.parsed?.message === 'User registered successfully',
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

    const query = this.isGraphQLClient 
      ? this.queries.LOGIN 
      : {
          method: 'POST',
          url: '/login',
          body: loginData
        };

    const variables = this.isGraphQLClient ? { input: loginData } : {};
    const response = this.makeRequest(query, variables);

    // Extract session cookie
    this.sessionCookie = extractSessionCookie(response);
    const success = check(response, {
      'login: response parsed': (r) => r.parsed !== null,
      'login: success true': (r) => r.parsed?.data?.login?.success === true || r.parsed?.success === true,
      'login: correct message': (r) =>
        r.parsed?.data?.login?.message === 'Login successful' ||
        r.parsed?.message === 'Login successful',
      'login: correct user': (r) => 
        r.parsed?.data?.login?.user?.preferred_username === this.currentUser?.username ||
        r.parsed?.user?.preferred_username === this.currentUser?.username,
    });

    return { response, success, sessionCookie: this.sessionCookie };
  }

  async me() {
    if (!this.sessionCookie) {
      throw new Error('No active session. Please login first.');
    }

    const headers = createSessionHeaders(this.sessionCookie);
    
    const query = this.isGraphQLClient 
      ? this.queries.ME 
      : {
          method: 'GET',
          url: '/me'
        };

    const response = this.makeRequest(query, {}, headers);
    
    const success = check(response, {
      'me: response parsed': (r) => r.parsed !== null,
      'me: correct user': (r) => 
        r.parsed?.data?.me?.preferred_username === this.currentUser?.username ||
        r.parsed?.preferred_username === this.currentUser?.username,
    });
    
    return { response, success };
  }

  async logout() {
    if (!this.sessionCookie) {
      throw new Error('No active session. Please login first.');
    }

    const headers = createSessionHeaders(this.sessionCookie);
    
    const query = this.isGraphQLClient 
      ? this.queries.LOGOUT 
      : {
          method: 'POST',
          url: '/logout'
        };

    const response = this.makeRequest(query, {}, headers);

    const success = check(response, {
      'logout: response parsed': (r) => r.parsed !== null,
      'logout: success true': (r) => r.parsed?.data?.logout?.success === true || r.parsed?.success === true,
      'logout: correct message': (r) => 
        r.parsed?.data?.logout?.message === "Logged out successfully" ||
        r.parsed?.message === "Logged out successfully",
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

  // Comprehensive authentication workflow test
  async runAuthWorkflowTest() {
    console.log('Running Authentication Workflow Test');

    try {
      // Step 1: Register new user
      const { user, success: registerSuccess } = await this.register();
      if (!registerSuccess) {
        return { success: false, step: 'registration' };
      }

      // Step 2: Login with registered user
      const { success: loginSuccess } = await this.login();
      if (!loginSuccess) {
        return { success: false, step: 'login' };
      }

      // Step 3: Get user profile (me query)
      const { success: meSuccess } = await this.me();
      if (!meSuccess) {
        return { success: false, step: 'profile' };
      }

      // Step 4: Logout user
      const { success: logoutSuccess } = await this.logout();
      if (!logoutSuccess) {
        return { success: false, step: 'logout' };
      }

      return { success: true, user };

    } catch (error) {
      console.error('Authentication workflow failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  // Edge case and negative tests
  async runEdgeCaseTests() {
    console.log('Running Authentication Edge Case Tests');

    let testResults = {
      duplicateRegistration: false,
      invalidLogin: false,
      unauthenticatedMe: false,
      doubleLogout: false,
      invalidCredentials: false
    };

    try {
      // Test 1: Duplicate registration
      const testUser = generateTestUser();
      await this.register(testUser);
      
      // Try to register same user again
      const registerQuery = this.isGraphQLClient 
        ? this.queries.REGISTER 
        : {
            method: 'POST',
            url: '/register',
            body: testUser
          };

      const registerVariables = this.isGraphQLClient ? { input: testUser } : {};
      const duplicateResponse = this.makeRequest(registerQuery, registerVariables);
      
      testResults.duplicateRegistration = check(duplicateResponse, {
        'duplicate registration: should fail': (r) => 
          r.parsed?.data?.register?.success === false ||
          r.parsed?.success === false ||
          r.parsed?.errors?.length > 0,
      });

      // Test 2: Invalid login credentials
      const loginQuery = this.isGraphQLClient 
        ? this.queries.LOGIN 
        : {
            method: 'POST',
            url: '/login',
            body: { username: 'nonexistent_user', password: 'wrong_password' }
          };

      const loginVariables = this.isGraphQLClient 
        ? { input: { username: 'nonexistent_user', password: 'wrong_password' } } 
        : {};

      const invalidLoginResponse = this.makeRequest(loginQuery, loginVariables);
      
      testResults.invalidLogin = check(invalidLoginResponse, {
        'invalid login: should fail': (r) => 
          r.parsed?.data?.login?.success === false ||
          r.parsed?.success === false ||
          r.parsed?.errors?.length > 0,
      });

      // Test 3: Unauthenticated me query
      const tempAuthService = new AuthService(this.client, this.queries);
      
      const meQuery = this.isGraphQLClient 
        ? this.queries.ME 
        : {
            method: 'GET',
            url: '/me'
          };

      const unauthMeResponse = tempAuthService.makeRequest(meQuery, {});
      
      testResults.unauthenticatedMe = check(unauthMeResponse, {
        'unauthenticated me: should fail': (r) => 
          r.parsed?.data?.me === null ||
          r.parsed?.preferred_username === null ||
          r.parsed?.errors?.length > 0,
      });

      // Test 4: Double logout (logout after already logged out)
      const authServiceForDoubleLogout = new AuthService(this.client, this.queries);
      await authServiceForDoubleLogout.register();
      await authServiceForDoubleLogout.login();
      await authServiceForDoubleLogout.logout(); // First logout
      
      // Try to logout again
      const logoutQuery = this.isGraphQLClient 
        ? this.queries.LOGOUT 
        : {
            method: 'POST',
            url: '/logout'
          };

      const doubleLogoutResponse = authServiceForDoubleLogout.makeRequest(
        logoutQuery, 
        {}, 
        authServiceForDoubleLogout.getSessionHeaders()
      );
      
      testResults.doubleLogout = check(doubleLogoutResponse, {
        'double logout: should handle gracefully': (r) => 
          r.parsed?.data?.logout?.success === true ||
          r.parsed?.success === true ||
          r.parsed?.errors?.length > 0,
      });

      // Test 5: Login with wrong password for existing user
      const wrongPasswordQuery = this.isGraphQLClient 
        ? this.queries.LOGIN 
        : {
            method: 'POST',
            url: '/login',
            body: { username: testUser.username, password: 'definitely_wrong_password' }
          };

      const wrongPasswordVariables = this.isGraphQLClient 
        ? { input: { username: testUser.username, password: 'definitely_wrong_password' } } 
        : {};

      const wrongPasswordResponse = this.makeRequest(wrongPasswordQuery, wrongPasswordVariables);
      
      testResults.invalidCredentials = check(wrongPasswordResponse, {
        'wrong password: should fail': (r) => 
          r.parsed?.data?.login?.success === false ||
          r.parsed?.success === false ||
          r.parsed?.errors?.length > 0,
      });

      const passedTests = Object.values(testResults).filter(Boolean).length;
      const totalTests = Object.keys(testResults).length;

      return { success: passedTests === totalTests, results: testResults };

    } catch (error) {
      console.error('Edge case tests failed:', error.message);
      return { success: false, error: error.message, results: testResults };
    }
  }

  // Negative test cases
  async runNegativeTests() {
    console.log('Running Authentication Negative Tests');

    let testResults = {
      emptyCredentials: false,
      malformedData: false,
      sqlInjection: false,
      longInputs: false
    };

    try {
      // Test 1: Empty credentials
      const emptyRegQuery = this.isGraphQLClient 
        ? this.queries.REGISTER 
        : {
            method: 'POST',
            url: '/register',
            body: { username: '', email: '', password: '' }
          };

      const emptyRegVariables = this.isGraphQLClient 
        ? { input: { username: '', email: '', password: '' } } 
        : {};

      const emptyRegResponse = this.makeRequest(emptyRegQuery, emptyRegVariables);
      
      testResults.emptyCredentials = check(emptyRegResponse, {
        'empty credentials: should fail': (r) => 
          r.parsed?.data?.register?.success === false ||
          r.parsed?.success === false ||
          r.parsed?.errors?.length > 0,
      });

      // Test 2: Malformed email
      const malformedQuery = this.isGraphQLClient 
        ? this.queries.REGISTER 
        : {
            method: 'POST',
            url: '/register',
            body: { username: 'testuser', email: 'not-an-email', password: 'password123' }
          };

      const malformedVariables = this.isGraphQLClient 
        ? { input: { username: 'testuser', email: 'not-an-email', password: 'password123' } } 
        : {};

      const malformedResponse = this.makeRequest(malformedQuery, malformedVariables);
      
      testResults.malformedData = check(malformedResponse, {
        'malformed email: should fail': (r) => 
          r.parsed?.data?.register?.success === false ||
          r.parsed?.success === false ||
          r.parsed?.errors?.length > 0,
      });

      // Test 3: SQL injection attempt
      const sqlInjectionQuery = this.isGraphQLClient 
        ? this.queries.LOGIN 
        : {
            method: 'POST',
            url: '/login',
            body: { username: "admin'; DROP TABLE users; --", password: 'password' }
          };

      const sqlInjectionVariables = this.isGraphQLClient 
        ? { input: { username: "admin'; DROP TABLE users; --", password: 'password' } } 
        : {};

      const sqlInjectionResponse = this.makeRequest(sqlInjectionQuery, sqlInjectionVariables);
      
      testResults.sqlInjection = check(sqlInjectionResponse, {
        'sql injection: should fail safely': (r) => 
          r.parsed?.data?.login?.success === false ||
          r.parsed?.success === false ||
          r.parsed?.errors?.length > 0,
      });

      // Test 4: Extremely long inputs
      const longString = 'a'.repeat(10000);
      const longInputQuery = this.isGraphQLClient 
        ? this.queries.REGISTER 
        : {
            method: 'POST',
            url: '/register',
            body: { username: longString, email: `${longString}@example.com`, password: longString }
          };

      const longInputVariables = this.isGraphQLClient 
        ? { input: { username: longString, email: `${longString}@example.com`, password: longString } } 
        : {};

      const longInputResponse = this.makeRequest(longInputQuery, longInputVariables);
      
      testResults.longInputs = check(longInputResponse, {
        'long inputs: should fail gracefully': (r) => 
          r.parsed?.data?.register?.success === false ||
          r.parsed?.success === false ||
          r.parsed?.errors?.length > 0,
      });

      const passedTests = Object.values(testResults).filter(Boolean).length;
      const totalTests = Object.keys(testResults).length;
      
      return { success: passedTests === totalTests, results: testResults };

    } catch (error) {
      console.error('Negative tests failed:', error.message);
      return { success: false, error: error.message, results: testResults };
    }
  }
}