import { Router } from "express";
import { changePassword, createUser, deleteUser, listUsers, login, updateProfile } from "../controllers/admin.controller.js";
import { requireAdmin } from "../middleware/auth.js";
import { loginLimiter } from "../middleware/rateLimiters.js";

const router = Router();

router.post("/login", loginLimiter, login);

// Called by the admin panel's Settings page.
router.patch("/update-profile", requireAdmin, updateProfile);
router.patch("/change-password", requireAdmin, changePassword);

// User management
router.get("/users", requireAdmin, listUsers);
router.post("/create-user", requireAdmin, createUser);
router.delete("/delete-user", requireAdmin, deleteUser);

export default router;
