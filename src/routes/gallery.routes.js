import { Router } from "express";
import { deleteImage, listImages, uploadImages } from "../controllers/gallery.controller.js";
import { requireAdmin } from "../middleware/auth.js";
import { galleryImages } from "../middleware/upload.js";

const router = Router();

router.get("/get", listImages);
router.post("/upload", requireAdmin, galleryImages, uploadImages);
router.delete("/delete", requireAdmin, deleteImage);

export default router;
