import { check } from 'k6';

export class OrderService {
  constructor(client, queries = null) {
    this.client = client;
    this.queries = queries;
    this.sessionHeaders = {};
    this.isGraphQLClient = this.client.constructor.name === 'GraphQLClient';
  }

  // Set session headers for authenticated requests
  setSessionHeaders(headers) {
    this.sessionHeaders = headers;
  }

  // Determine request method based on client type
  async makeRequest(query, variables = {}, headers = {}) {
    const requestHeaders = { ...this.sessionHeaders, ...headers };
    
    if (this.isGraphQLClient) {
      // GraphQL request
      return await this.client.requestWithParsing(query, variables, requestHeaders);
    } else {
      // REST request - query should be an object with method, url, params
      return await this.client.requestWithParsing(query, variables, requestHeaders);
    }
  }

  /**
   * Get user orders
   */
  async getUserOrders(variables = {}, expectedOrderCount = null) {
    const query = this.isGraphQLClient 
      ? this.queries.GET_USER_ORDERS 
      : {
          method: 'GET',
          url: '/orders',
          params: variables
        };

    const graphqlVariables = this.isGraphQLClient ? variables : {};
    const response = await this.makeRequest(query, graphqlVariables);

    // Handle response based on client type
    const responseData = this.isGraphQLClient 
      ? response.parsed?.data?.userOrders
      : response.parsed;

    // Check if response has parsed data
    if (!response.parsed) {
      return { success: false, message: "No parsed data in response" };
    }

    // Check if orders field exists
    if (!responseData) {
      return { success: false, message: "No orders field in response" };
    }

    // Check response structure
    check(response, {
      "getUserOrders: response has data": (r) => {
        const data = this.isGraphQLClient ? r.parsed?.data?.userOrders : r.parsed;
        return data !== undefined;
      },
      "getUserOrders: success is boolean": (r) => {
        const data = this.isGraphQLClient ? r.parsed?.data?.userOrders : r.parsed;
        return typeof data?.success === "boolean";
      },
      "getUserOrders: message is string": (r) => {
        const data = this.isGraphQLClient ? r.parsed?.data?.userOrders : r.parsed;
        return typeof data?.message === "string";
      },
      "getUserOrders: orders is array": (r) => {
        const data = this.isGraphQLClient ? r.parsed?.data?.userOrders : r.parsed;
        return Array.isArray(data?.orders);
      },
    });

    if (responseData?.success) {
      if (expectedOrderCount !== null) {
        check(responseData, {
          [`getUserOrders: expected ${expectedOrderCount} orders`]: (data) => 
            data.orders.length === expectedOrderCount,
        });
      }

      // Validate order structure if orders exist
      if (responseData.orders.length > 0) {
        const firstOrder = responseData.orders[0];
        check(firstOrder, {
          "getUserOrders: order has id": (order) => order.id !== undefined,
          "getUserOrders: order has totalMinor": (order) => order.totalMinor !== undefined,
          "getUserOrders: order has currency": (order) => order.currency !== undefined,
          "getUserOrders: order has status": (order) => order.status !== undefined,
          "getUserOrders: order has items array": (order) => Array.isArray(order.items),
        });
      }
    } else {
      console.log(`Failed to get user orders: ${responseData?.message}`);
    }

    return responseData;
  }

  /**
   * Create order from cart
   */
  async createOrderFromCart(variables = {}, expectedSuccess = true) {
    console.log("Creating order from cart...");
    console.log(`Variables:`, JSON.stringify(variables, null, 2));
    
    const query = this.isGraphQLClient 
      ? this.queries.CREATE_ORDER_FROM_CART 
      : {
          method: 'POST',
          url: '/orders',
          body: this.isGraphQLClient ? variables : variables.input || variables
        };

    const graphqlVariables = this.isGraphQLClient ? variables : {};
    const response = await this.makeRequest(query, graphqlVariables);

    // Handle response based on client type
    const responseData = this.isGraphQLClient 
      ? response.parsed?.data?.createOrderFromCart
      : response.parsed;

    // Check response structure
    check(response, {
      "createOrderFromCart: response has data": (r) => {
        const data = this.isGraphQLClient ? r.parsed?.data?.createOrderFromCart : r.parsed;
        return data !== undefined;
      },
      "createOrderFromCart: success is boolean": (r) => {
        const data = this.isGraphQLClient ? r.parsed?.data?.createOrderFromCart : r.parsed;
        return typeof data?.success === "boolean";
      },
      "createOrderFromCart: message is string": (r) => {
        const data = this.isGraphQLClient ? r.parsed?.data?.createOrderFromCart : r.parsed;
        return typeof data?.message === "string";
      },
    });

    if (expectedSuccess) {
      check(responseData, {
        "createOrderFromCart: operation successful": (data) => data?.success === true,
        "createOrderFromCart: order exists": (data) => data?.order !== null && data?.order !== undefined,
      });

      if (responseData?.success && responseData?.order) {
        // Validate order structure
        check(responseData.order, {
          "createOrderFromCart: order has id": (order) => order.id !== undefined,
          "createOrderFromCart: order has totalMinor": (order) => order.totalMinor !== undefined,
          "createOrderFromCart: order has currency": (order) => order.currency !== undefined,
          "createOrderFromCart: order has status": (order) => order.status !== undefined,
          "createOrderFromCart: order has items": (order) => Array.isArray(order.items) && order.items.length > 0,
        });
      } else {
        console.log(`Failed to create order: ${responseData?.message}`);
      }
    } else {
      // Expecting failure
      check(responseData, {
        "createOrderFromCart: operation failed as expected": (data) => data?.success === false,
        "createOrderFromCart: order is null on failure": (data) => data?.order === null,
      });
      console.log(`Order creation failed as expected: ${responseData?.message}`);
    }

    return responseData;
  }

  /**
   * Create order from cart (expecting failure for edge cases)
   */
  async createOrderFromCartExpectingFailure(variables) {
    const query = this.isGraphQLClient 
      ? this.queries.CREATE_ORDER_FROM_CART 
      : {
          method: 'POST',
          url: '/orders',
          body: this.isGraphQLClient ? variables : variables.input || variables
        };

    const graphqlVariables = this.isGraphQLClient ? variables : {};
    const response = await this.makeRequest(query, graphqlVariables);

    if (this.isGraphQLClient) {
      // For GraphQL, we might get GraphQL errors or different response structure
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
    } else {
      // For REST, handle the response directly
      const orderData = response.parsed;
      
      check(orderData, {
        "createOrderFromCart: operation failed as expected": (data) => data?.success === false,
        "createOrderFromCart: order is null on failure": (data) => data?.order === null,
        "createOrderFromCart: error message exists": (data) => data?.message && data.message.length > 0,
      });
      
      console.log(`Order creation failed as expected: ${orderData?.message}`);
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
      const product = productResponse?.product;
      
      if (!product) {
        throw new Error("Test product 'airpods-pro' not found");
      }
      
      const initialStock = product.stockQty;
      const productPrice = parseInt(product.priceMinor);
      const orderQty = 2;
      const expectedTotal = productPrice * orderQty;

      // Step 2: Create wallet with same currency and 1000000 initial balance
      const initialWalletBalance = 1000000;
      console.log(`Creating wallet with currency: ${product.currency}`);
      const walletResponse = await walletService.createUserWallet({
        input: {
          currency: product.currency,
          initialBalanceMinor: initialWalletBalance.toString()
        }
      });
      
      console.log(`Wallet creation response:`, JSON.stringify(walletResponse, null, 2));
      
      const wallet = walletResponse?.wallet;
      
      if (!wallet || !walletResponse?.success) {
        console.log(`Wallet creation failed. Success: ${walletResponse?.success}, Wallet: ${wallet}, Message: ${walletResponse?.message}`);
        throw new Error("Failed to create test wallet");
      }
      
      // Step 3: Add product to cart
      await cartService.addItemToCart({
        input: {
          productId: product.id,
          quantity: orderQty
        }
      }, product.id);

      // Step 4: Get initial orders count
      const initialOrdersResponse = await this.getUserOrders();
      const initialOrderCount = initialOrdersResponse?.orders?.length || 0;

      // Step 5: Create order from cart
      const orderResponse = await this.createOrderFromCart({
        input: {
          walletId: wallet.id
        }
      });

      const createdOrder = orderResponse?.order;
      
      if (!createdOrder) {
        throw new Error("Order creation failed");
      }

      // Step 6: Verify product stock decreased
      const updatedProductResponse = await productService.getProductBySlug({ slug: "airpods-pro" });
      const updatedProduct = updatedProductResponse?.product;
      
      const expectedNewStock = initialStock - orderQty;
      check(updatedProduct, {
        "Product stock decreased correctly": (p) => p.stockQty === expectedNewStock,
      });
      
      console.log(`Stock updated: ${initialStock} → ${updatedProduct.stockQty} (decreased by ${orderQty})`);

      // Step 7: Verify wallet balance decreased
      const updatedWalletResponse = await walletService.getUserWalletByCurrency({
        currency: product.currency
      });
      const updatedWallet = updatedWalletResponse?.wallet;
      
      const expectedNewBalance = initialWalletBalance - expectedTotal;
      check(updatedWallet, {
        "Wallet balance decreased correctly": (w) => parseInt(w.balanceMinor) === expectedNewBalance,
      });
      
      console.log(`Balance updated: ${initialWalletBalance} → ${updatedWallet.balanceMinor} (decreased by ${expectedTotal})`);

      // Step 8: Verify order appears in user orders
      const finalOrdersResponse = await this.getUserOrders();
      const finalOrders = finalOrdersResponse?.orders || [];
      
      check(finalOrdersResponse, {
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
      const product = productResponse?.product;
      
      if (!product) {
        throw new Error("Test product 'airpods-pro' not found");
      }
      
      const initialStock = product.stockQty;
      const orderQty = 2;

      // Step 2: Get existing wallet
      const walletResponse = await walletService.getUserWalletByCurrency({
        currency: product.currency
      });
      
      const wallet = walletResponse?.wallet;
      
      if (!wallet) {
        throw new Error("No existing wallet found for currency " + product.currency);
      }
      
      // Step 3: Add product to cart
      await cartService.addItemToCart({
        input: {
          productId: product.id,
          quantity: orderQty
        }
      }, product.id);

      // Step 4: Get initial orders count
      const initialOrdersResponse = await this.getUserOrders();
      const initialOrderCount = initialOrdersResponse?.orders?.length || 0;

      // Step 5: Attempt to create order with invalid wallet ID (should fail)
      const orderResponse = await this.createOrderFromCart({
        input: {
          walletId: "invalid-wallet-id-12345"
        }
      }, false); // Expecting failure

      // Verify order creation failed
      check(orderResponse, {
        "Order creation failed as expected": (data) => data?.success === false,
        "Order is null on failure": (data) => data?.order === null,
        "Error message exists": (data) => data?.message && data.message.length > 0,
      });
      
      console.log(`Order creation failed as expected: ${orderResponse?.message}`);

      // Step 6: Verify product stock unchanged
      const updatedProductResponse = await productService.getProductBySlug({ slug: "airpods-pro" });
      const updatedProduct = updatedProductResponse?.product;
      
      check(updatedProduct, {
        "Product stock unchanged after failed order": (p) => p.stockQty === initialStock,
      });
      
      console.log(`Stock unchanged: ${initialStock} → ${updatedProduct.stockQty}`);

      // Step 7: Verify wallet balance unchanged
      const updatedWalletResponse = await walletService.getUserWalletByCurrency({
        currency: product.currency
      });
      const updatedWallet = updatedWalletResponse?.wallet;
      
      const originalBalance = parseInt(wallet.balanceMinor);
      check(updatedWallet, {
        "Wallet balance unchanged after failed order": (w) => parseInt(w.balanceMinor) === originalBalance,
      });
      
      console.log(`Balance unchanged: ${originalBalance} → ${updatedWallet.balanceMinor}`);

      // Step 8: Verify no new order in user orders
      const finalOrdersResponse = await this.getUserOrders();
      const finalOrders = finalOrdersResponse?.orders || [];
      
      check(finalOrdersResponse, {
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

  /**
   * Run comprehensive order workflow test
   */
  async runOrderWorkflowTest(cartService, productService, walletService) {
    console.log("Starting Order Workflow Test");
    console.log("===============================");

    // Run positive workflow test
    await this.runPositiveOrderWorkflowTest(cartService, productService, walletService);
    
    // Run negative workflow test
    await this.runNegativeOrderWorkflowTest(cartService, productService, walletService);

    console.log("Order Workflow Test Completed");
    console.log("===============================");
  }

  /**
   * Run negative tests (invalid inputs)
   */
  async runNegativeTests() {
    console.log("Starting Order Negative Tests");
    console.log("============================");

    // Test 1: Create order without authentication (if applicable)
    // This would depend on your authentication setup

    // Test 2: Create order with malformed input
    await this.createOrderFromCartExpectingFailure({
      input: {
        walletId: null
      }
    });

    // Test 3: Create order with non-existent wallet
    await this.createOrderFromCartExpectingFailure({
      input: {
        walletId: "00000000-0000-0000-0000-000000000000"
      }
    });

    console.log("Order Negative Tests Completed");
    console.log("============================");
  }
}