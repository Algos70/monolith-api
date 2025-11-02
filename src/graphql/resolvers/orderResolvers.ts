import { OrderService } from "../../services/OrderService";
import { GraphQLContext } from "../utils/permissions";
import { 
  RequireOrdersReadPermission, 
  RequireOrdersWritePermission 
} from "../decorators/permissions";
import { getCurrentUserId } from "../utils/helperFunctions";

class OrderResolvers {
  private orderService: OrderService;

  constructor() {
    this.orderService = new OrderService();
  }

  // Get user's orders
  @RequireOrdersReadPermission()
  async userOrders(_: any, __: any, context: GraphQLContext) {
    const userId = getCurrentUserId(context);

    if (!userId) {
      throw new Error("User ID not found");
    }

    return await this.orderService.findByUser(userId);
  }



  // Create new order from cart
  @RequireOrdersWritePermission()
  async createOrderFromCart(
    _: any,
    { input }: { input: { walletId: string } },
    context: GraphQLContext
  ) {
    const userId = getCurrentUserId(context);

    if (!userId) {
      throw new Error("User ID not found");
    }

    const { walletId } = input;

    if (!walletId) {
      throw new Error("walletId is required");
    }

    try {
      return await this.orderService.createOrderFromCart({
        userId,
        walletId,
      });
    } catch (error) {
      if (error instanceof Error) {
        // Re-throw with the same message for consistent error handling
        throw new Error(error.message);
      }
      throw new Error("Failed to create order");
    }
  }
}

const orderResolversInstance = new OrderResolvers();

export const orderResolvers = {
  Query: {
    userOrders: orderResolversInstance.userOrders.bind(orderResolversInstance),
  },
  Mutation: {
    createOrderFromCart: orderResolversInstance.createOrderFromCart.bind(orderResolversInstance),
  },
};