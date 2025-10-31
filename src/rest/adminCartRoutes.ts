import { Router, Request, Response } from "express";
import { CartService } from "../services/CartService";
import {
  requireAdminPanelReadPermissionForCarts,
  requireAdminPanelWritePermissionForCarts
} from "../auth";

const router = Router();
const cartService = new CartService();

// GET /admin/carts - List all carts with pagination
router.get(
  "/",
  requireAdminPanelReadPermissionForCarts,
  async (req: Request, res: Response) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = req.query.search as string;

      const result = await cartService.getCartsForAdmin({ page, limit, search });
      res.json(result);
    } catch (error) {
      console.error("Get carts error:", error);
      res.status(500).json({ error: "Failed to fetch carts" });
    }
  }
);

// GET /admin/carts/stats - Get cart statistics
router.get(
  "/stats",
  requireAdminPanelReadPermissionForCarts,
  async (req: Request, res: Response) => {
    try {
      const stats = await cartService.getCartStatsForAdmin();
      res.json(stats);
    } catch (error) {
      console.error("Get cart stats error:", error);
      res.status(500).json({ error: "Failed to fetch cart statistics" });
    }
  }
);

// GET /admin/carts/:id - Get cart by ID
router.get(
  "/:id",
  requireAdminPanelReadPermissionForCarts,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const cart = await cartService.getCartByIdForAdmin(id);
      res.json(cart);
    } catch (error) {
      console.error("Get cart error:", error);
      if (error instanceof Error && error.message === "Cart not found") {
        return res.status(404).json({ error: error.message });
      }
      res.status(500).json({ error: "Failed to fetch cart" });
    }
  }
);

// GET /admin/carts/:id/with-relations - Get cart with all relations
router.get(
  "/:id/with-relations",
  requireAdminPanelReadPermissionForCarts,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const include = req.query.include as string;
      
      const cart = await cartService.getCartWithRelationsForAdmin(id, include);
      res.json(cart);
    } catch (error) {
      console.error("Get cart with relations error:", error);
      if (error instanceof Error && error.message === "Cart not found") {
        return res.status(404).json({ error: error.message });
      }
      res.status(500).json({ error: "Failed to fetch cart with relations" });
    }
  }
);

// GET /admin/carts/user/:userId - Get carts by user ID
router.get(
  "/user/:userId",
  requireAdminPanelReadPermissionForCarts,
  async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const carts = await cartService.getCartsByUserIdForAdmin(userId);
      res.json(carts);
    } catch (error) {
      console.error("Get carts by user error:", error);
      if (error instanceof Error && error.message === "User not found") {
        return res.status(404).json({ error: error.message });
      }
      res.status(500).json({ error: "Failed to fetch user carts" });
    }
  }
);

// DELETE /admin/carts/:id - Delete cart
router.delete(
  "/:id",
  requireAdminPanelWritePermissionForCarts,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const result = await cartService.deleteCartForAdmin(id);
      res.json(result);
    } catch (error) {
      console.error("Delete cart error:", error);
      if (error instanceof Error && error.message === "Cart not found") {
        return res.status(404).json({ error: error.message });
      }
      res.status(500).json({ error: "Failed to delete cart" });
    }
  }
);

export default router;