import { sleep } from "k6";
import { OrderService } from "./services/order-service.js";
import { CartService } from "./services/cart-service.js";
import { ProductService } from "./services/product-service.js";
import { WalletService } from "./services/wallet-service.js";
import { TEST_CONFIG } from "../config/test-config.js";
import { setupAuth } from "./utils/test-base.js";

export const options = TEST_CONFIG.SMOKE_TEST_OPTIONS;

export default async function () {
  console.log("Starting Order User Queries Tests");
  console.log("==========================================");

  const { user, sessionHeaders, cleanup } = setupAuth();

  // Create services with authenticated session
  const orderService = new OrderService(undefined, sessionHeaders);
  const cartService = new CartService(undefined, sessionHeaders);
  const productService = new ProductService(undefined, sessionHeaders);
  const walletService = new WalletService(undefined, sessionHeaders);

  try {
    // Test 1: Positive Order Workflow Test
    console.log("POSITIVE ORDER WORKFLOW TEST");
    console.log("================================");
    positiveTestData = await orderService.runPositiveOrderWorkflowTest(
      cartService, 
      productService, 
      walletService
    );
    sleep(TEST_CONFIG.TIMEOUTS.DEFAULT_SLEEP);

    console.log("Sleeping between tests...");
    sleep(2); 
    // Test 2: Negative Order Workflow Test
    console.log("NEGATIVE ORDER WORKFLOW TEST");
    console.log("===============================");
    negativeTestData = await orderService.runNegativeOrderWorkflowTest(
      cartService, 
      productService, 
      walletService
    );
    sleep(TEST_CONFIG.TIMEOUTS.DEFAULT_SLEEP);

    // Test 3: Basic edge case tests
    console.log("ADDITIONAL EDGE CASE TESTS");
    console.log("=============================");
    await orderService.runEdgeCaseTests();
    sleep(TEST_CONFIG.TIMEOUTS.DEFAULT_SLEEP);
  } catch (error) {
    console.log(`Order test failed: ${error.message}`);
    throw error;
  }

  console.log("Order User Tests Completed Successfully!");
  console.log("==========================================");
}