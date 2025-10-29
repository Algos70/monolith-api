import { Repository } from "typeorm";
import { AppDataSource } from "../data-source";
import { Order } from "../entities/Order";
import { OrderItem } from "../entities/OrderItem";

export class OrderRepository {
  private orderRepository: Repository<Order>;
  private orderItemRepository: Repository<OrderItem>;

  constructor() {
    this.orderRepository = AppDataSource.getRepository(Order);
    this.orderItemRepository = AppDataSource.getRepository(OrderItem);
  }

  // Order aggregate root methods
  async findById(id: string): Promise<Order | null> {
    return await this.orderRepository.findOne({
      where: { id },
      relations: ["user", "items", "items.product"]
    });
  }

  async findByUser(userId: string): Promise<Order[]> {
    return await this.orderRepository.find({
      where: { user: { id: userId } },
      relations: ["items", "items.product"],
      order: { createdAt: "DESC" }
    });
  }

  async findByStatus(status: string): Promise<Order[]> {
    return await this.orderRepository.find({
      where: { status },
      relations: ["user", "items", "items.product"]
    });
  }

  // Transactional order creation with items
  async createOrder(
    userId: string, 
    orderData: { totalMinor: number; currency: string; status?: string },
    items: Array<{ productId: string; qty: number; unitPriceMinor: number; currency: string }>
  ): Promise<Order> {
    return await AppDataSource.transaction(async manager => {
      // Create order
      const order = manager.create(Order, {
        user: { id: userId },
        ...orderData
      });
      const savedOrder = await manager.save(order);

      // Create order items
      const orderItems = items.map(item => 
        manager.create(OrderItem, {
          order: { id: savedOrder.id },
          product: { id: item.productId },
          qty: item.qty,
          unitPriceMinor: item.unitPriceMinor,
          currency: item.currency
        })
      );
      
      await manager.save(orderItems);

      // Return order with items
      return await manager.findOne(Order, {
        where: { id: savedOrder.id },
        relations: ["user", "items", "items.product"]
      }) as Order;
    });
  }

  async updateStatus(orderId: string, status: string): Promise<void> {
    await this.orderRepository.update(orderId, { status });
  }

  async updateOrder(id: string, orderData: Partial<Order>): Promise<Order | null> {
    await this.orderRepository.update(id, orderData);
    return await this.findById(id);
  }

  // OrderItem management within Order aggregate
  async addOrderItem(
    orderId: string, 
    productId: string, 
    qty: number, 
    unitPriceMinor: number, 
    currency: string
  ): Promise<void> {
    const orderItem = this.orderItemRepository.create({
      order: { id: orderId },
      product: { id: productId },
      qty,
      unitPriceMinor,
      currency
    });
    await this.orderItemRepository.save(orderItem);
  }

  async removeOrderItem(orderId: string, productId: string): Promise<void> {
    await this.orderItemRepository.delete({
      order: { id: orderId },
      product: { id: productId }
    });
  }

  async deleteOrder(id: string): Promise<void> {
    // First delete all order items (cascade should handle this, but being explicit)
    await this.orderItemRepository.delete({ order: { id } });
    await this.orderRepository.delete(id);
  }

  async findAll(): Promise<Order[]> {
    return await this.orderRepository.find({
      relations: ["user", "items", "items.product"],
      order: { createdAt: "DESC" }
    });
  }

  // OrderItem specific methods for admin/service layer
  async findOrderItemById(id: string): Promise<OrderItem | null> {
    return await this.orderItemRepository.findOne({
      where: { id },
      relations: ["order", "product"]
    });
  }

  async findOrderItemsByOrderId(orderId: string): Promise<OrderItem[]> {
    return await this.orderItemRepository.find({
      where: { order: { id: orderId } },
      relations: ["order", "product"]
    });
  }

  async findOrderItemsByProductId(productId: string): Promise<OrderItem[]> {
    return await this.orderItemRepository.find({
      where: { product: { id: productId } },
      relations: ["order", "product"]
    });
  }

  async findAllOrderItems(): Promise<OrderItem[]> {
    return await this.orderItemRepository.find({
      relations: ["order", "product"]
    });
  }

  async updateOrderItem(id: string, updateData: Partial<OrderItem>): Promise<void> {
    await this.orderItemRepository.update(id, updateData);
  }

  async deleteOrderItem(id: string): Promise<void> {
    await this.orderItemRepository.delete(id);
  }

  async findOrderItemsWithPagination(options: {
    page: number;
    limit: number;
    orderId?: string;
    productId?: string;
  }) {
    const { page, limit, orderId, productId } = options;

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
    const offset = (page - 1) * limit;

    const orderItems = await queryBuilder
      .skip(offset)
      .take(limit)
      .getMany();

    return {
      orderItems,
      total,
    };
  }
}