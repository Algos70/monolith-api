import { CartRepository } from "../repositories/CartRepository";
import { UserRepository } from "../repositories/UserRepository";

export class CartService {
  private cartRepository: CartRepository;
  private userRepository: UserRepository;

  constructor() {
    this.cartRepository = new CartRepository();
    this.userRepository = new UserRepository();
  }

  async getCartsForAdmin(options: {
    page: number;
    limit: number;
    search?: string;
  }) {
    const { page, limit, search } = options;

    // For now, get all carts and implement pagination/search at service level
    // In a real scenario, you'd add these methods to CartRepository
    const allCarts = await this.cartRepository.findAll();

    let filteredCarts = allCarts;

    if (search) {
      filteredCarts = allCarts.filter(
        (cart) =>
          cart.user.email?.toLowerCase().includes(search.toLowerCase()) ||
          cart.user.name?.toLowerCase().includes(search.toLowerCase())
      );
    }

    const total = filteredCarts.length;
    const skip = (page - 1) * limit;
    const paginatedCarts = filteredCarts.slice(skip, skip + limit);

    return {
      data: paginatedCarts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getCartByIdForAdmin(id: string) {
    const cart = await this.cartRepository.findById(id);

    if (!cart) {
      throw new Error("Cart not found");
    }

    return cart;
  }

  async getCartWithRelationsForAdmin(id: string, _include?: string) {
    // CartRepository already includes relations, so we just get the cart
    const cart = await this.cartRepository.findById(id);

    if (!cart) {
      throw new Error("Cart not found");
    }

    return cart;
  }

  async deleteCartForAdmin(id: string) {
    const cart = await this.cartRepository.findById(id);

    if (!cart) {
      throw new Error("Cart not found");
    }

    await this.cartRepository.deleteCart(id);
    return { message: "Cart deleted successfully" };
  }

  async getCartsByUserIdForAdmin(userId: string) {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new Error("User not found");
    }

    const cart = await this.cartRepository.getCartByUser(userId);
    return cart ? [cart] : [];
  }

  async getCartStatsForAdmin() {
    const allCarts = await this.cartRepository.findAll();
    const totalCarts = allCarts.length;
    const activeCarts = allCarts.filter(
      (cart) => cart.items && cart.items.length > 0
    ).length;
    const emptyCarts = totalCarts - activeCarts;

    return {
      totalCarts,
      activeCarts,
      emptyCarts,
    };
  }

  // User-facing cart methods
  async getUserCart(userId: string) {
    let cart = await this.cartRepository.getCartByUser(userId);
    
    if (!cart) {
      cart = await this.cartRepository.createCart(userId);
    }
    
    return cart;
  }

  async addItemToCart(userId: string, productId: string, quantity: number) {
    let cart = await this.cartRepository.getCartByUser(userId);
    
    if (!cart) {
      cart = await this.cartRepository.createCart(userId);
    }

    await this.cartRepository.addItem(cart.id, productId, quantity);
    
    // Return updated cart
    return await this.cartRepository.getCartByUser(userId);
  }

  async removeItemFromCart(userId: string, productId: string) {
    const cart = await this.cartRepository.getCartByUser(userId);
    
    if (!cart) {
      throw new Error("Cart not found");
    }

    await this.cartRepository.removeItem(cart.id, productId);
    
    // Return updated cart
    return await this.cartRepository.getCartByUser(userId);
  }

  async clearUserCart(userId: string, manager?: any) {
    if (manager) {
      // Use transaction manager for clearing cart by user ID directly
      await this.cartRepository.clearCartByUserId(userId, manager);
      return null; // In transaction context, we don't need to return the cart
    } else {
      const cart = await this.cartRepository.getCartByUser(userId);
      
      if (!cart) {
        throw new Error("Cart not found");
      }

      await this.cartRepository.clearCart(cart.id);
      
      // Return updated cart
      return await this.cartRepository.getCartByUser(userId);
    }
  }

  async updateItemQuantity(userId: string, productId: string, quantity: number) {
    const cart = await this.cartRepository.getCartByUser(userId);
    
    if (!cart) {
      throw new Error("Cart not found");
    }

    if (quantity <= 0) {
      // If quantity is 0 or negative, remove the item
      await this.cartRepository.removeItem(cart.id, productId);
    } else {
      // Update the quantity
      await this.cartRepository.updateItemQuantity(cart.id, productId, quantity);
    }
    
    // Return updated cart
    return await this.cartRepository.getCartByUser(userId);
  }

  async decreaseItemQuantity(userId: string, productId: string, decreaseBy: number = 1) {
    const cart = await this.cartRepository.getCartByUser(userId);
    
    if (!cart) {
      throw new Error("Cart not found");
    }

    // Find the current item
    const currentItem = cart.items?.find(item => item.product.id === productId);
    
    if (!currentItem) {
      throw new Error("Item not found in cart");
    }

    const newQuantity = currentItem.qty - decreaseBy;
    
    if (newQuantity <= 0) {
      // Remove the item if quantity becomes 0 or negative
      await this.cartRepository.removeItem(cart.id, productId);
    } else {
      // Update with new quantity
      await this.cartRepository.updateItemQuantity(cart.id, productId, newQuantity);
    }
    
    // Return updated cart
    return await this.cartRepository.getCartByUser(userId);
  }
}
