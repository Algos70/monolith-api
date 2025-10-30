import { Router, Request, Response } from "express";
import { CategoryService } from "../services/CategoryService";
import { requireCategoriesReadPermission } from "../auth";
import { rateLimitMiddleware } from "../cache/RateLimitMiddleware";

const router = Router();
const categoryService = new CategoryService();

// GET /categories - List all categories with pagination (public)
router.get(
  "/",
  rateLimitMiddleware.createCatalogRateLimit(),
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
  rateLimitMiddleware.createCatalogRateLimit(),
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
  rateLimitMiddleware.createCatalogRateLimit(),
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
  rateLimitMiddleware.createCatalogRateLimit(),
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

      // Get paginated products using the new method
      const result = await categoryService.getCategoryProductsPaginated(
        category.id,
        {
          page,
          limit,
          inStockOnly,
        }
      );

      res.json(result);
    } catch (error) {
      console.error("Get category products error:", error);
      res.status(500).json({ error: "Failed to fetch category products" });
    }
  }
);
export default router;
