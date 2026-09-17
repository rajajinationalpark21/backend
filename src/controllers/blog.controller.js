import mongoose from "mongoose";
import { Blog } from "../models/Blog.js";
import { FOLDERS, destroyImage, uploadImage } from "../config/cloudinary.js";
import { AppError } from "../utils/AppError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { getIdFromAliases, getString } from "../utils/validation.js";

const BLOG_ID_ALIASES = ["blogId", "id", "_id"];

export function slugify(text) {
  if (!text) return "";
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export const listBlogs = asyncHandler(async (req, res) => {
  const rawBlogs = await Blog.find().sort({ createdAt: -1 }).lean();
  const blogs = rawBlogs.map((b) => ({
    ...b,
    slug: b.slug || slugify(b.title),
  }));
  res.json({ success: true, count: blogs.length, blogs });
});

export const getBlog = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!id) throw new AppError("Blog identifier is required", 400);

  let blog = null;
  if (mongoose.isValidObjectId(id)) {
    blog = await Blog.findById(id).lean();
  }

  if (!blog) {
    blog = await Blog.findOne({ slug: id.toLowerCase() }).lean();
  }

  if (!blog) {
    const targetSlug = slugify(id);
    const allBlogs = await Blog.find().lean();
    blog = allBlogs.find(
      (b) => b.slug === targetSlug || slugify(b.title) === targetSlug
    );
  }

  if (!blog) throw new AppError("Blog post not found", 404);

  res.json({
    success: true,
    blog: {
      ...blog,
      slug: blog.slug || slugify(blog.title),
    },
  });
});

export const createBlog = asyncHandler(async (req, res) => {
  const title = getString(req.body, "title", { required: true, max: 200 });
  const fields = {
    title,
    slug: req.body.slug ? slugify(req.body.slug) : slugify(title),
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
    if (!blog.slug || req.body.slug) {
      blog.slug = slugify(req.body.slug || blog.title);
    }
  }
  if (req.body.slug !== undefined) {
    blog.slug = slugify(req.body.slug);
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
