export const TEST_CONFIG = {
  // Base configuration
  BASE_URL: __ENV.BASE_URL || 'http://localhost:4000/graphql',
  REST_BASE_URL: __ENV.REST_BASE_URL || 'http://localhost:4000/api',
  
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

  // K6 Test Options
  SMOKE_TEST_OPTIONS: {
    vus: 1,
    iterations: 1, // Sadece 1 kez çalıştır
    thresholds: {
      http_req_duration: ['p(95)<2000'],
      http_req_failed: ['rate<0.5'],
    },
  },
};

// Export individual URLs for convenience
export const BASE_URL = TEST_CONFIG.BASE_URL;
export const REST_BASE_URL = TEST_CONFIG.REST_BASE_URL;