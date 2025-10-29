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
      // Get all users
      const users = await userService.getAllUsers();
      
      // Filter by search if provided
      let filteredUsers = users;
      if (search) {
        filteredUsers = users.filter(user => 
          user.email.toLowerCase().includes(search.toLowerCase()) ||
          user.name?.toLowerCase().includes(search.toLowerCase())
        );
      }

      // Simple pagination
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

      return {
        users: paginatedUsers,
        pagination: {
          page,
          limit,
          total: filteredUsers.length,
          totalPages: Math.ceil(filteredUsers.length / limit)
        }
      };
    } catch (error) {
      console.error('GraphQL adminUsers error:', error);
      throw new Error('Failed to fetch users');
    }
  }

  @RequireAdminPanelReadPermissionForUser()
  async adminUser(_: any, { id }: any, context: GraphQLContext) {
    try {
      const user = await userService.findById(id);
      if (!user) {
        throw new UserInputError('User not found');
      }
      return user;
    } catch (error) {
      console.error('GraphQL adminUser error:', error);
      if (error instanceof UserInputError) throw error;
      throw new Error('Failed to fetch user');
    }
  }

  @RequireAdminPanelReadPermissionForUser()
  async adminUserWithRelations(_: any, { id, include = [] }: any, context: GraphQLContext) {
    try {
      let user;
      if (include.includes('wallets')) {
        user = await userService.findWithWallets(id);
      } else if (include.includes('orders')) {
        user = await userService.findWithOrders(id);
      } else if (include.includes('carts')) {
        user = await userService.findWithCarts(id);
      } else {
        user = await userService.findById(id);
      }

      if (!user) {
        throw new UserInputError('User not found');
      }
      return user;
    } catch (error) {
      console.error('GraphQL adminUserWithRelations error:', error);
      if (error instanceof UserInputError) throw error;
      throw new Error('Failed to fetch user with relations');
    }
  }

  @RequireAdminPanelWritePermissionForUser()
  async adminCreateUser(_: any, { input }: any, context: GraphQLContext) {
    try {
      const { email, name } = input;

      if (!email) {
        throw new UserInputError('Email is required');
      }

      // Check if user already exists
      const existingUser = await userService.findByEmail(email);
      if (existingUser) {
        throw new UserInputError('User with this email already exists');
      }

      return await userService.createUser({ email, name });
    } catch (error) {
      console.error('GraphQL adminCreateUser error:', error);
      if (error instanceof UserInputError) throw error;
      throw new Error('Failed to create user');
    }
  }

  @RequireAdminPanelWritePermissionForUser()
  async adminUpdateUser(_: any, { id, input }: any, context: GraphQLContext) {
    try {
      const { email, name } = input;

      // Check if user exists
      const existingUser = await userService.findById(id);
      if (!existingUser) {
        throw new UserInputError('User not found');
      }

      // If email is being changed, check for conflicts
      if (email && email !== existingUser.email) {
        const emailConflict = await userService.findByEmail(email);
        if (emailConflict) {
          throw new UserInputError('Email already in use by another user');
        }
      }

      const updatedUser = await userService.updateUser(id, { email, name });
      
      if (!updatedUser) {
        throw new UserInputError('User not found');
      }

      return updatedUser;
    } catch (error) {
      console.error('GraphQL adminUpdateUser error:', error);
      if (error instanceof UserInputError) throw error;
      throw new Error('Failed to update user');
    }
  }

  @RequireAdminPanelWritePermissionForUser()
  async adminDeleteUser(_: any, { id }: any, context: GraphQLContext) {
    try {
      // Check if user exists
      const existingUser = await userService.findById(id);
      if (!existingUser) {
        throw new UserInputError('User not found');
      }

      await userService.deleteUser(id);
      return true;
    } catch (error) {
      console.error('GraphQL adminDeleteUser error:', error);
      if (error instanceof UserInputError) throw error;
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