import { Order } from "../entities/Order";
import { OrderRepository } from "../repositories/OrderRepository";

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

export class OrderService {
  private orderRepository: OrderRepository;

  constructor() {
    this.orderRepository = new OrderRepository();
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
}
