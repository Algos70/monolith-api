import { sleep } from 'k6';
import { AuthService } from './auth-service.js';
import { TEST_CONFIG } from '../config/test-config.js';

export class TestBase {
  constructor(client = null, queries = null) {
    this.client = client;
    this.queries = queries;
    this.authService = null;
    this.sessionHeaders = {};
    this.currentUser = null;
  }

  // Setup method - like pytest fixture setup
  async setup() {
    console.log('\n🔐 Setting up authentication...');
    
    if (!this.client) {
      throw new Error('Client must be provided to TestBase constructor');
    }
    
    this.authService = new AuthService(this.client, this.queries);
    
    // Register user
    const { user } = this.authService.register();
    this.currentUser = user;
    sleep(TEST_CONFIG.TIMEOUTS.DEFAULT_SLEEP);
    
    // Login user
    this.authService.login();
    sleep(TEST_CONFIG.TIMEOUTS.DEFAULT_SLEEP);
    
    // Store session headers for other services
    this.sessionHeaders = this.authService.getSessionHeaders();
    
    console.log('✅ Authentication setup completed');
    return {
      user: this.currentUser,
      sessionHeaders: this.sessionHeaders,
      authService: this.authService,
    };
  }

  // Teardown method - like pytest fixture teardown
  async teardown() {
    if (this.authService && this.authService.isAuthenticated()) {
      console.log('\n🔐 Cleaning up authentication...');
      this.authService.logout();
      sleep(TEST_CONFIG.TIMEOUTS.DEFAULT_SLEEP);
      console.log('✅ Authentication cleanup completed');
    }
  }

  // Get session headers for services
  getSessionHeaders() {
    return this.sessionHeaders;
  }

  // Get current user
  getCurrentUser() {
    return this.currentUser;
  }

  // Get auth service
  getAuthService() {
    return this.authService;
  }
}

// Utility function for authenticated tests
export function withAuthentication(client, queries, testFunction) {
  return async function() {
    const testBase = new TestBase(client, queries);
    
    try {
      // Setup
      const authData = await testBase.setup();
      
      // Run the actual test with auth data
      await testFunction(authData);
      
    } finally {
      // Teardown
      await testBase.teardown();
    }
  };
}

// Alternative: Simple auth helper function
export async function setupAuth(client, queries = null) {
  console.log('\n🔐 Setting up authentication...');
  
  if (!client) {
    throw new Error('Client must be provided to setupAuth function');
  }
  
  const authService = new AuthService(client, queries);
  
  const { user } = authService.register();
  sleep(TEST_CONFIG.TIMEOUTS.DEFAULT_SLEEP);
  
  authService.login();
  sleep(TEST_CONFIG.TIMEOUTS.DEFAULT_SLEEP);
  
  console.log('✅ Authentication setup completed');
  
  return {
    user,
    authService,
    sessionHeaders: authService.getSessionHeaders(),
    cleanup: () => {
      console.log('\n🔐 Cleaning up authentication...');
      authService.logout();
      sleep(TEST_CONFIG.TIMEOUTS.DEFAULT_SLEEP);
      console.log('✅ Authentication cleanup completed');
    }
  };
}