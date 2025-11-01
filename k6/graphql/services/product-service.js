import { check } from 'k6';
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

    check(response, {
      'products: response parsed': (r) => r.parsed !== null,
      'products: success true': (r) => r.parsed?.data?.products?.success === true,
      'products: message is correct': (r) => r.parsed?.data?.products?.message === "Products are sent",

    });

    check(response, {
      'products: pagination total is 12': (r) =>
        r.parsed?.data?.products?.pagination?.total === 12,
      'products: pagination limit is 10': (r) =>
        r.parsed?.data?.products?.pagination?.limit === 10,
      'products: pagination total pages is 2': (r) =>
        r.parsed?.data?.products?.pagination?.totalPages === 2,
    });


    check(response, {
      'products: data fields are correct': (r) => {
        const p = r.parsed?.data?.products?.products?.[0];
        return (
          p &&
          typeof p.id === 'string' &&
          typeof p.name === 'string' &&
          typeof p.slug === 'string' &&
          typeof p.priceMinor === 'number' &&
          typeof p.currency === 'string' &&
          typeof p.stockQty === 'number' &&
          typeof p.createdAt === 'string' &&
          typeof p.updatedAt === 'string' &&
          typeof p.category === 'object' &&
          typeof p.category.id === 'string' &&
          typeof p.category.name === 'string' &&
          typeof p.category.slug === 'string'
        );
      },
    });
    return response
  }

  async getProductBySlug(variables = {}) {
    const response = this.client.requestWithParsing(
      PRODUCT_QUERIES.GET_PRODUCT_BY_SLUG,
      variables,
      this.sessionHeaders
    );

    console.log("response: ", response.parsed)
  }

}