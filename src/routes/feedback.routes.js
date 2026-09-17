import { Router } from "express";
import {
  submitFeedback,
  listFeedback,
  adminListFeedback,
  updateFeedback,
  deleteFeedback,
} from "../controllers/feedback.controller.js";
import { requireAdmin } from "../middleware/auth.js";
import { contactLimiter } from "../middleware/rateLimiters.js";

const router = Router();

// Public: list approved and submit feedback
router.get("/get", listFeedback);
router.post("/submit", contactLimiter, submitFeedback);

// Admin only: list all feedback, update status, delete
router.get("/admin/all", requireAdmin, adminListFeedback);
router.patch("/update", requireAdmin, updateFeedback);
router.put("/update", requireAdmin, updateFeedback);
router.delete("/delete", requireAdmin, deleteFeedback);

export default router;

