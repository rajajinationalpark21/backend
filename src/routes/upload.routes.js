import { Router } from "express";
import { uploadSingleImage } from "../controllers/upload.controller.js";
import { requireAdmin } from "../middleware/auth.js";
import { singleImage } from "../middleware/upload.js";

const router = Router();

router.post("/image", requireAdmin, singleImage, uploadSingleImage);

export default router;
