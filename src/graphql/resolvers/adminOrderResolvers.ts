import { OrderService } from '../../services/OrderService';
import { UserInputError, type GraphQLContext } from '../utils/permissions';
import {
  RequireAdminPanelReadPermissionForOrders,
  RequireAdminPanelWritePermissionForOrders,
} from '../decorators/permissions';

const orderService = new OrderService();

export class AdminOrderResolvers {
  @RequireAdminPanelReadPermissionForOrders()
  async adminOrders(
    _: any,
    { page = 1, limit = 10, status, userId }: any,
    context: GraphQLContext
  ) {
    try {
      return await orderService.getOrdersForAdmin({
        page,
        limit,
        status,
        userId,
      });
    } catch (error) {
      console.error('GraphQL adminOrders error:', error);
      throw new Error('Failed to fetch orders');
    }
  }

  @RequireAdminPanelReadPermissionForOrders()
  async adminOrder(_: any, { id }: any, context: GraphQLContext) {
    try {
      return await orderService.getOrderForAdmin(id);
    } catch (error) {
      console.error('GraphQL adminOrder error:', error);
      if (error instanceof Error && error.message === 'Order not found') {
        throw new UserInputError(error.message);
      }
      throw new Error('Failed to fetch order');
    }
  }

  @RequireAdminPanelReadPermissionForOrders()
  async adminOrdersByStatus(_: any, { status }: any, context: GraphQLContext) {
    try {
      return await orderService.findByStatus(status);
    } catch (error) {
      console.error('GraphQL adminOrdersByStatus error:', error);
      throw new Error('Failed to fetch orders by status');
    }
  }

  @RequireAdminPanelReadPermissionForOrders()
  async adminOrdersByUser(_: any, { userId }: any, context: GraphQLContext) {
    try {
      return await orderService.findByUser(userId);
    } catch (error) {
      console.error('GraphQL adminOrdersByUser error:', error);
      throw new Error('Failed to fetch orders by user');
    }
  }

  @RequireAdminPanelWritePermissionForOrders()
  async adminCreateOrder(_: any, { input }: any, context: GraphQLContext) {
    try {
      const { userId, totalMinor, currency, status, items } = input;

      if (!userId || !totalMinor || !currency || !items) {
        throw new UserInputError('userId, totalMinor, currency, and items are required');
      }

      if (!Array.isArray(items) || items.length === 0) {
        throw new UserInputError('items must be a non-empty array');
      }

      return await orderService.createOrder({
        userId,
        totalMinor,
        currency,
        status: status || 'PENDING',
        items,
      });
    } catch (error) {
      console.error('GraphQL adminCreateOrder error:', error);
      if (error instanceof Error) {
        if (error.message.includes('must have at least one item')) {
          throw new UserInputError(error.message);
        }
        if (error.name === 'UserInputError') {
          throw error;
        }
      }
      throw new Error('Failed to create order');
    }
  }

  @RequireAdminPanelWritePermissionForOrders()
  async adminUpdateOrder(
    _: any,
    { id, input }: any,
    context: GraphQLContext
  ) {
    try {
      const { totalMinor, currency, status } = input;

      const updateData: any = {};
      if (totalMinor !== undefined) updateData.totalMinor = totalMinor;
      if (currency !== undefined) updateData.currency = currency;
      if (status !== undefined) updateData.status = status;

      if (Object.keys(updateData).length === 0) {
        throw new UserInputError('No valid fields to update');
      }

      const order = await orderService.updateOrder(id, updateData);

      if (!order) {
        throw new UserInputError('Order not found');
      }

      return order;
    } catch (error) {
      console.error('GraphQL adminUpdateOrder error:', error);
      if (error instanceof Error) {
        if (error.message === 'Order not found') {
          throw new UserInputError(error.message);
        }
        if (error.name === 'UserInputError') {
          throw error;
        }
      }
      throw new Error('Failed to update order');
    }
  }

  @RequireAdminPanelWritePermissionForOrders()
  async adminUpdateOrderStatus(
    _: any,
    { id, input }: any,
    context: GraphQLContext
  ) {
    try {
      const { status } = input;

      if (!status) {
        throw new UserInputError('Status is required');
      }

      const order = await orderService.updateStatus(id, status);

      if (!order) {
        throw new UserInputError('Order not found');
      }

      return order;
    } catch (error) {
      console.error('GraphQL adminUpdateOrderStatus error:', error);
      if (error instanceof Error) {
        if (error.message.includes('Invalid status')) {
          throw new UserInputError(error.message);
        }
        if (error.message === 'Order not found') {
          throw new UserInputError(error.message);
        }
        if (error.name === 'UserInputError') {
          throw error;
        }
      }
      throw new Error('Failed to update order status');
    }
  }

  @RequireAdminPanelWritePermissionForOrders()
  async adminDeleteOrder(_: any, { id }: any, context: GraphQLContext) {
    try {
      await orderService.deleteOrder(id);
      return true;
    } catch (error) {
      console.error('GraphQL adminDeleteOrder error:', error);
      if (error instanceof Error && error.message === 'Order not found') {
        throw new UserInputError(error.message);
      }
      throw new Error('Failed to delete order');
    }
  }
}

// Export resolver instance
const adminOrderResolversInstance = new AdminOrderResolvers();

export const adminOrderResolvers = {
  Query: {
    adminOrders: adminOrderResolversInstance.adminOrders.bind(
      adminOrderResolversInstance
    ),
    adminOrder: adminOrderResolversInstance.adminOrder.bind(
      adminOrderResolversInstance
    ),
    adminOrdersByStatus: adminOrderResolversInstance.adminOrdersByStatus.bind(
      adminOrderResolversInstance
    ),
    adminOrdersByUser: adminOrderResolversInstance.adminOrdersByUser.bind(
      adminOrderResolversInstance
    ),
  },
  Mutation: {
    adminCreateOrder: adminOrderResolversInstance.adminCreateOrder.bind(
      adminOrderResolversInstance
    ),
    adminUpdateOrder: adminOrderResolversInstance.adminUpdateOrder.bind(
      adminOrderResolversInstance
    ),
    adminUpdateOrderStatus: adminOrderResolversInstance.adminUpdateOrderStatus.bind(
      adminOrderResolversInstance
    ),
    adminDeleteOrder: adminOrderResolversInstance.adminDeleteOrder.bind(
      adminOrderResolversInstance
    ),
  },
};