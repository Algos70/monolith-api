import { UserService } from '../../services/UserService';
import { UserInputError, type GraphQLContext } from '../utils/permissions';
import {
  RequireAdminPanelReadPermissionForUser,
} from '../decorators/permissions';

const userService = new UserService();

export class AdminUserResolvers {
  @RequireAdminPanelReadPermissionForUser()
  async adminUsers(_: any, { page = 1, limit = 10, search }: any, context: GraphQLContext) {
    try {
      return await userService.getUsersForAdmin({ page, limit, search });
    } catch (error) {
      console.error('GraphQL adminUsers error:', error);
      throw new Error('Failed to fetch users');
    }
  }

  @RequireAdminPanelReadPermissionForUser()
  async adminUser(_: any, { id }: any, context: GraphQLContext) {
    try {
      return await userService.getUserWithRelationsForAdmin(id);
    } catch (error) {
      console.error('GraphQL adminUser error:', error);
      if (error instanceof Error && error.message === 'User not found') {
        throw new UserInputError(error.message);
      }
      throw new Error('Failed to fetch user');
    }
  }

  @RequireAdminPanelReadPermissionForUser()
  async adminUserWithRelations(_: any, { id, include = [] }: any, context: GraphQLContext) {
    try {
      return await userService.getUserWithRelationsForAdmin(id, include);
    } catch (error) {
      console.error('GraphQL adminUserWithRelations error:', error);
      if (error instanceof Error && error.message === 'User not found') {
        throw new UserInputError(error.message);
      }
      throw new Error('Failed to fetch user with relations');
    }
  }




}

// Export resolver instance
const adminUserResolversInstance = new AdminUserResolvers();

export const adminUserResolvers = {
  Query: {
    adminUsers: adminUserResolversInstance.adminUsers.bind(adminUserResolversInstance),
    adminUser: adminUserResolversInstance.adminUser.bind(adminUserResolversInstance),
    adminUserWithRelations: adminUserResolversInstance.adminUserWithRelations.bind(adminUserResolversInstance)
  }
};