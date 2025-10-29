// GraphQL type definitions for Wallet
export const walletTypeDefs = `
  type Wallet {
    id: ID!
    currency: String!
    balanceMinor: Int!
    user: User!
    createdAt: String!
    updatedAt: String!
  }

  input CreateWalletInput {
    userId: ID!
    currency: String!
    initialBalance: Int = 0
  }

  input BalanceOperationInput {
    amountMinor: Int!
  }

  input TransferInput {
    fromUserId: ID!
    toUserId: ID!
    currency: String!
    amountMinor: Int!
  }

  type WalletConnection {
    wallets: [Wallet!]!
    pagination: Pagination!
  }

  type BalanceResponse {
    balance: Int!
    currency: String!
    userId: ID!
  }

  type TransferResponse {
    success: Boolean!
    message: String!
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
  }
`;