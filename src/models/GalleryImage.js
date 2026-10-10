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
    // Present only for the supplied website-image import. It makes the import
    // idempotent without affecting images uploaded later from the admin UI.
    sourceKey: { type: String, trim: true, unique: true, sparse: true },
  },
  { timestamps: true }
);

galleryImageSchema.index({ createdAt: -1 });

export const GalleryImage = mongoose.model("GalleryImage", galleryImageSchema);
