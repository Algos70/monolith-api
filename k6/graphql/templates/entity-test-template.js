import { sleep } from 'k6';
import { AuthService } from '../services/auth-service.js';
import { TEST_CONFIG } from '../config/test-config.js';

export const options = TEST_CONFIG.SMOKE_TEST_OPTIONS;

// Template for entity tests
// Replace ENTITY_NAME with your actual entity (e.g., Product, Order, Category)
export default function () {
  const authService = new AuthService();

  console.log('\n🧪 Starting ENTITY_NAME Tests');

  // Step 1: Authenticate (most entities require authentication)
  const { user } = authService.register();
  sleep(TEST_CONFIG.TIMEOUTS.DEFAULT_SLEEP);

  authService.login();
  sleep(TEST_CONFIG.TIMEOUTS.DEFAULT_SLEEP);

  // Step 2: Create Entity Test
  // TODO: Implement create entity test
  console.log('📝 Testing ENTITY_NAME Creation...');
  
  // Step 3: Read Entity Test
  // TODO: Implement read entity test
  console.log('📖 Testing ENTITY_NAME Reading...');
  
  // Step 4: Update Entity Test
  // TODO: Implement update entity test
  console.log('✏️ Testing ENTITY_NAME Update...');
  
  // Step 5: Delete Entity Test
  // TODO: Implement delete entity test
  console.log('🗑️ Testing ENTITY_NAME Deletion...');

  // Step 6: Cleanup - Logout
  authService.logout();
  sleep(TEST_CONFIG.TIMEOUTS.DEFAULT_SLEEP);

  console.log('✅ ENTITY_NAME Tests Completed');
}

/*
Usage Instructions:
1. Copy this template to a new file (e.g., products.test.js)
2. Replace ENTITY_NAME with your entity name
3. Create corresponding queries file (e.g., queries/product-queries.js)
4. Create corresponding service file (e.g., services/product-service.js)
5. Implement the CRUD operations in the service
6. Update the test steps above to use your service methods

Example structure:
- queries/product-queries.js (GraphQL queries)
- services/product-service.js (Business logic)
- products.test.js (Test implementation)
*/