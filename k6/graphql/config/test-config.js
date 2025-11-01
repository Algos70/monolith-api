export const TEST_CONFIG = {
  // Base configuration
  BASE_URL: __ENV.BASE_URL || 'http://localhost:4000/graphql',
  
  TEST_DATA: {
    DEFAULT_PASSWORD: 'TestPassword123!',
    ADMIN_CREDENTIALS: {
      username: __ENV.ADMIN_USERNAME || 'admin2',
      password: __ENV.ADMIN_PASSWORD || '123',
    },
  },

  TIMEOUTS: {
    DEFAULT_SLEEP: 0.5, // seconds
    REQUEST_TIMEOUT: '30s',
  },
};