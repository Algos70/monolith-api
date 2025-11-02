import { sleep } from 'k6';
import { AuthService } from '../services/auth-service.js';
import { TEST_CONFIG } from '../../config/test-config.js';

export class TestBase {
  constructor() {
    this.authService = null;
    this.sessionHeaders = {};
    this.currentUser = null;
  }

  // Setup method - like pytest fixture setup
  async setup() {
    console.log('\n🔐 Setting up authentication...');
    
    this.authService = new AuthService();
    
    // Register user
    const { user } = this.authService.register();
    this.currentUser = user;
    sleep(TEST_CONFIG.TIMEOUTS.DEFAULT_SLEEP);
    
    // Login user
    const { sessionCookie } = this.authService.login();
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
export function withAuthentication(testFunction) {
  return async function() {
    const testBase = new TestBase();
    
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
export async function setupAuth() {
  console.log('\n🔐 Setting up authentication...');
  
  const authService = new AuthService();
  
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