// GraphQL type definitions for Order
export const orderTypeDefs = `
  type Order {
    id: ID!
    totalMinor: String!
    currency: String!
    status: String!
    createdAt: String!
    updatedAt: String!
    user: User!
    items: [OrderItem!]!
  }



  input CreateOrderItemForOrderInput {
    productId: ID!
    qty: Int!
    unitPriceMinor: String!
    currency: String!
  }

  input CreateOrderInput {
    userId: ID!
    totalMinor: Int!
    currency: String!
    status: String
    items: [CreateOrderItemForOrderInput!]!
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

  type UserOrdersResponse {
    success: Boolean!
    message: String!
    orders: [Order!]!
  }

  type CreateOrderFromCartResponse {
    success: Boolean!
    message: String!
    order: Order
  }

  input CreateOrderFromCartInput {
    walletId: ID!
  }

  extend type Query {
    # User Order Queries
    userOrders: UserOrdersResponse!
    
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
    # User Order Mutations
    createOrderFromCart(input: CreateOrderFromCartInput!): CreateOrderFromCartResponse!
    
    # Admin Order Mutations
    adminCreateOrder(input: CreateOrderInput!): Order!
    adminUpdateOrder(id: ID!, input: UpdateOrderInput!): Order!
    adminUpdateOrderStatus(id: ID!, input: UpdateOrderStatusInput!): Order!
    adminDeleteOrder(id: ID!): Boolean!
  }
`;
