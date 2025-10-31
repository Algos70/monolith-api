export const authTypeDefs = `
  # Authentication Types
  type AuthResponse {
    success: Boolean!
    message: String!
    user: User
  }

  type RegisterResponse {
    success: Boolean!
    message: String!
  }

  type LogoutResponse {
    success: Boolean!
    message: String!
  }

  # Input Types
  input LoginInput {
    username: String!
    password: String!
  }

  input RegisterInput {
    username: String!
    email: String!
    password: String!
    firstName: String
    lastName: String
  }

  # Extend Query and Mutation
  extend type Query {
    # Get current authenticated user
    me: User
  }

  extend type Mutation {
    # Authentication mutations
    login(input: LoginInput!): AuthResponse!
    register(input: RegisterInput!): RegisterResponse!
    logout: LogoutResponse!
    refreshToken: AuthResponse!
  }
`;
