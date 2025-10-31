import { Repository } from "typeorm";
import { AppDataSource } from "../data-source";
import { Cart } from "../entities/Cart";
import { CartItem } from "../entities/CartItem";
import { Product } from "../entities/Product";

export class CartRepository {
  private cartRepository: Repository<Cart>;
  private cartItemRepository: Repository<CartItem>;
  private productRepository: Repository<Product>;

  constructor() {
    this.cartRepository = AppDataSource.getRepository(Cart);
    this.cartItemRepository = AppDataSource.getRepository(CartItem);
    this.productRepository = AppDataSource.getRepository(Product);
  }

  // Cart aggregate root methods
  async getCartByUser(userId: string): Promise<Cart | null> {
    return await this.cartRepository.findOne({
      where: { user: { id: userId } },
      relations: ["items", "items.product"],
    });
  }

  async findById(id: string): Promise<Cart | null> {
    return await this.cartRepository.findOne({
      where: { id },
      relations: ["user", "items", "items.product"],
    });
  }

  async createCart(userId: string): Promise<Cart> {
    const cart = this.cartRepository.create({
      user: { id: userId },
    });
    return await this.cartRepository.save(cart);
  }

  // CartItem management within Cart aggregate
  async addItem(cartId: string, productId: string, qty: number): Promise<void> {
    // Get the product to check its currency
    const product = await this.productRepository.findOne({
      where: { id: productId },
    });

    if (!product) {
      throw new Error("Product not found");
    }

    // Check if cart has existing items with different currency
    const cart = await this.cartRepository.findOne({
      where: { id: cartId },
      relations: ["items", "items.product"],
    });

    if (cart && cart.items && cart.items.length > 0) {
      const existingCurrency = cart.items[0].product.currency;
      if (product.currency !== existingCurrency) {
        throw new Error(
          `Cannot add item with currency ${product.currency} to cart containing items with currency ${existingCurrency}`
        );
      }
    }

    const existingItem = await this.cartItemRepository.findOne({
      where: {
        cart: { id: cartId },
        product: { id: productId },
      },
    });

    if (existingItem) {
      existingItem.qty += qty;
      await this.cartItemRepository.save(existingItem);
    } else {
      const newItem = this.cartItemRepository.create({
        cart: { id: cartId },
        product: { id: productId },
        qty,
      });
      await this.cartItemRepository.save(newItem);
    }
  }

  async updateItemQuantity(
    cartId: string,
    productId: string,
    qty: number
  ): Promise<void> {
    await this.cartItemRepository.update(
      {
        cart: { id: cartId },
        product: { id: productId },
      },
      { qty }
    );
  }

  async removeItem(cartId: string, productId: string): Promise<void> {
    await this.cartItemRepository.delete({
      cart: { id: cartId },
      product: { id: productId },
    });
  }

  async clearCart(cartId: string, manager?: any): Promise<void> {
    if (manager) {
      await manager.delete(CartItem, {
        cart: { id: cartId },
      });
    } else {
      await this.cartItemRepository.delete({
        cart: { id: cartId },
      });
    }
  }

  async clearCartByUserId(userId: string, manager?: any): Promise<void> {
    const executeOperation = async (entityManager: any) => {
      // First find the cart
      const cart = await entityManager.findOne(Cart, {
        where: { user: { id: userId } }
      });
      
      if (cart) {
        await entityManager.delete(CartItem, {
          cart: { id: cart.id },
        });
      }
    };

    if (manager) {
      await executeOperation(manager);
    } else {
      await AppDataSource.transaction(executeOperation);
    }
  }

  async deleteCart(id: string): Promise<void> {
    // First delete all cart items (cascade should handle this, but being explicit)
    await this.cartItemRepository.delete({ cart: { id } });
    await this.cartRepository.delete(id);
  }

  async findAll(): Promise<Cart[]> {
    return await this.cartRepository.find({
      relations: ["user", "items", "items.product"],
    });
  }
}
