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
        return res.status(400).json({ 
          success: false,
          message: "User ID not found",
          orders: []
        });
      }

      const orders = await orderService.findByUser(userId);
      res.json({
        success: true,
        message: "Orders retrieved successfully",
        orders
      });
    } catch (error) {
      console.error("Get user orders error:", error);
      res.status(500).json({ 
        success: false,
        message: error instanceof Error ? error.message : "Failed to retrieve orders",
        orders: []
      });
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
        return res.status(400).json({ 
          success: false,
          message: "User ID not found",
          order: null
        });
      }

      if (!walletId) {
        return res.status(400).json({ 
          success: false,
          message: "walletId is required",
          order: null
        });
      }

      const order = await orderService.createOrderFromCart({
        userId,
        walletId,
      });

      res.status(201).json({
        success: true,
        message: "Order created successfully",
        order
      });
    } catch (error) {
      console.error("Create order error:", error);
      res.status(400).json({ 
        success: false,
        message: error instanceof Error ? error.message : "Failed to create order",
        order: null
      });
    }
  }
);

export default router;
