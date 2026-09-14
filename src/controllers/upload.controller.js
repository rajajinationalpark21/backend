import { FOLDERS, uploadImage } from "../config/cloudinary.js";
import { AppError } from "../utils/AppError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

/**
 * Hosts a single image and returns its URL. Used for content fields that are not
 * a hero banner - for example the About page activity cards.
 */
export const uploadSingleImage = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new AppError('No image was received. Send a file under the "image" field.', 400);
  }

  const image = await uploadImage(req.file, FOLDERS.content);

  res.status(201).json({ success: true, message: "Image uploaded", image });
});
