import { Entity, Column, ManyToOne } from "typeorm";
import { BaseEntity } from "./BaseEntity";
import { Order } from "./Order";
import { Product } from "./Product";

@Entity({ name: "order_items" })
export class OrderItem extends BaseEntity {
  @ManyToOne(() => Order, (order) => order.items)
  order!: Order;

  @ManyToOne(() => Product)
  product!: Product;

  @Column({ type: "int" })
  qty!: number;

  @Column({ type: "bigint" })
  unitPriceMinor!: number;

  @Column({ length: 3 })
  currency!: string;
}