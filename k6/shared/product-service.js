import { check, sleep } from "k6";
import { TEST_CONFIG } from "../config/test-config.js";

export class ProductService {
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

  async getProducts(variables = {}) {
    const query = this.isGraphQLClient 
      ? this.queries.GET_PRODUCTS 
      : {
          method: 'GET',
          url: '/products',
          params: variables
        };

    const graphqlVariables = this.isGraphQLClient ? variables : {};
    const response = this.makeRequest(query, graphqlVariables);



    // Handle response based on client type
    const responseData = this.isGraphQLClient 
      ? response.parsed?.data?.products
      : response.parsed;

    check(response, {
      "products: response parsed": (r) => r.parsed !== null,
      "products: success true": (r) => {
        const data = this.isGraphQLClient ? r.parsed?.data?.products : r.parsed;
        return data?.success === true;
      },
      "products: message is correct": (r) => {
        const data = this.isGraphQLClient ? r.parsed?.data?.products : r.parsed;
        return data?.message === "Products are sent";
      },
    });

    check(response, {
      "products: pagination total is 12": (r) => {
        const data = this.isGraphQLClient ? r.parsed?.data?.products : r.parsed;
        return data?.pagination?.total === 12;
      },
      "products: pagination limit is 10": (r) => {
        const data = this.isGraphQLClient ? r.parsed?.data?.products : r.parsed;
        return data?.pagination?.limit === 10;
      },
      "products: pagination total pages is 2": (r) => {
        const data = this.isGraphQLClient ? r.parsed?.data?.products : r.parsed;
        return data?.pagination?.totalPages === 2;
      },
    });

    check(response, {
      "products: data fields are correct": (r) => {
        const data = this.isGraphQLClient ? r.parsed?.data?.products : r.parsed;
        const p = data?.products?.[0];
        if (!p) return false;
        
        // For REST API, priceMinor comes as string, for GraphQL as number
        const priceMinorType = this.isGraphQLClient ? "number" : "string";
        const stockQtyType = this.isGraphQLClient ? "number" : "number";
        
        return (
          typeof p.id === "string" &&
          typeof p.name === "string" &&
          typeof p.slug === "string" &&
          typeof p.priceMinor === priceMinorType &&
          typeof p.currency === "string" &&
          typeof p.stockQty === stockQtyType &&
          typeof p.createdAt === "string" &&
          typeof p.updatedAt === "string" &&
          typeof p.category === "object" &&
          typeof p.category.id === "string" &&
          typeof p.category.name === "string" &&
          typeof p.category.slug === "string"
        );
      },
    });
    return responseData;
  }

  async getProductBySlug(variables = {}) {
    const query = this.isGraphQLClient 
      ? this.queries.GET_PRODUCT_BY_SLUG 
      : {
          method: 'GET',
          url: `/products/slug/${variables.slug}`,
          params: {}
        };

    const graphqlVariables = this.isGraphQLClient ? variables : {};
    const response = this.makeRequest(query, graphqlVariables);



    // Handle response based on client type
    const responseData = this.isGraphQLClient 
      ? response.parsed?.data?.productBySlug
      : response.parsed;

    check(response, {
      "productBySlug: response parsed": (r) => r.parsed !== null,
      "productBySlug: success true": (r) => {
        const data = this.isGraphQLClient ? r.parsed?.data?.productBySlug : r.parsed;
        return data?.success === true;
      },
      "productBySlug: message is correct": (r) => {
        const data = this.isGraphQLClient ? r.parsed?.data?.productBySlug : r.parsed;
        return data?.message === "Product fetched successfully";
      },
    });
    
    check(response, {
      "productBySlug: product data matches expected values": (r) => {
        const data = this.isGraphQLClient ? r.parsed?.data?.productBySlug : r.parsed;
        const p = data?.product;
        if (!p) return false;
        
        // For REST API, priceMinor comes as string, for GraphQL as number
        const expectedPrice = this.isGraphQLClient ? 24999 : "24999";
        
        return (
          p.name === "AirPods Pro" &&
          p.slug === "airpods-pro" &&
          p.priceMinor === expectedPrice &&
          p.currency === "USD" &&
          p.category.name === "Electronics" &&
          p.category.slug === "electronics"
        );
      },
    });

    return responseData;
  }

  async getFeaturedProducts(variables = {}) {
    const query = this.isGraphQLClient 
      ? this.queries.GET_FEATURED_PRODUCTS 
      : {
          method: 'GET',
          url: '/products/featured',
          params: variables
        };

    const graphqlVariables = this.isGraphQLClient ? variables : {};
    const response = this.makeRequest(query, graphqlVariables);



    // Handle response based on client type
    const responseData = this.isGraphQLClient 
      ? response.parsed?.data?.featuredProducts
      : response.parsed;

    check(response, {
      "featuredProducts: response parsed": (r) => r.parsed !== null,
      "featuredProducts: success true": (r) => {
        const data = this.isGraphQLClient ? r.parsed?.data?.featuredProducts : r.parsed;
        return data?.success === true;
      },
      "featuredProducts: message is correct": (r) => {
        const data = this.isGraphQLClient ? r.parsed?.data?.featuredProducts : r.parsed;
        return data?.message === "Products are sent";
      },
    });

    check(response, {
      "featuredProducts: pagination total is 12": (r) => {
        const data = this.isGraphQLClient ? r.parsed?.data?.featuredProducts : r.parsed;
        return data?.pagination?.total === 12;
      },
      "featuredProducts: pagination limit is 8": (r) => {
        const data = this.isGraphQLClient ? r.parsed?.data?.featuredProducts : r.parsed;
        return data?.pagination?.limit === 8;
      },
      "featuredProducts: pagination total pages is 2": (r) => {
        const data = this.isGraphQLClient ? r.parsed?.data?.featuredProducts : r.parsed;
        return data?.pagination?.totalPages === 2;
      },
    });

    check(response, {
      "featuredProducts: products array exists": (r) => {
        const data = this.isGraphQLClient ? r.parsed?.data?.featuredProducts : r.parsed;
        return Array.isArray(data?.products);
      },
      "featuredProducts: has 8 products": (r) => {
        const data = this.isGraphQLClient ? r.parsed?.data?.featuredProducts : r.parsed;
        return data?.products?.length === 8;
      },
    });

    check(response, {
      "featuredProducts: data fields are correct": (r) => {
        const data = this.isGraphQLClient ? r.parsed?.data?.featuredProducts : r.parsed;
        const p = data?.products?.[0];
        if (!p) return false;
        
        // For REST API, priceMinor comes as string, for GraphQL as number
        const priceMinorType = this.isGraphQLClient ? "number" : "string";
        const stockQtyType = this.isGraphQLClient ? "number" : "number";
        
        return (
          typeof p.id === "string" &&
          typeof p.name === "string" &&
          typeof p.slug === "string" &&
          typeof p.priceMinor === priceMinorType &&
          typeof p.currency === "string" &&
          typeof p.stockQty === stockQtyType &&
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
        const data = this.isGraphQLClient ? r.parsed?.data?.featuredProducts : r.parsed;
        const products = data?.products;
        if (!products || !Array.isArray(products) || products.length === 0) {
          return false;
        }
        return products.every((p) => p && p.stockQty > 0);
      },
    });

    return responseData;
  }

  async searchProducts(variables = {}) {
    const query = this.isGraphQLClient 
      ? this.queries.SEARCH_PRODUCTS 
      : {
          method: 'GET',
          url: '/products/search',
          params: {
            q: variables.search,
            category: variables.categoryId,
            inStock: variables.inStockOnly,
            page: variables.page,
            limit: variables.limit
          }
        };

    const graphqlVariables = this.isGraphQLClient ? variables : {};
    const response = this.makeRequest(query, graphqlVariables);



    // Handle response based on client type
    const responseData = this.isGraphQLClient 
      ? response.parsed?.data?.searchProducts
      : response.parsed;

    check(response, {
      "searchProducts: response parsed": (r) => r.parsed !== null,
      "searchProducts: success true": (r) => {
        const data = this.isGraphQLClient ? r.parsed?.data?.searchProducts : r.parsed;
        return data?.success === true;
      },
      "searchProducts: message is correct": (r) => {
        const data = this.isGraphQLClient ? r.parsed?.data?.searchProducts : r.parsed;
        return data?.message === "Products are sent";
      },
    });
    
    check(response, {
      "searchProducts: pagination total is 1": (r) => {
        const data = this.isGraphQLClient ? r.parsed?.data?.searchProducts : r.parsed;
        return data?.pagination?.total === 1;
      },
      "searchProducts: pagination limit is 10": (r) => {
        const data = this.isGraphQLClient ? r.parsed?.data?.searchProducts : r.parsed;
        return data?.pagination?.limit === 10;
      },
      "searchProducts: pagination total pages is 2": (r) => {
        const data = this.isGraphQLClient ? r.parsed?.data?.searchProducts : r.parsed;
        return data?.pagination?.totalPages === 1;
      },
    });

    check(response, {
      "searchProducts: products array exists": (r) => {
        const data = this.isGraphQLClient ? r.parsed?.data?.searchProducts : r.parsed;
        return Array.isArray(data?.products);
      },
      "searchProducts: has products": (r) => {
        const data = this.isGraphQLClient ? r.parsed?.data?.searchProducts : r.parsed;
        return data?.products?.length > 0;
      },
    });

    check(response, {
      "searchProducts: data fields are correct": (r) => {
        const data = this.isGraphQLClient ? r.parsed?.data?.searchProducts : r.parsed;
        const p = data?.products?.[0];
        if (!p) return false;
        
        // For REST API, priceMinor comes as string, for GraphQL as number
        const priceMinorType = this.isGraphQLClient ? "number" : "string";
        const stockQtyType = this.isGraphQLClient ? "number" : "number";
        
        return (
          typeof p.id === "string" &&
          typeof p.name === "string" &&
          typeof p.slug === "string" &&
          typeof p.priceMinor === priceMinorType &&
          typeof p.currency === "string" &&
          typeof p.stockQty === stockQtyType &&
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
        const data = this.isGraphQLClient ? r.parsed?.data?.searchProducts : r.parsed;
        const products = data?.products;
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
          const data = this.isGraphQLClient ? r.parsed?.data?.searchProducts : r.parsed;
          const products = data?.products;
          if (!products || !Array.isArray(products) || products.length === 0) {
            return false;
          }
          return products.every((p) => p && p.stockQty > 0);
        },
      });
    }

    return responseData;
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
    // Test 1: Get product by non-existent slug
    const query2 = this.isGraphQLClient 
      ? this.queries.GET_PRODUCT_BY_SLUG 
      : {
          method: 'GET',
          url: '/products/slug/non-existent-product-slug-12345',
          params: {}
        };

    const nonExistentSlugResponse = this.makeRequest(query2,
      this.isGraphQLClient ? { slug: "non-existent-product-slug-12345" } : {});



    check(nonExistentSlugResponse, {
      "productBySlug negative: response parsed for non-existent": (r) => r.parsed !== null,
      "productBySlug negative: success false for non-existent slug": (r) => {
        const data = this.isGraphQLClient ? r.parsed?.data?.productBySlug : r.parsed;
        return data?.success === false;
      },
      "productBySlug negative: correct error message for non-existent": (r) => {
        const data = this.isGraphQLClient ? r.parsed?.data?.productBySlug : r.parsed;
        return data?.message === "Product not found";
      },
    });

    // Test 3: Search with no results
    const query3 = this.isGraphQLClient 
      ? this.queries.SEARCH_PRODUCTS 
      : {
          method: 'GET',
          url: '/products/search',
          params: { 
            q: "nonexistentproductname12345xyz",
            page: 1,
            limit: 10 
          }
        };

    const noResultsSearchResponse = this.makeRequest(query3,
      this.isGraphQLClient ? { 
        search: "nonexistentproductname12345xyz",
        page: 1,
        limit: 10 
      } : {});



    check(noResultsSearchResponse, {
      "searchProducts negative: response parsed": (r) => r.parsed !== null,
      "searchProducts negative: success true but empty results": (r) => {
        const data = this.isGraphQLClient ? r.parsed?.data?.searchProducts : r.parsed;
        return data?.success === true;
      },
      "searchProducts negative: empty products array": (r) => {
        const data = this.isGraphQLClient ? r.parsed?.data?.searchProducts : r.parsed;
        return Array.isArray(data?.products) && data?.products?.length === 0;
      },
      "searchProducts negative: zero total count": (r) => {
        const data = this.isGraphQLClient ? r.parsed?.data?.searchProducts : r.parsed;
        return data?.pagination?.total === 0;
      },
    });

    sleep(TEST_CONFIG.TIMEOUTS.DEFAULT_SLEEP);
  }

  async runEdgeCaseTests() {
    // Test 1: Search with special characters and symbols
    const query1 = this.isGraphQLClient 
      ? this.queries.SEARCH_PRODUCTS 
      : {
          method: 'GET',
          url: '/products/search',
          params: { 
            q: "!@#$%^&*()",
            page: 1,
            limit: 10 
          }
        };

    const specialCharSearchResponse = this.makeRequest(query1,
      this.isGraphQLClient ? { 
        search: "!@#$%^&*()",
        page: 1,
        limit: 10 
      } : {});

    check(specialCharSearchResponse, {
      "searchProducts edge: response parsed for special chars": (r) => r.parsed !== null,
      "searchProducts edge: success true for special chars": (r) => {
        const data = this.isGraphQLClient ? r.parsed?.data?.searchProducts : r.parsed;
        return data?.success === true;
      },
      "searchProducts edge: handles special characters gracefully": (r) => {
        const data = this.isGraphQLClient ? r.parsed?.data?.searchProducts : r.parsed;
        return Array.isArray(data?.products);
      },
    });

    // Test 2: Search with very long string
    const query2 = this.isGraphQLClient 
      ? this.queries.SEARCH_PRODUCTS 
      : {
          method: 'GET',
          url: '/products/search',
          params: { 
            q: "a".repeat(1000),
            page: 1,
            limit: 10 
          }
        };

    const longSearchResponse = this.makeRequest(query2,
      this.isGraphQLClient ? { 
        search: "a".repeat(1000),
        page: 1,
        limit: 10 
      } : {});

    check(longSearchResponse, {
      "searchProducts edge: response parsed for long string": (r) => r.parsed !== null,
      "searchProducts edge: success true for long string": (r) => {
        const data = this.isGraphQLClient ? r.parsed?.data?.searchProducts : r.parsed;
        return data?.success === true;
      },
      "searchProducts edge: handles long search string": (r) => {
        const data = this.isGraphQLClient ? r.parsed?.data?.searchProducts : r.parsed;
        return Array.isArray(data?.products);
      },
    });

    // Test 3: Pagination with extreme values
    const query3 = this.isGraphQLClient 
      ? this.queries.GET_PRODUCTS 
      : {
          method: 'GET',
          url: '/products',
          params: { 
            page: 999999,
            limit: 1 
          }
        };

    const extremePaginationResponse = this.makeRequest(query3,
      this.isGraphQLClient ? { 
        page: 999999,
        limit: 1 
      } : {});

    check(extremePaginationResponse, {
      "products edge: response parsed for extreme pagination": (r) => r.parsed !== null,
      "products edge: success true for extreme pagination": (r) => {
        const data = this.isGraphQLClient ? r.parsed?.data?.products : r.parsed;
        return data?.success === true;
      },
      "products edge: empty results for out of range page": (r) => {
        const data = this.isGraphQLClient ? r.parsed?.data?.products : r.parsed;
        return Array.isArray(data?.products) && data?.products?.length === 0;
      },
    });

    // Test 4: Search with minimum limit (1)
    const query4 = this.isGraphQLClient 
      ? this.queries.SEARCH_PRODUCTS 
      : {
          method: 'GET',
          url: '/products/search',
          params: { 
            q: "AirPods",
            page: 1,
            limit: 1 
          }
        };

    const minLimitResponse = this.makeRequest(query4,
      this.isGraphQLClient ? { 
        search: "AirPods",
        page: 1,
        limit: 1 
      } : {});

    check(minLimitResponse, {
      "searchProducts edge: response parsed for min limit": (r) => r.parsed !== null,
      "searchProducts edge: success true for min limit": (r) => {
        const data = this.isGraphQLClient ? r.parsed?.data?.searchProducts : r.parsed;
        return data?.success === true;
      },
      "searchProducts edge: respects limit of 1": (r) => {
        const data = this.isGraphQLClient ? r.parsed?.data?.searchProducts : r.parsed;
        return data?.products?.length <= 1;
      },
      "searchProducts edge: pagination limit is 1": (r) => {
        const data = this.isGraphQLClient ? r.parsed?.data?.searchProducts : r.parsed;
        return data?.pagination?.limit === 1;
      },
    });

    // Test 5: Search with case sensitivity variations
    const query5 = this.isGraphQLClient 
      ? this.queries.SEARCH_PRODUCTS 
      : {
          method: 'GET',
          url: '/products/search',
          params: { 
            q: "AIRPODS",
            page: 1,
            limit: 10 
          }
        };

    const caseVariationsResponse = this.makeRequest(query5,
      this.isGraphQLClient ? { 
        search: "AIRPODS",
        page: 1,
        limit: 10 
      } : {});

    check(caseVariationsResponse, {
      "searchProducts edge: response parsed for uppercase": (r) => r.parsed !== null,
      "searchProducts edge: success true for uppercase": (r) => {
        const data = this.isGraphQLClient ? r.parsed?.data?.searchProducts : r.parsed;
        return data?.success === true;
      },
      "searchProducts edge: case insensitive search works": (r) => {
        const data = this.isGraphQLClient ? r.parsed?.data?.searchProducts : r.parsed;
        return data?.products?.length > 0;
      },
    });

    // Test 6: Product slug with whitespace
    const query6 = this.isGraphQLClient 
      ? this.queries.GET_PRODUCT_BY_SLUG 
      : {
          method: 'GET',
          url: `/products/slug/${encodeURIComponent("  airpods-pro  ")}`,
          params: {}
        };

    const whitespaceSlugResponse = this.makeRequest(query6,
      this.isGraphQLClient ? { slug: "  airpods-pro  " } : {});



    check(whitespaceSlugResponse, {
      "productBySlug edge: response parsed for whitespace": (r) => r.parsed !== null,
      "productBySlug edge: success true for trimmed slug": (r) => {
        const data = this.isGraphQLClient ? r.parsed?.data?.productBySlug : r.parsed;
        return data?.success === true;
      },
      "productBySlug edge: finds product despite whitespace": (r) => {
        const data = this.isGraphQLClient ? r.parsed?.data?.productBySlug : r.parsed;
        return data?.product?.slug === "airpods-pro";
      },
    });

    // Test 7: Featured products with maximum limit
    const query7 = this.isGraphQLClient 
      ? this.queries.GET_FEATURED_PRODUCTS 
      : {
          method: 'GET',
          url: '/products/featured',
          params: { limit: 100 }
        };

    const maxFeaturedResponse = this.makeRequest(query7,
      this.isGraphQLClient ? { limit: 100 } : {});

    check(maxFeaturedResponse, {
      "featuredProducts edge: response parsed for max limit": (r) => r.parsed !== null,
      "featuredProducts edge: success true for max limit": (r) => {
        const data = this.isGraphQLClient ? r.parsed?.data?.featuredProducts : r.parsed;
        return data?.success === true;
      },
      "featuredProducts edge: handles large limit gracefully": (r) => {
        const data = this.isGraphQLClient ? r.parsed?.data?.featuredProducts : r.parsed;
        return Array.isArray(data?.products);
      },
    });

    sleep(TEST_CONFIG.TIMEOUTS.DEFAULT_SLEEP);
  }
}