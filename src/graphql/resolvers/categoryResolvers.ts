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
    // Validate and sanitize input parameters at GraphQL level
    const sanitizedPage = Math.max(1, page || 1);
    const sanitizedLimit = Math.max(1, Math.min(100, limit || 10));
    
    return await categoryService.getCategoriesForAdmin({
      page: sanitizedPage,
      limit: sanitizedLimit,
      search,
    });
  }

  @RequirePermission("categories_read")
  async category(_: any, { id }: any, context: GraphQLContext) {
    return await categoryService.getCategoryWithProductsForAdmin(id);
  }

  @RequirePermission("categories_read")
  async categoryBySlug(_: any, { slug }: any, context: GraphQLContext) {
    return await categoryService.getCategoryBySlug(slug);
  }

  @RequirePermission("categories_read")
  async categoryProducts(
    _: any,
    { slug, page = 1, limit = 10, inStockOnly = true }: any,
    context: GraphQLContext
  ) {
    // First find the category by slug
    const categoryResult = await categoryService.getCategoryBySlug(slug);
    
    if (!categoryResult.success || !categoryResult.category) {
      return {
        success: false,
        message: categoryResult.message,
      };
    }

    // Get paginated products using the new method
    return await categoryService.getCategoryProductsPaginated(categoryResult.category.id, {
      page,
      limit,
      inStockOnly,
    });
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