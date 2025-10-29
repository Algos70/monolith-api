import { ProductService } from "../../services/ProductService";
import { UserInputError, type GraphQLContext } from "../utils/permissions";
import {
  RequireAdminPanelReadPermissionForProducts,
  RequireAdminPanelWritePermissionForProducts,
} from "../decorators/permissions";

const productService = new ProductService();

export class AdminProductResolvers {
  @RequireAdminPanelReadPermissionForProducts()
  async adminProducts(
    _: any,
    { page = 1, limit = 10, search, categoryId, inStockOnly }: any,
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
      console.error("GraphQL adminProducts error:", error);
      throw new Error("Failed to fetch products");
    }
  }

  @RequireAdminPanelReadPermissionForProducts()
  async adminProduct(_: any, { id }: any, context: GraphQLContext) {
    try {
      return await productService.getProductForAdmin(id);
    } catch (error) {
      console.error("GraphQL adminProduct error:", error);
      if (error instanceof Error && error.message === "Product not found") {
        throw new UserInputError(error.message);
      }
      throw new Error("Failed to fetch product");
    }
  }

  @RequireAdminPanelReadPermissionForProducts()
  async adminProductBySlug(_: any, { slug }: any, context: GraphQLContext) {
    try {
      const product = await productService.findBySlug(slug);
      if (!product) {
        throw new UserInputError("Product not found");
      }
      return product;
    } catch (error) {
      console.error("GraphQL adminProductBySlug error:", error);
      if (error instanceof UserInputError) {
        throw error;
      }
      throw new Error("Failed to fetch product");
    }
  }

  @RequireAdminPanelReadPermissionForProducts()
  async adminProductsByCategory(
    _: any,
    { categoryId }: any,
    context: GraphQLContext
  ) {
    try {
      return await productService.findByCategoryId(categoryId);
    } catch (error) {
      console.error("GraphQL adminProductsByCategory error:", error);
      throw new Error("Failed to fetch products by category");
    }
  }

  @RequireAdminPanelReadPermissionForProducts()
  async adminProductStockCheck(
    _: any,
    { id, qty = 1 }: any,
    context: GraphQLContext
  ) {
    try {
      const inStock = await productService.isInStock(id, qty);
      return { inStock, requiredQty: qty };
    } catch (error) {
      console.error("GraphQL adminProductStockCheck error:", error);
      throw new Error("Failed to check stock");
    }
  }

  @RequireAdminPanelWritePermissionForProducts()
  async adminCreateProduct(_: any, { input }: any, context: GraphQLContext) {
    try {
      const { name, slug, priceMinor, currency, stockQty, categoryId } = input;

      return await productService.createProduct({
        name,
        slug,
        priceMinor,
        currency,
        stockQty,
        categoryId,
      });
    } catch (error) {
      console.error("GraphQL adminCreateProduct error:", error);
      if (error instanceof Error) {
        const validationError = error as any;
        if (validationError.code === "DUPLICATE") {
          throw new UserInputError(error.message);
        }
        if (validationError.code === "NOT_FOUND") {
          throw new UserInputError(error.message);
        }
        if (
          validationError.code === "REQUIRED" ||
          validationError.code === "INVALID_TYPE" ||
          validationError.code === "INVALID_FORMAT"
        ) {
          throw new UserInputError(error.message);
        }
      }
      throw new Error("Failed to create product");
    }
  }

  @RequireAdminPanelWritePermissionForProducts()
  async adminUpdateProduct(
    _: any,
    { id, input }: any,
    context: GraphQLContext
  ) {
    try {
      const { name, slug, priceMinor, currency, stockQty, categoryId } = input;

      const updateData: any = {};
      if (name !== undefined) updateData.name = name;
      if (slug !== undefined) updateData.slug = slug;
      if (priceMinor !== undefined) updateData.priceMinor = priceMinor;
      if (currency !== undefined) updateData.currency = currency;
      if (stockQty !== undefined) updateData.stockQty = stockQty;
      if (categoryId !== undefined) updateData.categoryId = categoryId;

      if (Object.keys(updateData).length === 0) {
        throw new UserInputError("No valid fields to update");
      }

      const product = await productService.updateProduct(id, updateData);
      return product;
    } catch (error) {
      console.error("GraphQL adminUpdateProduct error:", error);
      if (error instanceof Error) {
        const validationError = error as any;
        if (validationError.code === "NOT_FOUND") {
          throw new UserInputError(error.message);
        }
        if (validationError.code === "DUPLICATE") {
          throw new UserInputError(error.message);
        }
        if (
          validationError.code === "REQUIRED" ||
          validationError.code === "INVALID_TYPE" ||
          validationError.code === "INVALID_FORMAT"
        ) {
          throw new UserInputError(error.message);
        }
      }
      if (error instanceof UserInputError) {
        throw error;
      }
      throw new Error("Failed to update product");
    }
  }

  @RequireAdminPanelWritePermissionForProducts()
  async adminDeleteProduct(_: any, { id }: any, context: GraphQLContext) {
    try {
      await productService.deleteProduct(id);
      return true;
    } catch (error) {
      console.error("GraphQL adminDeleteProduct error:", error);
      if (error instanceof Error && error.message === "Product not found") {
        throw new UserInputError(error.message);
      }
      throw new Error("Failed to delete product");
    }
  }

  @RequireAdminPanelWritePermissionForProducts()
  async adminIncreaseProductStock(
    _: any,
    { id, input }: any,
    context: GraphQLContext
  ) {
    try {
      const { qty } = input;
      return await productService.increaseStock(id, qty);
    } catch (error) {
      console.error("GraphQL adminIncreaseProductStock error:", error);
      if (error instanceof Error) {
        const validationError = error as any;
        if (validationError.code === "INVALID_TYPE") {
          throw new UserInputError(error.message);
        }
        if (error.message.includes("Product not found")) {
          throw new UserInputError("Product not found");
        }
      }
      throw new Error("Failed to increase stock");
    }
  }

  @RequireAdminPanelWritePermissionForProducts()
  async adminDecreaseProductStock(
    _: any,
    { id, input }: any,
    context: GraphQLContext
  ) {
    try {
      const { qty } = input;
      return await productService.decreaseStock(id, qty);
    } catch (error) {
      console.error("GraphQL adminDecreaseProductStock error:", error);
      if (error instanceof Error) {
        const validationError = error as any;
        if (validationError.code === "INVALID_TYPE") {
          throw new UserInputError(error.message);
        }
        if (error.message.includes("Product not found")) {
          throw new UserInputError("Product not found");
        }
        if (error.message.includes("Insufficient stock")) {
          throw new UserInputError(error.message);
        }
      }
      throw new Error("Failed to decrease stock");
    }
  }

  @RequireAdminPanelWritePermissionForProducts()
  async adminUpdateProductPrice(
    _: any,
    { id, input }: any,
    context: GraphQLContext
  ) {
    try {
      const { priceMinor } = input;
      return await productService.updatePrice(id, priceMinor);
    } catch (error) {
      console.error("GraphQL adminUpdateProductPrice error:", error);
      if (error instanceof Error) {
        const validationError = error as any;
        if (validationError.code === "NOT_FOUND") {
          throw new UserInputError(error.message);
        }
        if (validationError.code === "INVALID_TYPE") {
          throw new UserInputError(error.message);
        }
      }
      throw new Error("Failed to update price");
    }
  }
}

// Export resolver instance
const adminProductResolversInstance = new AdminProductResolvers();

export const adminProductResolvers = {
  Query: {
    adminProducts: adminProductResolversInstance.adminProducts.bind(
      adminProductResolversInstance
    ),
    adminProduct: adminProductResolversInstance.adminProduct.bind(
      adminProductResolversInstance
    ),
    adminProductBySlug: adminProductResolversInstance.adminProductBySlug.bind(
      adminProductResolversInstance
    ),
    adminProductsByCategory:
      adminProductResolversInstance.adminProductsByCategory.bind(
        adminProductResolversInstance
      ),
    adminProductStockCheck:
      adminProductResolversInstance.adminProductStockCheck.bind(
        adminProductResolversInstance
      ),
  },
  Mutation: {
    adminCreateProduct: adminProductResolversInstance.adminCreateProduct.bind(
      adminProductResolversInstance
    ),
    adminUpdateProduct: adminProductResolversInstance.adminUpdateProduct.bind(
      adminProductResolversInstance
    ),
    adminDeleteProduct: adminProductResolversInstance.adminDeleteProduct.bind(
      adminProductResolversInstance
    ),
    adminIncreaseProductStock:
      adminProductResolversInstance.adminIncreaseProductStock.bind(
        adminProductResolversInstance
      ),
    adminDecreaseProductStock:
      adminProductResolversInstance.adminDecreaseProductStock.bind(
        adminProductResolversInstance
      ),
    adminUpdateProductPrice:
      adminProductResolversInstance.adminUpdateProductPrice.bind(
        adminProductResolversInstance
      ),
  },
};
