import mongoose from "mongoose";

const { Schema } = mongoose;

const blogSchema = new Schema(
  {
    title: { type: String, required: [true, "title is required"], trim: true, maxlength: 200 },
    category: { type: String, trim: true, maxlength: 60, default: "Uncategorized" },
    summary: { type: String, trim: true, maxlength: 500, default: "" },
    content: { type: String, required: [true, "content is required"] },
    image: { type: String, trim: true, default: "" },
    imagePublicId: { type: String, trim: true, default: "" },
    published: { type: Boolean, default: true },
  },
  { timestamps: true }
);

blogSchema.index({ createdAt: -1 });
blogSchema.index({ category: 1 });

export const Blog = mongoose.model("Blog", blogSchema);
