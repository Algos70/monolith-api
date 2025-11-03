// Category GraphQL Queries

export const GET_CATEGORIES = `
  query GetCategories($page: Int, $limit: Int, $search: String) {
    categories(page: $page, limit: $limit, search: $search) {
      success
      message
      categories {
        id
        slug
        name
        createdAt
        updatedAt
      }
      pagination {
        page
        limit
        total
        totalPages
      }
    }
  }
`;

export const GET_CATEGORY_PRODUCTS = `
  query GetCategoryProducts($slug: String!, $page: Int, $limit: Int, $inStockOnly: Boolean) {
    categoryProducts(slug: $slug, page: $page, limit: $limit, inStockOnly: $inStockOnly) {
      success
      message
      category {
        id
        slug
        name
        createdAt
        updatedAt
      }
      products {
        id
        name
        slug
        priceMinor
        currency
        stockQty
      }
      pagination {
        page
        limit
        total
        totalPages
      }
    }
  }
`;