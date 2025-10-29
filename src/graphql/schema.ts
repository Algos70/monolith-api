import { userTypeDefs } from "./types/User";
import { categoryTypeDefs } from "./types/Category";
import { productTypeDefs } from "./types/Product";

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
  categoryTypeDefs,
  productTypeDefs,
  userTypeDefs,
];
