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
      throw new Error("Failed to fetch cart");
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
        throw new UserInputError("Product ID and valid quantity are required");
      }

      return await cartService.addItemToCart(userId, productId, quantity);
    } catch (error) {
      console.error("GraphQL addItemToCart error:", error);
      if (error instanceof UserInputError) {
        throw error;
      }
      if (error instanceof Error && error.message.includes("not found")) {
        throw new UserInputError(error.message);
      }
      if (error instanceof Error && error.message.includes("currency")) {
        throw new UserInputError(error.message);
      }
      throw new Error("Failed to add item to cart");
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
      return await cartService.removeItemFromCart(userId, productId);
    } catch (error) {
      console.error("GraphQL removeItemFromCart error:", error);
      if (error instanceof Error && error.message === "Cart not found") {
        throw new UserInputError(error.message);
      }
      throw new Error("Failed to remove item from cart");
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
        throw new UserInputError("Quantity cannot be negative");
      }

      return await cartService.updateItemQuantity(userId, productId, quantity);
    } catch (error) {
      console.error("GraphQL updateItemQuantity error:", error);
      if (error instanceof UserInputError) {
        throw error;
      }
      if (error instanceof Error && error.message === "Cart not found") {
        throw new UserInputError(error.message);
      }
      throw new Error("Failed to update item quantity");
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
        throw new UserInputError("Decrease amount must be positive");
      }

      return await cartService.decreaseItemQuantity(userId, productId, decreaseBy);
    } catch (error) {
      console.error("GraphQL decreaseItemQuantity error:", error);
      if (error instanceof UserInputError) {
        throw error;
      }
      if (error instanceof Error && (error.message === "Cart not found" || error.message === "Item not found in cart")) {
        throw new UserInputError(error.message);
      }
      throw new Error("Failed to decrease item quantity");
    }
  }

  @RequirePermission("cart_write")
  async clearCart(_: any, __: any, context: GraphQLContext) {
    try {
      const userId = getCurrentUserId(context);
      return await cartService.clearUserCart(userId);
    } catch (error) {
      console.error("GraphQL clearCart error:", error);
      if (error instanceof Error && error.message === "Cart not found") {
        throw new UserInputError(error.message);
      }
      throw new Error("Failed to clear cart");
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