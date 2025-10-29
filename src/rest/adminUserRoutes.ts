import { Router, Request, Response } from "express";
import { UserService } from "../services/UserService";
import {
  requireAdminPanelReadPermissionForUser,
  requireAdminPanelWritePermissionForUser,
} from "../auth";

const router = Router();
const userService = new UserService();

// GET /admin/users - List all users with pagination
router.get(
  "/",
  requireAdminPanelReadPermissionForUser,
  async (req: Request, res: Response) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = req.query.search as string;

      // For now, get all users (you can add pagination logic later)
      const users = await userService.getAllUsers();

      // Filter by search if provided
      let filteredUsers = users;
      if (search) {
        filteredUsers = users.filter(
          (user) =>
            user.email.toLowerCase().includes(search.toLowerCase()) ||
            user.name?.toLowerCase().includes(search.toLowerCase())
        );
      }

      // Simple pagination
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

      res.json({
        users: paginatedUsers,
        pagination: {
          page,
          limit,
          total: filteredUsers.length,
          totalPages: Math.ceil(filteredUsers.length / limit),
        },
      });
    } catch (error) {
      console.error("Get users error:", error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  }
);

// GET /admin/users/:id - Get user by ID
router.get(
  "/:id",
  requireAdminPanelReadPermissionForUser,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const user = await userService.findById(id);

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json(user);
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ error: "Failed to fetch user" });
    }
  }
);

// POST /admin/users - Create new user
router.post(
  "/",
  requireAdminPanelWritePermissionForUser,
  async (req: Request, res: Response) => {
    try {
      const { email, name } = req.body;

      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }

      // Check if user already exists
      const existingUser = await userService.findByEmail(email);
      if (existingUser) {
        return res
          .status(409)
          .json({ error: "User with this email already exists" });
      }

      const user = await userService.createUser({ email, name });
      res.status(201).json(user);
    } catch (error) {
      console.error("Create user error:", error);
      res.status(500).json({ error: "Failed to create user" });
    }
  }
);

// PUT /admin/users/:id - Update user
router.put(
  "/:id",
  requireAdminPanelWritePermissionForUser,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { email, name } = req.body;

      // Check if user exists
      const existingUser = await userService.findById(id);
      if (!existingUser) {
        return res.status(404).json({ error: "User not found" });
      }

      // If email is being changed, check for conflicts
      if (email && email !== existingUser.email) {
        const emailConflict = await userService.findByEmail(email);
        if (emailConflict) {
          return res
            .status(409)
            .json({ error: "Email already in use by another user" });
        }
      }

      const updatedUser = await userService.updateUser(id, { email, name });

      if (!updatedUser) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json(updatedUser);
    } catch (error) {
      console.error("Update user error:", error);
      res.status(500).json({ error: "Failed to update user" });
    }
  }
);

// DELETE /admin/users/:id - Delete user
router.delete(
  "/:id",
  requireAdminPanelWritePermissionForUser,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      // Check if user exists
      const existingUser = await userService.findById(id);
      if (!existingUser) {
        return res.status(404).json({ error: "User not found" });
      }

      await userService.deleteUser(id);
      res.json({ message: "User deleted successfully" });
    } catch (error) {
      console.error("Delete user error:", error);
      res.status(500).json({ error: "Failed to delete user" });
    }
  }
);

// GET /admin/users/:id/with-relations - Get user with all relations
router.get(
  "/:id/with-relations",
  requireAdminPanelReadPermissionForUser,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const include = req.query.include as string;

      let user;
      if (include?.includes("wallets")) {
        user = await userService.findWithWallets(id);
      } else if (include?.includes("orders")) {
        user = await userService.findWithOrders(id);
      } else if (include?.includes("carts")) {
        user = await userService.findWithCarts(id);
      } else {
        user = await userService.findById(id);
      }

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json(user);
    } catch (error) {
      console.error("Get user with relations error:", error);
      res.status(500).json({ error: "Failed to fetch user with relations" });
    }
  }
);

export default router;
