import { OrderItem } from "../entities/OrderItem";
import { OrderRepository } from "../repositories/OrderRepository";
import { ProductRepository } from "../repositories/ProductRepository";

export interface CreateOrderItemData {
  orderId: string;
  productId: string;
  qty: number;
  unitPriceMinor: number;
  currency: string;
}

export interface OrderItemListOptions {
  page?: number;
  limit?: number;
  orderId?: string;
  productId?: string;
}

export interface OrderItemListResult {
  orderItems: OrderItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export class OrderItemService {
  private orderRepository: OrderRepository;
  private productRepository: ProductRepository;

  constructor() {
    this.orderRepository = new OrderRepository();
    this.productRepository = new ProductRepository();
  }

  // ID ile order item bul
  async findById(id: string): Promise<OrderItem | null> {
    return await this.orderRepository.findOrderItemById(id);
  }

  // Sipariş ID'sine göre order item'ları getir
  async findByOrderId(orderId: string): Promise<OrderItem[]> {
    return await this.orderRepository.findOrderItemsByOrderId(orderId);
  }

  // Ürün ID'sine göre order item'ları getir
  async findByProductId(productId: string): Promise<OrderItem[]> {
    return await this.orderRepository.findOrderItemsByProductId(productId);
  }

  // Tüm order item'ları getir
  async findAll(): Promise<OrderItem[]> {
    return await this.orderRepository.findAllOrderItems();
  }

  // Yeni order item oluştur
  async createOrderItem(orderItemData: CreateOrderItemData): Promise<OrderItem> {
    // Validate order exists
    const order = await this.orderRepository.findById(orderItemData.orderId);
    if (!order) {
      throw new Error("Order not found");
    }

    // Validate product exists
    const product = await this.productRepository.findById(orderItemData.productId);
    if (!product) {
      throw new Error("Product not found");
    }

    await this.orderRepository.addOrderItem(
      orderItemData.orderId,
      orderItemData.productId,
      orderItemData.qty,
      orderItemData.unitPriceMinor,
      orderItemData.currency
    );

    // Return the created order item by finding it
    const orderItems = await this.orderRepository.findOrderItemsByOrderId(orderItemData.orderId);
    const createdItem = orderItems.find(item => 
      item.product.id === orderItemData.productId && 
      item.qty === orderItemData.qty &&
      item.unitPriceMinor === orderItemData.unitPriceMinor
    );

    if (!createdItem) {
      throw new Error("Failed to create order item");
    }

    return createdItem;
  }

  // Order item güncelle
  async updateOrderItem(
    id: string,
    updateData: Partial<OrderItem>
  ): Promise<OrderItem | null> {
    const orderItem = await this.orderRepository.findOrderItemById(id);
    if (!orderItem) {
      throw new Error("Order item not found");
    }

    await this.orderRepository.updateOrderItem(id, updateData);
    return await this.orderRepository.findOrderItemById(id);
  }

  // Order item sil
  async deleteOrderItem(id: string): Promise<void> {
    const orderItem = await this.orderRepository.findOrderItemById(id);
    if (!orderItem) {
      throw new Error("Order item not found");
    }

    await this.orderRepository.deleteOrderItem(id);
  }

  // Admin için order item'ları listele (pagination ile)
  async getOrderItemsForAdmin(
    options: OrderItemListOptions
  ): Promise<OrderItemListResult> {
    const { page = 1, limit = 10, orderId, productId } = options;

    const result = await this.orderRepository.findOrderItemsWithPagination({
      page,
      limit,
      orderId,
      productId,
    });

    const totalPages = Math.ceil(result.total / limit);

    return {
      orderItems: result.orderItems,
      pagination: {
        page,
        limit,
        total: result.total,
        totalPages,
      },
    };
  }

  // Admin için order item detayı
  async getOrderItemForAdmin(id: string): Promise<OrderItem> {
    const orderItem = await this.orderRepository.findOrderItemById(id);
    if (!orderItem) {
      throw new Error("Order item not found");
    }
    return orderItem;
  }
}