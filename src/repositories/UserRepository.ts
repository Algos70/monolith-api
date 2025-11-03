import { Repository } from "typeorm";
import { AppDataSource } from "./data-source";
import { User } from "../entities/User";

export class UserRepository {
  private repository: Repository<User>;

  constructor() {
    this.repository = AppDataSource.getRepository(User);
  }

  // Core user methods
  async findByEmail(email: string): Promise<User | null> {
    return await this.repository.findOne({
      where: { email }
    });
  }

  async findById(id: string): Promise<User | null> {
    return await this.repository.findOne({
      where: { id }
    });
  }

  // User with related data (for profile views)
  async findWithWallets(id: string): Promise<User | null> {
    return await this.repository.findOne({
      where: { id },
      relations: ["wallets"]
    });
  }

  async findWithOrders(id: string): Promise<User | null> {
    return await this.repository.findOne({
      where: { id },
      relations: ["orders", "orders.items", "orders.items.product"]
    });
  }

  async findWithCarts(id: string): Promise<User | null> {
    return await this.repository.findOne({
      where: { id },
      relations: ["carts", "carts.items", "carts.items.product"]
    });
  }

  // User management
  async create(userData: Partial<User>): Promise<User> {
    const user = this.repository.create(userData);
    return await this.repository.save(user);
  }

  async updateProfile(id: string, userData: Partial<User>): Promise<User | null> {
    await this.repository.update(id, userData);
    return await this.findById(id);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  async findAll(): Promise<User[]> {
    return await this.repository.find();
  }

  // User existence checks
  async existsByEmail(email: string): Promise<boolean> {
    const count = await this.repository.count({
      where: { email }
    });
    return count > 0;
  }

  async existsById(id: string): Promise<boolean> {
    const count = await this.repository.count({
      where: { id }
    });
    return count > 0;
  }
}