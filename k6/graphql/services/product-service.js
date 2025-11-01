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

  async getProductsByCategory(variables = {}) {
    const response = this.client.requestWithParsing(
      PRODUCT_QUERIES.GET_PRODUCTS_BY_CATEGORY,
      variables,
      this.sessionHeaders
    );

    check(response, {
      "productsByCategory: response parsed": (r) => r.parsed !== null,
      "productsByCategory: success true": (r) =>
        r.parsed?.data?.productsByCategory?.success === true,
      "productsByCategory: message contains 'Found'": (r) =>
        r.parsed?.data?.productsByCategory?.message?.includes("Found"),
    });

    check(response, {
      "productsByCategory: products array exists": (r) =>
        Array.isArray(r.parsed?.data?.productsByCategory?.products),
      "productsByCategory: has products": (r) =>
        r.parsed?.data?.productsByCategory?.products?.length > 0,
    });

    check(response, {
      "productsByCategory: product data fields are correct": (r) => {
        const p = r.parsed?.data?.productsByCategory?.products?.[0];
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
      "productsByCategory: all products belong to requested category": (r) => {
        const products = r.parsed?.data?.productsByCategory?.products;
        if (!products || !Array.isArray(products) || products.length === 0) {
          return false;
        }
        return products.every(
          (p) => p && p.category && p.category.id === variables.categoryId
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
}
