import { check } from "k6";
import { GraphQLClient } from "../utils/graphql-client.js";
import { CART_QUERIES } from "../queries/cart-queries.js";

export class CartService {
  constructor(client = new GraphQLClient(), sessionHeaders = {}) {
    this.client = client;
    this.sessionHeaders = sessionHeaders;
  }

  /**
   * Get user cart
   */
  async getUserCart(variables = {}, expectedCartItems = null) {
    
    const response = this.client.requestWithParsing(
      CART_QUERIES.GET_USER_CART,
      variables,
      this.sessionHeaders
    );
    
    check(response, {
      "getUserCart: response parsed": (r) => r.parsed !== null,
      "getUserCart: success is true": (r) => r.parsed?.data?.userCart?.success === true,
      "getUserCart: message matches expected": (r) => r.parsed?.data?.userCart?.message === "Cart retrieved successfully",
      "getUserCart: has cartItems array": (r) => Array.isArray(r.parsed?.data?.userCart?.cartItems),
    });

    if (expectedCartItems !== null) {
      check(response, {
        "getUserCart: cart items count matches expected": (r) => 
          r.parsed?.data?.userCart?.cartItems?.length === expectedCartItems,
      });
    }

    return response;
  }

  /**
   * Add item to cart
   */
  async addItemToCart(variables, expectedProductId = null, expectedMessage = "Item added to cart successfully", expectedSuccess = true) {
    
    const response = this.client.requestWithParsing(
      CART_QUERIES.ADD_ITEM_TO_CART,
      variables,
      this.sessionHeaders
    );
    check(response, {
      "addItemToCart: response parsed": (r) => r.parsed !== null,
      "addItemToCart: success matches expected": (r) => r.parsed?.data?.addItemToCart?.success === expectedSuccess,
      "addItemToCart: message matches expected": (r) => r.parsed?.data?.addItemToCart?.message === expectedMessage,
    });

    if (expectedProductId) {
      check(response, {
        "addItemToCart: cartItem has correct product": (r) => 
          r.parsed?.data?.addItemToCart?.cartItem?.product?.id === expectedProductId,
        "addItemToCart: cartItem has correct quantity": (r) => 
          r.parsed?.data?.addItemToCart?.cartItem?.qty === variables.input.quantity,
      });
    }

    return response;
  }

  /**
   * Update item quantity in cart
   */
  async updateItemQuantity(variables, expectedMessage = "Item quantity updated successfully", expectedSuccess = true) {
    
    const response = this.client.requestWithParsing(
      CART_QUERIES.UPDATE_ITEM_QUANTITY,
      variables,
      this.sessionHeaders
    );
    
    check(response, {
      "updateItemQuantity: response parsed": (r) => r.parsed !== null,
      "updateItemQuantity: success matches expected": (r) => r.parsed?.data?.updateItemQuantity?.success === expectedSuccess,
      "updateItemQuantity: message matches expected": (r) => r.parsed?.data?.updateItemQuantity?.message === expectedMessage,
    });

    return response;
  }

  /**
   * Decrease item quantity in cart
   */
  async decreaseItemQuantity(variables) {
    
    const response = this.client.requestWithParsing(
      CART_QUERIES.DECREASE_ITEM_QUANTITY,
      variables,
      this.sessionHeaders
    );
    
    check(response, {
      "decreaseItemQuantity: response parsed": (r) => r.parsed !== null,
      "decreaseItemQuantity: success is true": (r) => r.parsed?.data?.decreaseItemQuantity?.success === true,
      "decreaseItemQuantity: message matches expected": (r) => r.parsed?.data?.decreaseItemQuantity?.message === "Item quantity decreased successfully",
    });

    return response;
  }

  /**
   * Remove item from cart
   */
  async removeItemFromCart(variables, expectedProductId = null, expectedMessage = "Item removed from cart successfully", expectedSuccess = true) {
    
    const response = this.client.requestWithParsing(
      CART_QUERIES.REMOVE_ITEM_FROM_CART,
      variables,
      this.sessionHeaders
    );
    
    check(response, {
      "removeItemFromCart: response parsed": (r) => r.parsed !== null,
      "removeItemFromCart: success matches expected": (r) => r.parsed?.data?.removeItemFromCart?.success === expectedSuccess,
      "removeItemFromCart: message matches expected": (r) => r.parsed?.data?.removeItemFromCart?.message === expectedMessage,
    });

    if (expectedProductId) {
      check(response, {
        "removeItemFromCart: removed correct product": (r) => 
          r.parsed?.data?.removeItemFromCart?.cartItem?.product?.id === expectedProductId,
      });
    }

    return response;
  }

  /**
   * Clear cart
   */
  async clearCart() {
    
    const response = this.client.requestWithParsing(
      CART_QUERIES.CLEAR_CART,
      {},
      this.sessionHeaders
    );

    
    check(response, {
      "clearCart: response parsed": (r) => r.parsed !== null,
      "clearCart: success is true": (r) => r.parsed?.data?.clearCart?.success === true,
      "clearCart: message matches expected": (r) => r.parsed?.data?.clearCart?.message === "Cart cleared successfully",
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
    
    const cartItems = cartResult.parsed?.data?.userCart?.cartItems || [];
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
    const productResponse = await productService.getProductBySlug({ slug: productSlug });
    const productId = productResponse.parsed?.data?.productBySlug?.product?.id;
    
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
    // Get real product ID for edge case testing
    const productResponse = await productService.getProductBySlug({ slug: productSlug });
    const realProductId = productResponse.parsed?.data?.productBySlug?.product?.id;
    
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
}