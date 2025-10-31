import { authTypeDefs } from "./types/Auth";
import { userTypeDefs } from "./types/User";
import { categoryTypeDefs } from "./types/Category";
import { productTypeDefs } from "./types/Product";
import { walletTypeDefs } from "./types/Wallet";
import { orderTypeDefs } from "./types/Order";
import { orderItemTypeDefs } from "./types/OrderItem";
import { cartTypeDefs } from "./types/Cart";

// Base schema with Query and Mutation types
const baseTypeDefs = `
  type Query {
    _empty: String
  }

  type Mutation {
    _empty: String
  }
`;

export const typeDefs = [
  baseTypeDefs,
  authTypeDefs,
  categoryTypeDefs,
  productTypeDefs,
  userTypeDefs,
  walletTypeDefs,
  orderTypeDefs,
  orderItemTypeDefs,
  cartTypeDefs,
];
