const cartTypes = `
  type Cart {
    id: ID!
    user: User!
    items: [CartItem!]!
    createdAt: String!
    updatedAt: String!
  }

  type CartItem {
    id: ID!
    cart: Cart!
    product: Product!
    qty: Int!
    createdAt: String!
    updatedAt: String!
  }

  type CartListResult {
    data: [Cart!]!
    pagination: Pagination!
  }

  type CartStats {
    totalCarts: Int!
    activeCarts: Int!
    emptyCarts: Int!
  }

  input CreateCartInput {
    userId: ID!
  }

  input AddCartItemInput {
    cartId: ID!
    productId: ID!
    qty: Int!
  }

  input AddItemToCartInput {
    productId: ID!
    quantity: Int!
  }

  input UpdateCartItemInput {
    qty: Int!
  }
`;

const cartQueries = `
  extend type Query {
    # User Cart Queries
    userCart: Cart!

    # Admin Cart Queries
    adminCarts(page: Int = 1, limit: Int = 10, search: String): CartListResult!
    adminCart(id: ID!): Cart!
    adminCartWithRelations(id: ID!, include: String): Cart!
    adminCartsByUser(userId: ID!): [Cart!]!
    adminCartStats: CartStats!
  }
`;

const cartMutations = `
  extend type Mutation {
    # User Cart Mutations
    addItemToCart(input: AddItemToCartInput!): Cart!
    removeItemFromCart(productId: ID!): Cart!
    clearCart: Cart!

    # Admin Cart Mutations
    adminDeleteCart(id: ID!): Boolean!
  }
`;

export const cartTypeDefs = cartTypes + cartQueries + cartMutations;