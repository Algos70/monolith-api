import { Order } from "../entities/Order";
import { OrderRepository } from "../repositories/OrderRepository";
import { CartService } from "./CartService";
import { WalletService } from "./WalletService";
import { ProductService } from "./ProductService";
import { AppDataSource } from "../data-source";

export interface CreateOrderData {
  userId: string;
  totalMinor: number;
  currency: string;
  status?: string;
  items: Array<{
    productId: string;
    qty: number;
    unitPriceMinor: number;
    currency: string;
  }>;
}

export interface OrderListOptions {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  userId?: string;
}

export interface OrderListResult {
  orders: Order[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CreateOrderFromCartData {
  userId: string;
  walletId: string;
}

export class OrderService {
  private orderRepository: OrderRepository;
  private cartService: CartService;
  private walletService: WalletService;
  private productService: ProductService;

  constructor() {
    this.orderRepository = new OrderRepository();
    this.cartService = new CartService();
    this.walletService = new WalletService();
    this.productService = new ProductService();
  }

  // ID ile sipariş bul
  async findById(id: string): Promise<Order | null> {
    return await this.orderRepository.findById(id);
  }

  // Kullanıcı siparişlerini getir
  async findByUser(userId: string): Promise<Order[]> {
    return await this.orderRepository.findByUser(userId);
  }

  // Status'e göre siparişleri getir
  async findByStatus(status: string): Promise<Order[]> {
    return await this.orderRepository.findByStatus(status);
  }

  // Yeni sipariş oluştur
  async createOrder(orderData: CreateOrderData): Promise<Order> {
    const { userId, items, ...orderInfo } = orderData;

    if (!items || items.length === 0) {
      throw new Error("Order must have at least one item");
    }

    return await this.orderRepository.createOrder(userId, orderInfo, items);
  }

  // Sipariş durumunu güncelle
  async updateStatus(orderId: string, status: string): Promise<Order | null> {
    const validStatuses = [
      "PENDING",
      "CONFIRMED",
      "PROCESSING",
      "SHIPPED",
      "DELIVERED",
      "CANCELLED",
    ];

    if (!validStatuses.includes(status)) {
      throw new Error(
        `Invalid status. Valid statuses: ${validStatuses.join(", ")}`
      );
    }

    await this.orderRepository.updateStatus(orderId, status);
    return await this.findById(orderId);
  }

  // Sipariş güncelle
  async updateOrder(
    id: string,
    updateData: Partial<Order>
  ): Promise<Order | null> {
    const order = await this.findById(id);
    if (!order) {
      throw new Error("Order not found");
    }

    return await this.orderRepository.updateOrder(id, updateData);
  }

  // Sipariş sil
  async deleteOrder(id: string): Promise<void> {
    const order = await this.findById(id);
    if (!order) {
      throw new Error("Order not found");
    }

    await this.orderRepository.deleteOrder(id);
  }

  // Admin için siparişleri listele (pagination ile)
  async getOrdersForAdmin(options: OrderListOptions): Promise<OrderListResult> {
    const { page = 1, limit = 10, status, userId } = options;

    let orders: Order[];

    if (status) {
      orders = await this.orderRepository.findByStatus(status);
    } else if (userId) {
      orders = await this.orderRepository.findByUser(userId);
    } else {
      orders = await this.orderRepository.findAll();
    }

    // Manual pagination since we're filtering
    const total = orders.length;
    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedOrders = orders.slice(startIndex, endIndex);

    return {
      orders: paginatedOrders,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }

  // Admin için sipariş detayı
  async getOrderForAdmin(id: string): Promise<Order> {
    const order = await this.findById(id);
    if (!order) {
      throw new Error("Order not found");
    }
    return order;
  }

  // Create order from user's cart with transaction
  async createOrderFromCart(data: CreateOrderFromCartData): Promise<Order> {
    const { userId, walletId } = data;

    return await AppDataSource.transaction(async (manager) => {
      // Get user's cart (read-only operation, no transaction needed)
      const cart = await this.cartService.getUserCart(userId);

      if (!cart || !cart.items || cart.items.length === 0) {
        throw new Error("Cart is empty");
      }

      // Get wallet and verify it belongs to the user (read-only operation)
      const wallet = await this.walletService.findById(walletId);

      if (!wallet) {
        throw new Error("Wallet not found");
      }

      if (wallet.user.id !== userId) {
        throw new Error("Wallet does not belong to user");
      }

      // Calculate total and verify currency consistency
      let totalMinor = 0;
      const orderItems = [];

      for (const cartItem of cart.items) {
        const product = cartItem.product;

        // Check if product currency matches wallet currency
        if (product.currency !== wallet.currency) {
          throw new Error(
            `Product ${product.name} currency (${product.currency}) does not match wallet currency (${wallet.currency})`
          );
        }

        // Check inventory (read-only operation)
        const isInStock = await this.productService.isInStock(
          product.id,
          cartItem.qty
        );
        if (!isInStock) {
          throw new Error(
            `Insufficient stock for product ${product.name}. Required: ${cartItem.qty}, Available: ${product.stockQty}`
          );
        }

        const itemTotal = product.priceMinor * cartItem.qty;
        totalMinor += itemTotal;

        orderItems.push({
          productId: product.id,
          qty: cartItem.qty,
          unitPriceMinor: product.priceMinor,
          currency: product.currency,
        });
      }

      // Check wallet balance
      if (wallet.balanceMinor < totalMinor) {
        throw new Error(
          `Insufficient wallet balance. Required: ${totalMinor}, Available: ${wallet.balanceMinor}`
        );
      }

      // Now perform all database modifications within the transaction using repositories

      // 1. Decrease product stock for each item
      for (const cartItem of cart.items) {
        await this.productService.decreaseStock(
          cartItem.product.id,
          cartItem.qty,
          manager
        );
      }

      // 2. Decrease wallet balance
      await this.walletService.decreaseBalance(
        {
          userId,
          currency: wallet.currency,
          amountMinor: totalMinor,
        },
        manager
      );

      // 3. Create the order with items
      const order = await this.orderRepository.createOrder(
        userId,
        {
          totalMinor,
          currency: wallet.currency,
          status: "CONFIRMED",
        },
        orderItems,
        manager
      );

      // 4. Clear the user's cart
      await this.cartService.clearUserCart(userId, manager);

      return order;
    });
  }
}
