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

      const result = await userService.getUsersForAdmin({ page, limit, search });
      res.json(result);
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
      const user = await userService.getUserWithRelationsForAdmin(id);
      res.json(user);
    } catch (error) {
      console.error("Get user error:", error);
      if (error instanceof Error && error.message === "User not found") {
        return res.status(404).json({ error: error.message });
      }
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
      const user = await userService.createUserForAdmin({ email, name });
      res.status(201).json(user);
    } catch (error) {
      console.error("Create user error:", error);
      if (error instanceof Error) {
        if (error.message === "Email is required") {
          return res.status(400).json({ error: error.message });
        }
        if (error.message === "User with this email already exists") {
          return res.status(409).json({ error: error.message });
        }
      }
      res.status(500).json({ error: "Failed to create user" });
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
      
      const user = await userService.getUserWithRelationsForAdmin(id, include);
      res.json(user);
    } catch (error) {
      console.error("Get user with relations error:", error);
      if (error instanceof Error && error.message === "User not found") {
        return res.status(404).json({ error: error.message });
      }
      res.status(500).json({ error: "Failed to fetch user with relations" });
    }
  }
);

export default router;
