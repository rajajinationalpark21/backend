import mongoose from "mongoose";

const { Schema } = mongoose;

const galleryImageSchema = new Schema(
  {
    url: { type: String, required: true, trim: true },
    publicId: { type: String, required: true, trim: true },
    title: { type: String, trim: true, maxlength: 160, default: "" },
    category: { type: String, trim: true, maxlength: 60, default: "" },
    format: { type: String, trim: true, default: "" },
    width: { type: Number },
    height: { type: Number },
    bytes: { type: Number },
  },
  { timestamps: true }
);

galleryImageSchema.index({ createdAt: -1 });

export const GalleryImage = mongoose.model("GalleryImage", galleryImageSchema);
