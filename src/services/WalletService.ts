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

  async findByUserAndCurrency(userId: string, currency: string): Promise<Wallet | null> {
    return await this.walletRepository.findByUserAndCurrency(userId, currency);
  }

  async createWallet(data: CreateWalletData): Promise<Wallet> {
    const { userId, currency, initialBalance = 0 } = data;

    // Validate currency format (ISO 4217)
    if (!currency || currency.length !== 3) {
      const error = new Error("Currency must be a valid 3-letter ISO 4217 code") as any;
      error.code = "INVALID_FORMAT";
      throw error;
    }

    // Check if wallet already exists for this user and currency
    const existingWallet = await this.walletRepository.findByUserAndCurrency(userId, currency);
    if (existingWallet) {
      const error = new Error(`Wallet already exists for user ${userId} and currency ${currency}`) as any;
      error.code = "DUPLICATE";
      throw error;
    }

    // Validate initial balance
    if (initialBalance < 0) {
      const error = new Error("Initial balance cannot be negative") as any;
      error.code = "INVALID_TYPE";
      throw error;
    }

    return await this.walletRepository.createWallet(userId, currency, initialBalance);
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

    const wallet = await this.walletRepository.increaseBalance(userId, currency, amountMinor);
    if (!wallet) {
      const error = new Error(`Wallet not found for user ${userId} and currency ${currency}`) as any;
      error.code = "NOT_FOUND";
      throw error;
    }

    return wallet;
  }

  async decreaseBalance(data: BalanceOperationData): Promise<Wallet> {
    const { userId, currency, amountMinor } = data;

    if (amountMinor <= 0) {
      const error = new Error("Amount must be positive") as any;
      error.code = "INVALID_TYPE";
      throw error;
    }

    try {
      const wallet = await this.walletRepository.decreaseBalance(userId, currency, amountMinor);
      if (!wallet) {
        const error = new Error(`Wallet not found for user ${userId} and currency ${currency}`) as any;
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
      await this.walletRepository.transfer(fromUserId, toUserId, currency, amountMinor);
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
  async getWalletsForAdmin(options: WalletListOptions = {}): Promise<WalletListResult> {
    const { page = 1, limit = 10, search, currency, userId } = options;

    // Get all wallets
    let allWallets = await this.walletRepository.findAll();

    // Apply filters
    if (currency) {
      allWallets = allWallets.filter(wallet => wallet.currency === currency);
    }

    if (userId) {
      allWallets = allWallets.filter(wallet => wallet.user.id === userId);
    }

    if (search) {
      allWallets = allWallets.filter(wallet =>
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
      const error = new Error("Currency must be a valid 3-letter ISO 4217 code") as any;
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
    const existingWallet = await this.walletRepository.findByUserAndCurrency(wallet.user.id, currency);
    if (existingWallet && existingWallet.id !== id) {
      const error = new Error(`User already has a wallet with currency ${currency}`) as any;
      error.code = "DUPLICATE";
      throw error;
    }

    wallet.currency = currency;
    // Note: This would need to be implemented in the repository
    // For now, we'll throw an error as this operation is complex
    throw new Error("Currency update not implemented - requires database update");
  }
}