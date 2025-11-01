export const TEST_CONFIG = {
  // Base configuration
  BASE_URL: __ENV.BASE_URL || 'http://localhost:4000/graphql',
  
  // Test options for different scenarios
  LOAD_TEST_OPTIONS: {
    vus: 10,
    duration: '30s',
  },
  
  SMOKE_TEST_OPTIONS: {
    vus: 1,
    iterations: 1,
  },
  

  TEST_DATA: {
    DEFAULT_PASSWORD: 'TestPassword123!',
    ADMIN_CREDENTIALS: {
      username: __ENV.ADMIN_USERNAME || 'admin',
      password: __ENV.ADMIN_PASSWORD || 'admin123',
    },
  },

  TIMEOUTS: {
    DEFAULT_SLEEP: 1, // seconds
    REQUEST_TIMEOUT: '30s',
  },
};