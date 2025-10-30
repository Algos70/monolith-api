import { UserWalletService } from "../../services/UserWalletService";
import {
  UserInputError,
  ForbiddenError,
  type GraphQLContext,
} from "../utils/permissions";
import {
  RequireWalletReadPermission,
  RequireWalletWritePermission,
} from "../decorators/permissions";

const userWalletService = new UserWalletService();

// Helper function to get current user ID from GraphQL context
const getCurrentUserId = (context: GraphQLContext): string => {
  // Try to get user from context.user first (if set by middleware)
  if (context.user) {
    return context.user.dbUserId || context.user.sub;
  }

  // Try to get user from session if available
  if (context.session?.user) {
    return context.session.user.dbUserId || context.session.user.sub;
  }

  // Try to get user from request session
  if (context.req?.session?.user) {
    return context.req.session.user.dbUserId || context.req.session.user.sub;
  }

  return "";
};

export class WalletResolvers {
  @RequireWalletReadPermission()
  async userWallets(_: any, __: any, context: GraphQLContext) {
    try {
      const userId = getCurrentUserId(context);
      if (!userId) {
        throw new UserInputError("User ID not found in session");
      }

      return await userWalletService.getUserWallets(userId);
    } catch (error) {
      console.error("GraphQL userWallets error:", error);
      if (error instanceof UserInputError) {
        throw error;
      }
      throw new Error("Failed to fetch user wallets");
    }
  }

  @RequireWalletWritePermission()
  async createUserWallet(_: any, { input }: any, context: GraphQLContext) {
    try {
      const userId = getCurrentUserId(context);
      if (!userId) {
        throw new UserInputError("User ID not found in session");
      }

      const { currency, initialBalance } = input;

      if (!currency) {
        throw new UserInputError("Currency is required");
      }

      return await userWalletService.createUserWallet({
        userId,
        currency,
        initialBalance,
      });
    } catch (error) {
      console.error("GraphQL createUserWallet error:", error);
      if (error instanceof Error) {
        const validationError = error as any;
        if (validationError.code === "DUPLICATE") {
          throw new UserInputError(error.message);
        }
        if (
          validationError.code === "INVALID_FORMAT" ||
          validationError.code === "INVALID_TYPE"
        ) {
          throw new UserInputError(error.message);
        }
      }
      if (error instanceof UserInputError) {
        throw error;
      }
      throw new Error("Failed to create wallet");
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

      if (!amountMinor || typeof amountMinor !== "number") {
        throw new UserInputError(
          "Amount (in minor units) is required and must be a number"
        );
      }

      return await userWalletService.increaseUserWalletBalance({
        userId,
        walletId,
        amountMinor,
      });
    } catch (error) {
      console.error("GraphQL increaseUserWalletBalance error:", error);
      if (error instanceof Error) {
        const validationError = error as any;
        if (validationError.code === "FORBIDDEN") {
          throw new ForbiddenError(error.message);
        }
        if (validationError.code === "INVALID_TYPE") {
          throw new UserInputError(error.message);
        }
        if (validationError.code === "NOT_FOUND") {
          throw new UserInputError(error.message);
        }
        if (error.message === "Wallet not found") {
          throw new UserInputError(error.message);
        }
      }
      if (error instanceof UserInputError || error instanceof ForbiddenError) {
        throw error;
      }
      throw new Error("Failed to increase wallet balance");
    }
  }

  @RequireWalletWritePermission()
  async deleteUserWallet(_: any, { walletId }: any, context: GraphQLContext) {
    try {
      const userId = getCurrentUserId(context);
      if (!userId) {
        throw new UserInputError("User ID not found in session");
      }

      await userWalletService.deleteUserWallet(userId, walletId);
      return true;
    } catch (error) {
      console.error("GraphQL deleteUserWallet error:", error);
      if (error instanceof Error) {
        const validationError = error as any;
        if (validationError.code === "FORBIDDEN") {
          throw new ForbiddenError(error.message);
        }
        if (error.message === "Wallet not found") {
          throw new UserInputError(error.message);
        }
        if (error.message === "Cannot delete wallet with positive balance") {
          throw new ForbiddenError(error.message);
        }
      }
      if (error instanceof UserInputError || error instanceof ForbiddenError) {
        throw error;
      }
      throw new Error("Failed to delete wallet");
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
        throw new UserInputError("User ID not found in session");
      }

      const { toWalletId, currency, amountMinor } = input;

      if (!toWalletId || !currency || !amountMinor) {
        throw new UserInputError(
          "Target wallet ID, currency, and amount are required"
        );
      }

      if (typeof amountMinor !== "number") {
        throw new UserInputError("Amount must be a number");
      }

      await userWalletService.transferFromUserWallet({
        userId,
        toWalletId,
        currency,
        amountMinor,
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
          throw new UserInputError(error.message);
        }
        if (validationError.code === "NOT_FOUND") {
          throw new UserInputError(error.message);
        }
        if (validationError.code === "INSUFFICIENT_BALANCE") {
          throw new UserInputError(error.message);
        }
      }
      if (error instanceof UserInputError) {
        throw error;
      }
      throw new Error("Failed to complete transfer");
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
        throw new UserInputError("User ID not found in session");
      }

      const wallet = await userWalletService.getUserWalletByCurrency(
        userId,
        currency
      );

      if (!wallet) {
        throw new UserInputError("Wallet not found");
      }

      return wallet;
    } catch (error) {
      console.error("GraphQL userWalletByCurrency error:", error);
      if (error instanceof UserInputError) {
        throw error;
      }
      throw new Error("Failed to fetch wallet");
    }
  }

  @RequireWalletReadPermission()
  async userWalletBalance(_: any, { currency }: any, context: GraphQLContext) {
    try {
      const userId = getCurrentUserId(context);
      if (!userId) {
        throw new UserInputError("User ID not found in session");
      }

      const balance = await userWalletService.getUserWalletBalance(
        userId,
        currency
      );
      return {
        balance,
        currency,
        userId,
      };
    } catch (error) {
      console.error("GraphQL userWalletBalance error:", error);
      if (error instanceof UserInputError) {
        throw error;
      }
      throw new Error("Failed to get wallet balance");
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
