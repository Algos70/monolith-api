import { Router, Request, Response } from "express";
import { WalletService } from "../services/WalletService";
import { SessionService } from "../services/SessionService";
import {
  requireWalletReadPermission,
  requireWalletWritePermission,
} from "../auth";
import { rateLimitMiddleware } from "../cache/RateLimitMiddleware";

const router = Router();
const userWalletService = new WalletService();

// Helper function to get current user ID from session
const getCurrentUserId = (req: Request): string => {
  const user = SessionService.getUser(req);
  return user?.sub || user?.id;
};

// GET /wallets - Get all wallets for the authenticated user
router.get(
  "/",
  rateLimitMiddleware.createIPRateLimit({ maxRequests: 300, message: "Too many wallet requests" }),
  requireWalletReadPermission,
  async (req: Request, res: Response) => {
    try {
      const userId = getCurrentUserId(req);
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "User ID not found in session",
          wallets: [],
        });
      }

      const result = await userWalletService.getUserWallets(userId);
      res.json(result);
    } catch (error) {
      console.error("Get user wallets error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch wallets",
        wallets: [],
      });
    }
  }
);

// POST /wallets - Create a new wallet for the authenticated user
router.post(
  "/",
  rateLimitMiddleware.createIPRateLimit({ maxRequests: 15, message: "Too many wallet creation requests" }),
  requireWalletWritePermission,
  async (req: Request, res: Response) => {
    try {
      const userId = getCurrentUserId(req);
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "User ID not found in session",
          wallet: null,
        });
      }

      const { currency, initialBalance } = req.body;

      if (!currency) {
        return res.status(400).json({
          success: false,
          message: "Currency is required",
          wallet: null,
        });
      }

      const result = await userWalletService.createUserWallet({
        userId,
        currency,
        initialBalance,
      });

      res.status(201).json(result);
    } catch (error) {
      console.error("Create wallet error:", error);
      if (error instanceof Error) {
        const validationError = error as any;
        if (validationError.code === "DUPLICATE") {
          return res.status(409).json({
            success: false,
            message: error.message,
            wallet: null,
          });
        }
        if (
          validationError.code === "INVALID_FORMAT" ||
          validationError.code === "INVALID_TYPE"
        ) {
          return res.status(400).json({
            success: false,
            message: error.message,
            wallet: null,
          });
        }
      }
      res.status(500).json({
        success: false,
        message: "Failed to create wallet",
        wallet: null,
      });
    }
  }
);

// POST /wallets/:id/increase - Increase balance of user's own wallet
router.post(
  "/:id/increase",
  rateLimitMiddleware.createIPRateLimit({ maxRequests: 60, message: "Too many balance increase requests" }),
  requireWalletWritePermission,
  async (req: Request, res: Response) => {
    try {
      const userId = getCurrentUserId(req);
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "User ID not found in session",
        });
      }

      const { id } = req.params;
      const { amountMinor } = req.body;

      if (!amountMinor || typeof amountMinor !== "number") {
        return res.status(400).json({
          success: false,
          message: "Amount (in minor units) is required and must be a number",
        });
      }

      const result = await userWalletService.increaseUserWalletBalance({
        userId,
        walletId: id,
        amountMinor,
      });

      res.json(result);
    } catch (error) {
      console.error("Increase balance error:", error);
      if (error instanceof Error) {
        const validationError = error as any;
        if (validationError.code === "FORBIDDEN") {
          return res.status(403).json({
            success: false,
            message: error.message,
          });
        }
        if (validationError.code === "INVALID_TYPE") {
          return res.status(400).json({
            success: false,
            message: error.message,
          });
        }
        if (validationError.code === "NOT_FOUND") {
          return res.status(404).json({
            success: false,
            message: error.message,
          });
        }
        if (error.message === "Wallet not found") {
          return res.status(404).json({
            success: false,
            message: error.message,
          });
        }
      }
      res.status(500).json({
        success: false,
        message: "Failed to increase balance",
      });
    }
  }
);

// DELETE /wallets/:id - Delete user's own wallet
router.delete(
  "/:id",
  rateLimitMiddleware.createIPRateLimit({ maxRequests: 15, message: "Too many wallet deletion requests" }),
  requireWalletWritePermission,
  async (req: Request, res: Response) => {
    try {
      const userId = getCurrentUserId(req);
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "User ID not found in session",
        });
      }

      const { id } = req.params;

      await userWalletService.deleteUserWallet(userId, id);
      res.json({
        success: true,
        message: "Wallet deleted successfully",
      });
    } catch (error) {
      console.error("Delete wallet error:", error);
      if (error instanceof Error) {
        const validationError = error as any;
        if (validationError.code === "FORBIDDEN") {
          return res.status(403).json({
            success: false,
            message: error.message,
          });
        }
        if (error.message === "Wallet not found") {
          return res.status(404).json({
            success: false,
            message: error.message,
          });
        }
        if (error.message === "Cannot delete wallet with positive balance") {
          return res.status(409).json({
            success: false,
            message: error.message,
          });
        }
      }
      res.status(500).json({
        success: false,
        message: "Failed to delete wallet",
      });
    }
  }
);

// POST /wallets/transfer - Transfer money from user's wallet to another wallet
router.post(
  "/transfer",
  rateLimitMiddleware.createIPRateLimit({ maxRequests: 30, message: "Too many transfer requests" }),
  requireWalletWritePermission,
  async (req: Request, res: Response) => {
    try {
      const userId = getCurrentUserId(req);
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "User ID not found in session",
        });
      }

      const { toWalletId, currency, amountMinor } = req.body;

      if (!toWalletId || !currency || !amountMinor) {
        return res.status(400).json({
          success: false,
          message: "Target wallet ID, currency, and amount are required",
        });
      }

      if (typeof amountMinor !== "number") {
        return res.status(400).json({
          success: false,
          message: "Amount must be a positive number",
        });
      }

      await userWalletService.transferFromUserWallet({
        userId,
        toWalletId,
        currency,
        amountMinor,
      });

      res.json({
        success: true,
        message: "Transfer completed successfully",
      });
    } catch (error) {
      console.error("Transfer error:", error);
      if (error instanceof Error) {
        const validationError = error as any;
        if (
          validationError.code === "INVALID_TYPE" ||
          validationError.code === "INVALID_OPERATION"
        ) {
          return res.status(400).json({
            success: false,
            message: error.message,
          });
        }
        if (validationError.code === "NOT_FOUND") {
          return res.status(404).json({
            success: false,
            message: error.message,
          });
        }
        if (validationError.code === "INSUFFICIENT_BALANCE") {
          return res.status(400).json({
            success: false,
            message: error.message,
          });
        }
      }
      res.status(500).json({
        success: false,
        message: "Failed to complete transfer",
      });
    }
  }
);

// GET /wallets/currency/:currency - Get user's wallet by currency
router.get(
  "/currency/:currency",
  rateLimitMiddleware.createIPRateLimit({ maxRequests: 450, message: "Too many wallet by currency requests" }),
  requireWalletReadPermission,
  async (req: Request, res: Response) => {
    try {
      const userId = getCurrentUserId(req);
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "User ID not found in session",
          wallet: null,
        });
      }

      const { currency } = req.params;
      const result = await userWalletService.getUserWalletByCurrency(
        userId,
        currency
      );

      res.json(result);
    } catch (error) {
      console.error("Get wallet by currency error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch wallet",
        wallet: null,
      });
    }
  }
);

// GET /wallets/currency/:currency/balance - Get balance for user's wallet by currency
router.get(
  "/currency/:currency/balance",
  rateLimitMiddleware.createIPRateLimit({ maxRequests: 300, message: "Too many balance check requests" }),
  requireWalletReadPermission,
  async (req: Request, res: Response) => {
    try {
      const userId = getCurrentUserId(req);
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "User ID not found in session",
          balance: "0",
        });
      }

      const { currency } = req.params;
      const result = await userWalletService.getUserWalletBalance(
        userId,
        currency
      );
      
      res.json({
        success: result.success,
        message: result.message,
        balance: result.balance.toString(),
      });
    } catch (error) {
      console.error("Get balance error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get wallet balance",
        balance: "0",
      });
    }
  }
);

export default router;
