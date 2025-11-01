import { GraphQLClient } from '../utils/graphql-client.js';
import { PRODUCT_QUERIES } from '../queries/product-queries.js';
import { 
  logTestStep,
  checkTestScenario 
} from '../utils/test-helpers.js';

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

    logTestStep('GET PRODUCTS', response, response.parsed);

    const scenarioName = `Get Products${variables.page ? ` (Page ${variables.page})` : ''}${variables.limit ? ` (Limit ${variables.limit})` : ''}`;
    const success = checkTestScenario(
      scenarioName,
      response,
      (data) => {
        if (!data) return false;
        const products = data.products;
        return products && 
               Array.isArray(products.products) && 
               products.pagination &&
               products.products.length >= 0;
      },
      `Fetch products with pagination and filtering`
    );

    return { response, success, products: response.parsed.data?.products };
  }

  async getProductById(id) {
    const response = this.client.requestWithParsing(
      PRODUCT_QUERIES.GET_PRODUCT_BY_ID,
      { id },
      this.sessionHeaders
    );

    logTestStep('GET PRODUCT BY ID', response, response.parsed);

    const success = checkTestScenario(
      `Get Product by ID: ${id}`,
      response,
      (data) => data && data.product && data.product.id === id,
      `Fetch product with ID: ${id}`
    );

    return { response, success, product: response.parsed.data?.product };
  }

  async getProductBySlug(slug) {
    const response = this.client.requestWithParsing(
      PRODUCT_QUERIES.GET_PRODUCT_BY_SLUG,
      { slug },
      this.sessionHeaders
    );

    logTestStep('GET PRODUCT BY SLUG', response, response.parsed);

    const success = checkTestScenario(
      `Get Product by Slug: ${slug}`,
      response,
      (data) => data && data.productBySlug && data.productBySlug.slug === slug,
      `Fetch product with slug: ${slug}`
    );

    return { response, success, product: response.parsed.data?.productBySlug };
  }

  async getProductsByCategory(categoryId) {
    const response = this.client.requestWithParsing(
      PRODUCT_QUERIES.GET_PRODUCTS_BY_CATEGORY,
      { categoryId },
      this.sessionHeaders
    );

    logTestStep('GET PRODUCTS BY CATEGORY', response, response.parsed);

    const success = checkTestScenario(
      `Get Products by Category: ${categoryId}`,
      response,
      (data) => {
        if (!data) return false;
        const products = data.productsByCategory;
        return Array.isArray(products) && 
               products.every(p => p.category && p.category.id === categoryId);
      },
      `Fetch all products in category: ${categoryId}`
    );

    return { response, success, products: response.parsed.data?.productsByCategory };
  }

  async checkProductAvailability(id, qty = 1) {
    const response = this.client.requestWithParsing(
      PRODUCT_QUERIES.CHECK_PRODUCT_AVAILABILITY,
      { id, qty },
      this.sessionHeaders
    );

    logTestStep('CHECK PRODUCT AVAILABILITY', response, response.parsed);

    const success = checkTestScenario(
      `Check Availability: ${qty} units of product ${id}`,
      response,
      (data) => {
        if (!data) return false;
        const availability = data.productAvailability;
        return availability && 
               availability.productId === id &&
               typeof availability.available === 'boolean';
      },
      `Check if ${qty} units are available for product ${id}`
    );

    return { response, success, availability: response.parsed.data?.productAvailability };
  }

  async getFeaturedProducts(limit = 8) {
    const response = this.client.requestWithParsing(
      PRODUCT_QUERIES.GET_FEATURED_PRODUCTS,
      { limit },
      this.sessionHeaders
    );

    logTestStep('GET FEATURED PRODUCTS', response, response.parsed);

    const success = checkTestScenario(
      `Get Featured Products (Limit: ${limit})`,
      response,
      (data) => {
        if (!data) return false;
        const featured = data.featuredProducts;
        return featured && 
               Array.isArray(featured.products) && 
               featured.products.length <= limit;
      },
      `Fetch up to ${limit} featured products`
    );

    return { response, success, products: response.parsed.data?.featuredProducts };
  }

  async searchProducts(variables = {}) {
    const response = this.client.requestWithParsing(
      PRODUCT_QUERIES.SEARCH_PRODUCTS,
      variables,
      this.sessionHeaders
    );

    logTestStep('SEARCH PRODUCTS', response, response.parsed);

    const searchTerm = variables.search || 'all';
    const success = checkTestScenario(
      `Search Products: "${searchTerm}"`,
      response,
      (data) => {
        if (!data) return false;
        const searchResults = data.searchProducts;
        return searchResults && 
               Array.isArray(searchResults.products) && 
               searchResults.pagination;
      },
      `Search products with term: "${searchTerm}"`
    );

    return { response, success, products: response.parsed.data?.searchProducts };
  }
}