export const PRODUCT_QUERIES = {
  // User queries (public access)
  GET_PRODUCTS: `
    query GetProducts($page: Int, $limit: Int, $search: String, $categoryId: ID, $inStockOnly: Boolean) {
      products(page: $page, limit: $limit, search: $search, categoryId: $categoryId, inStockOnly: $inStockOnly) {
        products {
          id
          name
          slug
          priceMinor
          currency
          stockQty
          createdAt
          updatedAt
          category {
            id
            name
            slug
          }
        }
        pagination {
          page
          limit
          total
          totalPages
        }
      }
    }
  `,

  GET_PRODUCT_BY_ID: `
    query GetProduct($id: ID!) {
      product(id: $id) {
        id
        name
        slug
        priceMinor
        currency
        stockQty
        createdAt
        updatedAt
        category {
          id
          name
          slug
        }
      }
    }
  `,

  GET_PRODUCT_BY_SLUG: `
    query GetProductBySlug($slug: String!) {
      productBySlug(slug: $slug) {
        id
        name
        slug
        priceMinor
        currency
        stockQty
        createdAt
        updatedAt
        category {
          id
          name
          slug
        }
      }
    }
  `,

  GET_PRODUCTS_BY_CATEGORY: `
    query GetProductsByCategory($categoryId: ID!) {
      productsByCategory(categoryId: $categoryId) {
        id
        name
        slug
        priceMinor
        currency
        stockQty
        createdAt
        updatedAt
        category {
          id
          name
          slug
        }
      }
    }
  `,

  CHECK_PRODUCT_AVAILABILITY: `
    query CheckProductAvailability($id: ID!, $qty: Int) {
      productAvailability(id: $id, qty: $qty) {
        productId
        available
        requiredQty
        stockQty
      }
    }
  `,

  GET_FEATURED_PRODUCTS: `
    query GetFeaturedProducts($limit: Int) {
      featuredProducts(limit: $limit) {
        products {
          id
          name
          slug
          priceMinor
          currency
          stockQty
          createdAt
          updatedAt
          category {
            id
            name
            slug
          }
        }
        pagination {
          page
          limit
          total
          totalPages
        }
      }
    }
  `,

  SEARCH_PRODUCTS: `
    query SearchProducts($search: String, $categoryId: ID, $inStockOnly: Boolean, $page: Int, $limit: Int) {
      searchProducts(search: $search, categoryId: $categoryId, inStockOnly: $inStockOnly, page: $page, limit: $limit) {
        products {
          id
          name
          slug
          priceMinor
          currency
          stockQty
          createdAt
          updatedAt
          category {
            id
            name
            slug
          }
        }
        pagination {
          page
          limit
          total
          totalPages
        }
      }
    }
  `,
};