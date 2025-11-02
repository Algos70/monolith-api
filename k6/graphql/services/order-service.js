import { GraphQLClient } from "../utils/graphql-client.js";
import { ORDER_QUERIES } from "../queries/order-queries.js";
import { check } from "k6";

export class OrderService {
  constructor(client = new GraphQLClient(), sessionHeaders = {}) {
    this.client = client;
    this.sessionHeaders = sessionHeaders;
  }

  /**
   * Get user orders
   */
  async getUserOrders(variables = {}, expectedOrderCount = null) {
    const response = await this.client.requestWithParsing(
      ORDER_QUERIES.GET_USER_ORDERS,
      variables,
      this.sessionHeaders
    );

    // Check response structure
    check(response, {
      "getUserOrders: response has data": (r) => r.parsed?.data !== undefined,
      "getUserOrders: userOrders exists": (r) => r.parsed?.data?.userOrders !== undefined,
      "getUserOrders: success is boolean": (r) => typeof r.parsed?.data?.userOrders?.success === "boolean",
      "getUserOrders: message is string": (r) => typeof r.parsed?.data?.userOrders?.message === "string",
      "getUserOrders: orders is array": (r) => Array.isArray(r.parsed?.data?.userOrders?.orders),
    });

    const userOrdersData = response.parsed?.data?.userOrders;
    
    if (userOrdersData?.success) {
      if (expectedOrderCount !== null) {
        check(userOrdersData, {
          [`getUserOrders: expected ${expectedOrderCount} orders`]: (data) => 
            data.orders.length === expectedOrderCount,
        });
      }

      // Validate order structure if orders exist
      if (userOrdersData.orders.length > 0) {
        const firstOrder = userOrdersData.orders[0];
        check(firstOrder, {
          "getUserOrders: order has id": (order) => order.id !== undefined,
          "getUserOrders: order has totalMinor": (order) => order.totalMinor !== undefined,
          "getUserOrders: order has currency": (order) => order.currency !== undefined,
          "getUserOrders: order has status": (order) => order.status !== undefined,
          "getUserOrders: order has items array": (order) => Array.isArray(order.items),
        });
      }
    } else {
      console.log(`Failed to get user orders: ${userOrdersData?.message}`);
    }

    return response;
  }

  /**
   * Create order from cart
   */
  async createOrderFromCart(variables = {}, expectedSuccess = true) {
    console.log("Creating order from cart...");
    console.log(`Variables:`, JSON.stringify(variables, null, 2));
    
    const response = await this.client.requestWithParsing(
      ORDER_QUERIES.CREATE_ORDER_FROM_CART,
      variables,
      this.sessionHeaders
    );

    // Check response structure
    check(response, {
      "createOrderFromCart: response has data": (r) => r.parsed?.data !== undefined,
      "createOrderFromCart: createOrderFromCart exists": (r) => r.parsed?.data?.createOrderFromCart !== undefined,
      "createOrderFromCart: success is boolean": (r) => typeof r.parsed?.data?.createOrderFromCart?.success === "boolean",
      "createOrderFromCart: message is string": (r) => typeof r.parsed?.data?.createOrderFromCart?.message === "string",
    });

    const orderData = response.parsed?.data?.createOrderFromCart;
    
    if (expectedSuccess) {
      check(orderData, {
        "createOrderFromCart: operation successful": (data) => data?.success === true,
        "createOrderFromCart: order exists": (data) => data?.order !== null && data?.order !== undefined,
      });

      if (orderData?.success && orderData?.order) {

        // Validate order structure
        check(orderData.order, {
          "createOrderFromCart: order has id": (order) => order.id !== undefined,
          "createOrderFromCart: order has totalMinor": (order) => order.totalMinor !== undefined,
          "createOrderFromCart: order has currency": (order) => order.currency !== undefined,
          "createOrderFromCart: order has status": (order) => order.status !== undefined,
          "createOrderFromCart: order has items": (order) => Array.isArray(order.items) && order.items.length > 0,
        });
      } else {
        console.log(`Failed to create order: ${orderData?.message}`);
      }
    } else {
      // Expecting failure
      check(orderData, {
        "createOrderFromCart: operation failed as expected": (data) => data?.success === false,
        "createOrderFromCart: order is null on failure": (data) => data?.order === null,
      });
      console.log(`Order creation failed as expected: ${orderData?.message}`);
    }

    return response;
  }

  /**
   * Create order from cart (expecting failure for edge cases)
   */
  async createOrderFromCartExpectingFailure(variables) {
    
    const response = this.client.requestWithParsing(
      ORDER_QUERIES.CREATE_ORDER_FROM_CART,
      variables,
      this.sessionHeaders
    );

    // For edge cases, we might get GraphQL errors or different response structure
    const hasGraphQLErrors = response.parsed?.errors && response.parsed.errors.length > 0;
    const orderData = response.parsed?.data?.createOrderFromCart;
    
    if (hasGraphQLErrors) {
      // GraphQL validation errors
      console.log(`Order creation failed as expected (GraphQL error): ${response.parsed.errors[0].message}`);
      check(response.parsed, {
        "createOrderFromCart: GraphQL errors exist": (r) => r.errors && r.errors.length > 0,
        "createOrderFromCart: error message exists": (r) => r.errors[0].message && r.errors[0].message.length > 0,
      });
    } else if (orderData) {
      // Business logic errors
      check(response, {
        "createOrderFromCart: response has data": (r) => r.parsed?.data !== undefined,
        "createOrderFromCart: createOrderFromCart exists": (r) => r.parsed?.data?.createOrderFromCart !== undefined,
      });
      
      check(orderData, {
        "createOrderFromCart: operation failed as expected": (data) => data?.success === false,
        "createOrderFromCart: order is null on failure": (data) => data?.order === null,
        "createOrderFromCart: error message exists": (data) => data?.message && data.message.length > 0,
      });
      
      console.log(`Order creation failed as expected: ${orderData?.message}`);
    } else {
      console.log(`Unexpected response structure in edge case test`);
    }

    return response;
  }

  /**
   * Run comprehensive order workflow test (Positive Case)
   */
  async runPositiveOrderWorkflowTest(cartService, productService, walletService) {
    console.log("Starting Positive Order Workflow Test");
    console.log("=========================================");

    try {
      // Step 1: Get product by slug
      const productResponse = await productService.getProductBySlug({ slug: "airpods-pro" });
      const product = productResponse.parsed?.data?.productBySlug?.product;
      
      if (!product) {
        throw new Error("Test product 'airpods-pro' not found");
      }
      
      const initialStock = product.stockQty;
      const productPrice = parseInt(product.priceMinor);
      const orderQty = 2;
      const expectedTotal = productPrice * orderQty;

      // Step 2: Create wallet with same currency and 1000000 initial balance
      const initialWalletBalance = 1000000;
      const walletResponse = await walletService.createUserWallet({
        input: {
          currency: product.currency,
          initialBalanceMinor: initialWalletBalance.toString()
        }
      });
      
      const wallet = walletResponse.parsed?.data?.createUserWallet?.wallet;
      if (!wallet) {
        throw new Error("Failed to create test wallet");
      }
      
      // Step 3:add product to cart
      
      await cartService.addItemToCart({
        input: {
          productId: product.id,
          quantity: orderQty
        }
      }, product.id);
      

      // Step 4: Get initial orders count
      const initialOrdersResponse = await this.getUserOrders();
      const initialOrderCount = initialOrdersResponse.parsed?.data?.userOrders?.orders?.length || 0;

      // Step 5: Create order from cart
      const orderResponse = await this.createOrderFromCart({
        input: {
          walletId: wallet.id
        }
      });

      const createdOrder = orderResponse.parsed?.data?.createOrderFromCart?.order;
      
      if (!createdOrder) {
        throw new Error("Order creation failed");
      }

      // Step 6: Verify product stock decreased
      const updatedProductResponse = await productService.getProductBySlug({ slug: "airpods-pro" });
      const updatedProduct = updatedProductResponse.parsed?.data?.productBySlug?.product;
      
      const expectedNewStock = initialStock - orderQty;
      check(updatedProduct, {
        "Product stock decreased correctly": (p) => p.stockQty === expectedNewStock,
      });
      
      console.log(`Stock updated: ${initialStock} → ${updatedProduct.stockQty} (decreased by ${orderQty})`);

      // Step 7: Verify wallet balance decreased
      const updatedWalletResponse = await walletService.getUserWalletByCurrency({
        currency: product.currency
      });
      const updatedWallet = updatedWalletResponse.parsed?.data?.userWalletByCurrency?.wallet;
      
      const expectedNewBalance = initialWalletBalance - expectedTotal;
      check(updatedWallet, {
        "Wallet balance decreased correctly": (w) => parseInt(w.balanceMinor) === expectedNewBalance,
      });
      
      console.log(`Balance updated: ${initialWalletBalance} → ${updatedWallet.balanceMinor} (decreased by ${expectedTotal})`);

      // Step 8: Verify order appears in user orders
      const finalOrdersResponse = await this.getUserOrders();
      const finalOrders = finalOrdersResponse.parsed?.data?.userOrders?.orders || [];
      
      check(finalOrdersResponse.parsed?.data?.userOrders, {
        "Order count increased": (data) => data.orders.length === initialOrderCount + 1,
        "New order exists in list": (data) => data.orders.some(order => order.id === createdOrder.id),
      });

      // Validate order data
      const foundOrder = finalOrders.find(order => order.id === createdOrder.id);
      if (foundOrder) {
        check(foundOrder, {
          "Order total matches expected": (order) => parseInt(order.totalMinor) === expectedTotal,
          "Order currency matches product": (order) => order.currency === product.currency,
          "Order has correct item count": (order) => order.items.length === 1,
          "Order item quantity correct": (order) => order.items[0].qty === orderQty,
        });
        
        console.log(`Order validation successful`);
        console.log(`Order details: ${foundOrder.totalMinor} ${foundOrder.currency}, ${foundOrder.items.length} items`);
      }

      console.log("Positive Order workflow test completed successfully!");
      
      // Return test data for cleanup
      return {
        wallet,
        product: updatedProduct,
        order: createdOrder,
        initialStock,
        initialWalletBalance
      };

    } catch (error) {
      console.log(`Positive Order workflow test failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Run negative order workflow test
   */
  async runNegativeOrderWorkflowTest(cartService, productService, walletService) {
    console.log("Starting Negative Order Workflow Test");
    console.log("========================================");

    try {
      // Step 1: Get product by slug
      const productResponse = await productService.getProductBySlug({ slug: "airpods-pro" });
      const product = productResponse.parsed?.data?.productBySlug?.product;
      
      if (!product) {
        throw new Error("Test product 'airpods-pro' not found");
      }
      
      const initialStock = product.stockQty;
      const orderQty = 2;

      // Step 2: Get existing wallet
      const walletResponse = await walletService.getUserWalletByCurrency({
        currency: product.currency
      });
      
      const wallet = walletResponse.parsed?.data?.userWalletByCurrency?.wallet;
      if (!wallet) {
        throw new Error("No existing wallet found for currency " + product.currency);
      }
      
      // Step 3:add product to cart
      
      await cartService.addItemToCart({
        input: {
          productId: product.id,
          quantity: orderQty
        }
      }, product.id);
      

      // Step 4: Get initial orders count
      const initialOrdersResponse = await this.getUserOrders();
      const initialOrderCount = initialOrdersResponse.parsed?.data?.userOrders?.orders?.length || 0;

      // Step 5: Attempt to create order with invalid wallet ID (should fail)
      const orderResponse = await this.createOrderFromCart({
        input: {
          walletId: "invalid-wallet-id-12345"
        }
      }, false); // Expecting failure

      const orderData = orderResponse.parsed?.data?.createOrderFromCart;
      
      // Verify order creation failed
      check(orderData, {
        "Order creation failed as expected": (data) => data?.success === false,
        "Order is null on failure": (data) => data?.order === null,
        "Error message exists": (data) => data?.message && data.message.length > 0,
      });
      
      console.log(`Order creation failed as expected: ${orderData?.message}`);

      // Step 6: Verify product stock unchanged
      const updatedProductResponse = await productService.getProductBySlug({ slug: "airpods-pro" });
      const updatedProduct = updatedProductResponse.parsed?.data?.productBySlug?.product;
      
      check(updatedProduct, {
        "Product stock unchanged after failed order": (p) => p.stockQty === initialStock,
      });
      
      console.log(`Stock unchanged: ${initialStock} → ${updatedProduct.stockQty}`);

      // Step 7: Verify wallet balance unchanged
      const updatedWalletResponse = await walletService.getUserWalletByCurrency({
        currency: product.currency
      });
      const updatedWallet = updatedWalletResponse.parsed?.data?.userWalletByCurrency?.wallet;
      
      const originalBalance = parseInt(wallet.balanceMinor);
      check(updatedWallet, {
        "Wallet balance unchanged after failed order": (w) => parseInt(w.balanceMinor) === originalBalance,
      });
      
      console.log(`Balance unchanged: ${originalBalance} → ${updatedWallet.balanceMinor}`);

      // Step 8: Verify no new order in user orders
      const finalOrdersResponse = await this.getUserOrders();
      const finalOrders = finalOrdersResponse.parsed?.data?.userOrders?.orders || [];
      
      check(finalOrdersResponse.parsed?.data?.userOrders, {
        "Order count unchanged": (data) => data.orders.length === initialOrderCount,
        "No failed order in list": (data) => data.success === true, 
      });
      
      console.log(`Order count unchanged: ${initialOrderCount} → ${finalOrders.length}`);

      console.log("Negative Order workflow test completed successfully!");
      
      // Return test data for cleanup
      return {
        wallet: updatedWallet,
        product: updatedProduct
      };

    } catch (error) {
      console.log(`Negative Order workflow test failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Run edge case tests
   */
  async runEdgeCaseTests() {
    console.log("Starting Order Edge Case Tests");
    console.log("==================================");

    // Test 1: Create order with invalid wallet ID
    await this.createOrderFromCartExpectingFailure({
      input: {
        walletId: "invalid-wallet-id"
      }
    });

    // Test 2: Create order with empty wallet ID
    await this.createOrderFromCartExpectingFailure({
      input: {
        walletId: ""
      }
    });

    // Test 3: Create order without wallet ID
    await this.createOrderFromCartExpectingFailure({
      input: {}
    });

    console.log("Order edge case tests completed!");
  }
}