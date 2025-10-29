import { Router, Request, Response } from "express";
import { WalletService } from "../services/WalletService";
import {
  requireAdminPanelReadPermissionForWallets,
  requireAdminPanelWritePermissionForWallets,
} from "../auth";

const router = Router();
const walletService = new WalletService();

// GET /admin/wallets - List all wallets with pagination
router.get(
  "/",
  requireAdminPanelReadPermissionForWallets,
  async (req: Request, res: Response) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = req.query.search as string;
      const currency = req.query.currency as string;
      const userId = req.query.userId as string;

      const result = await walletService.getWalletsForAdmin({
        page,
        limit,
        search,
        currency,
        userId,
      });
      res.json(result);
    } catch (error) {
      console.error("Get wallets error:", error);
      res.status(500).json({ error: "Failed to fetch wallets" });
    }
  }
);

// GET /admin/wallets/:id - Get wallet by ID
router.get(
  "/:id",
  requireAdminPanelReadPermissionForWallets,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const wallet = await walletService.getWalletForAdmin(id);
      res.json(wallet);
    } catch (error) {
      console.error("Get wallet error:", error);
      if (error instanceof Error && error.message === "Wallet not found") {
        return res.status(404).json({ error: error.message });
      }
      res.status(500).json({ error: "Failed to fetch wallet" });
    }
  }
);

// POST /admin/wallets - Create new wallet
router.post(
  "/",
  requireAdminPanelWritePermissionForWallets,
  async (req: Request, res: Response) => {
    try {
      const { userId, currency, initialBalance } = req.body;

      if (!userId || !currency) {
        return res.status(400).json({ error: "User ID and currency are required" });
      }

      const wallet = await walletService.createWallet({
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

// DELETE /admin/wallets/:id - Delete wallet
router.delete(
  "/:id",
  requireAdminPanelWritePermissionForWallets,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      await walletService.deleteWallet(id);
      res.status(204).send();
    } catch (error) {
      console.error("Delete wallet error:", error);
      if (error instanceof Error) {
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

// GET /admin/wallets/user/:userId - Get wallets by user ID
router.get(
  "/user/:userId",
  requireAdminPanelReadPermissionForWallets,
  async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const wallets = await walletService.findByUserId(userId);
      res.json(wallets);
    } catch (error) {
      console.error("Get wallets by user error:", error);
      res.status(500).json({ error: "Failed to fetch wallets by user" });
    }
  }
);

// GET /admin/wallets/currency/:currency - Get wallets by currency
router.get(
  "/currency/:currency",
  requireAdminPanelReadPermissionForWallets,
  async (req: Request, res: Response) => {
    try {
      const { currency } = req.params;
      const wallets = await walletService.findByCurrency(currency);
      res.json(wallets);
    } catch (error) {
      console.error("Get wallets by currency error:", error);
      res.status(500).json({ error: "Failed to fetch wallets by currency" });
    }
  }
);

// GET /admin/wallets/user/:userId/currency/:currency - Get specific wallet
router.get(
  "/user/:userId/currency/:currency",
  requireAdminPanelReadPermissionForWallets,
  async (req: Request, res: Response) => {
    try {
      const { userId, currency } = req.params;
      const wallet = await walletService.findByUserAndCurrency(userId, currency);
      
      if (!wallet) {
        return res.status(404).json({ error: "Wallet not found" });
      }
      
      res.json(wallet);
    } catch (error) {
      console.error("Get wallet by user and currency error:", error);
      res.status(500).json({ error: "Failed to fetch wallet" });
    }
  }
);

// POST /admin/wallets/:id/balance/increase - Increase wallet balance
router.post(
  "/:id/balance/increase",
  requireAdminPanelWritePermissionForWallets,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { amountMinor } = req.body;

      if (!amountMinor || typeof amountMinor !== "number") {
        return res.status(400).json({ error: "Amount (in minor units) is required and must be a number" });
      }

      // First get the wallet to extract userId and currency
      const wallet = await walletService.findById(id);
      if (!wallet) {
        return res.status(404).json({ error: "Wallet not found" });
      }

      const updatedWallet = await walletService.increaseBalance({
        userId: wallet.user.id,
        currency: wallet.currency,
        amountMinor,
      });
      
      res.json(updatedWallet);
    } catch (error) {
      console.error("Increase balance error:", error);
      if (error instanceof Error) {
        const validationError = error as any;
        if (validationError.code === "INVALID_TYPE") {
          return res.status(400).json({ error: error.message });
        }
        if (validationError.code === "NOT_FOUND") {
          return res.status(404).json({ error: error.message });
        }
      }
      res.status(500).json({ error: "Failed to increase balance" });
    }
  }
);

// POST /admin/wallets/:id/balance/decrease - Decrease wallet balance
router.post(
  "/:id/balance/decrease",
  requireAdminPanelWritePermissionForWallets,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { amountMinor } = req.body;

      if (!amountMinor || typeof amountMinor !== "number") {
        return res.status(400).json({ error: "Amount (in minor units) is required and must be a number" });
      }

      // First get the wallet to extract userId and currency
      const wallet = await walletService.findById(id);
      if (!wallet) {
        return res.status(404).json({ error: "Wallet not found" });
      }

      const updatedWallet = await walletService.decreaseBalance({
        userId: wallet.user.id,
        currency: wallet.currency,
        amountMinor,
      });
      
      res.json(updatedWallet);
    } catch (error) {
      console.error("Decrease balance error:", error);
      if (error instanceof Error) {
        const validationError = error as any;
        if (validationError.code === "INVALID_TYPE") {
          return res.status(400).json({ error: error.message });
        }
        if (validationError.code === "NOT_FOUND") {
          return res.status(404).json({ error: error.message });
        }
        if (validationError.code === "INSUFFICIENT_BALANCE") {
          return res.status(400).json({ error: error.message });
        }
      }
      res.status(500).json({ error: "Failed to decrease balance" });
    }
  }
);

// POST /admin/wallets/transfer - Transfer between wallets
router.post(
  "/transfer",
  requireAdminPanelWritePermissionForWallets,
  async (req: Request, res: Response) => {
    try {
      const { fromUserId, toUserId, currency, amountMinor } = req.body;

      if (!fromUserId || !toUserId || !currency || !amountMinor) {
        return res.status(400).json({ 
          error: "From user ID, to user ID, currency, and amount are required" 
        });
      }

      if (typeof amountMinor !== "number") {
        return res.status(400).json({ error: "Amount must be a number" });
      }

      await walletService.transfer({
        fromUserId,
        toUserId,
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

// GET /admin/wallets/user/:userId/currency/:currency/balance - Get balance
router.get(
  "/user/:userId/currency/:currency/balance",
  requireAdminPanelReadPermissionForWallets,
  async (req: Request, res: Response) => {
    try {
      const { userId, currency } = req.params;
      const balance = await walletService.getBalance(userId, currency);
      res.json({ balance, currency, userId });
    } catch (error) {
      console.error("Get balance error:", error);
      res.status(500).json({ error: "Failed to get balance" });
    }
  }
);

export default router;