import { sleep } from "k6";
import { OrderService } from "../shared/order-service.js";
import { CartService } from "../shared/cart-service.js";
import { ProductService } from "../shared/product-service.js";
import { WalletService } from "../shared/wallet-service.js";
import { RestClient } from "./utils/rest-client.js";
import { REST_BASE_URL, TEST_CONFIG } from "../config/test-config.js";
import { setupAuth } from "./utils/test-base.js";

export const options = TEST_CONFIG.SMOKE_TEST_OPTIONS;

export default async function () {
  console.log("Starting REST Order Tests");

  const { sessionHeaders } = setupAuth();

  // Create REST client and services with authenticated session
  const restClient = new RestClient(REST_BASE_URL);
  const orderService = new OrderService(restClient);
  const cartService = new CartService(restClient);
  const productService = new ProductService(restClient);
  const walletService = new WalletService(restClient);

  // Set session headers for all services
  orderService.setSessionHeaders(sessionHeaders);
  cartService.setSessionHeaders(sessionHeaders);
  productService.setSessionHeaders(sessionHeaders);
  walletService.setSessionHeaders(sessionHeaders);

  // Run comprehensive order workflow test
  await orderService.runOrderWorkflowTest(cartService, productService, walletService);
  sleep(TEST_CONFIG.TIMEOUTS.DEFAULT_SLEEP);
  
  // Run edge case tests
  await orderService.runEdgeCaseTests();
  sleep(TEST_CONFIG.TIMEOUTS.DEFAULT_SLEEP);

  // Run negative tests
  await orderService.runNegativeTests();
  sleep(TEST_CONFIG.TIMEOUTS.DEFAULT_SLEEP);

  console.log("REST Order Tests Completed");
}