import { sleep } from 'k6';
import { ProductService } from './services/product-service.js';
import { TEST_CONFIG } from './config/test-config.js';
import { setupAuth } from './utils/test-base.js';
import { resetTestResults, printTestSummary } from './utils/test-helpers.js';

export const options = TEST_CONFIG.SMOKE_TEST_OPTIONS;

// Test data based on seeded data. We seed the db at CI with these data
const SEEDED_DATA = {
  categories: {
    electronics: 'electronics',
    clothing: 'clothing',
    books: 'books',
    homeGarden: 'home-garden',
    sports: 'sports',
  },
  products: {
    // Electronics
    iphone: 'iphone-15-pro',
    macbook: 'macbook-air-m2',
    airpods: 'airpods-pro',
    // Clothing
    tshirt: 'classic-t-shirt',
    jeans: 'denim-jeans',
    jacket: 'winter-jacket',
    // Books
    jsBook: 'javascript-the-good-parts',
    cleanCode: 'clean-code',
    // Home & Garden
    coffeeMaker: 'coffee-maker',
    gardenTools: 'garden-tools-set',
    // Sports
    yogaMat: 'yoga-mat',
    runningShoes: 'running-shoes',
  },
};

export default function () {
  // Reset test results for this run
  resetTestResults();
  
  console.log('\n🛍️ Starting Product User Queries Tests');
  console.log('==========================================');

  const { user, sessionHeaders, cleanup } = setupAuth();

  // Create product service with authenticated session
  const productService = new ProductService(undefined, sessionHeaders);
  
  // Test 1: Get All Products - Basic product listing without filters
  
  console.log("prods:", productService.getProducts())
  sleep(TEST_CONFIG.TIMEOUTS.DEFAULT_SLEEP);


  // Cleanup authentication (like pytest fixture teardown)
  cleanup();

  // Print detailed test summary
  printTestSummary();
  
  console.log('\n✅ Product User Queries Tests Completed');
}