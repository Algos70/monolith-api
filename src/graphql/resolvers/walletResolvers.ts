import { WalletService } from "../../services/WalletService";
import {
  UserInputError,
  ForbiddenError,
  type GraphQLContext,
} from "../utils/permissions";
import {
  RequireWalletReadPermission,
  RequireWalletWritePermission,
} from "../decorators/permissions";
import { getCurrentUserId } from "../utils/helperFunctions";

const userWalletService = new WalletService();



export class WalletResolvers {
  @RequireWalletReadPermission()
  async userWallets(_: any, __: any, context: GraphQLContext) {
    try {
      const userId = getCurrentUserId(context);
      if (!userId) {
        return {
          success: false,
          message: "User ID not found in session",
          wallets: [],
        };
      }

      return await userWalletService.getUserWallets(userId);
    } catch (error) {
      console.error("GraphQL userWallets error:", error);
      return {
        success: false,
        message: "Failed to fetch wallets",
        wallets: [],
      };
    }
  }

  @RequireWalletWritePermission()
  async createUserWallet(_: any, { input }: any, context: GraphQLContext) {
    try {
      const userId = getCurrentUserId(context);
      if (!userId) {
        return {
          success: false,
          message: "User ID not found in session",
          wallet: null,
        };
      }

      const { currency, initialBalanceMinor } = input;

      if (!currency) {
        return {
          success: false,
          message: "Currency is required",
          wallet: null,
        };
      }

      const initialBalanceNum = initialBalanceMinor ? parseInt(initialBalanceMinor, 10) : 0;
      if (isNaN(initialBalanceNum) || initialBalanceNum < 0) {
        return {
          success: false,
          message: "Initial balance must be a non-negative number",
          wallet: null,
        };
      }

      return await userWalletService.createUserWallet({
        userId,
        currency,
        initialBalance: initialBalanceNum,
      });
    } catch (error) {
      console.error("GraphQL createUserWallet error:", error);
      return {
        success: false,
        message: "Failed to create wallet",
        wallet: null,
      };
    }
  }

  @RequireWalletWritePermission()
  async increaseUserWalletBalance(
    _: any,
    { walletId, input }: any,
    context: GraphQLContext
  ) {
    try {
      const userId = getCurrentUserId(context);
      if (!userId) {
        throw new UserInputError("User ID not found in session");
      }

      const { amountMinor } = input;

      if (!amountMinor) {
        throw new UserInputError("Amount (in minor units) is required");
      }

      const amountMinorNum = parseInt(amountMinor, 10);
      if (isNaN(amountMinorNum) || amountMinorNum <= 0) {
        throw new UserInputError("Amount must be a positive number");
      }

      const result = await userWalletService.increaseUserWalletBalance({
        userId,
        walletId,
        amountMinor: amountMinorNum,
      });

      if (!result.success) {
        throw new UserInputError(result.message);
      }

      return result;
    } catch (error) {
      console.error("GraphQL increaseUserWalletBalance error:", error);
      if (error instanceof UserInputError || error instanceof ForbiddenError) {
        throw error;
      }
      return {
        success: false,
        message: "Failed to increase wallet balance",
      };
    }
  }

  @RequireWalletWritePermission()
  async deleteUserWallet(_: any, { walletId }: any, context: GraphQLContext) {
    try {
      const userId = getCurrentUserId(context);
      if (!userId) {
        return {
          success: false,
          message: "User ID not found in session",
        };
      }

      await userWalletService.deleteUserWallet(userId, walletId);
      return {
        success: true,
        message: "Wallet deleted successfully",
      };
    } catch (error) {
      console.error("GraphQL deleteUserWallet error:", error);
      if (error instanceof Error) {
        const validationError = error as any;
        if (validationError.code === "FORBIDDEN") {
          return {
            success: false,
            message: error.message,
          };
        }
        if (error.message === "Wallet not found") {
          return {
            success: false,
            message: error.message,
          };
        }
        if (error.message === "Cannot delete wallet with positive balance") {
          return {
            success: false,
            message: error.message,
          };
        }
      }
      return {
        success: false,
        message: "Failed to delete wallet",
      };
    }
  }

  @RequireWalletWritePermission()
  async transferFromUserWallet(
    _: any,
    { input }: any,
    context: GraphQLContext
  ) {
    try {
      const userId = getCurrentUserId(context);
      if (!userId) {
        return {
          success: false,
          message: "User ID not found in session",
        };
      }

      const { toWalletId, currency, amountMinor } = input;

      if (!toWalletId || !currency || !amountMinor) {
        return {
          success: false,
          message: "Target wallet ID, currency, and amount are required",
        };
      }

      const amountMinorNum = parseInt(amountMinor, 10);
      if (isNaN(amountMinorNum) || amountMinorNum <= 0) {
        return {
          success: false,
          message: "Amount must be a positive number",
        };
      }

      await userWalletService.transferFromUserWallet({
        userId,
        toWalletId,
        currency,
        amountMinor: amountMinorNum,
      });

      return {
        success: true,
        message: "Transfer completed successfully",
      };
    } catch (error) {
      console.error("GraphQL transferFromUserWallet error:", error);
      if (error instanceof Error) {
        const validationError = error as any;
        if (
          validationError.code === "INVALID_TYPE" ||
          validationError.code === "INVALID_OPERATION"
        ) {
          return {
            success: false,
            message: error.message,
          };
        }
        if (validationError.code === "NOT_FOUND") {
          return {
            success: false,
            message: error.message,
          };
        }
        if (validationError.code === "INSUFFICIENT_BALANCE") {
          return {
            success: false,
            message: error.message,
          };
        }
      }
      return {
        success: false,
        message: "Failed to complete transfer",
      };
    }
  }

  @RequireWalletReadPermission()
  async userWalletByCurrency(
    _: any,
    { currency }: any,
    context: GraphQLContext
  ) {
    try {
      const userId = getCurrentUserId(context);
      if (!userId) {
        return {
          success: false,
          message: "User ID not found in session",
          wallet: null,
        };
      }

      return await userWalletService.getUserWalletByCurrency(
        userId,
        currency
      );
    } catch (error) {
      console.error("GraphQL userWalletByCurrency error:", error);
      return {
        success: false,
        message: "Failed to fetch wallet",
        wallet: null,
      };
    }
  }

  @RequireWalletReadPermission()
  async userWalletBalance(_: any, { currency }: any, context: GraphQLContext) {
    try {
      const userId = getCurrentUserId(context);
      if (!userId) {
        return {
          success: false,
          message: "User ID not found in session",
          balance: "0",
        };
      }

      const result = await userWalletService.getUserWalletBalance(
        userId,
        currency
      );

      return {
        success: result.success,
        message: result.message,
        balance: result.balance.toString(),
      };
    } catch (error) {
      console.error("GraphQL userWalletBalance error:", error);
      return {
        success: false,
        message: "Failed to get wallet balance",
        balance: "0",
      };
    }
  }
}

// Export resolver instance
const walletResolversInstance = new WalletResolvers();

export const walletResolvers = {
  Query: {
    userWallets: walletResolversInstance.userWallets.bind(
      walletResolversInstance
    ),
    userWalletByCurrency: walletResolversInstance.userWalletByCurrency.bind(
      walletResolversInstance
    ),
    userWalletBalance: walletResolversInstance.userWalletBalance.bind(
      walletResolversInstance
    ),
  },
  Mutation: {
    createUserWallet: walletResolversInstance.createUserWallet.bind(
      walletResolversInstance
    ),
    increaseUserWalletBalance:
      walletResolversInstance.increaseUserWalletBalance.bind(
        walletResolversInstance
      ),
    deleteUserWallet: walletResolversInstance.deleteUserWallet.bind(
      walletResolversInstance
    ),
    transferFromUserWallet: walletResolversInstance.transferFromUserWallet.bind(
      walletResolversInstance
    ),
  },
};
