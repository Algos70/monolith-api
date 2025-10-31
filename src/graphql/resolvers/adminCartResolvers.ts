import { CartService } from '../../services/CartService';
import { UserInputError, type GraphQLContext } from '../utils/permissions';
import {
  RequireAdminPanelReadPermissionForCarts,
  RequireAdminPanelWritePermissionForCarts,
} from '../decorators/permissions';

const cartService = new CartService();

export class AdminCartResolvers {
  @RequireAdminPanelReadPermissionForCarts()
  async adminCarts(
    _: any,
    { page = 1, limit = 10, search }: any,
    context: GraphQLContext
  ) {
    try {
      return await cartService.getCartsForAdmin({
        page,
        limit,
        search,
      });
    } catch (error) {
      console.error('GraphQL adminCarts error:', error);
      throw new Error('Failed to fetch carts');
    }
  }

  @RequireAdminPanelReadPermissionForCarts()
  async adminCart(_: any, { id }: any, context: GraphQLContext) {
    try {
      return await cartService.getCartByIdForAdmin(id);
    } catch (error) {
      console.error('GraphQL adminCart error:', error);
      if (error instanceof Error && error.message === 'Cart not found') {
        throw new UserInputError(error.message);
      }
      throw new Error('Failed to fetch cart');
    }
  }

  @RequireAdminPanelReadPermissionForCarts()
  async adminCartWithRelations(_: any, { id, include }: any, context: GraphQLContext) {
    try {
      return await cartService.getCartWithRelationsForAdmin(id, include);
    } catch (error) {
      console.error('GraphQL adminCartWithRelations error:', error);
      if (error instanceof Error && error.message === 'Cart not found') {
        throw new UserInputError(error.message);
      }
      throw new Error('Failed to fetch cart with relations');
    }
  }

  @RequireAdminPanelReadPermissionForCarts()
  async adminCartsByUser(_: any, { userId }: any, context: GraphQLContext) {
    try {
      return await cartService.getCartsByUserIdForAdmin(userId);
    } catch (error) {
      console.error('GraphQL adminCartsByUser error:', error);
      if (error instanceof Error && error.message === 'User not found') {
        throw new UserInputError(error.message);
      }
      throw new Error('Failed to fetch user carts');
    }
  }

  @RequireAdminPanelReadPermissionForCarts()
  async adminCartStats(_: any, __: any, context: GraphQLContext) {
    try {
      return await cartService.getCartStatsForAdmin();
    } catch (error) {
      console.error('GraphQL adminCartStats error:', error);
      throw new Error('Failed to fetch cart statistics');
    }
  }

  @RequireAdminPanelWritePermissionForCarts()
  async adminDeleteCart(_: any, { id }: any, context: GraphQLContext) {
    try {
      await cartService.deleteCartForAdmin(id);
      return true;
    } catch (error) {
      console.error('GraphQL adminDeleteCart error:', error);
      if (error instanceof Error && error.message === 'Cart not found') {
        throw new UserInputError(error.message);
      }
      throw new Error('Failed to delete cart');
    }
  }
}

// Export resolver instance
const adminCartResolversInstance = new AdminCartResolvers();

export const adminCartResolvers = {
  Query: {
    adminCarts: adminCartResolversInstance.adminCarts.bind(
      adminCartResolversInstance
    ),
    adminCart: adminCartResolversInstance.adminCart.bind(
      adminCartResolversInstance
    ),
    adminCartWithRelations: adminCartResolversInstance.adminCartWithRelations.bind(
      adminCartResolversInstance
    ),
    adminCartsByUser: adminCartResolversInstance.adminCartsByUser.bind(
      adminCartResolversInstance
    ),
    adminCartStats: adminCartResolversInstance.adminCartStats.bind(
      adminCartResolversInstance
    ),
  },
  Mutation: {
    adminDeleteCart: adminCartResolversInstance.adminDeleteCart.bind(
      adminCartResolversInstance
    ),
  },
};