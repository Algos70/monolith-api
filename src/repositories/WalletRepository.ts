import { Repository } from "typeorm";
import { AppDataSource } from "../data-source";
import { Wallet } from "../entities/Wallet";

export class WalletRepository {
  private repository: Repository<Wallet>;

  constructor() {
    this.repository = AppDataSource.getRepository(Wallet);
  }

  // Core wallet methods
  async findById(id: string): Promise<Wallet | null> {
    return await this.repository.findOne({
      where: { id },
      relations: ["user"]
    });
  }

  async findByUserAndCurrency(userId: string, currency: string): Promise<Wallet | null> {
    return await this.repository.findOne({
      where: { 
        user: { id: userId },
        currency 
      },
      relations: ["user"]
    });
  }

  async findByUserId(userId: string): Promise<Wallet[]> {
    return await this.repository.find({
      where: { user: { id: userId } },
      relations: ["user"]
    });
  }

  // Wallet creation and management
  async createWallet(userId: string, currency: string, initialBalance: number = 0): Promise<Wallet> {
    const wallet = this.repository.create({
      user: { id: userId },
      currency,
      balanceMinor: initialBalance
    });
    const savedWallet = await this.repository.save(wallet);
    
    // Return the wallet with full user relation loaded
    return await this.findById(savedWallet.id) as Wallet;
  }

  // Balance operations (domain-specific methods)
  async increaseBalance(userId: string, currency: string, amountMinor: number): Promise<Wallet | null> {
    return await AppDataSource.transaction(async manager => {
      const wallet = await manager.findOne(Wallet, {
        where: { user: { id: userId }, currency },
        relations: ["user"]
      });

      if (!wallet) {
        throw new Error(`Wallet not found for user ${userId} and currency ${currency}`);
      }

      wallet.balanceMinor += amountMinor;
      return await manager.save(wallet);
    });
  }

  async decreaseBalance(userId: string, currency: string, amountMinor: number, manager?: any): Promise<Wallet | null> {
    const executeOperation = async (entityManager: any) => {
      const wallet = await entityManager.findOne(Wallet, {
        where: { user: { id: userId }, currency },
        relations: ["user"]
      });

      if (!wallet) {
        throw new Error(`Wallet not found for user ${userId} and currency ${currency}`);
      }

      if (wallet.balanceMinor < amountMinor) {
        throw new Error(`Insufficient balance. Available: ${wallet.balanceMinor}, Required: ${amountMinor}`);
      }

      wallet.balanceMinor -= amountMinor;
      return await entityManager.save(wallet);
    };

    if (manager) {
      return await executeOperation(manager);
    } else {
      return await AppDataSource.transaction(executeOperation);
    }
  }

  async transfer(fromUserId: string, toUserId: string, currency: string, amountMinor: number): Promise<void> {
    await AppDataSource.transaction(async manager => {
      // Get both wallets
      const fromWallet = await manager.findOne(Wallet, {
        where: { user: { id: fromUserId }, currency }
      });
      const toWallet = await manager.findOne(Wallet, {
        where: { user: { id: toUserId }, currency }
      });

      if (!fromWallet || !toWallet) {
        throw new Error(`One or both wallets not found for currency ${currency}`);
      }

      if (fromWallet.balanceMinor < amountMinor) {
        throw new Error(`Insufficient balance for transfer`);
      }

      // Perform transfer
      fromWallet.balanceMinor -= amountMinor;
      toWallet.balanceMinor += amountMinor;

      await manager.save([fromWallet, toWallet]);
    });
  }

  // Query methods
  async getBalance(userId: string, currency: string): Promise<number> {
    const wallet = await this.findByUserAndCurrency(userId, currency);
    return wallet?.balanceMinor || 0;
  }

  async findByCurrency(currency: string): Promise<Wallet[]> {
    return await this.repository.find({
      where: { currency },
      relations: ["user"]
    });
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  async findAll(): Promise<Wallet[]> {
    return await this.repository.find({
      relations: ["user"]
    });
  }
}