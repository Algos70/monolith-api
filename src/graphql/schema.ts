import { userTypeDefs } from './types/User';

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
  userTypeDefs
];