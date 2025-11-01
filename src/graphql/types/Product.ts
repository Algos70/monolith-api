// GraphQL type definitions for Product
export const productTypeDefs = `
  type Product {
    id: ID!
    name: String!
    slug: String!
    priceMinor: Int!
    currency: String!
    stockQty: Int!
    createdAt: String!
    updatedAt: String!
    category: Category
  }

  input CreateProductInput {
    name: String!
    slug: String!
    priceMinor: Int!
    currency: String!
    stockQty: Int!
    categoryId: ID!
  }

  input UpdateProductInput {
    name: String
    slug: String
    priceMinor: Int
    currency: String
    stockQty: Int
    categoryId: ID
  }

  input StockOperationInput {
    qty: Int!
  }

  input PriceUpdateInput {
    priceMinor: Int!
  }

  type ProductConnection {
    success: Boolean!
    message: String!
    products: [Product!]!
    pagination: Pagination!
  }

  type ProductResult {
    success: Boolean!
    message: String!
    product: Product
  }

  type StockCheckResult {
    inStock: Boolean!
    requiredQty: Int!
  }

  type ProductAvailability {
    productId: ID!
    available: Boolean!
    requiredQty: Int!
    stockQty: Int!
  }

  extend type Query {
    # Admin queries
    adminProducts(
      page: Int = 1
      limit: Int = 10
      search: String
      categoryId: ID
      inStockOnly: Boolean
    ): ProductConnection!
    adminProduct(id: ID!): ProductResult!
    adminProductBySlug(slug: String!): Product
    adminProductsByCategory(categoryId: ID!): [Product!]!
    adminProductStockCheck(id: ID!, qty: Int = 1): StockCheckResult!

    # User queries
    products(
      page: Int = 1
      limit: Int = 10
      search: String
      categoryId: ID
      inStockOnly: Boolean = true
    ): ProductConnection!
    product(id: ID!): Product!
    productBySlug(slug: String!): ProductResult!
    productsByCategory(categoryId: ID!): [Product!]!
    productAvailability(id: ID!, qty: Int = 1): ProductAvailability!
    featuredProducts(limit: Int = 8): ProductConnection!
    searchProducts(
      search: String
      categoryId: ID
      inStockOnly: Boolean = true
      page: Int = 1
      limit: Int = 10
    ): ProductConnection!
  }

  extend type Mutation {
    adminCreateProduct(input: CreateProductInput!): Product!
    adminUpdateProduct(id: ID!, input: UpdateProductInput!): Product!
    adminDeleteProduct(id: ID!): Boolean!
    adminIncreaseProductStock(id: ID!, input: StockOperationInput!): Product!
    adminDecreaseProductStock(id: ID!, input: StockOperationInput!): Product!
    adminUpdateProductPrice(id: ID!, input: PriceUpdateInput!): Product!
  }
`;
