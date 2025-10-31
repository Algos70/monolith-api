import { CategoryService } from "../../services/CategoryService";
import { UserInputError, type GraphQLContext } from "../utils/permissions";
import {
  RequireAdminPanelReadPermissionForCategory,
  RequireAdminPanelWritePermissionForCategory,
} from "../decorators/permissions";

const categoryService = new CategoryService();

export class AdminCategoryResolvers {
  @RequireAdminPanelReadPermissionForCategory()
  async adminCategories(
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
      console.error("GraphQL adminCategories error:", error);
      throw new Error("Failed to fetch categories");
    }
  }

  @RequireAdminPanelReadPermissionForCategory()
  async adminCategory(_: any, { id }: any, context: GraphQLContext) {
    try {
      return await categoryService.getCategoryWithProductsForAdmin(id);
    } catch (error) {
      console.error("GraphQL adminCategory error:", error);
      if (error instanceof Error && error.message === "Category not found") {
        throw new UserInputError(error.message);
      }
      throw new Error("Failed to fetch category");
    }
  }

  @RequireAdminPanelReadPermissionForCategory()
  async adminCategoryBySlug(_: any, { slug }: any, context: GraphQLContext) {
    try {
      const category = await categoryService.findBySlug(slug);
      if (!category) {
        throw new UserInputError("Category not found");
      }
      return category;
    } catch (error) {
      console.error("GraphQL adminCategoryBySlug error:", error);
      if (error instanceof UserInputError) {
        throw error;
      }
      throw new Error("Failed to fetch category");
    }
  }

  @RequireAdminPanelWritePermissionForCategory()
  async adminCreateCategory(_: any, { input }: any, context: GraphQLContext) {
    try {
      const { slug, name } = input;

      if (!slug || !name) {
        throw new UserInputError("Slug and name are required");
      }

      return await categoryService.createCategory({ slug, name });
    } catch (error) {
      console.error("GraphQL adminCreateCategory error:", error);
      if (
        error instanceof Error &&
        error.message === "Category with this slug already exists"
      ) {
        throw new UserInputError(error.message);
      }
      throw new Error("Failed to create category");
    }
  }

  @RequireAdminPanelWritePermissionForCategory()
  async adminUpdateCategory(
    _: any,
    { id, input }: any,
    context: GraphQLContext
  ) {
    try {
      const { slug, name } = input;

      const updateData: any = {};
      if (slug !== undefined) updateData.slug = slug;
      if (name !== undefined) updateData.name = name;

      if (Object.keys(updateData).length === 0) {
        throw new UserInputError("No valid fields to update");
      }

      const category = await categoryService.updateCategory(id, updateData);

      if (!category) {
        throw new UserInputError("Category not found");
      }

      return category;
    } catch (error) {
      console.error("GraphQL adminUpdateCategory error:", error);
      if (
        error instanceof Error &&
        error.message === "Category with this slug already exists"
      ) {
        throw new UserInputError(error.message);
      }
      if (error instanceof UserInputError) {
        throw error;
      }
      throw new Error("Failed to update category");
    }
  }

  @RequireAdminPanelWritePermissionForCategory()
  async adminDeleteCategory(_: any, { id }: any, context: GraphQLContext) {
    try {
      await categoryService.deleteCategory(id);
      return true;
    } catch (error) {
      console.error("GraphQL adminDeleteCategory error:", error);
      if (error instanceof Error) {
        if (error.message === "Category not found") {
          throw new UserInputError(error.message);
        }
        if (
          error.message === "Cannot delete category with associated products"
        ) {
          throw new UserInputError(error.message);
        }
      }
      throw new Error("Failed to delete category");
    }
  }
}

// Export resolver instance
const adminCategoryResolversInstance = new AdminCategoryResolvers();

export const adminCategoryResolvers = {
  Query: {
    adminCategories: adminCategoryResolversInstance.adminCategories.bind(
      adminCategoryResolversInstance
    ),
    adminCategory: adminCategoryResolversInstance.adminCategory.bind(
      adminCategoryResolversInstance
    ),
    adminCategoryBySlug:
      adminCategoryResolversInstance.adminCategoryBySlug.bind(
        adminCategoryResolversInstance
      ),
  },
  Mutation: {
    adminCreateCategory:
      adminCategoryResolversInstance.adminCreateCategory.bind(
        adminCategoryResolversInstance
      ),
    adminUpdateCategory:
      adminCategoryResolversInstance.adminUpdateCategory.bind(
        adminCategoryResolversInstance
      ),
    adminDeleteCategory:
      adminCategoryResolversInstance.adminDeleteCategory.bind(
        adminCategoryResolversInstance
      ),
  },
};
