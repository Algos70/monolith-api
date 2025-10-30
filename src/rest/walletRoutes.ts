import { Router, Request, Response } from "express";
import { UserWalletService } from "../services/UserWalletService";
import { SessionService } from "../services/SessionService";
import {
  requireWalletReadPermission,
  requireWalletWritePermission,
} from "../auth";
import { rateLimitMiddleware } from "../cache/RateLimitMiddleware";

const router = Router();
const userWalletService = new UserWalletService();

// Helper function to get current user ID from session
const getCurrentUserId = (req: Request): string => {
  const user = SessionService.getUser(req);
  return user?.sub || user?.id;
};

// GET /wallets - Get all wallets for the authenticated user
router.get(
  "/",
  rateLimitMiddleware.createIPRateLimit({ maxRequests: 100, message: "Too many wallet requests" }),
  requireWalletReadPermission,
  async (req: Request, res: Response) => {
    try {
      const userId = getCurrentUserId(req);
      if (!userId) {
        return res.status(401).json({ error: "User ID not found in session" });
      }

      const wallets = await userWalletService.getUserWallets(userId);
      res.json(wallets);
    } catch (error) {
      console.error("Get user wallets error:", error);
      res.status(500).json({ error: "Failed to fetch wallets" });
    }
  }
);

// POST /wallets - Create a new wallet for the authenticated user
router.post(
  "/",
  rateLimitMiddleware.createIPRateLimit({ maxRequests: 5, message: "Too many wallet creation requests" }),
  requireWalletWritePermission,
  async (req: Request, res: Response) => {
    try {
      const userId = getCurrentUserId(req);
      if (!userId) {
        return res.status(401).json({ error: "User ID not found in session" });
      }

      const { currency, initialBalance } = req.body;

      if (!currency) {
        return res.status(400).json({ error: "Currency is required" });
      }

      const wallet = await userWalletService.createUserWallet({
        userId,
        currency,
        initialBalance,
      });

      res.status(201).json(wallet);
    } catch (error) {
      console.error("Create wallet error:", error);
      if (error instanceof Error) {
        const validationError = error as any;
        if (validationError.code === "DUPLICATE") {
          return res.status(409).json({ error: error.message });
        }
        if (
          validationError.code === "INVALID_FORMAT" ||
          validationError.code === "INVALID_TYPE"
        ) {
          return res.status(400).json({ error: error.message });
        }
      }
      res.status(500).json({ error: "Failed to create wallet" });
    }
  }
);

// POST /wallets/:id/increase - Increase balance of user's own wallet
router.post(
  "/:id/increase",
  rateLimitMiddleware.createIPRateLimit({ maxRequests: 20, message: "Too many balance increase requests" }),
  requireWalletWritePermission,
  async (req: Request, res: Response) => {
    try {
      const userId = getCurrentUserId(req);
      if (!userId) {
        return res.status(401).json({ error: "User ID not found in session" });
      }

      const { id } = req.params;
      const { amountMinor } = req.body;

      if (!amountMinor || typeof amountMinor !== "number") {
        return res.status(400).json({
          error: "Amount (in minor units) is required and must be a number",
        });
      }

      const updatedWallet = await userWalletService.increaseUserWalletBalance({
        userId,
        walletId: id,
        amountMinor,
      });

      res.json(updatedWallet);
    } catch (error) {
      console.error("Increase balance error:", error);
      if (error instanceof Error) {
        const validationError = error as any;
        if (validationError.code === "FORBIDDEN") {
          return res.status(403).json({ error: error.message });
        }
        if (validationError.code === "INVALID_TYPE") {
          return res.status(400).json({ error: error.message });
        }
        if (validationError.code === "NOT_FOUND") {
          return res.status(404).json({ error: error.message });
        }
        if (error.message === "Wallet not found") {
          return res.status(404).json({ error: error.message });
        }
      }
      res.status(500).json({ error: "Failed to increase balance" });
    }
  }
);

// DELETE /wallets/:id - Delete user's own wallet
router.delete(
  "/:id",
  rateLimitMiddleware.createIPRateLimit({ maxRequests: 5, message: "Too many wallet deletion requests" }),
  requireWalletWritePermission,
  async (req: Request, res: Response) => {
    try {
      const userId = getCurrentUserId(req);
      if (!userId) {
        return res.status(401).json({ error: "User ID not found in session" });
      }

      const { id } = req.params;

      await userWalletService.deleteUserWallet(userId, id);
      res.status(204).send();
    } catch (error) {
      console.error("Delete wallet error:", error);
      if (error instanceof Error) {
        const validationError = error as any;
        if (validationError.code === "FORBIDDEN") {
          return res.status(403).json({ error: error.message });
        }
        if (error.message === "Wallet not found") {
          return res.status(404).json({ error: error.message });
        }
        if (error.message === "Cannot delete wallet with positive balance") {
          return res.status(409).json({ error: error.message });
        }
      }
      res.status(500).json({ error: "Failed to delete wallet" });
    }
  }
);

// POST /wallets/transfer - Transfer money from user's wallet to another wallet
router.post(
  "/transfer",
  rateLimitMiddleware.createIPRateLimit({ maxRequests: 10, message: "Too many transfer requests" }),
  requireWalletWritePermission,
  async (req: Request, res: Response) => {
    try {
      const userId = getCurrentUserId(req);
      if (!userId) {
        return res.status(401).json({ error: "User ID not found in session" });
      }

      const { toWalletId, currency, amountMinor } = req.body;

      if (!toWalletId || !currency || !amountMinor) {
        return res.status(400).json({
          error: "Target wallet ID, currency, and amount are required",
        });
      }

      if (typeof amountMinor !== "number") {
        return res.status(400).json({ error: "Amount must be a number" });
      }

      await userWalletService.transferFromUserWallet({
        userId,
        toWalletId,
        currency,
        amountMinor,
      });

      res.json({ message: "Transfer completed successfully" });
    } catch (error) {
      console.error("Transfer error:", error);
      if (error instanceof Error) {
        const validationError = error as any;
        if (
          validationError.code === "INVALID_TYPE" ||
          validationError.code === "INVALID_OPERATION"
        ) {
          return res.status(400).json({ error: error.message });
        }
        if (validationError.code === "NOT_FOUND") {
          return res.status(404).json({ error: error.message });
        }
        if (validationError.code === "INSUFFICIENT_BALANCE") {
          return res.status(400).json({ error: error.message });
        }
      }
      res.status(500).json({ error: "Failed to complete transfer" });
    }
  }
);

// GET /wallets/currency/:currency - Get user's wallet by currency
router.get(
  "/currency/:currency",
  rateLimitMiddleware.createIPRateLimit({ maxRequests: 150, message: "Too many wallet by currency requests" }),
  requireWalletReadPermission,
  async (req: Request, res: Response) => {
    try {
      const userId = getCurrentUserId(req);
      if (!userId) {
        return res.status(401).json({ error: "User ID not found in session" });
      }

      const { currency } = req.params;
      const wallet = await userWalletService.getUserWalletByCurrency(
        userId,
        currency
      );

      if (!wallet) {
        return res.status(404).json({ error: "Wallet not found" });
      }

      res.json(wallet);
    } catch (error) {
      console.error("Get wallet by currency error:", error);
      res.status(500).json({ error: "Failed to fetch wallet" });
    }
  }
);

// GET /wallets/currency/:currency/balance - Get balance for user's wallet by currency
router.get(
  "/currency/:currency/balance",
  rateLimitMiddleware.createIPRateLimit({ maxRequests: 100, message: "Too many balance check requests" }),
  requireWalletReadPermission,
  async (req: Request, res: Response) => {
    try {
      const userId = getCurrentUserId(req);
      if (!userId) {
        return res.status(401).json({ error: "User ID not found in session" });
      }

      const { currency } = req.params;
      const balance = await userWalletService.getUserWalletBalance(
        userId,
        currency
      );
      res.json({ balance, currency, userId });
    } catch (error) {
      console.error("Get balance error:", error);
      res.status(500).json({ error: "Failed to get balance" });
    }
  }
);

export default router;
