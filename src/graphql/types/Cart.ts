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

  type UserCartResponse {
    success: Boolean!
    message: String!
    cartItems: [CartItem!]!
  }

  type CartItemResponse {
    success: Boolean!
    message: String!
    cartItem: CartItem
  }

  type CartOperationResponse {
    success: Boolean!
    message: String!
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

  input UpdateItemQuantityInput {
    productId: ID!
    quantity: Int!
  }

  input DecreaseItemQuantityInput {
    productId: ID!
    decreaseBy: Int = 1
  }

  input UpdateCartItemInput {
    qty: Int!
  }
`;

const cartQueries = `
  extend type Query {
    # User Cart Queries
    userCart: UserCartResponse!

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
    addItemToCart(input: AddItemToCartInput!): CartItemResponse!
    updateItemQuantity(input: UpdateItemQuantityInput!): CartOperationResponse!
    decreaseItemQuantity(input: DecreaseItemQuantityInput!): CartOperationResponse!
    removeItemFromCart(productId: ID!): CartItemResponse!
    clearCart: CartOperationResponse!

    # Admin Cart Mutations
    adminDeleteCart(id: ID!): Boolean!
  }
`;

export const cartTypeDefs = cartTypes + cartQueries + cartMutations;