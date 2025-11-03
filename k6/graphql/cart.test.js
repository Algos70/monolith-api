
import { sleep } from "k6";
import { CartService } from "./services/cart-service.js";
import { ProductService } from "../shared/product-service.js";
import { GraphQLClient } from "./utils/graphql-client.js";
import { PRODUCT_QUERIES } from "./queries/product-queries.js";
import { TEST_CONFIG } from "../config/test-config.js";
import { setupAuth } from "./utils/test-base.js";

export const options = TEST_CONFIG.SMOKE_TEST_OPTIONS;

export default async function () {
  console.log("Starting Cart User Queries Tests");
  console.log("==========================================");

  const { user, sessionHeaders, cleanup } = setupAuth();

  // Create services with authenticated session
  const client = new GraphQLClient();
  const cartService = new CartService(undefined, sessionHeaders);
  const productService = new ProductService(client, PRODUCT_QUERIES);
  productService.setSessionHeaders(sessionHeaders);

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