import { sleep } from "k6";
import { ProductService } from "./services/product-service.js";
import { TEST_CONFIG } from "./config/test-config.js";
import { setupAuth } from "./utils/test-base.js";

export const options = TEST_CONFIG.SMOKE_TEST_OPTIONS;

export default async function () {
  console.log("\n🛍️ Starting Product User Queries Tests");
  console.log("==========================================");

  const { user, sessionHeaders, cleanup } = setupAuth();

  // Create product service with authenticated session
  const productService = new ProductService(undefined, sessionHeaders);

  // Test 1: Get All Products - Basic product listing without filters
  await productService.getProducts();
  sleep(TEST_CONFIG.TIMEOUTS.DEFAULT_SLEEP);

  // Test 2: Get product by slug
  const productResponse = await productService.getProductBySlug({
    slug: "airpods-pro",
  });

  // Test 3: Get product by id
  await productService.getProductById({
    id: productResponse.parsed?.data?.productBySlug?.product?.id,
  });

  // Test 4: Get products by category id
  await productService.getProductsByCategory({
    categoryId: "02f94490-358e-4de6-a725-67bed187a89f",
  });
  sleep(TEST_CONFIG.TIMEOUTS.DEFAULT_SLEEP);

  // Test 5: Get featured products 
  await productService.getFeaturedProducts({ limit: 8 });
  sleep(TEST_CONFIG.TIMEOUTS.DEFAULT_SLEEP);

  // Test 6: Search products - Test search functionality with different parameters
  await productService.searchProducts({
    search: "AirPods",
    inStockOnly: true,
    page: 1,
    limit: 10,
  });

  console.log("\n✅ Product User Tests Completed");
}
