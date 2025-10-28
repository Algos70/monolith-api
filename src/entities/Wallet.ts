import { Entity, Column, ManyToOne } from "typeorm";
import { BaseEntity } from "./BaseEntity";
import { User } from "./User";

@Entity({ name: "wallets" })
export class Wallet extends BaseEntity {
  @ManyToOne(() => User, (user) => user.wallets)
  user!: User;

  @Column({ length: 3 })
  currency!: string; // ISO 4217

  @Column({ type: "bigint", default: 0 })
  balanceMinor!: number; // store as minor units (cents)
}