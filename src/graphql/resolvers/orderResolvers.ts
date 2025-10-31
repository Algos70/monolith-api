import { OrderService } from "../../services/OrderService";
import { GraphQLContext } from "../utils/permissions";
import { 
  RequireOrdersReadPermission, 
  RequireOrdersWritePermission 
} from "../decorators/permissions";

class OrderResolvers {
  private orderService: OrderService;

  constructor() {
    this.orderService = new OrderService();
  }

  // Get user's orders
  @RequireOrdersReadPermission()
  async userOrders(_: any, __: any, context: GraphQLContext) {
    const user = context.user || context.session?.user || context.req?.session?.user;
    const userId = user?.dbUserId || user?.sub;

    if (!userId) {
      throw new Error("User ID not found");
    }

    return await this.orderService.findByUser(userId);
  }

  // Get specific order by ID (user can only see their own orders)
  @RequireOrdersReadPermission()
  async userOrder(_: any, { id }: { id: string }, context: GraphQLContext) {
    const user = context.user || context.session?.user || context.req?.session?.user;
    const userId = user?.dbUserId || user?.sub;

    if (!userId) {
      throw new Error("User ID not found");
    }

    const order = await this.orderService.findById(id);
    
    if (!order) {
      throw new Error("Order not found");
    }

    // Check if the order belongs to the current user
    if (order.user.id !== userId) {
      throw new Error("Access denied");
    }

    return order;
  }

  // Create new order from cart
  @RequireOrdersWritePermission()
  async createOrderFromCart(
    _: any,
    { input }: { input: { walletId: string } },
    context: GraphQLContext
  ) {
    const user = context.user || context.session?.user || context.req?.session?.user;
    const userId = user?.dbUserId || user?.sub;

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
    userOrder: orderResolversInstance.userOrder.bind(orderResolversInstance),
  },
  Mutation: {
    createOrderFromCart: orderResolversInstance.createOrderFromCart.bind(orderResolversInstance),
  },
};