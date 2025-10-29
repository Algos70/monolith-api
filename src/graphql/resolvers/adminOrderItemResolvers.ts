import { OrderItemService } from '../../services/OrderItemService';
import { UserInputError, type GraphQLContext } from '../utils/permissions';
import {
  RequireAdminPanelReadPermissionForOrderItems,
  RequireAdminPanelWritePermissionForOrderItems,
} from '../decorators/permissions';

const orderItemService = new OrderItemService();

export class AdminOrderItemResolvers {
  @RequireAdminPanelReadPermissionForOrderItems()
  async adminOrderItems(
    _: any,
    { page = 1, limit = 10, orderId, productId }: any,
    context: GraphQLContext
  ) {
    try {
      return await orderItemService.getOrderItemsForAdmin({
        page,
        limit,
        orderId,
        productId,
      });
    } catch (error) {
      console.error('GraphQL adminOrderItems error:', error);
      throw new Error('Failed to fetch order items');
    }
  }

  @RequireAdminPanelReadPermissionForOrderItems()
  async adminOrderItem(_: any, { id }: any, context: GraphQLContext) {
    try {
      return await orderItemService.getOrderItemForAdmin(id);
    } catch (error) {
      console.error('GraphQL adminOrderItem error:', error);
      if (error instanceof Error && error.message === 'Order item not found') {
        throw new UserInputError(error.message);
      }
      throw new Error('Failed to fetch order item');
    }
  }

  @RequireAdminPanelReadPermissionForOrderItems()
  async adminOrderItemsByOrder(_: any, { orderId }: any, context: GraphQLContext) {
    try {
      return await orderItemService.findByOrderId(orderId);
    } catch (error) {
      console.error('GraphQL adminOrderItemsByOrder error:', error);
      throw new Error('Failed to fetch order items by order');
    }
  }

  @RequireAdminPanelReadPermissionForOrderItems()
  async adminOrderItemsByProduct(_: any, { productId }: any, context: GraphQLContext) {
    try {
      return await orderItemService.findByProductId(productId);
    } catch (error) {
      console.error('GraphQL adminOrderItemsByProduct error:', error);
      throw new Error('Failed to fetch order items by product');
    }
  }

  @RequireAdminPanelWritePermissionForOrderItems()
  async adminCreateOrderItem(_: any, { input }: any, context: GraphQLContext) {
    try {
      const { orderId, productId, qty, unitPriceMinor, currency } = input;

      if (!orderId || !productId || !qty || !unitPriceMinor || !currency) {
        throw new UserInputError('orderId, productId, qty, unitPriceMinor, and currency are required');
      }

      if (typeof qty !== 'number' || qty <= 0) {
        throw new UserInputError('qty must be a positive number');
      }

      if (typeof unitPriceMinor !== 'number' || unitPriceMinor < 0) {
        throw new UserInputError('unitPriceMinor must be a non-negative number');
      }

      return await orderItemService.createOrderItem({
        orderId,
        productId,
        qty,
        unitPriceMinor,
        currency,
      });
    } catch (error) {
      console.error('GraphQL adminCreateOrderItem error:', error);
      if (error instanceof Error && error.name === 'UserInputError') {
        throw error;
      }
      throw new Error('Failed to create order item');
    }
  }

  @RequireAdminPanelWritePermissionForOrderItems()
  async adminUpdateOrderItem(
    _: any,
    { id, input }: any,
    context: GraphQLContext
  ) {
    try {
      const { qty, unitPriceMinor, currency } = input;

      const updateData: any = {};
      if (qty !== undefined) {
        if (typeof qty !== 'number' || qty <= 0) {
          throw new UserInputError('qty must be a positive number');
        }
        updateData.qty = qty;
      }
      if (unitPriceMinor !== undefined) {
        if (typeof unitPriceMinor !== 'number' || unitPriceMinor < 0) {
          throw new UserInputError('unitPriceMinor must be a non-negative number');
        }
        updateData.unitPriceMinor = unitPriceMinor;
      }
      if (currency !== undefined) updateData.currency = currency;

      if (Object.keys(updateData).length === 0) {
        throw new UserInputError('No valid fields to update');
      }

      const orderItem = await orderItemService.updateOrderItem(id, updateData);

      if (!orderItem) {
        throw new UserInputError('Order item not found');
      }

      return orderItem;
    } catch (error) {
      console.error('GraphQL adminUpdateOrderItem error:', error);
      if (error instanceof Error) {
        if (error.message === 'Order item not found') {
          throw new UserInputError(error.message);
        }
        if (error.name === 'UserInputError') {
          throw error;
        }
      }
      throw new Error('Failed to update order item');
    }
  }

  @RequireAdminPanelWritePermissionForOrderItems()
  async adminUpdateOrderItemQuantity(
    _: any,
    { id, input }: any,
    context: GraphQLContext
  ) {
    try {
      const { qty } = input;

      if (!qty || typeof qty !== 'number' || qty <= 0) {
        throw new UserInputError('qty is required and must be a positive number');
      }

      const orderItem = await orderItemService.updateOrderItem(id, { qty });

      if (!orderItem) {
        throw new UserInputError('Order item not found');
      }

      return orderItem;
    } catch (error) {
      console.error('GraphQL adminUpdateOrderItemQuantity error:', error);
      if (error instanceof Error) {
        if (error.message === 'Order item not found') {
          throw new UserInputError(error.message);
        }
        if (error.name === 'UserInputError') {
          throw error;
        }
      }
      throw new Error('Failed to update order item quantity');
    }
  }

  @RequireAdminPanelWritePermissionForOrderItems()
  async adminUpdateOrderItemPrice(
    _: any,
    { id, input }: any,
    context: GraphQLContext
  ) {
    try {
      const { unitPriceMinor } = input;

      if (unitPriceMinor === undefined || typeof unitPriceMinor !== 'number' || unitPriceMinor < 0) {
        throw new UserInputError('unitPriceMinor is required and must be a non-negative number');
      }

      const orderItem = await orderItemService.updateOrderItem(id, { unitPriceMinor });

      if (!orderItem) {
        throw new UserInputError('Order item not found');
      }

      return orderItem;
    } catch (error) {
      console.error('GraphQL adminUpdateOrderItemPrice error:', error);
      if (error instanceof Error) {
        if (error.message === 'Order item not found') {
          throw new UserInputError(error.message);
        }
        if (error.name === 'UserInputError') {
          throw error;
        }
      }
      throw new Error('Failed to update order item price');
    }
  }

  @RequireAdminPanelWritePermissionForOrderItems()
  async adminDeleteOrderItem(_: any, { id }: any, context: GraphQLContext) {
    try {
      await orderItemService.deleteOrderItem(id);
      return true;
    } catch (error) {
      console.error('GraphQL adminDeleteOrderItem error:', error);
      if (error instanceof Error && error.message === 'Order item not found') {
        throw new UserInputError(error.message);
      }
      throw new Error('Failed to delete order item');
    }
  }
}

// Export resolver instance
const adminOrderItemResolversInstance = new AdminOrderItemResolvers();

export const adminOrderItemResolvers = {
  Query: {
    adminOrderItems: adminOrderItemResolversInstance.adminOrderItems.bind(
      adminOrderItemResolversInstance
    ),
    adminOrderItem: adminOrderItemResolversInstance.adminOrderItem.bind(
      adminOrderItemResolversInstance
    ),
    adminOrderItemsByOrder: adminOrderItemResolversInstance.adminOrderItemsByOrder.bind(
      adminOrderItemResolversInstance
    ),
    adminOrderItemsByProduct: adminOrderItemResolversInstance.adminOrderItemsByProduct.bind(
      adminOrderItemResolversInstance
    ),
  },
  Mutation: {
    adminCreateOrderItem: adminOrderItemResolversInstance.adminCreateOrderItem.bind(
      adminOrderItemResolversInstance
    ),
    adminUpdateOrderItem: adminOrderItemResolversInstance.adminUpdateOrderItem.bind(
      adminOrderItemResolversInstance
    ),
    adminUpdateOrderItemQuantity: adminOrderItemResolversInstance.adminUpdateOrderItemQuantity.bind(
      adminOrderItemResolversInstance
    ),
    adminUpdateOrderItemPrice: adminOrderItemResolversInstance.adminUpdateOrderItemPrice.bind(
      adminOrderItemResolversInstance
    ),
    adminDeleteOrderItem: adminOrderItemResolversInstance.adminDeleteOrderItem.bind(
      adminOrderItemResolversInstance
    ),
  },
};