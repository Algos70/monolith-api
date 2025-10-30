// GraphQL type definitions for OrderItem
export const orderItemTypeDefs = `
  type OrderItem {
    id: ID!
    qty: Int!
    unitPriceMinor: String!
    currency: String!
    createdAt: String!
    updatedAt: String!
    product: Product!
    order: Order!
  }

  input CreateStandaloneOrderItemInput {
    orderId: ID!
    productId: ID!
    qty: Int!
    unitPriceMinor: String!
    currency: String!
  }

  input UpdateOrderItemInput {
    qty: Int
    unitPriceMinor: String
    currency: String
  }

  input UpdateOrderItemQuantityInput {
    qty: Int!
  }

  input UpdateOrderItemPriceInput {
    unitPriceMinor: String!
  }

  type OrderItemConnection {
    orderItems: [OrderItem!]!
    pagination: Pagination!
  }

  extend type Query {
    # Admin OrderItem Queries
    adminOrderItems(
      page: Int = 1
      limit: Int = 10
      orderId: ID
      productId: ID
    ): OrderItemConnection!
    
    adminOrderItem(id: ID!): OrderItem!
    adminOrderItemsByOrder(orderId: ID!): [OrderItem!]!
    adminOrderItemsByProduct(productId: ID!): [OrderItem!]!
  }

  extend type Mutation {
    # Admin OrderItem Mutations
    adminCreateOrderItem(input: CreateStandaloneOrderItemInput!): OrderItem!
    adminUpdateOrderItem(id: ID!, input: UpdateOrderItemInput!): OrderItem!
    adminUpdateOrderItemQuantity(id: ID!, input: UpdateOrderItemQuantityInput!): OrderItem!
    adminUpdateOrderItemPrice(id: ID!, input: UpdateOrderItemPriceInput!): OrderItem!
    adminDeleteOrderItem(id: ID!): Boolean!
  }
`;
