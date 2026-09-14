import { Router } from "express";
import { getContent, updateContent } from "../controllers/content.controller.js";
import { requireAdmin } from "../middleware/auth.js";
import { contentMedia } from "../middleware/upload.js";

const router = Router();

// Public: the website renders every page from this document.
router.get("/get", getContent);

router.post("/update", requireAdmin, contentMedia, updateContent);

export default router;
