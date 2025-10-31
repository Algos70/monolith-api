import { Router, Request, Response } from "express";
import { CategoryService } from "../services/CategoryService";
import {
  requireAdminPanelWritePermissionForCategory,
  requireAdminPanelReadPermissionForCategory,
} from "../auth";

const router = Router();
const categoryService = new CategoryService();

// GET /admin/categories - List all categories with pagination
router.get(
  "/",
  requireAdminPanelReadPermissionForCategory,
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

// GET /admin/categories/:id - Get category by ID
router.get(
  "/:id",
  requireAdminPanelReadPermissionForCategory,
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

// POST /admin/categories - Create new category
router.post(
  "/",
  requireAdminPanelWritePermissionForCategory,
  async (req: Request, res: Response) => {
    try {
      const { slug, name } = req.body;

      if (!slug || !name) {
        return res.status(400).json({ error: "Slug and name are required" });
      }

      const category = await categoryService.createCategory({ slug, name });
      res.status(201).json(category);
    } catch (error) {
      console.error("Create category error:", error);
      if (
        error instanceof Error &&
        error.message === "Category with this slug already exists"
      ) {
        return res.status(409).json({ error: error.message });
      }
      res.status(500).json({ error: "Failed to create category" });
    }
  }
);

// PUT /admin/categories/:id - Update category
router.put(
  "/:id",
  requireAdminPanelWritePermissionForCategory,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { slug, name } = req.body;

      const updateData: any = {};
      if (slug !== undefined) updateData.slug = slug;
      if (name !== undefined) updateData.name = name;

      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ error: "No valid fields to update" });
      }

      const category = await categoryService.updateCategory(id, updateData);

      if (!category) {
        return res.status(404).json({ error: "Category not found" });
      }

      res.json(category);
    } catch (error) {
      console.error("Update category error:", error);
      if (
        error instanceof Error &&
        error.message === "Category with this slug already exists"
      ) {
        return res.status(409).json({ error: error.message });
      }
      res.status(500).json({ error: "Failed to update category" });
    }
  }
);

// DELETE /admin/categories/:id - Delete category
router.delete(
  "/:id",
  requireAdminPanelWritePermissionForCategory,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      await categoryService.deleteCategory(id);
      res.status(204).send();
    } catch (error) {
      console.error("Delete category error:", error);
      if (error instanceof Error) {
        if (error.message === "Category not found") {
          return res.status(404).json({ error: error.message });
        }
        if (
          error.message === "Cannot delete category with associated products"
        ) {
          return res.status(409).json({ error: error.message });
        }
      }
      res.status(500).json({ error: "Failed to delete category" });
    }
  }
);

// GET /admin/categories/slug/:slug - Get category by slug
router.get(
  "/slug/:slug",
  requireAdminPanelReadPermissionForCategory,
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

export default router;
