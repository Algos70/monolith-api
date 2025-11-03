import { sleep } from "k6";
import { OrderService } from "../shared/order-service.js";
import { CartService } from "../shared/cart-service.js";
import { ProductService } from "../shared/product-service.js";
import { WalletService } from "../shared/wallet-service.js";
import { GraphQLClient } from "./utils/graphql-client.js";
import { PRODUCT_QUERIES } from "./queries/product-queries.js";
import { CART_QUERIES } from "./queries/cart-queries.js";
import { ORDER_QUERIES } from "./queries/order-queries.js";
import { WALLET_QUERIES, WALLET_MUTATIONS } from "./queries/wallet-queries.js";
import { TEST_CONFIG } from "../config/test-config.js";
import { setupAuth } from "./utils/test-base.js";

export const options = TEST_CONFIG.SMOKE_TEST_OPTIONS;

export default async function () {
  console.log("Starting GraphQL Order Tests");
  console.log("==========================================");

  const { user, sessionHeaders, cleanup } = setupAuth();

  // Create services with authenticated session
  const client = new GraphQLClient();
  const orderService = new OrderService(client, ORDER_QUERIES);
  orderService.setSessionHeaders(sessionHeaders);
  const cartService = new CartService(client, CART_QUERIES);
  cartService.setSessionHeaders(sessionHeaders);
  const productService = new ProductService(client, PRODUCT_QUERIES);
  productService.setSessionHeaders(sessionHeaders);
  const walletService = new WalletService(client, { ...WALLET_QUERIES, ...WALLET_MUTATIONS });
  walletService.setSessionHeaders(sessionHeaders);

  try {
    // Run comprehensive order workflow test
    await orderService.runOrderWorkflowTest(cartService, productService, walletService);
    sleep(TEST_CONFIG.TIMEOUTS.DEFAULT_SLEEP);
    
    // Run edge case tests
    await orderService.runEdgeCaseTests();
    sleep(TEST_CONFIG.TIMEOUTS.DEFAULT_SLEEP);

    // Run negative tests
    await orderService.runNegativeTests();
    sleep(TEST_CONFIG.TIMEOUTS.DEFAULT_SLEEP);
  } catch (error) {
    console.log(`Order test failed: ${error.message}`);
    throw error;
  }

  console.log("GraphQL Order Tests Completed Successfully!");
  console.log("==========================================");
}