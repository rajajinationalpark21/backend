import mongoose from "mongoose";
import { slugify } from "../utils/slugify.js";

const { Schema } = mongoose;

const blogSchema = new Schema(
  {
    title: { type: String, required: [true, "title is required"], trim: true, maxlength: 200 },
    category: { type: String, trim: true, maxlength: 60, default: "Uncategorized" },
    summary: { type: String, trim: true, maxlength: 500, default: "" },
    content: { type: String, required: [true, "content is required"] },
    quote: { type: String, trim: true, default: "" },
    quoteAuthor: { type: String, trim: true, default: "" },
    image: { type: String, trim: true, default: "" },
    imagePublicId: { type: String, trim: true, default: "" },
    slug: { type: String, trim: true, lowercase: true, index: true },
    published: { type: Boolean, default: true },
  },
  { timestamps: true }
);

/**
 * Every post keeps a stored, unique slug (its URL). It is made from the title
 * when none is given, and "-2", "-3"… is added when another post already uses it.
 */
blogSchema.pre("validate", async function ensureSlug() {
  const base = slugify(this.slug || this.title) || "post";
  if (!this.isNew && !this.isModified("slug") && !this.isModified("title") && this.slug) return;
  let candidate = base;
  for (let n = 2; await this.constructor.exists({ slug: candidate, _id: { $ne: this._id } }); n += 1) {
    candidate = `${base}-${n}`;
  }
  this.slug = candidate;
});

blogSchema.index({ createdAt: -1 });
blogSchema.index({ category: 1 });

export const Blog = mongoose.model("Blog", blogSchema);
