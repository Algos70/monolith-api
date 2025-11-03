import { sleep } from "k6";
import { CartService } from "../shared/cart-service.js";
import { ProductService } from "../shared/product-service.js";
import { RestClient } from "./utils/rest-client.js";
import { TEST_CONFIG } from "../config/test-config.js";
import { setupAuth } from "./utils/test-base.js";

export const options = TEST_CONFIG.SMOKE_TEST_OPTIONS;

export default async function () {
  console.log("Starting REST Cart Tests");
  console.log("========================");

  const { user, sessionHeaders, cleanup } = setupAuth();

  // Create services with authenticated session
  const client = new RestClient();
  const cartService = new CartService(client);
  cartService.setSessionHeaders(sessionHeaders);
  
  const productService = new ProductService(client);
  productService.setSessionHeaders(sessionHeaders);

  try {
    // Run comprehensive cart workflow test - this covers all cart operations
    // Uses real product "airpods-pro" from the database
    await cartService.runCartWorkflowTest("airpods-pro", productService);
    sleep(TEST_CONFIG.TIMEOUTS.DEFAULT_SLEEP);

    // Run edge case tests
    await cartService.runEdgeCaseTests("airpods-pro", productService);
    sleep(TEST_CONFIG.TIMEOUTS.DEFAULT_SLEEP);
     // Run negative case tests
    await cartService.runNegativeFlowTests("airpods-pro", productService);
    sleep(TEST_CONFIG.TIMEOUTS.DEFAULT_SLEEP);

    console.log("REST Cart Tests Completed Successfully!");
  } catch (error) {
    console.log(`REST Cart test failed: ${error.message}`);
    throw error;
  }

  console.log("========================");
}