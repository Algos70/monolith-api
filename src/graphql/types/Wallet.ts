// GraphQL type definitions for Wallet
export const walletTypeDefs = `
  type Wallet {
    id: ID!
    currency: String!
    balanceMinor: String!
    user: User!
    createdAt: String!
    updatedAt: String!
  }

  input CreateWalletInput {
    userId: ID!
    currency: String!
    initialBalanceMinor: String = "0"
  }

  input BalanceOperationInput {
    amountMinor: String!
  }

  input TransferInput {
    fromUserId: ID!
    toUserId: ID!
    currency: String!
    amountMinor: String!
  }

  input CreateUserWalletInput {
    currency: String!
    initialBalanceMinor: String = "0"
  }

  input UserTransferInput {
    toWalletId: ID!
    currency: String!
    amountMinor: String!
  }

  type WalletConnection {
    wallets: [Wallet!]!
    pagination: Pagination!
  }

  type BalanceResponse {
    balance: String!
    currency: String!
    userId: ID!
  }

  type UserWalletBalanceResult {
    success: Boolean!
    message: String!
    balance: String!
  }

  type UserWalletOperationResult {
    success: Boolean!
    message: String!
  }

  type TransferResponse {
    success: Boolean!
    message: String!
  }

  type UserWalletsResult {
    success: Boolean!
    message: String!
    wallets: [Wallet!]!
  }

  type UserWalletResult {
    success: Boolean!
    message: String!
    wallet: Wallet
  }

  extend type Query {
    # List all wallets with pagination and filtering
    adminWallets(
      page: Int = 1
      limit: Int = 10
      search: String
      currency: String
      userId: ID
    ): WalletConnection!
    
    # Get wallet by ID
    adminWallet(id: ID!): Wallet
    
    # Get wallets by user ID
    adminWalletsByUser(userId: ID!): [Wallet!]!
    
    # Get wallets by currency
    adminWalletsByCurrency(currency: String!): [Wallet!]!
    
    # Get specific wallet by user and currency
    adminWalletByUserAndCurrency(userId: ID!, currency: String!): Wallet
    
    # Get balance for specific user and currency
    adminWalletBalance(userId: ID!, currency: String!): BalanceResponse!

    # User wallet operations
    # Get all wallets for the authenticated user
    userWallets: UserWalletsResult!
    
    # Get user's wallet by currency
    userWalletByCurrency(currency: String!): UserWalletResult!
    
    # Get balance for user's wallet by currency
    userWalletBalance(currency: String!): UserWalletBalanceResult!
  }

  extend type Mutation {
    # Create new wallet
    adminCreateWallet(input: CreateWalletInput!): Wallet!
    
    # Delete wallet
    adminDeleteWallet(id: ID!): Boolean!
    
    # Increase wallet balance
    adminIncreaseWalletBalance(id: ID!, input: BalanceOperationInput!): Wallet!
    
    # Decrease wallet balance
    adminDecreaseWalletBalance(id: ID!, input: BalanceOperationInput!): Wallet!
    
    # Transfer between wallets
    adminTransferBetweenWallets(input: TransferInput!): TransferResponse!

    # User wallet operations
    # Create a new wallet for the authenticated user
    createUserWallet(input: CreateUserWalletInput!): UserWalletResult!
    
    # Increase balance of user's own wallet
    increaseUserWalletBalance(walletId: ID!, input: BalanceOperationInput!): UserWalletOperationResult!
    
    # Delete user's own wallet
    deleteUserWallet(walletId: ID!): UserWalletOperationResult!
    
    # Transfer money from user's wallet to another wallet
    transferFromUserWallet(input: UserTransferInput!): TransferResponse!
  }
`;
