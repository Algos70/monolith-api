import { Router, Request, Response } from "express";
import { CategoryService } from "../services/CategoryService";
import { requireCategoriesReadPermission } from "../auth";

const router = Router();
const categoryService = new CategoryService();

// GET /categories - List all categories with pagination (public)
router.get(
  "/",
  requireCategoriesReadPermission,
  async (req: Request, res: Response) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = req.query.search as string;

      const result = await categoryService.getCategoriesForAdmin({
        page,
        limit,
        search,
      });
      res.json(result);
    } catch (error) {
      console.error("Get categories error:", error);
      res.status(500).json({ error: "Failed to fetch categories" });
    }
  }
);

// GET /categories/:id - Get category by ID (public)
router.get(
  "/:id",
  requireCategoriesReadPermission,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const category = await categoryService.getCategoryWithProductsForAdmin(
        id
      );
      res.json(category);
    } catch (error) {
      console.error("Get category error:", error);
      if (error instanceof Error && error.message === "Category not found") {
        return res.status(404).json({ error: error.message });
      }
      res.status(500).json({ error: "Failed to fetch category" });
    }
  }
);

// GET /categories/slug/:slug - Get category by slug (public)
router.get(
  "/slug/:slug",
  requireCategoriesReadPermission,
  async (req: Request, res: Response) => {
    try {
      const { slug } = req.params;
      const category = await categoryService.findBySlug(slug);

      if (!category) {
        return res.status(404).json({ error: "Category not found" });
      }

      res.json(category);
    } catch (error) {
      console.error("Get category by slug error:", error);
      res.status(500).json({ error: "Failed to fetch category" });
    }
  }
);

// GET /categories/slug/:slug/products - Get products in a category by slug
router.get(
  "/slug/:slug/products",
  requireCategoriesReadPermission,
  async (req: Request, res: Response) => {
    try {
      const { slug } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const inStockOnly = req.query.inStockOnly !== "false"; // Default to true for customers

      // First find the category by slug
      const category = await categoryService.findBySlug(slug);

      if (!category) {
        return res.status(404).json({ error: "Category not found" });
      }

      // Then get the category with products
      const categoryWithProducts =
        await categoryService.getCategoryWithProductsForAdmin(category.id);

      // Filter products based on stock if needed
      let products = categoryWithProducts.products || [];
      if (inStockOnly) {
        products = products.filter((product) => product.stockQty > 0);
      }

      // Simple pagination
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedProducts = products.slice(startIndex, endIndex);

      res.json({
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
      });
    } catch (error) {
      console.error("Get category products error:", error);
      res.status(500).json({ error: "Failed to fetch category products" });
    }
  }
);
export default router;
