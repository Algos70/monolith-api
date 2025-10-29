import { Repository } from "typeorm";
import { AppDataSource } from "../data-source";
import { Cart } from "../entities/Cart";
import { CartItem } from "../entities/CartItem";

export class CartRepository {
  private cartRepository: Repository<Cart>;
  private cartItemRepository: Repository<CartItem>;

  constructor() {
    this.cartRepository = AppDataSource.getRepository(Cart);
    this.cartItemRepository = AppDataSource.getRepository(CartItem);
  }

  // Cart aggregate root methods
  async getCartByUser(userId: string): Promise<Cart | null> {
    return await this.cartRepository.findOne({
      where: { user: { id: userId } },
      relations: ["items", "items.product"]
    });
  }

  async findById(id: string): Promise<Cart | null> {
    return await this.cartRepository.findOne({
      where: { id },
      relations: ["user", "items", "items.product"]
    });
  }

  async createCart(userId: string): Promise<Cart> {
    const cart = this.cartRepository.create({
      user: { id: userId }
    });
    return await this.cartRepository.save(cart);
  }

  // CartItem management within Cart aggregate
  async addItem(cartId: string, productId: string, qty: number): Promise<void> {
    const existingItem = await this.cartItemRepository.findOne({
      where: { 
        cart: { id: cartId },
        product: { id: productId }
      }
    });

    if (existingItem) {
      existingItem.qty += qty;
      await this.cartItemRepository.save(existingItem);
    } else {
      const newItem = this.cartItemRepository.create({
        cart: { id: cartId },
        product: { id: productId },
        qty
      });
      await this.cartItemRepository.save(newItem);
    }
  }

  async updateItemQuantity(cartId: string, productId: string, qty: number): Promise<void> {
    await this.cartItemRepository.update(
      { 
        cart: { id: cartId },
        product: { id: productId }
      },
      { qty }
    );
  }

  async removeItem(cartId: string, productId: string): Promise<void> {
    await this.cartItemRepository.delete({
      cart: { id: cartId },
      product: { id: productId }
    });
  }

  async clearCart(cartId: string): Promise<void> {
    await this.cartItemRepository.delete({
      cart: { id: cartId }
    });
  }

  async deleteCart(id: string): Promise<void> {
    // First delete all cart items (cascade should handle this, but being explicit)
    await this.cartItemRepository.delete({ cart: { id } });
    await this.cartRepository.delete(id);
  }

  async findAll(): Promise<Cart[]> {
    return await this.cartRepository.find({
      relations: ["user", "items", "items.product"]
    });
  }
}