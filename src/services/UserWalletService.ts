import { Wallet } from "../entities/Wallet";
import { WalletService } from "./WalletService";

export interface UserWalletCreateData {
  userId: string;
  currency: string;
  initialBalance?: number;
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

export class UserWalletService {
  private walletService: WalletService;

  constructor() {
    this.walletService = new WalletService();
  }

  // Get all wallets for a user
  async getUserWallets(userId: string): Promise<Wallet[]> {
    return await this.walletService.findByUserId(userId);
  }

  // Create a new wallet for a user
  async createUserWallet(data: UserWalletCreateData): Promise<Wallet> {
    const { userId, currency, initialBalance = 0 } = data;

    return await this.walletService.createWallet({
      userId,
      currency,
      initialBalance,
    });
  }

  // Increase balance of user's own wallet
  async increaseUserWalletBalance(data: UserWalletIncreaseBalanceData): Promise<Wallet> {
    const { userId, walletId, amountMinor } = data;

    // Verify wallet belongs to the user
    const wallet = await this.walletService.findById(walletId);
    if (!wallet) {
      throw new Error("Wallet not found");
    }

    if (wallet.user.id !== userId) {
      const error = new Error("You can only modify your own wallets") as any;
      error.code = "FORBIDDEN";
      throw error;
    }

    return await this.walletService.increaseBalance({
      userId,
      currency: wallet.currency,
      amountMinor,
    });
  }

  // Delete user's own wallet
  async deleteUserWallet(userId: string, walletId: string): Promise<void> {
    // Verify wallet belongs to the user
    const wallet = await this.walletService.findById(walletId);
    if (!wallet) {
      throw new Error("Wallet not found");
    }

    if (wallet.user.id !== userId) {
      const error = new Error("You can only delete your own wallets") as any;
      error.code = "FORBIDDEN";
      throw error;
    }

    await this.walletService.deleteWallet(walletId);
  }

  // Transfer money from user's wallet to another wallet
  async transferFromUserWallet(data: UserWalletTransferData): Promise<void> {
    const { userId, toWalletId, currency, amountMinor } = data;

    // Verify user has a wallet with the specified currency
    const fromWallet = await this.walletService.findByUserAndCurrency(userId, currency);
    if (!fromWallet) {
      const error = new Error(`You don't have a wallet with currency ${currency}`) as any;
      error.code = "NOT_FOUND";
      throw error;
    }

    // Verify target wallet exists and has the same currency
    const toWallet = await this.walletService.findById(toWalletId);
    if (!toWallet) {
      const error = new Error("Target wallet not found") as any;
      error.code = "NOT_FOUND";
      throw error;
    }

    if (toWallet.currency !== currency) {
      const error = new Error("Target wallet must have the same currency") as any;
      error.code = "INVALID_OPERATION";
      throw error;
    }

    // Prevent self-transfer
    if (toWallet.user.id === userId) {
      const error = new Error("Cannot transfer to your own wallet") as any;
      error.code = "INVALID_OPERATION";
      throw error;
    }

    await this.walletService.transfer({
      fromUserId: userId,
      toUserId: toWallet.user.id,
      currency,
      amountMinor,
    });
  }

  // Get user's wallet by currency
  async getUserWalletByCurrency(userId: string, currency: string): Promise<Wallet | null> {
    return await this.walletService.findByUserAndCurrency(userId, currency);
  }

  // Get balance for user's wallet by currency
  async getUserWalletBalance(userId: string, currency: string): Promise<number> {
    return await this.walletService.getBalance(userId, currency);
  }
}