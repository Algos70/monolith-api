import { UserService } from '../../services/UserService';
import { UserInputError, type GraphQLContext } from '../utils/permissions';
import {
  RequireAdminPanelReadPermissionForUser,
  RequireAdminPanelWritePermissionForUser,
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

  @RequireAdminPanelWritePermissionForUser()
  async adminCreateUser(_: any, { input }: any, context: GraphQLContext) {
    try {
      const { email, name } = input;
      return await userService.createUserForAdmin({ email, name });
    } catch (error) {
      console.error('GraphQL adminCreateUser error:', error);
      if (error instanceof Error) {
        if (error.message === 'Email is required' || error.message === 'User with this email already exists') {
          throw new UserInputError(error.message);
        }
      }
      throw new Error('Failed to create user');
    }
  }

  @RequireAdminPanelWritePermissionForUser()
  async adminUpdateUser(_: any, { id, input }: any, context: GraphQLContext) {
    try {
      const { email, name } = input;
      return await userService.updateUserForAdmin(id, { email, name });
    } catch (error) {
      console.error('GraphQL adminUpdateUser error:', error);
      if (error instanceof Error) {
        if (error.message === 'User not found' || error.message === 'Email already in use by another user') {
          throw new UserInputError(error.message);
        }
      }
      throw new Error('Failed to update user');
    }
  }

  @RequireAdminPanelWritePermissionForUser()
  async adminDeleteUser(_: any, { id }: any, context: GraphQLContext) {
    try {
      await userService.deleteUserForAdmin(id);
      return true;
    } catch (error) {
      console.error('GraphQL adminDeleteUser error:', error);
      if (error instanceof Error && error.message === 'User not found') {
        throw new UserInputError(error.message);
      }
      throw new Error('Failed to delete user');
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
  },
  Mutation: {
    adminCreateUser: adminUserResolversInstance.adminCreateUser.bind(adminUserResolversInstance),
    adminUpdateUser: adminUserResolversInstance.adminUpdateUser.bind(adminUserResolversInstance),
    adminDeleteUser: adminUserResolversInstance.adminDeleteUser.bind(adminUserResolversInstance)
  }
};