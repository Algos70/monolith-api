export const CART_QUERIES = {
  // User Cart Queries
  GET_USER_CART: `
    query GetUserCart {
      userCart {
        success
        message
        cartItems {
          id
          product {
            id
            name
            priceMinor
            currency
          }
          qty
          createdAt
          updatedAt
        }
      }
    }
  `,

  // User Cart Mutations
  ADD_ITEM_TO_CART: `
    mutation AddItemToCart($input: AddItemToCartInput!) {
      addItemToCart(input: $input) {
        success
        message
        cartItem {
          id
          product {
            id
            name
            priceMinor
            currency
          }
          qty
          createdAt
          updatedAt
        }
      }
    }
  `,

  UPDATE_ITEM_QUANTITY: `
    mutation UpdateItemQuantity($input: UpdateItemQuantityInput!) {
      updateItemQuantity(input: $input) {
        success
        message
      }
    }
  `,

  DECREASE_ITEM_QUANTITY: `
    mutation DecreaseItemQuantity($input: DecreaseItemQuantityInput!) {
      decreaseItemQuantity(input: $input) {
        success
        message
      }
    }
  `,

  REMOVE_ITEM_FROM_CART: `
    mutation RemoveItemFromCart($productId: ID!) {
      removeItemFromCart(productId: $productId) {
        success
        message
        cartItem {
          id
          product {
            id
            name
          }
          qty
        }
      }
    }
  `,

  CLEAR_CART: `
    mutation ClearCart {
      clearCart {
        success
        message
      }
    }
  `
};