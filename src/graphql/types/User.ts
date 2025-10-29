// GraphQL type definitions for User
export const userTypeDefs = `
  type User {
    id: ID!
    email: String!
    name: String
    createdAt: String!
    updatedAt: String!
    wallets: [Wallet!]
    orders: [Order!]
    carts: [Cart!]
  }

  type Wallet {
    id: ID!
    currency: String!
    balanceMinor: Int!
    createdAt: String!
    updatedAt: String!
  }

  type Order {
    id: ID!
    totalMinor: Int!
    currency: String!
    status: String!
    createdAt: String!
    updatedAt: String!
    items: [OrderItem!]
  }

  type OrderItem {
    id: ID!
    qty: Int!
    unitPriceMinor: Int!
    currency: String!
    product: Product!
  }

  type Cart {
    id: ID!
    createdAt: String!
    updatedAt: String!
    items: [CartItem!]
  }

  type CartItem {
    id: ID!
    qty: Int!
    product: Product!
  }

  type Product {
    id: ID!
    name: String!
    slug: String!
    priceMinor: Int!
    currency: String!
    stockQty: Int!
  }

  input CreateUserInput {
    email: String!
    name: String
  }

  input UpdateUserInput {
    email: String
    name: String
  }

  type UserConnection {
    users: [User!]!
    pagination: Pagination!
  }

  type Pagination {
    page: Int!
    limit: Int!
    total: Int!
    totalPages: Int!
  }

  extend type Query {
    adminUsers(page: Int = 1, limit: Int = 10, search: String): UserConnection!
    adminUser(id: ID!): User
    adminUserWithRelations(id: ID!, include: [String!]): User
  }

  extend type Mutation {
    adminCreateUser(input: CreateUserInput!): User!
    adminUpdateUser(id: ID!, input: UpdateUserInput!): User!
    adminDeleteUser(id: ID!): Boolean!
  }
`;