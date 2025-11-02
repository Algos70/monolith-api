import { GraphQLClient } from "../utils/graphql-client.js";
import {
  GET_CATEGORIES,
  GET_CATEGORY_BY_ID,
  GET_CATEGORY_BY_SLUG,
  GET_CATEGORY_PRODUCTS,
} from "../queries/category-queries.js";
import { check } from "k6";

export class CategoryService {
  constructor(client = new GraphQLClient(), sessionHeaders = {}) {
    this.client = client;
    this.sessionHeaders = sessionHeaders;
  }

  /**
   * Get categories with pagination and search
   */
  async getCategories(variables = {}) {
    const response = this.client.requestWithParsing(
      GET_CATEGORIES,
      variables,
      this.sessionHeaders
    );

    // Check if response has parsed data
    if (!response.parsed || !response.parsed.data) {
      return { success: false, message: "No parsed data in response" };
    }

    // Check if categories field exists
    if (!response.parsed.data.categories) {
      return { success: false, message: "No categories field in response" };
    }



    // Validate response structure
    check(response, {
      "Categories response has success field": (r) => r.parsed.data.categories.hasOwnProperty("success"),
      "Categories response has message field": (r) => r.parsed.data.categories.hasOwnProperty("message"),
      "Categories success is true": (r) => r.parsed.data.categories.success === true,
      "Categories message is correct": (r) => r.parsed.data.categories.message === "Categories retrieved successfully",
    });

    if (response.parsed.data.categories.success) {
      check(response, {
        "Categories array exists": (r) => Array.isArray(r.parsed.data.categories.categories),
        "Pagination exists": (r) => r.parsed.data.categories.pagination !== null && r.parsed.data.categories.pagination !== undefined,
        "Pagination has required fields": (r) => {
          const pagination = r.parsed.data.categories.pagination;
          return pagination && typeof pagination.page === "number" && typeof pagination.total === "number";
        },
      });
    }

    return response.parsed.data.categories;
  }

  /**
   * Get category by ID
   */
  async getCategoryById(variables = {}, expectSuccess = true) {
    const response = this.client.requestWithParsing(
      GET_CATEGORY_BY_ID,
      variables,
      this.sessionHeaders
    );

    // Check if response has parsed data and category field
    if (!response.parsed || !response.parsed.data || !response.parsed.data.category) {
      return { success: false, message: "No category field in response" };
    }

    // Validate response structure
    check(response, {
      "Category response has success field": (r) => r.parsed.data.category.hasOwnProperty("success"),
      "Category response has message field": (r) => r.parsed.data.category.hasOwnProperty("message"),
      "Category success is true": (r) => {
        const actualSuccess = r.parsed.data.category.success === true;
        return expectSuccess ? actualSuccess : !actualSuccess;
      },
      "Category message is correct": (r) => {
        const isSuccess = r.parsed.data.category.success;
        if (expectSuccess && isSuccess) {
          return r.parsed.data.category.message === "Category retrieved successfully";
        } else if (!expectSuccess && !isSuccess) {
          return !!r.parsed.data.category.message;
        }
        return true;
      },
    });

    if (response.parsed.data.category.success) {
      check(response, {
        "Category object exists": (r) => r.parsed.data.category.category !== null,
        "Category has required fields": (r) => {
          const category = r.parsed.data.category.category;
          return category && category.id && category.slug && category.name;
        },
      });
    }

    return response.parsed.data.category;
  }

  /**
   * Get category by slug
   */
  async getCategoryBySlug(variables = {}, expectSuccess = true) {
    const response = this.client.requestWithParsing(
      GET_CATEGORY_BY_SLUG,
      variables,
      this.sessionHeaders
    );

    // Check if response has parsed data and categoryBySlug field
    if (!response.parsed || !response.parsed.data || !response.parsed.data.categoryBySlug) {
      return { success: false, message: "No categoryBySlug field in response" };
    }

    // Validate response structure
    check(response, {
      "Category by slug response has success field": (r) => r.parsed.data.categoryBySlug.hasOwnProperty("success"),
      "Category by slug response has message field": (r) => r.parsed.data.categoryBySlug.hasOwnProperty("message"),
      "Category by slug success is true": (r) => {
        const actualSuccess = r.parsed.data.categoryBySlug.success === true;
        return expectSuccess ? actualSuccess : !actualSuccess;
      },
      "Category by slug message is correct": (r) => {
        const isSuccess = r.parsed.data.categoryBySlug.success;
        if (expectSuccess && isSuccess) {
          return r.parsed.data.categoryBySlug.message === "Category retrieved successfully";
        } else if (!expectSuccess && !isSuccess) {
          return !!r.parsed.data.categoryBySlug.message;
        }
        return true;
      },
    });

    if (response.parsed.data.categoryBySlug.success) {
      check(response, {
        "Category by slug object exists": (r) => r.parsed.data.categoryBySlug.category !== null,
        "Category by slug has required fields": (r) => {
          const category = r.parsed.data.categoryBySlug.category;
          return category && category.id && category.slug && category.name;
        },
      });
    }

    return response.parsed.data.categoryBySlug;
  }

  /**
   * Get category products with pagination
   */
  async getCategoryProducts(variables = {}, expectSuccess = true) {
    const response = this.client.requestWithParsing(
      GET_CATEGORY_PRODUCTS,
      variables,
      this.sessionHeaders
    );

    // Check if response has parsed data and categoryProducts field
    if (!response.parsed || !response.parsed.data || !response.parsed.data.categoryProducts) {
      return { success: false, message: "No categoryProducts field in response" };
    }

    // Validate response structure
    check(response, {
      "Category products response has success field": (r) => r.parsed.data.categoryProducts.hasOwnProperty("success"),
      "Category products response has message field": (r) => r.parsed.data.categoryProducts.hasOwnProperty("message"),
      "Category products success is true": (r) => {
        const actualSuccess = r.parsed.data.categoryProducts.success === true;
        return expectSuccess ? actualSuccess : !actualSuccess;
      },
      "Category products message is correct": (r) => {
        const isSuccess = r.parsed.data.categoryProducts.success;
        if (expectSuccess && isSuccess) {
          return r.parsed.data.categoryProducts.message === "Category products retrieved successfully";
        } else if (!expectSuccess && !isSuccess) {
          return !!r.parsed.data.categoryProducts.message;
        }
        return true;
      },
    });

    if (response.parsed.data.categoryProducts.success) {
      check(response, {
        "Category products has category": (r) => r.parsed.data.categoryProducts.category !== null,
        "Category products has products array": (r) => Array.isArray(r.parsed.data.categoryProducts.products),
        "Category products has pagination": (r) => r.parsed.data.categoryProducts.pagination !== null && r.parsed.data.categoryProducts.pagination !== undefined,
        "Category products pagination has required fields": (r) => {
          const pagination = r.parsed.data.categoryProducts.pagination;
          return pagination && typeof pagination.page === "number" && typeof pagination.total === "number";
        },
      });
    }

    return response.parsed.data.categoryProducts;
  }

  /**
   * Run comprehensive category workflow test
   */
  async runCategoryWorkflowTest(testCategorySlug = "electronics") {
    console.log(" Starting Category Workflow Test");
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

    // Test 3: Get category by slug
    const categoryBySlugResult = await this.getCategoryBySlug({ slug: testCategorySlug });
    
    check(categoryBySlugResult, {
      "Category by slug workflow - success": (r) => r.success === true,
    });

    let categoryId = null;
    if (categoryBySlugResult.success && categoryBySlugResult.category) {
      categoryId = categoryBySlugResult.category.id;
      
      // Test 4: Get category by ID
      const categoryByIdResult = await this.getCategoryById({ id: categoryId });
      
      check(categoryByIdResult, {
        "Category by ID workflow - success": (r) => r.success === true,
        "Category by ID workflow - same category": (r) => 
          r.success && r.category && r.category.id === categoryId,
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
    }

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

    // Test 1: Non-existent category by slug
    const nonExistentSlugResult = await this.getCategoryBySlug({ slug: "non-existent-category-12345" }, false);
    check(nonExistentSlugResult, {
      "Non-existent category by slug - should fail": (r) => r.success === false,
      "Non-existent category by slug - correct error message": (r) => r.message === "Category not found",
    });

    // Test 2: Non-existent category by ID
    const nonExistentIdResult = await this.getCategoryById({ id: "non-existent-id-12345" }, false);
    check(nonExistentIdResult, {
      "Non-existent category by ID - should fail": (r) => r.success === false,
      "Non-existent category by ID - correct error message": (r) => r.message === "Category not found",
    });

    // Test 3: Empty slug
    const emptySlugResult = await this.getCategoryBySlug({ slug: "" }, false);
    check(emptySlugResult, {
      "Empty slug - should fail": (r) => r.success === false,
    });

    // Test 4: Empty ID
    const emptyIdResult = await this.getCategoryById({ id: "" }, false);
    check(emptyIdResult, {
      "Empty ID - should fail": (r) => r.success === false,
    });

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