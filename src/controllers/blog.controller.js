import mongoose from "mongoose";
import { Blog } from "../models/Blog.js";
import { FOLDERS, destroyImage, uploadImage } from "../config/cloudinary.js";
import { AppError } from "../utils/AppError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { getIdFromAliases, getString } from "../utils/validation.js";
import { slugify } from "../utils/slugify.js";
import { recordAudit } from "../services/audit.js";
import { blogPaths, schedulePublish } from "../services/publish.js";

export { slugify };

const BLOG_ID_ALIASES = ["blogId", "id", "_id"];

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

  const targetSlug = slugify(id);
  if (!blog && targetSlug) {
    blog = await Blog.findOne({ slug: targetSlug }).lean();
  }

  // Posts saved before slugs were stored: only those few are checked by title.
  if (!blog && targetSlug) {
    const unslugged = await Blog.find({ $or: [{ slug: { $exists: false } }, { slug: null }, { slug: "" }] })
      .select("_id title")
      .lean();
    const match = unslugged.find((b) => slugify(b.title) === targetSlug);
    if (match) blog = await Blog.findById(match._id).lean();
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
    // Made unique by the model when it is saved.
    slug: slugify(req.body.slug || title),
    category: getString(req.body, "category", { max: 60, fallback: "Uncategorized" }),
    summary: getString(req.body, "summary", { max: 500 }),
    seoTitle: getString(req.body, "seoTitle", { max: 70 }),
    content: getString(req.body, "content", { required: true, max: 200_000 }),
    quote: getString(req.body, "quote", { max: 1000 }),
    quoteAuthor: getString(req.body, "quoteAuthor", { max: 150 }),
  };

  if (req.file) {
    const image = await uploadImage(req.file, FOLDERS.blogs);
    fields.image = image.url;
    fields.imagePublicId = image.publicId;
  }

  const blog = await Blog.create(fields);
  await recordAudit(req, "blog.create", blog.title);
  schedulePublish(blogPaths(blog.slug));

  res.status(201).json({ success: true, message: "Blog post created", blog });
});

export const updateBlog = asyncHandler(async (req, res) => {
  const id = getIdFromAliases(req.body, BLOG_ID_ALIASES, "blogId");
  const blog = await Blog.findById(id);

  if (!blog) throw new AppError("Blog post not found", 404);
  const previousSlug = blog.slug;

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
  if (req.body.seoTitle !== undefined) {
    blog.seoTitle = getString(req.body, "seoTitle", { max: 70 });
  }
  if (req.body.content !== undefined) {
    blog.content = getString(req.body, "content", { required: true, max: 200_000 });
  }
  if (req.body.quote !== undefined) {
    blog.quote = getString(req.body, "quote", { max: 1000 });
  }
  if (req.body.quoteAuthor !== undefined) {
    blog.quoteAuthor = getString(req.body, "quoteAuthor", { max: 150 });
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

  await recordAudit(req, "blog.update", blog.title);
  schedulePublish(blogPaths(blog.slug, previousSlug));
  res.json({ success: true, message: "Blog post updated", blog });
});

export const deleteBlog = asyncHandler(async (req, res) => {
  const source = { ...req.query, ...req.params, ...req.body };
  const id = getIdFromAliases(source, BLOG_ID_ALIASES, "blogId");
  const blog = await Blog.findByIdAndDelete(id);

  if (!blog) throw new AppError("Blog post not found", 404);

  await destroyImage(blog.imagePublicId);
  await recordAudit(req, "blog.delete", blog.title);
  schedulePublish(blogPaths(blog.slug));

  res.json({ success: true, message: "Blog post deleted" });
});
