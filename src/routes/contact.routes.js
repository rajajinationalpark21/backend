import { Router } from "express";
import {
  deleteInquiry,
  listInquiries,
  submitInquiry,
} from "../controllers/contact.controller.js";
import { requireAdmin } from "../middleware/auth.js";
import { contactLimiter } from "../middleware/rateLimiters.js";

const router = Router();

// Public: submitted by the Contact page form.
router.post("/submit", contactLimiter, submitInquiry);

// Admin only: inquiries are personal data.
router.get("/get", requireAdmin, listInquiries);
router.delete("/delete", requireAdmin, deleteInquiry);

export default router;
