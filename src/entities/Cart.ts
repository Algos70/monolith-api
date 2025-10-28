import { Entity, OneToMany, ManyToOne } from "typeorm";
import { BaseEntity } from "./BaseEntity";
import { User } from "./User";
import { CartItem } from "./CartItem";

@Entity({ name: "carts" })
export class Cart extends BaseEntity {
  @ManyToOne(() => User, (user) => user.carts)
  user!: User;

  @OneToMany(() => CartItem, (item) => item.cart, { cascade: true })
  items!: CartItem[];
}
