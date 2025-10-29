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

  type CategoryConnection {
    categories: [Category!]!
    pagination: Pagination!
  }

  extend type Query {
    adminCategories(page: Int = 1, limit: Int = 10, search: String): CategoryConnection!
    adminCategory(id: ID!): Category
    adminCategoryBySlug(slug: String!): Category
  }

  extend type Mutation {
    adminCreateCategory(input: CreateCategoryInput!): Category!
    adminUpdateCategory(id: ID!, input: UpdateCategoryInput!): Category!
    adminDeleteCategory(id: ID!): Boolean!
  }
`;