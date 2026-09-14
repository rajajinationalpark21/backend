import { Router } from "express";
import { getSection, updateSafari } from "../controllers/content.controller.js";
import { requireAdmin } from "../middleware/auth.js";
import { contentMedia } from "../middleware/upload.js";

const router = Router();

router.get("/get", getSection("safari"));
router.post("/update", requireAdmin, contentMedia, updateSafari);

export default router;
