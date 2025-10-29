import { Router, Request, Response } from "express";
import { OrderItemService } from "../services/OrderItemService";
import {
  requireAdminPanelReadPermissionForOrderItems,
  requireAdminPanelWritePermissionForOrderItems,
} from "../auth";

const router = Router();
const orderItemService = new OrderItemService();

// GET /admin/order-items - List all order items with pagination
router.get(
  "/",
  requireAdminPanelReadPermissionForOrderItems,
  async (req: Request, res: Response) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const orderId = req.query.orderId as string;
      const productId = req.query.productId as string;

      const result = await orderItemService.getOrderItemsForAdmin({
        page,
        limit,
        orderId,
        productId,
      });
      res.json(result);
    } catch (error) {
      console.error("Get order items error:", error);
      res.status(500).json({ error: "Failed to fetch order items" });
    }
  }
);

// GET /admin/order-items/:id - Get order item by ID
router.get(
  "/:id",
  requireAdminPanelReadPermissionForOrderItems,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const orderItem = await orderItemService.getOrderItemForAdmin(id);
      res.json(orderItem);
    } catch (error) {
      console.error("Get order item error:", error);
      if (error instanceof Error && error.message === "Order item not found") {
        return res.status(404).json({ error: error.message });
      }
      res.status(500).json({ error: "Failed to fetch order item" });
    }
  }
);

// POST /admin/order-items - Create new order item
router.post(
  "/",
  requireAdminPanelWritePermissionForOrderItems,
  async (req: Request, res: Response) => {
    try {
      const { orderId, productId, qty, unitPriceMinor, currency } = req.body;

      if (!orderId || !productId || !qty || !unitPriceMinor || !currency) {
        return res.status(400).json({ 
          error: "orderId, productId, qty, unitPriceMinor, and currency are required" 
        });
      }

      if (typeof qty !== "number" || qty <= 0) {
        return res.status(400).json({ 
          error: "qty must be a positive number" 
        });
      }

      if (typeof unitPriceMinor !== "number" || unitPriceMinor < 0) {
        return res.status(400).json({ 
          error: "unitPriceMinor must be a non-negative number" 
        });
      }

      const orderItem = await orderItemService.createOrderItem({
        orderId,
        productId,
        qty,
        unitPriceMinor,
        currency,
      });
      res.status(201).json(orderItem);
    } catch (error) {
      console.error("Create order item error:", error);
      res.status(500).json({ error: "Failed to create order item" });
    }
  }
);

// PUT /admin/order-items/:id - Update order item
router.put(
  "/:id",
  requireAdminPanelWritePermissionForOrderItems,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { qty, unitPriceMinor, currency } = req.body;

      const updateData: any = {};
      if (qty !== undefined) {
        if (typeof qty !== "number" || qty <= 0) {
          return res.status(400).json({ 
            error: "qty must be a positive number" 
          });
        }
        updateData.qty = qty;
      }
      if (unitPriceMinor !== undefined) {
        if (typeof unitPriceMinor !== "number" || unitPriceMinor < 0) {
          return res.status(400).json({ 
            error: "unitPriceMinor must be a non-negative number" 
          });
        }
        updateData.unitPriceMinor = unitPriceMinor;
      }
      if (currency !== undefined) updateData.currency = currency;

      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ error: "No valid fields to update" });
      }

      const orderItem = await orderItemService.updateOrderItem(id, updateData);

      if (!orderItem) {
        return res.status(404).json({ error: "Order item not found" });
      }

      res.json(orderItem);
    } catch (error) {
      console.error("Update order item error:", error);
      if (error instanceof Error && error.message === "Order item not found") {
        return res.status(404).json({ error: error.message });
      }
      res.status(500).json({ error: "Failed to update order item" });
    }
  }
);

// DELETE /admin/order-items/:id - Delete order item
router.delete(
  "/:id",
  requireAdminPanelWritePermissionForOrderItems,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      await orderItemService.deleteOrderItem(id);
      res.status(204).send();
    } catch (error) {
      console.error("Delete order item error:", error);
      if (error instanceof Error && error.message === "Order item not found") {
        return res.status(404).json({ error: error.message });
      }
      res.status(500).json({ error: "Failed to delete order item" });
    }
  }
);

// GET /admin/order-items/order/:orderId - Get order items by order ID
router.get(
  "/order/:orderId",
  requireAdminPanelReadPermissionForOrderItems,
  async (req: Request, res: Response) => {
    try {
      const { orderId } = req.params;
      const orderItems = await orderItemService.findByOrderId(orderId);
      res.json(orderItems);
    } catch (error) {
      console.error("Get order items by order error:", error);
      res.status(500).json({ error: "Failed to fetch order items by order" });
    }
  }
);

// GET /admin/order-items/product/:productId - Get order items by product ID
router.get(
  "/product/:productId",
  requireAdminPanelReadPermissionForOrderItems,
  async (req: Request, res: Response) => {
    try {
      const { productId } = req.params;
      const orderItems = await orderItemService.findByProductId(productId);
      res.json(orderItems);
    } catch (error) {
      console.error("Get order items by product error:", error);
      res.status(500).json({ error: "Failed to fetch order items by product" });
    }
  }
);

// PUT /admin/order-items/:id/quantity - Update order item quantity
router.put(
  "/:id/quantity",
  requireAdminPanelWritePermissionForOrderItems,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { qty } = req.body;

      if (!qty || typeof qty !== "number" || qty <= 0) {
        return res.status(400).json({ 
          error: "qty is required and must be a positive number" 
        });
      }

      const orderItem = await orderItemService.updateOrderItem(id, { qty });

      if (!orderItem) {
        return res.status(404).json({ error: "Order item not found" });
      }

      res.json(orderItem);
    } catch (error) {
      console.error("Update order item quantity error:", error);
      if (error instanceof Error && error.message === "Order item not found") {
        return res.status(404).json({ error: error.message });
      }
      res.status(500).json({ error: "Failed to update order item quantity" });
    }
  }
);

// PUT /admin/order-items/:id/price - Update order item unit price
router.put(
  "/:id/price",
  requireAdminPanelWritePermissionForOrderItems,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { unitPriceMinor } = req.body;

      if (unitPriceMinor === undefined || typeof unitPriceMinor !== "number" || unitPriceMinor < 0) {
        return res.status(400).json({ 
          error: "unitPriceMinor is required and must be a non-negative number" 
        });
      }

      const orderItem = await orderItemService.updateOrderItem(id, { unitPriceMinor });

      if (!orderItem) {
        return res.status(404).json({ error: "Order item not found" });
      }

      res.json(orderItem);
    } catch (error) {
      console.error("Update order item price error:", error);
      if (error instanceof Error && error.message === "Order item not found") {
        return res.status(404).json({ error: error.message });
      }
      res.status(500).json({ error: "Failed to update order item price" });
    }
  }
);

export default router;