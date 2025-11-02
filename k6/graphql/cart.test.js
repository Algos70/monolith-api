
import { sleep } from "k6";
import { CartService } from "./services/cart-service.js";
import { ProductService } from "./services/product-service.js";
import { TEST_CONFIG } from "./config/test-config.js";
import { setupAuth } from "./utils/test-base.js";

export const options = TEST_CONFIG.SMOKE_TEST_OPTIONS;

export default async function () {
  console.log("Starting Cart User Queries Tests");
  console.log("==========================================");

  const { user, sessionHeaders, cleanup } = setupAuth();

  // Create services with authenticated session
  const cartService = new CartService(undefined, sessionHeaders);
  const productService = new ProductService(undefined, sessionHeaders);

  // Run comprehensive cart workflow test - this covers all cart operations
  // Uses real product "airpods-pro" from the database
  await cartService.runCartWorkflowTest("airpods-pro", productService);
  sleep(TEST_CONFIG.TIMEOUTS.DEFAULT_SLEEP);

  // Run edge case tests
  await cartService.runEdgeCaseTests("airpods-pro", productService);
  sleep(TEST_CONFIG.TIMEOUTS.DEFAULT_SLEEP);
  // Run negative flow tests
  await cartService.runNegativeFlowTests("airpods-pro", productService);
  sleep(TEST_CONFIG.TIMEOUTS.DEFAULT_SLEEP);
  console.log("Cart User Tests Completed");
  console.log("==========================================");
}