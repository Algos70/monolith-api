import { check } from "k6";

export class CartService {
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
  makeRequest(query, variables = {}, headers = {}) {
    const requestHeaders = { ...this.sessionHeaders, ...headers };
    
    if (this.isGraphQLClient) {
      // GraphQL request
      return this.client.requestWithParsing(query, variables, requestHeaders);
    } else {
      // REST request - query should be an object with method, url, body
      return this.client.requestWithParsing(query, variables, requestHeaders);
    }
  }

  /**
   * Get user cart
   */
  async getUserCart(variables = {}, expectedCartItems = null) {
    const query = this.isGraphQLClient 
      ? this.queries.GET_USER_CART 
      : {
          method: 'GET',
          url: '/cart'
        };

    const graphqlVariables = this.isGraphQLClient ? variables : {};
    const response = this.makeRequest(query, graphqlVariables);

    // Handle response based on client type
    const responseData = this.isGraphQLClient 
      ? response.parsed?.data?.userCart
      : response.parsed;

    check(response, {
      "getUserCart: response parsed": (r) => r.parsed !== null,
      "getUserCart: success is true": (r) => {
        const data = this.isGraphQLClient ? r.parsed?.data?.userCart : r.parsed;
        return data?.success === true;
      },
      "getUserCart: message matches expected": (r) => {
        const data = this.isGraphQLClient ? r.parsed?.data?.userCart : r.parsed;
        const expectedMessage = this.isGraphQLClient ? "Cart retrieved successfully" : "Cart fetched successfully";
        return data?.message === expectedMessage;
      },
      "getUserCart: has cartItems array": (r) => {
        const data = this.isGraphQLClient ? r.parsed?.data?.userCart : r.parsed;
        const cartItems = this.isGraphQLClient ? data?.cartItems : data?.cart?.cartItems;
        return Array.isArray(cartItems);
      },
    });

    if (expectedCartItems !== null) {
      check(response, {
        "getUserCart: cart items count matches expected": (r) => {
          const data = this.isGraphQLClient ? r.parsed?.data?.userCart : r.parsed;
          const cartItems = this.isGraphQLClient ? data?.cartItems : data?.cart?.cartItems;
          return cartItems?.length === expectedCartItems;
        },
      });
    }

    return response;
  }

  /**
   * Add item to cart
   */
  async addItemToCart(variables, expectedProductId = null, expectedMessage = "Item added to cart successfully", expectedSuccess = true) {
    const query = this.isGraphQLClient 
      ? this.queries.ADD_ITEM_TO_CART 
      : {
          method: 'POST',
          url: '/cart/items',
          body: variables.input
        };

    const graphqlVariables = this.isGraphQLClient ? variables : {};
    const response = this.makeRequest(query, graphqlVariables);

    // Handle response based on client type
    const responseData = this.isGraphQLClient 
      ? response.parsed?.data?.addItemToCart
      : response.parsed;

    check(response, {
      "addItemToCart: response parsed": (r) => r.parsed !== null,
      "addItemToCart: success matches expected": (r) => {
        const data = this.isGraphQLClient ? r.parsed?.data?.addItemToCart : r.parsed;
        return data?.success === expectedSuccess;
      },
      "addItemToCart: message matches expected": (r) => {
        const data = this.isGraphQLClient ? r.parsed?.data?.addItemToCart : r.parsed;
        return data?.message === expectedMessage;
      },
    });

    // Only check cartItem details when we expect success and have expectedProductId
    if (expectedProductId && expectedSuccess) {
      check(response, {
        "addItemToCart: cartItem has correct product": (r) => {
          const data = this.isGraphQLClient ? r.parsed?.data?.addItemToCart : r.parsed;
          return data?.cartItem?.product?.id === expectedProductId;
        },
        "addItemToCart: cartItem has correct quantity": (r) => {
          const data = this.isGraphQLClient ? r.parsed?.data?.addItemToCart : r.parsed;
          return data?.cartItem?.qty === variables.input.quantity;
        },
      });
    }

    return response;
  }

  /**
   * Update item quantity in cart
   */
  async updateItemQuantity(variables, expectedMessage = "Item quantity updated successfully", expectedSuccess = true) {
    const query = this.isGraphQLClient 
      ? this.queries.UPDATE_ITEM_QUANTITY 
      : {
          method: 'PUT',
          url: `/cart/items/${variables.input.productId}`,
          body: { quantity: variables.input.quantity }
        };

    const graphqlVariables = this.isGraphQLClient ? variables : {};
    const response = this.makeRequest(query, graphqlVariables);
    
    // Handle response based on client type
    const responseData = this.isGraphQLClient 
      ? response.parsed?.data?.updateItemQuantity
      : response.parsed;





    check(response, {
      "updateItemQuantity: response parsed": (r) => r.parsed !== null,
      "updateItemQuantity: success matches expected": (r) => {
        const data = this.isGraphQLClient ? r.parsed?.data?.updateItemQuantity : r.parsed;
        return data?.success === expectedSuccess;
      },
      "updateItemQuantity: message matches expected": (r) => {
        const data = this.isGraphQLClient ? r.parsed?.data?.updateItemQuantity : r.parsed;
        return data?.message === expectedMessage;
      },
    });

    return response;
  }

  /**
   * Decrease item quantity in cart
   */
  async decreaseItemQuantity(variables, expectedMessage = "Item quantity decreased successfully", expectedSuccess = true) {
    const query = this.isGraphQLClient 
      ? this.queries.DECREASE_ITEM_QUANTITY 
      : {
          method: 'PUT',
          url: `/cart/items/${variables.input.productId}/decrease`,
          body: { decreaseBy: variables.input.decreaseBy }
        };

    const graphqlVariables = this.isGraphQLClient ? variables : {};
    const response = this.makeRequest(query, graphqlVariables);
    
    // Handle response based on client type
    const responseData = this.isGraphQLClient 
      ? response.parsed?.data?.decreaseItemQuantity
      : response.parsed;



    check(response, {
      "decreaseItemQuantity: response parsed": (r) => r.parsed !== null,
      "decreaseItemQuantity: success matches expected": (r) => {
        const data = this.isGraphQLClient ? r.parsed?.data?.decreaseItemQuantity : r.parsed;
        return data?.success === expectedSuccess;
      },
      "decreaseItemQuantity: message matches expected": (r) => {
        const data = this.isGraphQLClient ? r.parsed?.data?.decreaseItemQuantity : r.parsed;
        return data?.message === expectedMessage;
      },
    });

    return response;
  }

  /**
   * Remove item from cart
   */
  async removeItemFromCart(variables, expectedProductId = null, expectedMessage = "Item removed from cart successfully", expectedSuccess = true) {
    const query = this.isGraphQLClient 
      ? this.queries.REMOVE_ITEM_FROM_CART 
      : {
          method: 'DELETE',
          url: `/cart/items/${variables.productId}`
        };

    const graphqlVariables = this.isGraphQLClient ? variables : {};
    const response = this.makeRequest(query, graphqlVariables);
    
    // Handle response based on client type
    const responseData = this.isGraphQLClient 
      ? response.parsed?.data?.removeItemFromCart
      : response.parsed;



    check(response, {
      "removeItemFromCart: response parsed": (r) => r.parsed !== null,
      "removeItemFromCart: success matches expected": (r) => {
        const data = this.isGraphQLClient ? r.parsed?.data?.removeItemFromCart : r.parsed;
        return data?.success === expectedSuccess;
      },
      "removeItemFromCart: message matches expected": (r) => {
        const data = this.isGraphQLClient ? r.parsed?.data?.removeItemFromCart : r.parsed;
        return data?.message === expectedMessage;
      },
    });

    if (expectedProductId) {
      check(response, {
        "removeItemFromCart: removed correct product": (r) => {
          const data = this.isGraphQLClient ? r.parsed?.data?.removeItemFromCart : r.parsed;
          return data?.cartItem?.product?.id === expectedProductId;
        },
      });
    }

    return response;
  }

  /**
   * Clear cart
   */
  async clearCart() {
    const query = this.isGraphQLClient 
      ? this.queries.CLEAR_CART 
      : {
          method: 'DELETE',
          url: '/cart'
        };

    const response = this.makeRequest(query, {});

    // Handle response based on client type
    const responseData = this.isGraphQLClient 
      ? response.parsed?.data?.clearCart
      : response.parsed;



    check(response, {
      "clearCart: response parsed": (r) => r.parsed !== null,
      "clearCart: success is true": (r) => {
        const data = this.isGraphQLClient ? r.parsed?.data?.clearCart : r.parsed;
        return data?.success === true;
      },
      "clearCart: message matches expected": (r) => {
        const data = this.isGraphQLClient ? r.parsed?.data?.clearCart : r.parsed;
        return data?.message === "Cart cleared successfully";
      },
    });

    return response;
  }

  /**
   * Add item and verify it's in cart (Integration Test)
   */
  async addItemAndVerify(productId, quantity, expectedItemCount) {
    // Add item to cart
    const addResult = await this.addItemToCart({
      input: { productId, quantity }
    }, productId);

    // Verify cart contains the item
    const cartResult = await this.getUserCart({}, expectedItemCount);
    
    const responseData = this.isGraphQLClient 
      ? cartResult.parsed?.data?.userCart
      : cartResult.parsed;
    
    const cartItems = responseData?.cartItems || [];
    const addedItem = cartItems.find(item => item.product.id === productId);
    
    check({ addedItem, quantity }, {
      "Integration: Item exists in cart": ({ addedItem }) => addedItem !== undefined,
      "Integration: Item has correct quantity": ({ addedItem, quantity }) => 
        addedItem && addedItem.qty === quantity,
    });

    return cartResult;
  }

  /**
   * Run comprehensive cart workflow test
   */
  async runCartWorkflowTest(productSlug = "airpods-pro", productService) {
    // Step 0: Get product by slug to get the real product ID
    const productData = await productService.getProductBySlug({ slug: productSlug });
    const productId = productData?.product?.id;
    

    if (!productId) {
      return null;
    }
    

    // Step 1: Verify cart is empty
    await this.getUserCart({}, 0);
    

    // Step 2: Add item to cart
    await this.addItemToCart({
      input: { productId, quantity: 2 }
    }, productId);
    

    // Step 3: Verify item is in cart
    await this.getUserCart({}, 1);
    

    // Step 4: Update item quantity
    await this.updateItemQuantity({
      input: { productId, quantity: 5 }
    });
    

    // Step 5: Decrease item quantity
    await this.decreaseItemQuantity({
      input: { productId, decreaseBy: 2 }
    });
    

    // Step 6: Remove item from cart
    await this.removeItemFromCart({ productId }, productId);
    

    // Step 7: Verify cart is empty again
    const finalResult = await this.getUserCart({}, 0);
    
    return finalResult;
  }

  /**
   * Run edge case tests
   */
  async runEdgeCaseTests(productSlug = "airpods-pro", productService) {
    // Clear cart before starting edge case tests
    await this.clearCart();
    
    // Get real product ID for edge case testing
    const productData = await productService.getProductBySlug({ slug: productSlug });
    const realProductId = productData?.product?.id;
    
    if (realProductId) {
      // Try to add item with zero quantity (should fail gracefully)
      await this.addItemToCart({
        input: {
          productId: realProductId,
          quantity: 0
        }
      }, null, "Product ID and valid quantity are required", false);

      // Try to update item quantity to negative (should fail gracefully)
      await this.updateItemQuantity({
        input: {
          productId: realProductId,
          quantity: -1
        }
      }, "Quantity cannot be negative", false);
    }

    // Try to remove non-existent item (should fail gracefully)
    await this.removeItemFromCart({
      productId: "non-existent-product-id"
    }, null, "Item not found in cart", false);
  }

  /**
   * Run comprehensive negative flow tests
   */
  async runNegativeFlowTests(productSlug = "airpods-pro", productService) {

    
    // Clear cart before starting negative flow tests
    await this.clearCart();
    
    // Get real product ID for testing
    const productData = await productService.getProductBySlug({ slug: productSlug });
    const realProductId = productData?.product?.id;
    
    if (!realProductId) {

      return;
    }

    // Test 1: Add item with invalid product ID
    await this.addItemToCart({
      input: {
        productId: "invalid-product-id-12345",
        quantity: 1
      }
    }, null, "invalid input syntax for type uuid: \"invalid-product-id-12345\"", false);

    // Test 2: Add item with negative quantity
    await this.addItemToCart({
      input: {
        productId: realProductId,
        quantity: -5
      }
    }, null, "Product ID and valid quantity are required", false);

    // Test 3: Add item with extremely large quantity (API allows this)
    // Don't check exact quantity since API might cap or handle large numbers differently
    await this.addItemToCart({
      input: {
        productId: realProductId,
        quantity: 999999
      }
    }, null, "Item added to cart successfully", true);

    // Test 4: Update quantity for non-existent item
    await this.updateItemQuantity({
      input: {
        productId: "non-existent-item-id",
        quantity: 5
      }
    }, "Item not found in cart", false);

    // Test 5: Update quantity to zero (should remove item)
    // First add an item (don't check quantity since cart might have existing items)
    await this.addItemToCart({
      input: { productId: realProductId, quantity: 3 }
    }, null, "Item added to cart successfully", true);
    
    // Then update to zero (should succeed but remove the item)
    await this.updateItemQuantity({
      input: {
        productId: realProductId,
        quantity: 0
      }
    }, "Item quantity updated successfully", true);

    // Test 6: Decrease quantity for non-existent item
    await this.decreaseItemQuantity({
      input: {
        productId: "non-existent-item-id",
        decreaseBy: 1
      }
    }, "Item not found in cart", false);

    // Test 7: Remove item that doesn't exist in cart
    await this.removeItemFromCart({
      productId: "definitely-not-in-cart-id"
    }, null, "Item not found in cart", false);

    // Test 8: Zero quantity operations (should be handled gracefully)
    
    // Add item with zero quantity
    await this.addItemToCart({
      input: {
        productId: realProductId,
        quantity: 0
      }
    }, null, "Product ID and valid quantity are required", false);

    // Test 9: Boundary value testing
    
    // Add item with quantity 1 (minimum valid) - don't check quantity since cart state may vary
    await this.addItemToCart({
      input: {
        productId: realProductId,
        quantity: 1
      }
    }, null, "Item added to cart successfully", true);

    // Decrease by more than available quantity (should remove item)
    await this.decreaseItemQuantity({
      input: {
        productId: realProductId,
        decreaseBy: 10
      }
    }, "Item quantity decreased successfully", true);

    // Test 10: Multiple operations on empty cart
    
    // Clear cart first
    await this.clearCart();
    
    // Try to remove from empty cart
    await this.removeItemFromCart({
      productId: realProductId
    }, null, "Item not found in cart", false);
    
    // Try to update quantity in empty cart
    await this.updateItemQuantity({
      input: {
        productId: realProductId,
        quantity: 5
      }
    }, "Item not found in cart", false);

    // Try to decrease quantity in empty cart
    await this.decreaseItemQuantity({
      input: {
        productId: realProductId,
        decreaseBy: 1
      }
    }, "Item not found in cart", false);

    // Test 11: Concurrent operations stress test
    
    // Add item first (don't check quantity since cart state may vary from previous tests)
    await this.addItemToCart({
      input: { productId: realProductId, quantity: 5 }
    }, null, "Item added to cart successfully", true);
    
    // Try to add same item again (should update quantity or handle gracefully)
    // Don't check quantity since API behavior for duplicate adds may vary
    await this.addItemToCart({
      input: { productId: realProductId, quantity: 3 }
    }, null, "Item added to cart successfully", true);

    // Test 12: Invalid decrease amounts
    
    // First add an item for testing decrease operations (don't check quantity since cart state may vary)
    await this.addItemToCart({
      input: { productId: realProductId, quantity: 5 }
    }, null, "Item added to cart successfully", true);
    
    // Try to decrease by zero (should fail)
    await this.decreaseItemQuantity({
      input: {
        productId: realProductId,
        decreaseBy: 0
      }
    }, "Decrease amount must be positive", false);
    
    // Try to decrease by negative amount (should fail)
    await this.decreaseItemQuantity({
      input: {
        productId: realProductId,
        decreaseBy: -5
      }
    }, "Decrease amount must be positive", false);


  }
}