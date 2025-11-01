import { check } from "k6";
import { GraphQLClient } from "../utils/graphql-client.js";
import { PRODUCT_QUERIES } from "../queries/product-queries.js";

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
          p.id === "debbe9ec-d7ad-47dc-af6c-d9001dd08844" &&
          p.name === "AirPods Pro" &&
          p.slug === "airpods-pro" &&
          p.priceMinor === 24999 &&
          p.currency === "USD" &&
          p.stockQty === 100 &&
          p.createdAt === "1761971826320" &&
          p.updatedAt === "1761971826320" &&
          p.category.id === "02f94490-358e-4de6-a725-67bed187a89f" &&
          p.category.name === "Electronics" &&
          p.category.slug === "electronics"
        );
      },
    });

    return response;
  }

  async getProductById(variables = {}) {
    const response = this.client.requestWithParsing(
      PRODUCT_QUERIES.GET_PRODUCT_BY_ID,
      variables,
      this.sessionHeaders
    );

    check(response, {
      "productById: response parsed": (r) => r.parsed !== null,
      "productById: success true": (r) =>
        r.parsed?.data?.product?.success === true,
      "productById: message is correct": (r) =>
        r.parsed?.data?.product?.message === "Product fetched succesfully",
    });

    check(response, {
      "productById: product data fields are correct": (r) => {
        const p = r.parsed?.data?.product?.product;
        return (
          p &&
          p.id === "debbe9ec-d7ad-47dc-af6c-d9001dd08844" &&
          p.name === "AirPods Pro" &&
          p.slug === "airpods-pro" &&
          p.priceMinor === 24999 &&
          p.currency === "USD" &&
          p.stockQty === 100 &&
          p.createdAt === "1761971826320" &&
          p.updatedAt === "1761971826320" &&
          p.category.id === "02f94490-358e-4de6-a725-67bed187a89f" &&
          p.category.name === "Electronics" &&
          p.category.slug === "electronics"
        );
      },
    });

    return response;
  }
}
