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
  
  // Test 1: Get All Products
  productService.getProducts();
  sleep(TEST_CONFIG.TIMEOUTS.DEFAULT_SLEEP);

  productService.getProducts({
    page: 1,
    limit: 5,
  });
  sleep(TEST_CONFIG.TIMEOUTS.DEFAULT_SLEEP);

  productService.getProducts({
    inStockOnly: true,
    limit: 10,
  });
  sleep(TEST_CONFIG.TIMEOUTS.DEFAULT_SLEEP);

  const { product: iphone } = productService.getProductBySlug(SEEDED_DATA.products.iphone);
  sleep(TEST_CONFIG.TIMEOUTS.DEFAULT_SLEEP);

  productService.getProductBySlug(SEEDED_DATA.products.macbook);
  sleep(TEST_CONFIG.TIMEOUTS.DEFAULT_SLEEP);

  if (iphone && iphone.id) {
    productService.getProductById(iphone.id);
    sleep(TEST_CONFIG.TIMEOUTS.DEFAULT_SLEEP);
  }

  if (iphone && iphone.category && iphone.category.id) {
    productService.getProductsByCategory(iphone.category.id);
    sleep(TEST_CONFIG.TIMEOUTS.DEFAULT_SLEEP);
  }

  productService.searchProducts({
    search: 'iPhone',
    page: 1,
    limit: 5,
  });
  sleep(TEST_CONFIG.TIMEOUTS.DEFAULT_SLEEP);

  productService.searchProducts({
    search: 'JavaScript',
    inStockOnly: true,
  });
  sleep(TEST_CONFIG.TIMEOUTS.DEFAULT_SLEEP);

  productService.searchProducts({
    search: 'T-Shirt',
    page: 1,
    limit: 10,
  });
  sleep(TEST_CONFIG.TIMEOUTS.DEFAULT_SLEEP);

  productService.getFeaturedProducts(6);
  sleep(TEST_CONFIG.TIMEOUTS.DEFAULT_SLEEP);

  if (iphone && iphone.id) {
    productService.checkProductAvailability(iphone.id, 1);
    sleep(TEST_CONFIG.TIMEOUTS.DEFAULT_SLEEP);
  }

  if (iphone && iphone.id) {
    productService.checkProductAvailability(iphone.id, 5);
    sleep(TEST_CONFIG.TIMEOUTS.DEFAULT_SLEEP);
  }

  if (iphone && iphone.category && iphone.category.id) {
    productService.searchProducts({
      search: 'Pro',
      categoryId: iphone.category.id,
      inStockOnly: true,
    });
    sleep(TEST_CONFIG.TIMEOUTS.DEFAULT_SLEEP);
  }

  productService.getProducts({
    limit: 20,
    inStockOnly: false,
  });
  sleep(TEST_CONFIG.TIMEOUTS.DEFAULT_SLEEP);

  productService.searchProducts({
    search: '',
    page: 1,
    limit: 5,
  });
  sleep(TEST_CONFIG.TIMEOUTS.DEFAULT_SLEEP);



  productService.searchProducts({
    search: 'Code',
    inStockOnly: true,
  });
  sleep(TEST_CONFIG.TIMEOUTS.DEFAULT_SLEEP);

  productService.searchProducts({
    search: 'Yoga',
    inStockOnly: true,
  });
  sleep(TEST_CONFIG.TIMEOUTS.DEFAULT_SLEEP);

  productService.searchProducts({
    search: 'MacBook',
    inStockOnly: true,
  });
  sleep(TEST_CONFIG.TIMEOUTS.DEFAULT_SLEEP);

  // Cleanup authentication (like pytest fixture teardown)
  cleanup();

  // Print detailed test summary
  printTestSummary();
  
  console.log('\n✅ Product User Queries Tests Completed');
}