export const ORDER_QUERIES = {
  // User Order Queries
  GET_USER_ORDERS: `
    query GetUserOrders {
      userOrders {
        success
        message
        orders {
          id
          totalMinor
          currency
          status
          createdAt
          updatedAt
          user {
            id
          }
          items {
            id
            qty
            unitPriceMinor
            currency
            product {
              id
              name
              priceMinor
              currency
            }
          }
        }
      }
    }
  `,

  // User Order Mutations
  CREATE_ORDER_FROM_CART: `
    mutation CreateOrderFromCart($input: CreateOrderFromCartInput!) {
      createOrderFromCart(input: $input) {
        success
        message
        order {
          id
          totalMinor
          currency
          status
          createdAt
          updatedAt
          user {
            id
          }
          items {
            id
            qty
            unitPriceMinor
            currency
            product {
              id
              name
              priceMinor
              currency
            }
          }
        }
      }
    }
  `
};