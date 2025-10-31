// GraphQL type definitions for User
export const userTypeDefs = `
  type User {
    # Database fields
    id: ID
    email: String!
    name: String
    createdAt: String
    updatedAt: String
    wallets: [Wallet!]
    orders: [Order!]
    carts: [Cart!]
    
    # Keycloak fields (from session)
    sub: String
    preferred_username: String
    given_name: String
    family_name: String
    email_verified: Boolean
    permissions: [String!]
    dbUserId: ID
    
    # Additional Keycloak fields
    iss: String
    aud: String
    exp: Int
    iat: Int
    jti: String
    typ: String
    azp: String
    sid: String
    acr: String
    scope: String
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