import { Router, Request, Response } from "express";
import { CartService } from "../services/CartService";
import { requireCartReadPermissions, requireCartWritePermissions } from "../auth";
import { SessionService } from "../services/SessionService";

const router = Router();
const cartService = new CartService();

// GET /cart - Get current user's cart with all items
router.get(
  "/",
  requireCartReadPermissions,
  async (req: Request, res: Response) => {
    try {
      const user = SessionService.getUser(req);
      const userId = user.sub;

      const cart = await cartService.getUserCart(userId);
      res.json(cart);
    } catch (error) {
      console.error("Get user cart error:", error);
      res.status(500).json({ error: "Failed to fetch cart" });
    }
  }
);

// POST /cart/items - Add item to current user's cart
router.post(
  "/items",
  requireCartWritePermissions,
  async (req: Request, res: Response) => {
    try {
      const user = SessionService.getUser(req);
      const userId = user.sub;
      const { productId, quantity } = req.body;

      if (!productId || !quantity || quantity <= 0) {
        return res.status(400).json({ 
          error: "Product ID and valid quantity are required" 
        });
      }

      const cart = await cartService.addItemToCart(userId, productId, quantity);
      res.json(cart);
    } catch (error) {
      console.error("Add item to cart error:", error);
      if (error instanceof Error && error.message.includes("not found")) {
        return res.status(404).json({ error: error.message });
      }
      res.status(500).json({ error: "Failed to add item to cart" });
    }
  }
);

// DELETE /cart/items/:productId - Remove item from current user's cart
router.delete(
  "/items/:productId",
  requireCartWritePermissions,
  async (req: Request, res: Response) => {
    try {
      const user = SessionService.getUser(req);
      const userId = user.sub;
      const { productId } = req.params;

      const cart = await cartService.removeItemFromCart(userId, productId);
      res.json(cart);
    } catch (error) {
      console.error("Remove item from cart error:", error);
      if (error instanceof Error && error.message === "Cart not found") {
        return res.status(404).json({ error: error.message });
      }
      res.status(500).json({ error: "Failed to remove item from cart" });
    }
  }
);

// DELETE /cart - Clear current user's cart
router.delete(
  "/",
  requireCartWritePermissions,
  async (req: Request, res: Response) => {
    try {
      const user = SessionService.getUser(req);
      const userId = user.sub;

      const cart = await cartService.clearUserCart(userId);
      res.json({ 
        message: "Cart cleared successfully",
        cart 
      });
    } catch (error) {
      console.error("Clear cart error:", error);
      if (error instanceof Error && error.message === "Cart not found") {
        return res.status(404).json({ error: error.message });
      }
      res.status(500).json({ error: "Failed to clear cart" });
    }
  }
);

export default router;