import { check, sleep } from "k6";
import { GraphQLClient } from "../utils/graphql-client.js";
import { PRODUCT_QUERIES } from "../queries/product-queries.js";
import { TEST_CONFIG } from "../../config/test-config.js";

export class ProductService {
  constructor(client = new GraphQLClient(), sessionHeaders = {}) {
    this.client = client;
    this.sessionHeaders = sessionHeaders;
  }

  async getProducts(variables = {}) {
    const response = this.client.requestWithParsing(
      PRODUCT_QUERIES.GET_PRODUCTS,
      variables,
      this.sessionHeaders
    );

    check(response, {
      "products: response parsed": (r) => r.parsed !== null,
      "products: success true": (r) =>
        r.parsed?.data?.products?.success === true,
      "products: message is correct": (r) =>
        r.parsed?.data?.products?.message === "Products are sent",
    });

    check(response, {
      "products: pagination total is 12": (r) =>
        r.parsed?.data?.products?.pagination?.total === 12,
      "products: pagination limit is 10": (r) =>
        r.parsed?.data?.products?.pagination?.limit === 10,
      "products: pagination total pages is 2": (r) =>
        r.parsed?.data?.products?.pagination?.totalPages === 2,
    });

    check(response, {
      "products: data fields are correct": (r) => {
        const p = r.parsed?.data?.products?.products?.[0];
        return (
          p &&
          typeof p.id === "string" &&
          typeof p.name === "string" &&
          typeof p.slug === "string" &&
          typeof p.priceMinor === "number" &&
          typeof p.currency === "string" &&
          typeof p.stockQty === "number" &&
          typeof p.createdAt === "string" &&
          typeof p.updatedAt === "string" &&
          typeof p.category === "object" &&
          typeof p.category.id === "string" &&
          typeof p.category.name === "string" &&
          typeof p.category.slug === "string"
        );
      },
    });
    return response;
  }

  async getProductBySlug(variables = {}) {
    const response = this.client.requestWithParsing(
      PRODUCT_QUERIES.GET_PRODUCT_BY_SLUG,
      variables,
      this.sessionHeaders
    );

    check(response, {
      "productBySlug: response parsed": (r) => r.parsed !== null,
      "productBySlug: success true": (r) =>
        r.parsed?.data?.productBySlug?.success === true,
      "productBySlug: message is correct": (r) =>
        r.parsed?.data?.productBySlug?.message ===
        "Product fetched successfully",
    });
    check(response, {
      "productBySlug: product data matches expected values": (r) => {
        const p = r.parsed?.data?.productBySlug?.product;
        return (
          p &&
          p.name === "AirPods Pro" &&
          p.slug === "airpods-pro" &&
          p.priceMinor === 24999 &&
          p.currency === "USD" &&
          p.category.name === "Electronics" &&
          p.category.slug === "electronics"
        );
      },
    });

    return response;
  }


  async getFeaturedProducts(variables = {}) {
    const response = this.client.requestWithParsing(
      PRODUCT_QUERIES.GET_FEATURED_PRODUCTS,
      variables,
      this.sessionHeaders
    );

    check(response, {
      "featuredProducts: response parsed": (r) => r.parsed !== null,
      "featuredProducts: success true": (r) =>
        r.parsed?.data?.featuredProducts?.success === true,
      "featuredProducts: message is correct": (r) =>
        r.parsed?.data?.featuredProducts?.message === "Products are sent",
    });

    check(response, {
      "featuredProducts: pagination total is 12": (r) =>
        r.parsed?.data?.featuredProducts?.pagination?.total === 12,
      "featuredProducts: pagination limit is 8": (r) =>
        r.parsed?.data?.featuredProducts?.pagination?.limit === 8,
      "featuredProducts: pagination total pages is 2": (r) =>
        r.parsed?.data?.featuredProducts?.pagination?.totalPages === 2,
    });

    check(response, {
      "featuredProducts: products array exists": (r) =>
        Array.isArray(r.parsed?.data?.featuredProducts?.products),
      "featuredProducts: has 8 products": (r) =>
        r.parsed?.data?.featuredProducts?.products?.length === 8,
    });

    check(response, {
      "featuredProducts: data fields are correct": (r) => {
        const p = r.parsed?.data?.featuredProducts?.products?.[0];
        return (
          p &&
          typeof p.id === "string" &&
          typeof p.name === "string" &&
          typeof p.slug === "string" &&
          typeof p.priceMinor === "number" &&
          typeof p.currency === "string" &&
          typeof p.stockQty === "number" &&
          typeof p.createdAt === "string" &&
          typeof p.updatedAt === "string" &&
          typeof p.category === "object" &&
          typeof p.category.id === "string" &&
          typeof p.category.name === "string" &&
          typeof p.category.slug === "string"
        );
      },
    });

    check(response, {
      "featuredProducts: all products are in stock": (r) => {
        const products = r.parsed?.data?.featuredProducts?.products;
        if (!products || !Array.isArray(products) || products.length === 0) {
          return false;
        }
        return products.every((p) => p && p.stockQty > 0);
      },
    });

    return response;
  }

  async searchProducts(variables = {}) {
    const response = this.client.requestWithParsing(
      PRODUCT_QUERIES.SEARCH_PRODUCTS,
      variables,
      this.sessionHeaders
    );

    check(response, {
      "searchProducts: response parsed": (r) => r.parsed !== null,
      "searchProducts: success true": (r) =>
        r.parsed?.data?.searchProducts?.success === true,
      "searchProducts: message is correct": (r) =>
        r.parsed?.data?.searchProducts?.message === "Products are sent",
    });
    check(response, {
      "searchProducts: pagination total is 1": (r) =>
        r.parsed?.data?.searchProducts?.pagination?.total === 1,
      "searchProducts: pagination limit is 10": (r) =>
        r.parsed?.data?.searchProducts?.pagination?.limit === 10,
      "searchProducts: pagination total pages is 2": (r) =>
        r.parsed?.data?.searchProducts?.pagination?.totalPages === 1,
    });

    check(response, {
      "searchProducts: products array exists": (r) =>
        Array.isArray(r.parsed?.data?.searchProducts?.products),
      "searchProducts: has products": (r) =>
        r.parsed?.data?.searchProducts?.products?.length > 0,
    });

    check(response, {
      "searchProducts: data fields are correct": (r) => {
        const p = r.parsed?.data?.searchProducts?.products?.[0];
        return (
          p &&
          typeof p.id === "string" &&
          typeof p.name === "string" &&
          typeof p.slug === "string" &&
          typeof p.priceMinor === "number" &&
          typeof p.currency === "string" &&
          typeof p.stockQty === "number" &&
          typeof p.createdAt === "string" &&
          typeof p.updatedAt === "string" &&
          typeof p.category === "object" &&
          typeof p.category.id === "string" &&
          typeof p.category.name === "string" &&
          typeof p.category.slug === "string"
        );
      },
    });

    // If search term is provided, check that results match the search
      check(response, {
        "searchProducts: results match search term": (r) => {
          const products = r.parsed?.data?.searchProducts?.products;
          if (!products || !Array.isArray(products) || products.length === 0) {
            return false;
          }
          const searchTerm = variables.search.toLowerCase();
          return products.every(
            (p) =>
              p &&
              (p.name.toLowerCase().includes(searchTerm) ||
                p.slug.toLowerCase().includes(searchTerm))
          );
        },
      });

    // If inStockOnly is true, check that all products are in stock
    if (variables.inStockOnly !== false) {
      check(response, {
        "searchProducts: all products are in stock": (r) => {
          const products = r.parsed?.data?.searchProducts?.products;
          if (!products || !Array.isArray(products) || products.length === 0) {
            return false;
          }
          return products.every((p) => p && p.stockQty > 0);
        },
      });
    }

    return response;
  }

  async runProductWorkflowTest(productSlug = "airpods-pro") {
    await this.getProducts();
    sleep(TEST_CONFIG.TIMEOUTS.DEFAULT_SLEEP);

    const productResponse = await this.getProductBySlug({
      slug: productSlug,
    });

    await this.getFeaturedProducts({ limit: 8 });
    sleep(TEST_CONFIG.TIMEOUTS.DEFAULT_SLEEP);

    await this.searchProducts({
      search: "AirPods",
      inStockOnly: true,
      page: 1,
      limit: 10,
    });
  }

  async runNegativeFlowTests() {
    // Test 1: Get product by invalid/empty slug
    const invalidSlugResponse = this.client.requestWithParsing(
      PRODUCT_QUERIES.GET_PRODUCT_BY_SLUG,
      { slug: "" },
      this.sessionHeaders
    );

    check(invalidSlugResponse, {
      "productBySlug negative: response parsed": (r) => r.parsed !== null,
      "productBySlug negative: success false for empty slug": (r) =>
        r.parsed?.data?.productBySlug?.success === false,
      "productBySlug negative: correct error message for empty slug": (r) =>
        r.parsed?.data?.productBySlug?.message === "Invalid slug parameter",
    });

    // Test 2: Get product by non-existent slug
    const nonExistentSlugResponse = this.client.requestWithParsing(
      PRODUCT_QUERIES.GET_PRODUCT_BY_SLUG,
      { slug: "non-existent-product-slug-12345" },
      this.sessionHeaders
    );

    check(nonExistentSlugResponse, {
      "productBySlug negative: response parsed for non-existent": (r) => r.parsed !== null,
      "productBySlug negative: success false for non-existent slug": (r) =>
        r.parsed?.data?.productBySlug?.success === false,
      "productBySlug negative: correct error message for non-existent": (r) =>
        r.parsed?.data?.productBySlug?.message === "Product not found",
    });
    // Test 6: Search with no results
    const noResultsSearchResponse = this.client.requestWithParsing(
      PRODUCT_QUERIES.SEARCH_PRODUCTS,
      { 
        search: "nonexistentproductname12345xyz",
        page: 1,
        limit: 10 
      },
      this.sessionHeaders
    );

    check(noResultsSearchResponse, {
      "searchProducts negative: response parsed": (r) => r.parsed !== null,
      "searchProducts negative: success true but empty results": (r) =>
        r.parsed?.data?.searchProducts?.success === true,
      "searchProducts negative: empty products array": (r) =>
        Array.isArray(r.parsed?.data?.searchProducts?.products) &&
        r.parsed?.data?.searchProducts?.products?.length === 0,
      "searchProducts negative: zero total count": (r) =>
        r.parsed?.data?.searchProducts?.pagination?.total === 0,
    });

    sleep(TEST_CONFIG.TIMEOUTS.DEFAULT_SLEEP);
  }

  async runEdgeCaseTests() {
    // Test 1: Search with special characters and symbols
    const specialCharSearchResponse = this.client.requestWithParsing(
      PRODUCT_QUERIES.SEARCH_PRODUCTS,
      { 
        search: "!@#$%^&*()",
        page: 1,
        limit: 10 
      },
      this.sessionHeaders
    );

    check(specialCharSearchResponse, {
      "searchProducts edge: response parsed for special chars": (r) => r.parsed !== null,
      "searchProducts edge: success true for special chars": (r) =>
        r.parsed?.data?.searchProducts?.success === true,
      "searchProducts edge: handles special characters gracefully": (r) =>
        Array.isArray(r.parsed?.data?.searchProducts?.products),
    });

    // Test 2: Search with very long string
    const longSearchResponse = this.client.requestWithParsing(
      PRODUCT_QUERIES.SEARCH_PRODUCTS,
      { 
        search: "a".repeat(1000),
        page: 1,
        limit: 10 
      },
      this.sessionHeaders
    );

    check(longSearchResponse, {
      "searchProducts edge: response parsed for long string": (r) => r.parsed !== null,
      "searchProducts edge: success true for long string": (r) =>
        r.parsed?.data?.searchProducts?.success === true,
      "searchProducts edge: handles long search string": (r) =>
        Array.isArray(r.parsed?.data?.searchProducts?.products),
    });

    // Test 3: Pagination with extreme values
    const extremePaginationResponse = this.client.requestWithParsing(
      PRODUCT_QUERIES.GET_PRODUCTS,
      { 
        page: 999999,
        limit: 1 
      },
      this.sessionHeaders
    );

    check(extremePaginationResponse, {
      "products edge: response parsed for extreme pagination": (r) => r.parsed !== null,
      "products edge: success true for extreme pagination": (r) =>
        r.parsed?.data?.products?.success === true,
      "products edge: empty results for out of range page": (r) =>
        Array.isArray(r.parsed?.data?.products?.products) &&
        r.parsed?.data?.products?.products?.length === 0,
    });

    // Test 4: Search with minimum limit (1)
    const minLimitResponse = this.client.requestWithParsing(
      PRODUCT_QUERIES.SEARCH_PRODUCTS,
      { 
        search: "AirPods",
        page: 1,
        limit: 1 
      },
      this.sessionHeaders
    );

    check(minLimitResponse, {
      "searchProducts edge: response parsed for min limit": (r) => r.parsed !== null,
      "searchProducts edge: success true for min limit": (r) =>
        r.parsed?.data?.searchProducts?.success === true,
      "searchProducts edge: respects limit of 1": (r) =>
        r.parsed?.data?.searchProducts?.products?.length <= 1,
      "searchProducts edge: pagination limit is 1": (r) =>
        r.parsed?.data?.searchProducts?.pagination?.limit === 1,
    });

    // Test 5: Search with case sensitivity variations
    const caseVariationsResponse = this.client.requestWithParsing(
      PRODUCT_QUERIES.SEARCH_PRODUCTS,
      { 
        search: "AIRPODS",
        page: 1,
        limit: 10 
      },
      this.sessionHeaders
    );

    check(caseVariationsResponse, {
      "searchProducts edge: response parsed for uppercase": (r) => r.parsed !== null,
      "searchProducts edge: success true for uppercase": (r) =>
        r.parsed?.data?.searchProducts?.success === true,
      "searchProducts edge: case insensitive search works": (r) =>
        r.parsed?.data?.searchProducts?.products?.length > 0,
    });

    // Test 6: Product slug with whitespace
    const whitespaceSlugResponse = this.client.requestWithParsing(
      PRODUCT_QUERIES.GET_PRODUCT_BY_SLUG,
      { slug: "  airpods-pro  " },
      this.sessionHeaders
    );

    check(whitespaceSlugResponse, {
      "productBySlug edge: response parsed for whitespace": (r) => r.parsed !== null,
      "productBySlug edge: success true for trimmed slug": (r) =>
        r.parsed?.data?.productBySlug?.success === true,
      "productBySlug edge: finds product despite whitespace": (r) =>
        r.parsed?.data?.productBySlug?.product?.slug === "airpods-pro",
    });

    // Test 7: Featured products with maximum limit
    const maxFeaturedResponse = this.client.requestWithParsing(
      PRODUCT_QUERIES.GET_FEATURED_PRODUCTS,
      { limit: 100 },
      this.sessionHeaders
    );

    check(maxFeaturedResponse, {
      "featuredProducts edge: response parsed for max limit": (r) => r.parsed !== null,
      "featuredProducts edge: success true for max limit": (r) =>
        r.parsed?.data?.featuredProducts?.success === true,
      "featuredProducts edge: handles large limit gracefully": (r) =>
        Array.isArray(r.parsed?.data?.featuredProducts?.products),
    });

    sleep(TEST_CONFIG.TIMEOUTS.DEFAULT_SLEEP);
  }
}
