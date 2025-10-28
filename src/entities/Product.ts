import { Entity, Column, ManyToOne } from "typeorm";
import { BaseEntity } from "./BaseEntity";
import { Category } from "./Category";

@Entity({ name: "products" })
export class Product extends BaseEntity {
  @ManyToOne(() => Category, (category) => category.products)
  category!: Category;

  @Column()
  name!: string;

  @Column({ unique: true })
  slug!: string;

  @Column({ type: "bigint" })
  priceMinor!: number;

  @Column({ length: 3 })
  currency!: string;

  @Column({ type: "int", default: 0 })
  stockQty!: number;
}