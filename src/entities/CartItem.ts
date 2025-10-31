import { Entity, Column, ManyToOne } from "typeorm";
import { BaseEntity } from "./BaseEntity";
import { Cart } from "./Cart";
import { Product } from "./Product";

@Entity({ name: "cart_items" })
export class CartItem extends BaseEntity {
  @ManyToOne(() => Cart, (cart) => cart.items)
  cart!: Cart;

  @ManyToOne(() => Product)
  product!: Product;

  @Column({ type: "int" })
  qty!: number;
}