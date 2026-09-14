import multer from "multer";
import { env } from "../config/env.js";
import { AppError } from "../utils/AppError.js";

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
]);

// Memory storage keeps the file as a buffer so it can be streamed straight to
// Cloudinary without ever touching the local disk.
const uploader = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: env.uploads.maxFileSizeBytes,
    files: env.uploads.maxFilesPerRequest,
  },
  fileFilter(req, file, cb) {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      cb(
        new AppError(
          `Unsupported file type "${file.mimetype}". Upload a JPEG, PNG, WebP, GIF or AVIF image.`,
          400
        )
      );
      return;
    }
    cb(null, true);
  },
});

const maxFiles = env.uploads.maxFilesPerRequest;

/** Blog cover image - the admin form field is `image`. */
export const blogImage = uploader.single("image");

/** Gallery upload - accepts one or many files under `images` (or `image`). */
export const galleryImages = uploader.fields([
  { name: "images", maxCount: maxFiles },
  { name: "image", maxCount: maxFiles },
]);

/** Content sections - the home tab uploads a hero banner. */
export const contentMedia = uploader.fields([{ name: "heroBanner", maxCount: 1 }]);

/** Single arbitrary image, returns its hosted URL. */
export const singleImage = uploader.single("image");
