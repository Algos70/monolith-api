import { check } from 'k6';

export class CategoryService {
  constructor(client, queries = null) {
    this.client = client;
    this.queries = queries;
    this.sessionHeaders = {};
    this.isGraphQLClient = this.client.constructor.name === 'GraphQLClient';
  }

  // Set session headers for authenticated requests
  setSessionHeaders(headers) {
    this.sessionHeaders = headers;
  }

  // Determine request method based on client type
  makeRequest(query, variables = {}, headers = {}) {
    const requestHeaders = { ...this.sessionHeaders, ...headers };
    
    if (this.isGraphQLClient) {
      // GraphQL request
      return this.client.requestWithParsing(query, variables, requestHeaders);
    } else {
      // REST request - query should be an object with method, url, params
      return this.client.requestWithParsing(query, variables, requestHeaders);
    }
  }

  /**
   * Get categories with pagination and search
   */
  async getCategories(variables = {}) {
    const query = this.isGraphQLClient 
      ? this.queries.GET_CATEGORIES 
      : {
          method: 'GET',
          url: '/categories',
          params: variables
        };

    const graphqlVariables = this.isGraphQLClient ? variables : {};
    const response = this.makeRequest(query, graphqlVariables);

    // Handle response based on client type
    const responseData = this.isGraphQLClient 
      ? response.parsed?.data?.categories
      : response.parsed;

    // Check if response has parsed data
    if (!response.parsed) {
      return { success: false, message: "No parsed data in response" };
    }

    // Check if categories field exists
    if (!responseData) {
      return { success: false, message: "No categories field in response" };
    }

    // Validate response structure
    check(response, {
      "Categories response has success field": (r) => {
        const data = this.isGraphQLClient ? r.parsed.data.categories : r.parsed;
        return data.hasOwnProperty("success");
      },
      "Categories response has message field": (r) => {
        const data = this.isGraphQLClient ? r.parsed.data.categories : r.parsed;
        return data.hasOwnProperty("message");
      },
      "Categories success is true": (r) => {
        const data = this.isGraphQLClient ? r.parsed.data.categories : r.parsed;
        return data.success === true;
      },
      "Categories message is correct": (r) => {
        const data = this.isGraphQLClient ? r.parsed.data.categories : r.parsed;
        return data.message === "Categories retrieved successfully";
      },
    });

    if (responseData.success) {
      check(response, {
        "Categories array exists": (r) => {
          const data = this.isGraphQLClient ? r.parsed.data.categories : r.parsed;
          return Array.isArray(data.categories);
        },
        "Pagination exists": (r) => {
          const data = this.isGraphQLClient ? r.parsed.data.categories : r.parsed;
          return data.pagination !== null && data.pagination !== undefined;
        },
        "Pagination has required fields": (r) => {
          const data = this.isGraphQLClient ? r.parsed.data.categories : r.parsed;
          const pagination = data.pagination;
          return pagination && typeof pagination.page === "number" && typeof pagination.total === "number";
        },
      });
    }

    return responseData;
  }

  /**
   * Get category products with pagination
   */
  async getCategoryProducts(variables = {}, expectSuccess = true) {
    const query = this.isGraphQLClient 
      ? this.queries.GET_CATEGORY_PRODUCTS 
      : {
          method: 'GET',
          url: `/categories/${variables.slug}/products`,
          params: {
            page: variables.page,
            limit: variables.limit,
            inStockOnly: variables.inStockOnly
          }
        };

    const graphqlVariables = this.isGraphQLClient ? variables : {};
    const response = this.makeRequest(query, graphqlVariables);

    // Handle response based on client type
    const responseData = this.isGraphQLClient 
      ? response.parsed?.data?.categoryProducts
      : response.parsed;

    // Check if response has parsed data and categoryProducts field
    if (!response.parsed || !responseData) {
      return { success: false, message: "No categoryProducts field in response" };
    }

    // Validate response structure
    check(response, {
      "Category products response has success field": (r) => {
        const data = this.isGraphQLClient ? r.parsed.data.categoryProducts : r.parsed;
        return data.hasOwnProperty("success");
      },
      "Category products response has message field": (r) => {
        const data = this.isGraphQLClient ? r.parsed.data.categoryProducts : r.parsed;
        return data.hasOwnProperty("message");
      },
      "Category products success is true": (r) => {
        const data = this.isGraphQLClient ? r.parsed.data.categoryProducts : r.parsed;
        const actualSuccess = data.success === true;
        return expectSuccess ? actualSuccess : !actualSuccess;
      },
      "Category products message is correct": (r) => {
        const data = this.isGraphQLClient ? r.parsed.data.categoryProducts : r.parsed;
        const isSuccess = data.success;
        if (expectSuccess && isSuccess) {
          return data.message === "Category products retrieved successfully";
        } else if (!expectSuccess && !isSuccess) {
          return !!data.message;
        }
        return true;
      },
    });

    if (responseData.success) {
      check(response, {
        "Category products has category": (r) => {
          const data = this.isGraphQLClient ? r.parsed.data.categoryProducts : r.parsed;
          return data.category !== null;
        },
        "Category products has products array": (r) => {
          const data = this.isGraphQLClient ? r.parsed.data.categoryProducts : r.parsed;
          return Array.isArray(data.products);
        },
        "Category products has pagination": (r) => {
          const data = this.isGraphQLClient ? r.parsed.data.categoryProducts : r.parsed;
          return data.pagination !== null && data.pagination !== undefined;
        },
        "Category products pagination has required fields": (r) => {
          const data = this.isGraphQLClient ? r.parsed.data.categoryProducts : r.parsed;
          const pagination = data.pagination;
          return pagination && typeof pagination.page === "number" && typeof pagination.total === "number";
        },
      });
    }

    return responseData;
  }

  /**
   * Run comprehensive category workflow test
   */
  async runCategoryWorkflowTest(testCategorySlug = "electronics") {
    console.log("Starting Category Workflow Test");
    console.log("=====================================");

    // Test 1: Get all categories
    const categoriesResult = await this.getCategories({ page: 1, limit: 5 });
    
    check(categoriesResult, {
      "Categories workflow - success": (r) => r.success === true,
      "Categories workflow - has categories": (r) => r.categories && r.categories.length > 0,
    });

    // Test 2: Get categories with search
    const searchResult = await this.getCategories({ page: 1, limit: 5, search: "elec" });
    
    check(searchResult, {
      "Search categories workflow - success": (r) => r.success === true,
    });

      // Test 5: Get category products
      const categoryProductsResult = await this.getCategoryProducts({ 
        slug: testCategorySlug, 
        page: 1, 
        limit: 5,
        inStockOnly: true 
      });

      check(categoryProductsResult, {
        "Category products workflow - success": (r) => r.success === true,
      });

      // Test 6: Get category products with different pagination
      const categoryProductsPage2Result = await this.getCategoryProducts({ 
        slug: testCategorySlug, 
        page: 2, 
        limit: 3,
        inStockOnly: false 
      });
      
      check(categoryProductsPage2Result, {
        "Category products page 2 workflow - success": (r) => r.success === true,
      });

    console.log("Category Workflow Test Completed");
    console.log("=====================================");
  }

  /**
   * Run edge case tests (boundary conditions)
   */
  async runEdgeCaseTests() {
    console.log("Starting Category Edge Case Tests");
    console.log("====================================");

    // Test 1: Large pagination values
    const largePaginationResult = await this.getCategories({ page: 999, limit: 100 });
    check(largePaginationResult, {
      "Large pagination - handles gracefully": (r) => r.hasOwnProperty("success"),
    });

    // Test 2: Zero pagination
    const zeroPaginationResult = await this.getCategories({ page: 0, limit: 0 });
    check(zeroPaginationResult, {
      "Zero pagination - handles gracefully": (r) => r.hasOwnProperty("success"),
    });

    // Test 3: Very long search term
    const longSearchResult = await this.getCategories({ search: "electronics".repeat(50) });
    check(longSearchResult, {
      "Long search term - handles gracefully": (r) => r.hasOwnProperty("success"),
    });

    // Test 4: Special characters in search
    const specialSearchResult = await this.getCategories({ search: "café & électronique" });
    check(specialSearchResult, {
      "Special characters search - handles gracefully": (r) => r.hasOwnProperty("success"),
    });

    console.log("Category Edge Case Tests Completed");
    console.log("====================================");
  }

  /**
   * Run negative tests (invalid inputs)
   */
  async runNegativeTests() {
    console.log("Starting Category Negative Tests");
    console.log("===============================");

    // Test 5: Non-existent category products
    const nonExistentProductsResult = await this.getCategoryProducts({ 
      slug: "fake-category-123",
      page: 1,
      limit: 5
    }, false);
    check(nonExistentProductsResult, {
      "Non-existent category products - should fail": (r) => r.success === false,
      "Non-existent category products - correct error message": (r) => r.message === "Category not found",
    });

    // Test 6: Negative pagination
    const negativePaginationResult = await this.getCategories({ page: -1, limit: -5 });
    check(negativePaginationResult, {
      "Negative pagination - should handle gracefully": (r) => r.hasOwnProperty("success"),
    });

    console.log("Category Negative Tests Completed");
    console.log("===============================");
  }
}