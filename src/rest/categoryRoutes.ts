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
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string;

    const result = await categoryService.getCategoriesForAdmin({
      page,
      limit,
      search,
    });
    res.json(result);
  }
);

// GET /categories/:slug/products - Get products in a category by slug
router.get(
  "/:slug/products",
  rateLimitMiddleware.createCatalogRateLimit(),
  requireCategoriesReadPermission,
  async (req: Request, res: Response) => {
    const { slug } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const inStockOnly = req.query.inStockOnly !== "false"; // Default to true for customers

    // First find the category by slug
    const category = await categoryService.getCategoryBySlug(slug);

    if (!category.category?.id) {
      return res.status(404).json({ error: "Category not found" });
    }
    // Get paginated products using the new method
    const result = await categoryService.getCategoryProductsPaginated(
      category.category.id,
      {
        page,
        limit,
        inStockOnly,
      }
    );

    res.json(result);
  }
);

export default router;
