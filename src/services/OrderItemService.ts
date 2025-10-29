import { OrderItem } from "../entities/OrderItem";
import { AppDataSource } from "../data-source";
import { Repository } from "typeorm";

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
  private orderItemRepository: Repository<OrderItem>;

  constructor() {
    this.orderItemRepository = AppDataSource.getRepository(OrderItem);
  }

  // ID ile order item bul
  async findById(id: string): Promise<OrderItem | null> {
    return await this.orderItemRepository.findOne({
      where: { id },
      relations: ["order", "product"],
    });
  }

  // Sipariş ID'sine göre order item'ları getir
  async findByOrderId(orderId: string): Promise<OrderItem[]> {
    return await this.orderItemRepository.find({
      where: { order: { id: orderId } },
      relations: ["order", "product"],
    });
  }

  // Ürün ID'sine göre order item'ları getir
  async findByProductId(productId: string): Promise<OrderItem[]> {
    return await this.orderItemRepository.find({
      where: { product: { id: productId } },
      relations: ["order", "product"],
    });
  }

  // Tüm order item'ları getir
  async findAll(): Promise<OrderItem[]> {
    return await this.orderItemRepository.find({
      relations: ["order", "product"],
    });
  }

  // Yeni order item oluştur
  async createOrderItem(orderItemData: CreateOrderItemData): Promise<OrderItem> {
    const { orderId, productId, ...itemData } = orderItemData;

    const orderItem = this.orderItemRepository.create({
      ...itemData,
      order: { id: orderId },
      product: { id: productId },
    });

    return await this.orderItemRepository.save(orderItem);
  }

  // Order item güncelle
  async updateOrderItem(
    id: string,
    updateData: Partial<OrderItem>
  ): Promise<OrderItem | null> {
    const orderItem = await this.findById(id);
    if (!orderItem) {
      throw new Error("Order item not found");
    }

    await this.orderItemRepository.update(id, updateData);
    return await this.findById(id);
  }

  // Order item sil
  async deleteOrderItem(id: string): Promise<void> {
    const orderItem = await this.findById(id);
    if (!orderItem) {
      throw new Error("Order item not found");
    }

    await this.orderItemRepository.delete(id);
  }

  // Admin için order item'ları listele (pagination ile)
  async getOrderItemsForAdmin(options: OrderItemListOptions): Promise<OrderItemListResult> {
    const { page = 1, limit = 10, orderId, productId } = options;

    const queryBuilder = this.orderItemRepository
      .createQueryBuilder("orderItem")
      .leftJoinAndSelect("orderItem.order", "order")
      .leftJoinAndSelect("orderItem.product", "product");

    if (orderId) {
      queryBuilder.where("order.id = :orderId", { orderId });
    }

    if (productId) {
      queryBuilder.andWhere("product.id = :productId", { productId });
    }

    const total = await queryBuilder.getCount();
    const totalPages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;

    const orderItems = await queryBuilder
      .skip(offset)
      .take(limit)
      .getMany();

    return {
      orderItems,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }

  // Admin için order item detayı
  async getOrderItemForAdmin(id: string): Promise<OrderItem> {
    const orderItem = await this.findById(id);
    if (!orderItem) {
      throw new Error("Order item not found");
    }
    return orderItem;
  }
}