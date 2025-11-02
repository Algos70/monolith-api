import { Router, Request, Response } from "express";
import { OrderService } from "../services/OrderService";
import { SessionService } from "../services/SessionService";
import {
  requireOrdersReadPermission,
  requireOrdersWritePermission,
} from "../auth";
import { rateLimitMiddleware } from "../cache/RateLimitMiddleware";

const router = Router();
const orderService = new OrderService();

// GET /orders - Get user's orders
router.get(
  "/",
  rateLimitMiddleware.createIPRateLimit({ maxRequests: 300, message: "Too many order requests" }),
  requireOrdersReadPermission,
  async (req: Request, res: Response) => {
    try {
      const user = SessionService.getUser(req);
      const userId = user.sub || user.id;

      if (!userId) {
        return res.status(401).json({ error: "User ID not found in session" });
      }

      const orders = await orderService.findByUser(userId);
      res.json(orders);
    } catch (error) {
      console.error("Get user orders error:", error);
      res.status(500).json({ error: "Failed to fetch orders" });
    }
  }
);



// POST /orders - Create new order from cart
router.post(
  "/",
  rateLimitMiddleware.createIPRateLimit({ maxRequests: 30, message: "Too many order creation requests" }),
  requireOrdersWritePermission,
  async (req: Request, res: Response) => {
    try {
      const { walletId } = req.body;
      const user = SessionService.getUser(req);
      const userId = user.sub || user.id;

      if (!userId) {
        return res.status(401).json({ error: "User ID not found in session" });
      }

      if (!walletId) {
        return res.status(400).json({ error: "walletId is required" });
      }

      const order = await orderService.createOrderFromCart({
        userId,
        walletId,
      });

      res.status(201).json(order);
    } catch (error) {
      console.error("Create order error:", error);

      if (error instanceof Error) {
        if (error.message.includes("Cart is empty")) {
          return res.status(400).json({ error: error.message });
        }
        if (error.message.includes("Insufficient stock")) {
          return res.status(400).json({ error: error.message });
        }
        if (error.message.includes("Insufficient balance")) {
          return res.status(400).json({ error: error.message });
        }
        if (
          error.message.includes("currency") &&
          error.message.includes("does not match")
        ) {
          return res.status(400).json({ error: error.message });
        }
        if (error.message.includes("does not belong to user")) {
          return res.status(403).json({ error: error.message });
        }
        if (error.message.includes("not found")) {
          return res.status(404).json({ error: error.message });
        }
      }

      res.status(500).json({ error: "Failed to create order" });
    }
  }
);

export default router;
