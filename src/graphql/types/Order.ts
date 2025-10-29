// GraphQL type definitions for Order
export const orderTypeDefs = `
  type Order {
    id: ID!
    totalMinor: Int!
    currency: String!
    status: String!
    createdAt: String!
    updatedAt: String!
    user: User!
    items: [OrderItem!]!
  }

  type OrderItem {
    id: ID!
    qty: Int!
    unitPriceMinor: Int!
    currency: String!
    product: Product!
    order: Order!
  }

  input CreateOrderInput {
    userId: ID!
    totalMinor: Int!
    currency: String!
    status: String
    items: [CreateOrderItemInput!]!
  }

  input CreateOrderItemInput {
    productId: ID!
    qty: Int!
    unitPriceMinor: Int!
    currency: String!
  }

  input UpdateOrderInput {
    totalMinor: Int
    currency: String
    status: String
  }

  input UpdateOrderStatusInput {
    status: String!
  }

  type OrderConnection {
    orders: [Order!]!
    pagination: Pagination!
  }

  extend type Query {
    # Admin Order Queries
    adminOrders(
      page: Int = 1
      limit: Int = 10
      status: String
      userId: ID
    ): OrderConnection!
    
    adminOrder(id: ID!): Order!
    adminOrdersByStatus(status: String!): [Order!]!
    adminOrdersByUser(userId: ID!): [Order!]!
  }

  extend type Mutation {
    # Admin Order Mutations
    adminCreateOrder(input: CreateOrderInput!): Order!
    adminUpdateOrder(id: ID!, input: UpdateOrderInput!): Order!
    adminUpdateOrderStatus(id: ID!, input: UpdateOrderStatusInput!): Order!
    adminDeleteOrder(id: ID!): Boolean!
  }
`;