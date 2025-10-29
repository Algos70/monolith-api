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
    category: Category!
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
    products: [Product!]!
    pagination: Pagination!
  }

  type StockCheckResult {
    inStock: Boolean!
    requiredQty: Int!
  }

  extend type Query {
    adminProducts(
      page: Int = 1
      limit: Int = 10
      search: String
      categoryId: ID
      inStockOnly: Boolean
    ): ProductConnection!
    adminProduct(id: ID!): Product
    adminProductBySlug(slug: String!): Product
    adminProductsByCategory(categoryId: ID!): [Product!]!
    adminProductStockCheck(id: ID!, qty: Int = 1): StockCheckResult!
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