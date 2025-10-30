import { CategoryService } from "../../services/CategoryService";
import { UserInputError, type GraphQLContext } from "../utils/permissions";
import { RequirePermission } from "../decorators/permissions";

const categoryService = new CategoryService();

export class CategoryResolvers {
  @RequirePermission("categories_read")
  async categories(
    _: any,
    { page = 1, limit = 10, search }: any,
    context: GraphQLContext
  ) {
    try {
      return await categoryService.getCategoriesForAdmin({
        page,
        limit,
        search,
      });
    } catch (error) {
      console.error("GraphQL categories error:", error);
      throw new Error("Failed to fetch categories");
    }
  }

  @RequirePermission("categories_read")
  async category(_: any, { id }: any, context: GraphQLContext) {
    try {
      return await categoryService.getCategoryWithProductsForAdmin(id);
    } catch (error) {
      console.error("GraphQL category error:", error);
      if (error instanceof Error && error.message === "Category not found") {
        throw new UserInputError(error.message);
      }
      throw new Error("Failed to fetch category");
    }
  }

  @RequirePermission("categories_read")
  async categoryBySlug(_: any, { slug }: any, context: GraphQLContext) {
    try {
      const category = await categoryService.findBySlug(slug);
      if (!category) {
        throw new UserInputError("Category not found");
      }
      return category;
    } catch (error) {
      console.error("GraphQL categoryBySlug error:", error);
      if (error instanceof UserInputError) {
        throw error;
      }
      throw new Error("Failed to fetch category");
    }
  }

  @RequirePermission("categories_read")
  async categoryProducts(
    _: any,
    { slug, page = 1, limit = 10, inStockOnly = true }: any,
    context: GraphQLContext
  ) {
    try {
      // First find the category by slug
      const category = await categoryService.findBySlug(slug);
      
      if (!category) {
        throw new UserInputError("Category not found");
      }

      // Then get the category with products
      const categoryWithProducts = await categoryService.getCategoryWithProductsForAdmin(
        category.id
      );

      // Filter products based on stock if needed
      let products = categoryWithProducts.products || [];
      if (inStockOnly) {
        products = products.filter((product) => product.stockQty > 0);
      }

      // Simple pagination
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedProducts = products.slice(startIndex, endIndex);

      return {
        category: {
          id: category.id,
          name: category.name,
          slug: category.slug,
        },
        products: paginatedProducts,
        pagination: {
          page,
          limit,
          total: products.length,
          totalPages: Math.ceil(products.length / limit),
        },
      };
    } catch (error) {
      console.error("GraphQL categoryProducts error:", error);
      if (error instanceof UserInputError) {
        throw error;
      }
      throw new Error("Failed to fetch category products");
    }
  }
}

// Export resolver instance
const categoryResolversInstance = new CategoryResolvers();

export const categoryResolvers = {
  Query: {
    categories: categoryResolversInstance.categories.bind(
      categoryResolversInstance
    ),
    category: categoryResolversInstance.category.bind(
      categoryResolversInstance
    ),
    categoryBySlug: categoryResolversInstance.categoryBySlug.bind(
      categoryResolversInstance
    ),
    categoryProducts: categoryResolversInstance.categoryProducts.bind(
      categoryResolversInstance
    ),
  },
};