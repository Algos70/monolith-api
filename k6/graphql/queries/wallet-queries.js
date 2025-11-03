export const WALLET_QUERIES = {
  // User wallet queries (public access for authenticated users)
  GET_USER_WALLETS: `
    query GetUserWallets {
      userWallets {
        success
        message
        wallets {
          id
          currency
          balanceMinor
          createdAt
          updatedAt
          user {
            id
            email
            name
            given_name
            family_name
          }
        }
      }
    }
  `,

  GET_USER_WALLET_BY_CURRENCY: `
    query GetUserWalletByCurrency($currency: String!) {
      userWalletByCurrency(currency: $currency) {
        success
        message
        wallet {
          id
          currency
          balanceMinor
          createdAt
          updatedAt
          user {
            id
            email
            name
            given_name
            family_name
          }
        }
      }
    }
  `,

  GET_USER_WALLET_BALANCE: `
    query GetUserWalletBalance($currency: String!) {
      userWalletBalance(currency: $currency) {
        success
        message
        balance
      }
    }
  `,
};

export const WALLET_MUTATIONS = {
  // User wallet mutations
  CREATE_USER_WALLET: `
    mutation CreateUserWallet($input: CreateUserWalletInput!) {
      createUserWallet(input: $input) {
        success
        message
        wallet {
          id
          currency
          balanceMinor
          createdAt
          updatedAt
          user {
            id
            email
            name
            given_name
            family_name
          }
        }
      }
    }
  `,

  INCREASE_USER_WALLET_BALANCE: `
    mutation IncreaseUserWalletBalance($walletId: ID!, $input: BalanceOperationInput!) {
      increaseUserWalletBalance(walletId: $walletId, input: $input) {
        success
        message
      }
    }
  `,

  DELETE_USER_WALLET: `
    mutation DeleteUserWallet($walletId: ID!) {
      deleteUserWallet(walletId: $walletId) {
        success
        message
      }
    }
  `,

  TRANSFER_FROM_USER_WALLET: `
    mutation TransferFromUserWallet($input: UserTransferInput!) {
      transferFromUserWallet(input: $input) {
        success
        message
      }
    }
  `,
};