import { Blog } from "../models/Blog.js";
import { FOLDERS, destroyImage, uploadImage } from "../config/cloudinary.js";
import { AppError } from "../utils/AppError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { getIdFromAliases, getObjectId, getString } from "../utils/validation.js";

const BLOG_ID_ALIASES = ["blogId", "id", "_id"];

export const listBlogs = asyncHandler(async (req, res) => {
  const blogs = await Blog.find().sort({ createdAt: -1 }).lean();
  res.json({ success: true, count: blogs.length, blogs });
});

export const getBlog = asyncHandler(async (req, res) => {
  const id = getObjectId(req.params, "id");
  const blog = await Blog.findById(id).lean();

  if (!blog) throw new AppError("Blog post not found", 404);

  res.json({ success: true, blog });
});

export const createBlog = asyncHandler(async (req, res) => {
  const fields = {
    title: getString(req.body, "title", { required: true, max: 200 }),
    category: getString(req.body, "category", { max: 60, fallback: "Uncategorized" }),
    summary: getString(req.body, "summary", { max: 500 }),
    content: getString(req.body, "content", { required: true, max: 200_000 }),
  };

  if (req.file) {
    const image = await uploadImage(req.file, FOLDERS.blogs);
    fields.image = image.url;
    fields.imagePublicId = image.publicId;
  }

  const blog = await Blog.create(fields);

  res.status(201).json({ success: true, message: "Blog post created", blog });
});

export const updateBlog = asyncHandler(async (req, res) => {
  const id = getIdFromAliases(req.body, BLOG_ID_ALIASES, "blogId");
  const blog = await Blog.findById(id);

  if (!blog) throw new AppError("Blog post not found", 404);

  if (req.body.title !== undefined) {
    blog.title = getString(req.body, "title", { required: true, max: 200 });
  }
  if (req.body.category !== undefined) {
    blog.category = getString(req.body, "category", { max: 60, fallback: "Uncategorized" });
  }
  if (req.body.summary !== undefined) {
    blog.summary = getString(req.body, "summary", { max: 500 });
  }
  if (req.body.content !== undefined) {
    blog.content = getString(req.body, "content", { required: true, max: 200_000 });
  }

  if (req.file) {
    const image = await uploadImage(req.file, FOLDERS.blogs);
    const previousPublicId = blog.imagePublicId;

    blog.image = image.url;
    blog.imagePublicId = image.publicId;
    await blog.save();
    await destroyImage(previousPublicId);
  } else {
    await blog.save();
  }

  res.json({ success: true, message: "Blog post updated", blog });
});

export const deleteBlog = asyncHandler(async (req, res) => {
  const id = getIdFromAliases(req.body, BLOG_ID_ALIASES, "blogId");
  const blog = await Blog.findByIdAndDelete(id);

  if (!blog) throw new AppError("Blog post not found", 404);

  await destroyImage(blog.imagePublicId);

  res.json({ success: true, message: "Blog post deleted" });
});
