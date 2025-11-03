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
    try {
      const userId = getCurrentUserId(context);

      if (!userId) {
        return {
          success: false,
          message: "User ID not found",
          orders: []
        };
      }

      const orders = await this.orderService.findByUser(userId);
      
      return {
        success: true,
        message: "Orders retrieved successfully",
        orders
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "Failed to retrieve orders",
        orders: []
      };
    }
  }



  // Create new order from cart
  @RequireOrdersWritePermission()
  async createOrderFromCart(
    _: any,
    { input }: { input: { walletId: string } },
    context: GraphQLContext
  ) {
    try {
      const userId = getCurrentUserId(context);

      if (!userId) {
        return {
          success: false,
          message: "User ID not found",
          order: null
        };
      }

      const { walletId } = input;

      if (!walletId) {
        return {
          success: false,
          message: "walletId is required",
          order: null
        };
      }

      const order = await this.orderService.createOrderFromCart({
        userId,
        walletId,
      });

      return {
        success: true,
        message: "Order created successfully",
        order
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "Failed to create order",
        order: null
      };
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