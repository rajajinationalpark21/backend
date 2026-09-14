import { GalleryImage } from "../models/GalleryImage.js";
import { FOLDERS, destroyImage, uploadImage } from "../config/cloudinary.js";
import { AppError } from "../utils/AppError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { getIdFromAliases, getString } from "../utils/validation.js";

const IMAGE_ID_ALIASES = ["imageId", "id", "_id"];

/** Collects files whether the client used the plural or singular field name. */
function collectFiles(files) {
  if (Array.isArray(files)) return files;
  return [...(files?.images ?? []), ...(files?.image ?? [])];
}

export const listImages = asyncHandler(async (req, res) => {
  const images = await GalleryImage.find().sort({ createdAt: -1 }).lean();
  res.json({ success: true, count: images.length, images });
});

export const uploadImages = asyncHandler(async (req, res) => {
  const files = collectFiles(req.files);
  if (files.length === 0) {
    throw new AppError("No images were received. Send files under the \"images\" field.", 400);
  }

  const title = getString(req.body, "title", { max: 160 });
  const category = getString(req.body, "category", { max: 60 });

  const uploaded = await Promise.all(files.map((file) => uploadImage(file, FOLDERS.gallery)));
  const images = await GalleryImage.insertMany(uploaded.map((image) => ({ ...image, title, category })));

  res.status(201).json({
    success: true,
    message: `${images.length} image${images.length === 1 ? "" : "s"} uploaded`,
    count: images.length,
    images,
  });
});

export const deleteImage = asyncHandler(async (req, res) => {
  const id = getIdFromAliases(req.body, IMAGE_ID_ALIASES, "imageId");
  const image = await GalleryImage.findByIdAndDelete(id);

  if (!image) throw new AppError("Image not found", 404);

  await destroyImage(image.publicId);

  res.json({ success: true, message: "Image deleted" });
});
