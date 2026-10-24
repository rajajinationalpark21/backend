import { Router } from "express";
import {
  changePassword,
  createUser,
  deleteUser,
  getMe,
  listAuditLog,
  listUsers,
  login,
  transferOwnership,
  updateProfile,
} from "../controllers/admin.controller.js";
import { requireAdmin, requireOwner } from "../middleware/auth.js";
import { loginLimiter } from "../middleware/rateLimiters.js";
import { visitSummary } from "../controllers/visit.controller.js";

const router = Router();

router.post("/login", loginLimiter, login);

// The signed-in admin, with whether they own the panel.
router.get("/me", requireAdmin, getMe);

// Website visits and enquiries for the dashboard.
router.get("/visits", requireAdmin, visitSummary);

// Called by the admin panel's Settings page.
router.patch("/update-profile", requireAdmin, updateProfile);
router.patch("/change-password", requireAdmin, changePassword);

// User management: anyone can see the list; only the owner can change it.
router.get("/users", requireAdmin, listUsers);
router.post("/create-user", requireAdmin, requireOwner, createUser);
router.delete("/delete-user", requireAdmin, requireOwner, deleteUser);
router.patch("/transfer-ownership", requireAdmin, requireOwner, transferOwnership);

// Who changed what (owner only).
router.get("/audit", requireAdmin, requireOwner, listAuditLog);

export default router;
