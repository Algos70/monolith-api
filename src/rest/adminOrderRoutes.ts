import { Router, Request, Response } from "express";
import { OrderService } from "../services/OrderService";
import {
  requireAdminPanelReadPermissionForOrders,
  requireAdminPanelWritePermissionForOrders,
} from "../auth";

const router = Router();
const orderService = new OrderService();

// GET /admin/orders - List all orders with pagination
router.get(
  "/",
  requireAdminPanelReadPermissionForOrders,
  async (req: Request, res: Response) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const status = req.query.status as string;
      const userId = req.query.userId as string;

      const result = await orderService.getOrdersForAdmin({
        page,
        limit,
        status,
        userId,
      });
      res.json(result);
    } catch (error) {
      console.error("Get orders error:", error);
      res.status(500).json({ error: "Failed to fetch orders" });
    }
  }
);

// GET /admin/orders/:id - Get order by ID
router.get(
  "/:id",
  requireAdminPanelReadPermissionForOrders,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const order = await orderService.getOrderForAdmin(id);
      res.json(order);
    } catch (error) {
      console.error("Get order error:", error);
      if (error instanceof Error && error.message === "Order not found") {
        return res.status(404).json({ error: error.message });
      }
      res.status(500).json({ error: "Failed to fetch order" });
    }
  }
);

// POST /admin/orders - Create new order
router.post(
  "/",
  requireAdminPanelWritePermissionForOrders,
  async (req: Request, res: Response) => {
    try {
      const { userId, totalMinor, currency, status, items } = req.body;

      if (!userId || !totalMinor || !currency || !items) {
        return res.status(400).json({ 
          error: "userId, totalMinor, currency, and items are required" 
        });
      }

      if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ 
          error: "items must be a non-empty array" 
        });
      }

      const order = await orderService.createOrder({
        userId,
        totalMinor,
        currency,
        status: status || "PENDING",
        items,
      });
      res.status(201).json(order);
    } catch (error) {
      console.error("Create order error:", error);
      if (error instanceof Error) {
        if (error.message.includes("must have at least one item")) {
          return res.status(400).json({ error: error.message });
        }
      }
      res.status(500).json({ error: "Failed to create order" });
    }
  }
);

// PUT /admin/orders/:id - Update order
router.put(
  "/:id",
  requireAdminPanelWritePermissionForOrders,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { totalMinor, currency, status } = req.body;

      const updateData: any = {};
      if (totalMinor !== undefined) updateData.totalMinor = totalMinor;
      if (currency !== undefined) updateData.currency = currency;
      if (status !== undefined) updateData.status = status;

      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ error: "No valid fields to update" });
      }

      const order = await orderService.updateOrder(id, updateData);

      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }

      res.json(order);
    } catch (error) {
      console.error("Update order error:", error);
      if (error instanceof Error && error.message === "Order not found") {
        return res.status(404).json({ error: error.message });
      }
      res.status(500).json({ error: "Failed to update order" });
    }
  }
);

// PUT /admin/orders/:id/status - Update order status
router.put(
  "/:id/status",
  requireAdminPanelWritePermissionForOrders,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!status) {
        return res.status(400).json({ error: "Status is required" });
      }

      const order = await orderService.updateStatus(id, status);

      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }

      res.json(order);
    } catch (error) {
      console.error("Update order status error:", error);
      if (error instanceof Error) {
        if (error.message.includes("Invalid status")) {
          return res.status(400).json({ error: error.message });
        }
        if (error.message === "Order not found") {
          return res.status(404).json({ error: error.message });
        }
      }
      res.status(500).json({ error: "Failed to update order status" });
    }
  }
);

// DELETE /admin/orders/:id - Delete order
router.delete(
  "/:id",
  requireAdminPanelWritePermissionForOrders,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      await orderService.deleteOrder(id);
      res.status(204).send();
    } catch (error) {
      console.error("Delete order error:", error);
      if (error instanceof Error && error.message === "Order not found") {
        return res.status(404).json({ error: error.message });
      }
      res.status(500).json({ error: "Failed to delete order" });
    }
  }
);

// GET /admin/orders/status/:status - Get orders by status
router.get(
  "/status/:status",
  requireAdminPanelReadPermissionForOrders,
  async (req: Request, res: Response) => {
    try {
      const { status } = req.params;
      const orders = await orderService.findByStatus(status);
      res.json(orders);
    } catch (error) {
      console.error("Get orders by status error:", error);
      res.status(500).json({ error: "Failed to fetch orders by status" });
    }
  }
);

// GET /admin/orders/user/:userId - Get orders by user
router.get(
  "/user/:userId",
  requireAdminPanelReadPermissionForOrders,
  async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const orders = await orderService.findByUser(userId);
      res.json(orders);
    } catch (error) {
      console.error("Get orders by user error:", error);
      res.status(500).json({ error: "Failed to fetch orders by user" });
    }
  }
);

export default router;