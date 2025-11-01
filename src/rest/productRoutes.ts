import { Router, Request, Response } from "express";
import { ProductService } from "../services/ProductService";
import { requireProductsReadPermission } from "../auth";
import { rateLimitMiddleware } from "../cache/RateLimitMiddleware";


const router = Router();
const productService = new ProductService();

// GET /products - List all products with pagination (public)
router.get(
  "/",
  rateLimitMiddleware.createCatalogRateLimit(),
  requireProductsReadPermission,
  async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string;
    const categoryId = req.query.categoryId as string;
    const inStockOnly = req.query.inStockOnly !== "false"; // Default to true for customers

    const result = await productService.getProductsForAdmin({
      page,
      limit,
      search,
      categoryId,
      inStockOnly,
    });
    res.json(result);
  } catch (error) {
    console.error("Get products error:", error);
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

// GET /products/:id - Get product by ID (public)
router.get(
  "/:id",
  rateLimitMiddleware.createCatalogRateLimit(),
  requireProductsReadPermission,
  async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const product = await productService.getProductForAdmin(id);
    res.json(product);
  } catch (error) {
    console.error("Get product error:", error);
    if (error instanceof Error && error.message === "Product not found") {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: "Failed to fetch product" });
  }
});

// GET /products/slug/:slug - Get product by slug (public)
router.get(
  "/slug/:slug",
  rateLimitMiddleware.createCatalogRateLimit(),
  requireProductsReadPermission,
  async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const product = await productService.findBySlug(slug);

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.json(product);
  } catch (error) {
    console.error("Get product by slug error:", error);
    res.status(500).json({ error: "Failed to fetch product" });
  }
});

// GET /products/category/:categoryId - Get products by category (public)
router.get(
  "/category/:categoryId",
  rateLimitMiddleware.createCatalogRateLimit(),
  requireProductsReadPermission,
  async (req: Request, res: Response) => {
  try {
    const { categoryId } = req.params;

    const products = await productService.findByCategoryId(categoryId);
    res.json(products);
  } catch (error) {
    console.error("Get products by category error:", error);
    res.status(500).json({ error: "Failed to fetch products by category" });
  }
});



// GET /products/featured - Get featured products
router.get(
  "/featured",
  rateLimitMiddleware.createCatalogRateLimit(),
  requireProductsReadPermission,
  async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 8;
    
    // For now, we'll get recent products in stock
    const result = await productService.getProductsForAdmin({
      page: 1,
      limit,
      inStockOnly: true,
    });
    
    res.json(result);
  } catch (error) {
    console.error("Get featured products error:", error);
    res.status(500).json({ error: "Failed to fetch featured products" });
  }
});

// GET /products/search - Advanced product search
router.get(
  "/search",
  rateLimitMiddleware.createCatalogRateLimit(),
  requireProductsReadPermission,
  async (req: Request, res: Response) => {
  try {
    const {
      q: search,
      category,
      inStock,
      page = "1",
      limit = "10",
    } = req.query;

    const result = await productService.getProductsForAdmin({
      search: search as string,
      categoryId: category as string,
      inStockOnly: inStock !== "false",
      page: parseInt(page as string),
      limit: parseInt(limit as string),
    });

    res.json(result);
  } catch (error) {
    console.error("Product search error:", error);
    res.status(500).json({ error: "Failed to search products" });
  }
});

export default router;