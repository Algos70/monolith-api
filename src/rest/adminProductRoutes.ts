import { Router, Request, Response } from "express";
import { ProductService } from "../services/ProductService";
import {
  requireAdminPanelReadPermissionForProducts,
  requireAdminPanelWritePermissionForProducts,
} from "../auth";

const router = Router();
const productService = new ProductService();

// GET /admin/products - List all products with pagination
router.get(
  "/",
  requireAdminPanelReadPermissionForProducts,
  async (req: Request, res: Response) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = req.query.search as string;
      const categoryId = req.query.categoryId as string;
      const inStockOnly = req.query.inStockOnly === "true";

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
  }
);

// GET /admin/products/:id - Get product by ID
router.get(
  "/:id",
  requireAdminPanelReadPermissionForProducts,
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
  }
);

// POST /admin/products - Create new product
router.post(
  "/",
  requireAdminPanelWritePermissionForProducts,
  async (req: Request, res: Response) => {
    try {
      const { name, slug, priceMinor, currency, stockQty, categoryId } =
        req.body;

      const product = await productService.createProduct({
        name,
        slug,
        priceMinor,
        currency,
        stockQty,
        categoryId,
      });
      res.status(201).json(product);
    } catch (error) {
      console.error("Create product error:", error);
      if (error instanceof Error) {
        const validationError = error as any;
        if (validationError.code === "DUPLICATE") {
          return res.status(409).json({ error: error.message });
        }
        if (validationError.code === "NOT_FOUND") {
          return res.status(400).json({ error: error.message });
        }
        if (
          validationError.code === "REQUIRED" ||
          validationError.code === "INVALID_TYPE" ||
          validationError.code === "INVALID_FORMAT"
        ) {
          return res.status(400).json({ error: error.message });
        }
      }
      res.status(500).json({ error: "Failed to create product" });
    }
  }
);

// PUT /admin/products/:id - Update product
router.put(
  "/:id",
  requireAdminPanelWritePermissionForProducts,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { name, slug, priceMinor, currency, stockQty, categoryId } =
        req.body;

      const updateData: any = {};
      if (name !== undefined) updateData.name = name;
      if (slug !== undefined) updateData.slug = slug;
      if (priceMinor !== undefined) updateData.priceMinor = priceMinor;
      if (currency !== undefined) updateData.currency = currency;
      if (stockQty !== undefined) updateData.stockQty = stockQty;
      if (categoryId !== undefined) updateData.categoryId = categoryId;

      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ error: "No valid fields to update" });
      }

      const product = await productService.updateProduct(id, updateData);
      res.json(product);
    } catch (error) {
      console.error("Update product error:", error);
      if (error instanceof Error) {
        const validationError = error as any;
        if (validationError.code === "NOT_FOUND") {
          return res.status(404).json({ error: error.message });
        }
        if (validationError.code === "DUPLICATE") {
          return res.status(409).json({ error: error.message });
        }
        if (
          validationError.code === "REQUIRED" ||
          validationError.code === "INVALID_TYPE" ||
          validationError.code === "INVALID_FORMAT"
        ) {
          return res.status(400).json({ error: error.message });
        }
      }
      res.status(500).json({ error: "Failed to update product" });
    }
  }
);

// DELETE /admin/products/:id - Delete product
router.delete(
  "/:id",
  requireAdminPanelWritePermissionForProducts,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      await productService.deleteProduct(id);
      res.status(204).send();
    } catch (error) {
      console.error("Delete product error:", error);
      if (error instanceof Error && error.message === "Product not found") {
        return res.status(404).json({ error: error.message });
      }
      res.status(500).json({ error: "Failed to delete product" });
    }
  }
);

// GET /admin/products/slug/:slug - Get product by slug
router.get(
  "/slug/:slug",
  requireAdminPanelReadPermissionForProducts,
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
  }
);

// GET /admin/products/category/:categoryId - Get products by category
router.get(
  "/category/:categoryId",
  requireAdminPanelReadPermissionForProducts,
  async (req: Request, res: Response) => {
    try {
      const { categoryId } = req.params;
      const products = await productService.findByCategoryId(categoryId);
      res.json(products);
    } catch (error) {
      console.error("Get products by category error:", error);
      res.status(500).json({ error: "Failed to fetch products by category" });
    }
  }
);

// POST /admin/products/:id/stock/increase - Increase product stock
router.post(
  "/:id/stock/increase",
  requireAdminPanelWritePermissionForProducts,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { qty } = req.body;

      const product = await productService.increaseStock(id, qty);
      res.json(product);
    } catch (error) {
      console.error("Increase stock error:", error);
      if (error instanceof Error) {
        const validationError = error as any;
        if (validationError.code === "INVALID_TYPE") {
          return res.status(400).json({ error: error.message });
        }
        if (error.message.includes("Product not found")) {
          return res.status(404).json({ error: "Product not found" });
        }
      }
      res.status(500).json({ error: "Failed to increase stock" });
    }
  }
);

// POST /admin/products/:id/stock/decrease - Decrease product stock
router.post(
  "/:id/stock/decrease",
  requireAdminPanelWritePermissionForProducts,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { qty } = req.body;

      const product = await productService.decreaseStock(id, qty);
      res.json(product);
    } catch (error) {
      console.error("Decrease stock error:", error);
      if (error instanceof Error) {
        const validationError = error as any;
        if (validationError.code === "INVALID_TYPE") {
          return res.status(400).json({ error: error.message });
        }
        if (error.message.includes("Product not found")) {
          return res.status(404).json({ error: "Product not found" });
        }
        if (error.message.includes("Insufficient stock")) {
          return res.status(400).json({ error: error.message });
        }
      }
      res.status(500).json({ error: "Failed to decrease stock" });
    }
  }
);

// PUT /admin/products/:id/price - Update product price
router.put(
  "/:id/price",
  requireAdminPanelWritePermissionForProducts,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { priceMinor } = req.body;

      const product = await productService.updatePrice(id, priceMinor);
      res.json(product);
    } catch (error) {
      console.error("Update price error:", error);
      if (error instanceof Error) {
        const validationError = error as any;
        if (validationError.code === "NOT_FOUND") {
          return res.status(404).json({ error: error.message });
        }
        if (validationError.code === "INVALID_TYPE") {
          return res.status(400).json({ error: error.message });
        }
      }
      res.status(500).json({ error: "Failed to update price" });
    }
  }
);

// GET /admin/products/:id/stock-check - Check if product is in stock
router.get(
  "/:id/stock-check",
  requireAdminPanelReadPermissionForProducts,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const requiredQty = parseInt(req.query.qty as string) || 1;

      const inStock = await productService.isInStock(id, requiredQty);
      res.json({ inStock, requiredQty });
    } catch (error) {
      console.error("Stock check error:", error);
      res.status(500).json({ error: "Failed to check stock" });
    }
  }
);

export default router;
