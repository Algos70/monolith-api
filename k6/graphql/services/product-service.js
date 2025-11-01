import { GraphQLClient } from '../utils/graphql-client.js';
import { PRODUCT_QUERIES } from '../queries/product-queries.js';

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
    return response
  }

}