import { Router } from "express";
import { getSection, updateSettings } from "../controllers/content.controller.js";
import { requireAdmin } from "../middleware/auth.js";

const router = Router();

// Public: contact details, social links and footer text shown site-wide.
router.get("/get", getSection("settings"));
router.post("/update", requireAdmin, updateSettings);

export default router;
