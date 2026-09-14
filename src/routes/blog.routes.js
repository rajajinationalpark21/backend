import { Router } from "express";
import {
  createBlog,
  deleteBlog,
  getBlog,
  listBlogs,
  updateBlog,
} from "../controllers/blog.controller.js";
import { requireAdmin } from "../middleware/auth.js";
import { blogImage } from "../middleware/upload.js";

const router = Router();

router.get("/get", listBlogs);
router.get("/detail/:id", getBlog);
router.post("/add", requireAdmin, blogImage, createBlog);
router.patch("/update", requireAdmin, blogImage, updateBlog);
router.delete("/delete", requireAdmin, deleteBlog);

export default router;
