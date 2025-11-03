import { Wallet } from "../entities/Wallet";
import { WalletRepository } from "../repositories/WalletRepository";

export interface CreateWalletData {
  userId: string;
  currency: string;
  initialBalance?: number;
}

export interface WalletListOptions {
  page?: number;
  limit?: number;
  search?: string;
  currency?: string;
  userId?: string;
}

export interface WalletListResult {
  wallets: Wallet[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface BalanceOperationData {
  userId: string;
  currency: string;
  amountMinor: number;
}

export interface TransferData {
  fromUserId: string;
  toUserId: string;
  currency: string;
  amountMinor: number;
}

export interface UserWalletIncreaseBalanceData {
  userId: string;
  walletId: string;
  amountMinor: number;
}

export interface UserWalletTransferData {
  userId: string;
  toWalletId: string;
  currency: string;
  amountMinor: number;
}

export interface UserWalletsResult {
  success: boolean;
  message: string;
  wallets: Wallet[];
}

export interface UserWalletResult {
  success: boolean;
  message: string;
  wallet: Wallet | null;
}

export interface UserWalletBalanceResult {
  success: boolean;
  message: string;
  balance: number;
}

export interface UserWalletOperationResult {
  success: boolean;
  message: string;
}

export class WalletService {
  private walletRepository: WalletRepository;

  constructor() {
    this.walletRepository = new WalletRepository();
  }

  // Basic CRUD operations
  async findById(id: string): Promise<Wallet | null> {
    return await this.walletRepository.findById(id);
  }

  async findByUserId(userId: string): Promise<Wallet[]> {
    return await this.walletRepository.findByUserId(userId);
  }

  async findByUserAndCurrency(
    userId: string,
    currency: string
  ): Promise<Wallet | null> {
    return await this.walletRepository.findByUserAndCurrency(userId, currency);
  }

  async createWallet(data: CreateWalletData): Promise<Wallet> {
    const { userId, currency, initialBalance = 0 } = data;

    // Validate currency format (ISO 4217)
    if (!currency || currency.length !== 3) {
      const error = new Error(
        "Currency must be a valid 3-letter ISO 4217 code"
      ) as any;
      error.code = "INVALID_FORMAT";
      throw error;
    }

    // Check if wallet already exists for this user and currency
    const existingWallet = await this.walletRepository.findByUserAndCurrency(
      userId,
      currency
    );
    if (existingWallet) {
      const error = new Error(
        `Wallet already exists for user ${userId} and currency ${currency}`
      ) as any;
      error.code = "DUPLICATE";
      throw error;
    }

    // Validate initial balance
    if (initialBalance < 0) {
      const error = new Error("Initial balance cannot be negative") as any;
      error.code = "INVALID_TYPE";
      throw error;
    }

    return await this.walletRepository.createWallet(
      userId,
      currency,
      initialBalance
    );
  }

  async deleteWallet(id: string): Promise<void> {
    const wallet = await this.walletRepository.findById(id);
    if (!wallet) {
      throw new Error("Wallet not found");
    }

    // Check if wallet has balance
    if (wallet.balanceMinor > 0) {
      throw new Error("Cannot delete wallet with positive balance");
    }

    await this.walletRepository.delete(id);
  }

  // Balance operations
  async increaseBalance(data: BalanceOperationData): Promise<Wallet> {
    const { userId, currency, amountMinor } = data;

    if (amountMinor <= 0) {
      const error = new Error("Amount must be positive") as any;
      error.code = "INVALID_TYPE";
      throw error;
    }

    const wallet = await this.walletRepository.increaseBalance(
      userId,
      currency,
      amountMinor
    );
    if (!wallet) {
      const error = new Error(
        `Wallet not found for user ${userId} and currency ${currency}`
      ) as any;
      error.code = "NOT_FOUND";
      throw error;
    }

    return wallet;
  }

  async decreaseBalance(
    data: BalanceOperationData,
    manager?: any
  ): Promise<Wallet> {
    const { userId, currency, amountMinor } = data;

    if (amountMinor <= 0) {
      const error = new Error("Amount must be positive") as any;
      error.code = "INVALID_TYPE";
      throw error;
    }

    try {
      const wallet = await this.walletRepository.decreaseBalance(
        userId,
        currency,
        amountMinor,
        manager
      );
      if (!wallet) {
        const error = new Error(
          `Wallet not found for user ${userId} and currency ${currency}`
        ) as any;
        error.code = "NOT_FOUND";
        throw error;
      }
      return wallet;
    } catch (error: any) {
      if (error.message.includes("Insufficient balance")) {
        error.code = "INSUFFICIENT_BALANCE";
      }
      throw error;
    }
  }

  async transfer(data: TransferData): Promise<void> {
    const { fromUserId, toUserId, currency, amountMinor } = data;

    if (amountMinor <= 0) {
      const error = new Error("Transfer amount must be positive") as any;
      error.code = "INVALID_TYPE";
      throw error;
    }

    if (fromUserId === toUserId) {
      const error = new Error("Cannot transfer to the same user") as any;
      error.code = "INVALID_OPERATION";
      throw error;
    }

    try {
      await this.walletRepository.transfer(
        fromUserId,
        toUserId,
        currency,
        amountMinor
      );
    } catch (error: any) {
      if (error.message.includes("not found")) {
        error.code = "NOT_FOUND";
      } else if (error.message.includes("Insufficient balance")) {
        error.code = "INSUFFICIENT_BALANCE";
      }
      throw error;
    }
  }

  async getBalance(userId: string, currency: string): Promise<number> {
    return await this.walletRepository.getBalance(userId, currency);
  }

  // Admin panel methods
  async getWalletsForAdmin(
    options: WalletListOptions = {}
  ): Promise<WalletListResult> {
    const { page = 1, limit = 10, search, currency, userId } = options;

    // Get all wallets
    let allWallets = await this.walletRepository.findAll();

    // Apply filters
    if (currency) {
      allWallets = allWallets.filter((wallet) => wallet.currency === currency);
    }

    if (userId) {
      allWallets = allWallets.filter((wallet) => wallet.user.id === userId);
    }

    if (search) {
      allWallets = allWallets.filter(
        (wallet) =>
          wallet.user.email.toLowerCase().includes(search.toLowerCase()) ||
          wallet.user.name?.toLowerCase().includes(search.toLowerCase()) ||
          wallet.currency.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedWallets = allWallets.slice(startIndex, endIndex);

    return {
      wallets: paginatedWallets,
      pagination: {
        page,
        limit,
        total: allWallets.length,
        totalPages: Math.ceil(allWallets.length / limit),
      },
    };
  }

  async getWalletForAdmin(id: string): Promise<Wallet> {
    const wallet = await this.walletRepository.findById(id);
    if (!wallet) {
      throw new Error("Wallet not found");
    }
    return wallet;
  }

  async findByCurrency(currency: string): Promise<Wallet[]> {
    return await this.walletRepository.findByCurrency(currency);
  }

  // Update wallet currency (admin only)
  async updateWalletCurrency(id: string, currency: string): Promise<Wallet> {
    if (!currency || currency.length !== 3) {
      const error = new Error(
        "Currency must be a valid 3-letter ISO 4217 code"
      ) as any;
      error.code = "INVALID_FORMAT";
      throw error;
    }

    const wallet = await this.walletRepository.findById(id);
    if (!wallet) {
      const error = new Error("Wallet not found") as any;
      error.code = "NOT_FOUND";
      throw error;
    }

    // Check if user already has a wallet with this currency
    const existingWallet = await this.walletRepository.findByUserAndCurrency(
      wallet.user.id,
      currency
    );
    if (existingWallet && existingWallet.id !== id) {
      const error = new Error(
        `User already has a wallet with currency ${currency}`
      ) as any;
      error.code = "DUPLICATE";
      throw error;
    }

    wallet.currency = currency;
    // Note: This would need to be implemented in the repository
    // For now, we'll throw an error as this operation is complex
    throw new Error(
      "Currency update not implemented - requires database update"
    );
  }

  // User-specific wallet operations (from UserWalletService)

  // Get all wallets for a user
  async getUserWallets(userId: string): Promise<UserWalletsResult> {
    try {
      const wallets = await this.findByUserId(userId);
      return {
        success: true,
        message: `Found ${wallets.length} wallets for user`,
        wallets: wallets,
      };
    } catch (error) {
      console.error("Error in WalletService.getUserWallets:", error);
      return {
        success: false,
        message: "Error retrieving user wallets",
        wallets: [],
      };
    }
  }

  // Create a new wallet for a user
  async createUserWallet(data: CreateWalletData): Promise<UserWalletResult> {
    try {
      const { userId, currency, initialBalance = 0 } = data;

      const wallet = await this.createWallet({
        userId,
        currency,
        initialBalance,
      });

      return {
        success: true,
        message: "Wallet created successfully",
        wallet: wallet,
      };
    } catch (error) {
      console.error("Error in WalletService.createUserWallet:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "Error creating wallet",
        wallet: null,
      };
    }
  }

  // Increase balance of user's own wallet
  async increaseUserWalletBalance(
    data: UserWalletIncreaseBalanceData
  ): Promise<UserWalletOperationResult> {
    try {
      const { userId, walletId, amountMinor } = data;

      // Verify wallet belongs to the user
      const wallet = await this.findById(walletId);
      if (!wallet) {
        return {
          success: false,
          message: "Wallet not found",
        };
      }

      if (wallet.user.id !== userId) {
        return {
          success: false,
          message: "You can only modify your own wallets",
        };
      }

      await this.increaseBalance({
        userId,
        currency: wallet.currency,
        amountMinor,
      });

      return {
        success: true,
        message: "Balance increased successfully",
      };
    } catch (error) {
      console.error("Error in WalletService.increaseUserWalletBalance:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "Error increasing balance",
      };
    }
  }

  // Delete user's own wallet
  async deleteUserWallet(userId: string, walletId: string): Promise<void> {
    // Verify wallet belongs to the user
    const wallet = await this.findById(walletId);
    if (!wallet) {
      throw new Error("Wallet not found");
    }

    if (wallet.user.id !== userId) {
      const error = new Error("You can only delete your own wallets") as any;
      error.code = "FORBIDDEN";
      throw error;
    }

    await this.deleteWallet(walletId);
  }

  // Transfer money from user's wallet to another wallet
  async transferFromUserWallet(data: UserWalletTransferData): Promise<void> {
    const { userId, toWalletId, currency, amountMinor } = data;

    // Verify user has a wallet with the specified currency
    const fromWallet = await this.findByUserAndCurrency(userId, currency);
    if (!fromWallet) {
      const error = new Error(
        `You don't have a wallet with currency ${currency}`
      ) as any;
      error.code = "NOT_FOUND";
      throw error;
    }

    // Verify target wallet exists and has the same currency
    const toWallet = await this.findById(toWalletId);
    if (!toWallet) {
      const error = new Error("Target wallet not found") as any;
      error.code = "NOT_FOUND";
      throw error;
    }

    if (toWallet.currency !== currency) {
      const error = new Error(
        "Target wallet must have the same currency"
      ) as any;
      error.code = "INVALID_OPERATION";
      throw error;
    }

    // Prevent self-transfer
    if (toWallet.user.id === userId) {
      const error = new Error("Cannot transfer to your own wallet") as any;
      error.code = "INVALID_OPERATION";
      throw error;
    }

    await this.transfer({
      fromUserId: userId,
      toUserId: toWallet.user.id,
      currency,
      amountMinor,
    });
  }

  // Get user's wallet by currency
  async getUserWalletByCurrency(
    userId: string,
    currency: string
  ): Promise<UserWalletResult> {
    try {
      const wallet = await this.findByUserAndCurrency(userId, currency);
      
      if (!wallet) {
        return {
          success: false,
          message: `Wallet not found for currency ${currency}`,
          wallet: null,
        };
      }

      return {
        success: true,
        message: "Wallet found successfully",
        wallet: wallet,
      };
    } catch (error) {
      console.error("Error in WalletService.getUserWalletByCurrency:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "Error retrieving wallet",
        wallet: null,
      };
    }
  }

  // Get balance for user's wallet by currency
  async getUserWalletBalance(
    userId: string,
    currency: string
  ): Promise<UserWalletBalanceResult> {
    try {
      const balance = await this.getBalance(userId, currency);
      return {
        success: true,
        message: "Balance retrieved successfully",
        balance: balance,
      };
    } catch (error) {
      console.error("Error in WalletService.getUserWalletBalance:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "Error retrieving balance",
        balance: 0,
      };
    }
  }
}
