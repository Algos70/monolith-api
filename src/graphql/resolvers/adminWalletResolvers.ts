import { WalletService } from '../../services/WalletService';
import { UserInputError, ForbiddenError, type GraphQLContext } from '../utils/permissions';
import {
  RequireAdminPanelReadPermissionForWallets,
  RequireAdminPanelWritePermissionForWallets,
} from '../decorators/permissions';

const walletService = new WalletService();

export class AdminWalletResolvers {
  @RequireAdminPanelReadPermissionForWallets()
  async adminWallets(_: any, { page = 1, limit = 10, search, currency, userId }: any, context: GraphQLContext) {
    try {
      return await walletService.getWalletsForAdmin({
        page,
        limit,
        search,
        currency,
        userId,
      });
    } catch (error) {
      console.error('GraphQL adminWallets error:', error);
      throw new Error('Failed to fetch wallets');
    }
  }

  @RequireAdminPanelReadPermissionForWallets()
  async adminWallet(_: any, { id }: any, context: GraphQLContext) {
    try {
      return await walletService.getWalletForAdmin(id);
    } catch (error) {
      console.error('GraphQL adminWallet error:', error);
      if (error instanceof Error && error.message === 'Wallet not found') {
        throw new UserInputError(error.message);
      }
      throw new Error('Failed to fetch wallet');
    }
  }

  @RequireAdminPanelReadPermissionForWallets()
  async adminWalletsByUser(_: any, { userId }: any, context: GraphQLContext) {
    try {
      return await walletService.findByUserId(userId);
    } catch (error) {
      console.error('GraphQL adminWalletsByUser error:', error);
      throw new Error('Failed to fetch wallets by user');
    }
  }

  @RequireAdminPanelReadPermissionForWallets()
  async adminWalletsByCurrency(_: any, { currency }: any, context: GraphQLContext) {
    try {
      return await walletService.findByCurrency(currency);
    } catch (error) {
      console.error('GraphQL adminWalletsByCurrency error:', error);
      throw new Error('Failed to fetch wallets by currency');
    }
  }

  @RequireAdminPanelReadPermissionForWallets()
  async adminWalletByUserAndCurrency(_: any, { userId, currency }: any, context: GraphQLContext) {
    try {
      const wallet = await walletService.findByUserAndCurrency(userId, currency);
      if (!wallet) {
        throw new UserInputError('Wallet not found');
      }
      return wallet;
    } catch (error) {
      console.error('GraphQL adminWalletByUserAndCurrency error:', error);
      if (error instanceof UserInputError) {
        throw error;
      }
      throw new Error('Failed to fetch wallet');
    }
  }

  @RequireAdminPanelReadPermissionForWallets()
  async adminWalletBalance(_: any, { userId, currency }: any, context: GraphQLContext) {
    try {
      const balance = await walletService.getBalance(userId, currency);
      return {
        balance,
        currency,
        userId,
      };
    } catch (error) {
      console.error('GraphQL adminWalletBalance error:', error);
      throw new Error('Failed to get wallet balance');
    }
  }

  @RequireAdminPanelWritePermissionForWallets()
  async adminCreateWallet(_: any, { input }: any, context: GraphQLContext) {
    try {
      const { userId, currency, initialBalanceMinor } = input;
      const initialBalanceNum = initialBalanceMinor ? parseInt(initialBalanceMinor, 10) : 0;
      return await walletService.createWallet({
        userId,
        currency,
        initialBalance: initialBalanceNum,
      });
    } catch (error) {
      console.error('GraphQL adminCreateWallet error:', error);
      if (error instanceof Error) {
        const validationError = error as any;
        if (validationError.code === 'DUPLICATE') {
          throw new UserInputError(error.message);
        }
        if (
          validationError.code === 'INVALID_FORMAT' ||
          validationError.code === 'INVALID_TYPE'
        ) {
          throw new UserInputError(error.message);
        }
      }
      throw new Error('Failed to create wallet');
    }
  }

  @RequireAdminPanelWritePermissionForWallets()
  async adminDeleteWallet(_: any, { id }: any, context: GraphQLContext) {
    try {
      await walletService.deleteWallet(id);
      return true;
    } catch (error) {
      console.error('GraphQL adminDeleteWallet error:', error);
      if (error instanceof Error) {
        if (error.message === 'Wallet not found') {
          throw new UserInputError(error.message);
        }
        if (error.message === 'Cannot delete wallet with positive balance') {
          throw new ForbiddenError(error.message);
        }
      }
      throw new Error('Failed to delete wallet');
    }
  }

  @RequireAdminPanelWritePermissionForWallets()
  async adminIncreaseWalletBalance(_: any, { id, input }: any, context: GraphQLContext) {
    try {
      const { amountMinor } = input;

      // First get the wallet to extract userId and currency
      const wallet = await walletService.findById(id);
      if (!wallet) {
        throw new UserInputError('Wallet not found');
      }

      return await walletService.increaseBalance({
        userId: wallet.user.id,
        currency: wallet.currency,
        amountMinor,
      });
    } catch (error) {
      console.error('GraphQL adminIncreaseWalletBalance error:', error);
      if (error instanceof Error) {
        const validationError = error as any;
        if (validationError.code === 'INVALID_TYPE') {
          throw new UserInputError(error.message);
        }
        if (validationError.code === 'NOT_FOUND') {
          throw new UserInputError(error.message);
        }
      }
      if (error instanceof UserInputError) {
        throw error;
      }
      throw new Error('Failed to increase wallet balance');
    }
  }

  @RequireAdminPanelWritePermissionForWallets()
  async adminDecreaseWalletBalance(_: any, { id, input }: any, context: GraphQLContext) {
    try {
      const { amountMinor } = input;

      // First get the wallet to extract userId and currency
      const wallet = await walletService.findById(id);
      if (!wallet) {
        throw new UserInputError('Wallet not found');
      }

      return await walletService.decreaseBalance({
        userId: wallet.user.id,
        currency: wallet.currency,
        amountMinor,
      });
    } catch (error) {
      console.error('GraphQL adminDecreaseWalletBalance error:', error);
      if (error instanceof Error) {
        const validationError = error as any;
        if (validationError.code === 'INVALID_TYPE') {
          throw new UserInputError(error.message);
        }
        if (validationError.code === 'NOT_FOUND') {
          throw new UserInputError(error.message);
        }
        if (validationError.code === 'INSUFFICIENT_BALANCE') {
          throw new UserInputError(error.message);
        }
      }
      if (error instanceof UserInputError) {
        throw error;
      }
      throw new Error('Failed to decrease wallet balance');
    }
  }

  @RequireAdminPanelWritePermissionForWallets()
  async adminTransferBetweenWallets(_: any, { input }: any, context: GraphQLContext) {
    try {
      const { fromUserId, toUserId, currency, amountMinor } = input;

      await walletService.transfer({
        fromUserId,
        toUserId,
        currency,
        amountMinor,
      });

      return {
        success: true,
        message: 'Transfer completed successfully',
      };
    } catch (error) {
      console.error('GraphQL adminTransferBetweenWallets error:', error);
      if (error instanceof Error) {
        const validationError = error as any;
        if (
          validationError.code === 'INVALID_TYPE' ||
          validationError.code === 'INVALID_OPERATION'
        ) {
          throw new UserInputError(error.message);
        }
        if (validationError.code === 'NOT_FOUND') {
          throw new UserInputError(error.message);
        }
        if (validationError.code === 'INSUFFICIENT_BALANCE') {
          throw new UserInputError(error.message);
        }
      }
      throw new Error('Failed to complete transfer');
    }
  }
}

// Export resolver instance
const adminWalletResolversInstance = new AdminWalletResolvers();

export const adminWalletResolvers = {
  Query: {
    adminWallets: adminWalletResolversInstance.adminWallets.bind(adminWalletResolversInstance),
    adminWallet: adminWalletResolversInstance.adminWallet.bind(adminWalletResolversInstance),
    adminWalletsByUser: adminWalletResolversInstance.adminWalletsByUser.bind(adminWalletResolversInstance),
    adminWalletsByCurrency: adminWalletResolversInstance.adminWalletsByCurrency.bind(adminWalletResolversInstance),
    adminWalletByUserAndCurrency: adminWalletResolversInstance.adminWalletByUserAndCurrency.bind(adminWalletResolversInstance),
    adminWalletBalance: adminWalletResolversInstance.adminWalletBalance.bind(adminWalletResolversInstance),
  },
  Mutation: {
    adminCreateWallet: adminWalletResolversInstance.adminCreateWallet.bind(adminWalletResolversInstance),
    adminDeleteWallet: adminWalletResolversInstance.adminDeleteWallet.bind(adminWalletResolversInstance),
    adminIncreaseWalletBalance: adminWalletResolversInstance.adminIncreaseWalletBalance.bind(adminWalletResolversInstance),
    adminDecreaseWalletBalance: adminWalletResolversInstance.adminDecreaseWalletBalance.bind(adminWalletResolversInstance),
    adminTransferBetweenWallets: adminWalletResolversInstance.adminTransferBetweenWallets.bind(adminWalletResolversInstance),
  },
};