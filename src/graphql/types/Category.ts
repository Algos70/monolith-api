// GraphQL type definitions for Category
export const categoryTypeDefs = `
  type Category {
    id: ID!
    slug: String!
    name: String!
    createdAt: String!
    updatedAt: String!
    products: [Product!]
  }

  input CreateCategoryInput {
    slug: String!
    name: String!
  }

  input UpdateCategoryInput {
    slug: String
    name: String
  }

  # Old format for admin queries
  type CategoryConnection {
    categories: [Category!]!
    pagination: Pagination!
  }

  type CategoryProductsResult {
    category: Category!
    products: [Product!]!
    pagination: Pagination!
  }

  type CategoryResponse {
    success: Boolean!
    message: String!
    category: Category
  }

  type CategoriesResponse {
    success: Boolean!
    message: String!
    categories: [Category!]
    pagination: Pagination
  }

  type CategoryProductsResponse {
    success: Boolean!
    message: String!
    category: Category
    products: [Product!]
    pagination: Pagination
  }

  extend type Query {
    # Admin queries
    adminCategories(page: Int = 1, limit: Int = 10, search: String): CategoryConnection!
    adminCategory(id: ID!): Category
    adminCategoryBySlug(slug: String!): Category
    
    # Public/User queries (new standardized format)
    categories(page: Int = 1, limit: Int = 10, search: String): CategoriesResponse!
    categoryProducts(slug: String!, page: Int = 1, limit: Int = 10, inStockOnly: Boolean = true): CategoryProductsResponse!
  }

  extend type Mutation {
    adminCreateCategory(input: CreateCategoryInput!): Category!
    adminUpdateCategory(id: ID!, input: UpdateCategoryInput!): Category!
    adminDeleteCategory(id: ID!): Boolean!
  }
`;