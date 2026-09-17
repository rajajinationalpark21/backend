import { Router } from "express";
import {
  submitFeedback,
  listFeedback,
  deleteFeedback,
} from "../controllers/feedback.controller.js";
import { requireAdmin } from "../middleware/auth.js";
import { contactLimiter } from "../middleware/rateLimiters.js";

const router = Router();

// Public: list and submit feedback
router.get("/get", listFeedback);
router.post("/submit", contactLimiter, submitFeedback);

// Admin only: delete feedback
router.delete("/delete", requireAdmin, deleteFeedback);

export default router;
