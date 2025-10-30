import { ProductService } from "../../services/ProductService";
import { UserInputError, type GraphQLContext } from "../utils/permissions";
import { RequirePermission } from "../decorators/permissions";

const productService = new ProductService();

export class ProductResolvers {
  @RequirePermission("products_read")
  async products(
    _: any,
    { page = 1, limit = 10, search, categoryId, inStockOnly = true }: any,
    context: GraphQLContext
  ) {
    try {
      return await productService.getProductsForAdmin({
        page,
        limit,
        search,
        categoryId,
        inStockOnly,
      });
    } catch (error) {
      console.error("GraphQL products error:", error);
      throw new Error("Failed to fetch products");
    }
  }

  @RequirePermission("products_read")
  async product(_: any, { id }: any, context: GraphQLContext) {
    try {
      return await productService.getProductForAdmin(id);
    } catch (error) {
      console.error("GraphQL product error:", error);
      if (error instanceof Error && error.message === "Product not found") {
        throw new UserInputError(error.message);
      }
      throw new Error("Failed to fetch product");
    }
  }

  @RequirePermission("products_read")
  async productBySlug(_: any, { slug }: any, context: GraphQLContext) {
    try {
      const product = await productService.findBySlug(slug);
      if (!product) {
        throw new UserInputError("Product not found");
      }
      return product;
    } catch (error) {
      console.error("GraphQL productBySlug error:", error);
      if (error instanceof UserInputError) {
        throw error;
      }
      throw new Error("Failed to fetch product");
    }
  }

  @RequirePermission("products_read")
  async productsByCategory(
    _: any,
    { categoryId }: any,
    context: GraphQLContext
  ) {
    try {
      return await productService.findByCategoryId(categoryId);
    } catch (error) {
      console.error("GraphQL productsByCategory error:", error);
      throw new Error("Failed to fetch products by category");
    }
  }

  @RequirePermission("products_read")
  async productAvailability(
    _: any,
    { id, qty = 1 }: any,
    context: GraphQLContext
  ) {
    try {
      const product = await productService.getProductForAdmin(id);
      const inStock = await productService.isInStock(id, qty);

      return {
        productId: id,
        available: inStock,
        requiredQty: qty,
        stockQty: product.stockQty,
      };
    } catch (error) {
      console.error("GraphQL productAvailability error:", error);
      if (error instanceof Error && error.message === "Product not found") {
        throw new UserInputError(error.message);
      }
      throw new Error("Failed to check product availability");
    }
  }

  @RequirePermission("products_read")
  async featuredProducts(_: any, { limit = 8 }: any, context: GraphQLContext) {
    try {
      return await productService.getProductsForAdmin({
        page: 1,
        limit,
        inStockOnly: true,
      });
    } catch (error) {
      console.error("GraphQL featuredProducts error:", error);
      throw new Error("Failed to fetch featured products");
    }
  }

  @RequirePermission("products_read")
  async searchProducts(
    _: any,
    { search, categoryId, inStockOnly = true, page = 1, limit = 10 }: any,
    context: GraphQLContext
  ) {
    try {
      return await productService.getProductsForAdmin({
        search,
        categoryId,
        inStockOnly,
        page,
        limit,
      });
    } catch (error) {
      console.error("GraphQL searchProducts error:", error);
      throw new Error("Failed to search products");
    }
  }
}

// Export resolver instance
const productResolversInstance = new ProductResolvers();

export const productResolvers = {
  Query: {
    products: productResolversInstance.products.bind(productResolversInstance),
    product: productResolversInstance.product.bind(productResolversInstance),
    productBySlug: productResolversInstance.productBySlug.bind(
      productResolversInstance
    ),
    productsByCategory: productResolversInstance.productsByCategory.bind(
      productResolversInstance
    ),
    productAvailability: productResolversInstance.productAvailability.bind(
      productResolversInstance
    ),
    featuredProducts: productResolversInstance.featuredProducts.bind(
      productResolversInstance
    ),
    searchProducts: productResolversInstance.searchProducts.bind(
      productResolversInstance
    ),
  },
};
