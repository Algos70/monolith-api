import { Entity, Column, ManyToOne, OneToMany } from "typeorm";
import { BaseEntity } from "./BaseEntity";
import { User } from "./User";
import { OrderItem } from "./OrderItem";

@Entity({ name: "orders" })
export class Order extends BaseEntity {
  @ManyToOne(() => User, (user) => user.orders)
  user!: User;

  @Column({ type: "bigint" })
  totalMinor!: number;

  @Column({ length: 3 })
  currency!: string;

  @Column({ default: "PENDING" })
  status!: string;

  @OneToMany(() => OrderItem, (item) => item.order)
  items!: OrderItem[];
}