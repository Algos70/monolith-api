import { Router, Request, Response } from "express";
import { CartService } from "../services/CartService";
import {
  requireCartReadPermissions,
  requireCartWritePermissions,
} from "../auth";
import { SessionService } from "../services/SessionService";
import { rateLimitMiddleware } from "../cache/RateLimitMiddleware";

const router = Router();
const cartService = new CartService();

// GET /cart - Get current user's cart with all items
router.get(
  "/",
  rateLimitMiddleware.createIPRateLimit({
    maxRequests: 600,
    message: "Too many cart requests",
  }),
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
  rateLimitMiddleware.createIPRateLimit({
    maxRequests: 150,
    message: "Too many add to cart requests",
  }),
  requireCartWritePermissions,
  async (req: Request, res: Response) => {
    try {
      const user = SessionService.getUser(req);
      const userId = user.sub;
      const { productId, quantity } = req.body;

      if (!productId || !quantity || quantity <= 0) {
        return res.status(400).json({
          error: "Product ID and valid quantity are required",
        });
      }

      const cart = await cartService.addItemToCart(userId, productId, quantity);
      res.json(cart);
    } catch (error) {
      console.error("Add item to cart error:", error);
      if (error instanceof Error && error.message.includes("not found")) {
        return res.status(404).json({ error: error.message });
      }
      if (error instanceof Error && error.message.includes("currency")) {
        return res.status(400).json({ error: error.message });
      }
      res.status(500).json({ error: "Failed to add item to cart" });
    }
  }
);

// DELETE /cart/items/:productId - Remove item from current user's cart
router.delete(
  "/items/:productId",
  rateLimitMiddleware.createIPRateLimit({
    maxRequests: 90,
    message: "Too many remove from cart requests",
  }),
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

// PUT /cart/items/:productId - Update item quantity in current user's cart
router.put(
  "/items/:productId",
  rateLimitMiddleware.createIPRateLimit({
    maxRequests: 150,
    message: "Too many update quantity requests",
  }),
  requireCartWritePermissions,
  async (req: Request, res: Response) => {
    try {
      const user = SessionService.getUser(req);
      const userId = user.sub;
      const { productId } = req.params;
      const { quantity } = req.body;

      if (!quantity || quantity < 0) {
        return res.status(400).json({
          error: "Valid quantity is required",
        });
      }

      const cart = await cartService.updateItemQuantity(
        userId,
        productId,
        quantity
      );
      res.json(cart);
    } catch (error) {
      console.error("Update item quantity error:", error);
      if (error instanceof Error && error.message === "Cart not found") {
        return res.status(404).json({ error: error.message });
      }
      res.status(500).json({ error: "Failed to update item quantity" });
    }
  }
);

// PATCH /cart/items/:productId/decrease - Decrease item quantity in current user's cart
router.patch(
  "/items/:productId/decrease",
  rateLimitMiddleware.createIPRateLimit({
    maxRequests: 150,
    message: "Too many decrease quantity requests",
  }),
  requireCartWritePermissions,
  async (req: Request, res: Response) => {
    try {
      const user = SessionService.getUser(req);
      const userId = user.sub;
      const { productId } = req.params;
      const { decreaseBy } = req.body;

      const decreaseAmount = decreaseBy && decreaseBy > 0 ? decreaseBy : 1;

      const cart = await cartService.decreaseItemQuantity(
        userId,
        productId,
        decreaseAmount
      );
      res.json(cart);
    } catch (error) {
      console.error("Decrease item quantity error:", error);
      if (
        error instanceof Error &&
        (error.message === "Cart not found" ||
          error.message === "Item not found in cart")
      ) {
        return res.status(404).json({ error: error.message });
      }
      res.status(500).json({ error: "Failed to decrease item quantity" });
    }
  }
);

// DELETE /cart - Clear current user's cart
router.delete(
  "/",
  rateLimitMiddleware.createIPRateLimit({
    maxRequests: 30,
    message: "Too many clear cart requests",
  }),
  requireCartWritePermissions,
  async (req: Request, res: Response) => {
    try {
      const user = SessionService.getUser(req);
      const userId = user.sub;

      const cart = await cartService.clearUserCart(userId);
      res.json({
        message: "Cart cleared successfully",
        cart,
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
