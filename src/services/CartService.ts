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
    try {
      let cart = await this.cartRepository.getCartByUser(userId);
      
      if (!cart) {
        cart = await this.cartRepository.createCart(userId);
      }
      
      return {
        success: true,
        message: "Cart retrieved successfully",
        cartItems: cart.items || []
      };
    } catch (error) {
      console.error("CartService getUserCart error:", error);
      return {
        success: false,
        message: "Failed to retrieve cart",
        cartItems: []
      };
    }
  }

  async addItemToCart(userId: string, productId: string, quantity: number) {
    try {
      let cart = await this.cartRepository.getCartByUser(userId);
      
      if (!cart) {
        cart = await this.cartRepository.createCart(userId);
      }

      await this.cartRepository.addItem(cart.id, productId, quantity);
      
      // Get updated cart and find the added item
      const updatedCart = await this.cartRepository.getCartByUser(userId);
      const addedItem = updatedCart?.items?.find(item => item.product.id === productId);
      
      return {
        success: true,
        message: "Item added to cart successfully",
        cartItem: addedItem
      };
    } catch (error) {
      console.error("CartService addItemToCart error:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "Failed to add item to cart",
        cartItem: null
      };
    }
  }

  async removeItemFromCart(userId: string, productId: string) {
    try {
      const cart = await this.cartRepository.getCartByUser(userId);
      
      if (!cart) {
        return {
          success: false,
          message: "Cart not found",
          cartItem: null
        };
      }

      // Find the item before removing it
      const removedItem = cart.items?.find(item => item.product.id === productId);

      if (!removedItem) {
        return {
          success: false,
          message: "Item not found in cart",
          cartItem: null
        };
      }

      await this.cartRepository.removeItem(cart.id, productId);
      
      return {
        success: true,
        message: "Item removed from cart successfully",
        cartItem: removedItem
      };
    } catch (error) {
      console.error("CartService removeItemFromCart error:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "Failed to remove item from cart",
        cartItem: null
      };
    }
  }

  async clearUserCart(userId: string, manager?: any) {
    try {
      if (manager) {
        // Use transaction manager for clearing cart by user ID directly
        await this.cartRepository.clearCartByUserId(userId, manager);
        return null; // In transaction context, we don't need to return the cart
      } else {
        const cart = await this.cartRepository.getCartByUser(userId);
        
        if (!cart) {
          return {
            success: false,
            message: "Cart not found"
          };
        }

        await this.cartRepository.clearCart(cart.id);
        
        return {
          success: true,
          message: "Cart cleared successfully"
        };
      }
    } catch (error) {
      console.error("CartService clearUserCart error:", error);
      if (manager) {
        throw error; // Re-throw in transaction context
      }
      return {
        success: false,
        message: error instanceof Error ? error.message : "Failed to clear cart"
      };
    }
  }

  async updateItemQuantity(userId: string, productId: string, quantity: number) {
    try {
      const cart = await this.cartRepository.getCartByUser(userId);
      
      if (!cart) {
        return {
          success: false,
          message: "Cart not found"
        };
      }

      // Check if item exists in cart
      const existingItem = cart.items?.find(item => item.product.id === productId);
      if (!existingItem) {
        return {
          success: false,
          message: "Item not found in cart"
        };
      }

      if (quantity <= 0) {
        // If quantity is 0 or negative, remove the item
        await this.cartRepository.removeItem(cart.id, productId);
      } else {
        // Update the quantity
        await this.cartRepository.updateItemQuantity(cart.id, productId, quantity);
      }
      
      return {
        success: true,
        message: "Item quantity updated successfully"
      };
    } catch (error) {
      console.error("CartService updateItemQuantity error:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "Failed to update item quantity"
      };
    }
  }

  async decreaseItemQuantity(userId: string, productId: string, decreaseBy: number = 1) {
    try {
      const cart = await this.cartRepository.getCartByUser(userId);
      
      if (!cart) {
        return {
          success: false,
          message: "Cart not found"
        };
      }

      // Find the current item
      const currentItem = cart.items?.find(item => item.product.id === productId);
      
      if (!currentItem) {
        return {
          success: false,
          message: "Item not found in cart"
        };
      }

      const newQuantity = currentItem.qty - decreaseBy;
      
      if (newQuantity <= 0) {
        // Remove the item if quantity becomes 0 or negative
        await this.cartRepository.removeItem(cart.id, productId);
      } else {
        // Update with new quantity
        await this.cartRepository.updateItemQuantity(cart.id, productId, newQuantity);
      }
      
      return {
        success: true,
        message: "Item quantity decreased successfully"
      };
    } catch (error) {
      console.error("CartService decreaseItemQuantity error:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "Failed to decrease item quantity"
      };
    }
  }
}
