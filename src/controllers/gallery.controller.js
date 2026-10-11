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
  const rawIds = req.body?.imageIds || req.body?.ids || req.body?.imageId || req.body?.id || req.body?._id;
  const ids = Array.isArray(rawIds) ? rawIds : rawIds ? [rawIds] : [];

  if (ids.length === 0) {
    throw new AppError("No image ID specified", 400);
  }

  const images = await GalleryImage.find({ _id: { $in: ids } });
  await Promise.allSettled(
    images.map((img) => (img.publicId ? destroyImage(img.publicId) : Promise.resolve()))
  );

  await GalleryImage.deleteMany({ _id: { $in: ids } });

  res.json({ success: true, message: `${ids.length} photo(s) deleted successfully` });
});

export const clearAllImages = asyncHandler(async (req, res) => {
  const images = await GalleryImage.find().lean();
  await Promise.allSettled(
    images.map((img) => (img.publicId ? destroyImage(img.publicId) : Promise.resolve()))
  );

  const result = await GalleryImage.deleteMany({});
  res.json({
    success: true,
    message: `All gallery photos cleared (${result.deletedCount} removed)`,
    deletedCount: result.deletedCount,
  });
});
