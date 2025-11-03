import { CartService } from "../../services/CartService";
import { UserInputError, type GraphQLContext } from "../utils/permissions";
import { RequirePermission } from "../decorators/permissions";
import { getCurrentUserId } from "../utils/helperFunctions";

const cartService = new CartService();

export class CartResolvers {
  @RequirePermission("cart_read")
  async userCart(_: any, __: any, context: GraphQLContext) {
    try {
      const userId = getCurrentUserId(context);
      return await cartService.getUserCart(userId);
    } catch (error) {
      console.error("GraphQL userCart error:", error);
      return {
        success: false,
        message: "Failed to fetch cart",
        cartItems: []
      };
    }
  }

  @RequirePermission("cart_write")
  async addItemToCart(
    _: any,
    { input }: { input: { productId: string; quantity: number } },
    context: GraphQLContext
  ) {
    try {
      const userId = getCurrentUserId(context);
      const { productId, quantity } = input;

      if (!productId || !quantity || quantity <= 0) {
        return {
          success: false,
          message: "Product ID and valid quantity are required",
          cartItem: null
        };
      }

      const result = await cartService.addItemToCart(userId, productId, quantity);
      
      return result;
    } catch (error) {
      console.error("GraphQL addItemToCart error:", error);
      return {
        success: false,
        message: "Failed to add item to cart",
        cartItem: null
      };
    }
  }

  @RequirePermission("cart_write")
  async removeItemFromCart(
    _: any,
    { productId }: { productId: string },
    context: GraphQLContext
  ) {
    try {
      const userId = getCurrentUserId(context);
      const result = await cartService.removeItemFromCart(userId, productId);
      
      return result;
    } catch (error) {
      console.error("GraphQL removeItemFromCart error:", error);
      return {
        success: false,
        message: "Failed to remove item from cart",
        cartItem: null
      };
    }
  }

  @RequirePermission("cart_write")
  async updateItemQuantity(
    _: any,
    { input }: { input: { productId: string; quantity: number } },
    context: GraphQLContext
  ) {
    try {
      const userId = getCurrentUserId(context);
      const { productId, quantity } = input;

      if (quantity < 0) {
        return {
          success: false,
          message: "Quantity cannot be negative"
        };
      }

      const result = await cartService.updateItemQuantity(userId, productId, quantity);
      
      return result;
    } catch (error) {
      console.error("GraphQL updateItemQuantity error:", error);
      return {
        success: false,
        message: "Failed to update item quantity"
      };
    }
  }

  @RequirePermission("cart_write")
  async decreaseItemQuantity(
    _: any,
    { input }: { input: { productId: string; decreaseBy?: number } },
    context: GraphQLContext
  ) {
    try {
      const userId = getCurrentUserId(context);
      const { productId, decreaseBy = 1 } = input;

      if (decreaseBy <= 0) {
        return {
          success: false,
          message: "Decrease amount must be positive"
        };
      }

      const result = await cartService.decreaseItemQuantity(userId, productId, decreaseBy);
      
      return result;
    } catch (error) {
      console.error("GraphQL decreaseItemQuantity error:", error);
      return {
        success: false,
        message: "Failed to decrease item quantity"
      };
    }
  }

  @RequirePermission("cart_write")
  async clearCart(_: any, __: any, context: GraphQLContext) {
    try {
      const userId = getCurrentUserId(context);
      const result = await cartService.clearUserCart(userId);
      
      return result;
    } catch (error) {
      console.error("GraphQL clearCart error:", error);
      return {
        success: false,
        message: "Failed to clear cart"
      };
    }
  }
}

// Export resolver instance
const cartResolversInstance = new CartResolvers();

export const cartResolvers = {
  Query: {
    userCart: cartResolversInstance.userCart.bind(cartResolversInstance),
  },
  Mutation: {
    addItemToCart: cartResolversInstance.addItemToCart.bind(cartResolversInstance),
    updateItemQuantity: cartResolversInstance.updateItemQuantity.bind(cartResolversInstance),
    decreaseItemQuantity: cartResolversInstance.decreaseItemQuantity.bind(cartResolversInstance),
    removeItemFromCart: cartResolversInstance.removeItemFromCart.bind(cartResolversInstance),
    clearCart: cartResolversInstance.clearCart.bind(cartResolversInstance),
  },
};