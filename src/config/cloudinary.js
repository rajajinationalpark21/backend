import { v2 as cloudinary } from "cloudinary";
import sharp from "sharp";
import { env, isCloudinaryConfigured } from "./env.js";
import { AppError } from "../utils/AppError.js";

cloudinary.config({
  cloud_name: env.cloudinary.cloudName,
  api_key: env.cloudinary.apiKey,
  api_secret: env.cloudinary.apiSecret,
  secure: true,
});

export const FOLDERS = {
  blogs: `${env.cloudinary.folder}/blogs`,
  gallery: `${env.cloudinary.folder}/gallery`,
  content: `${env.cloudinary.folder}/content`,
};

export function assertCloudinaryIsConfigured() {
  if (!isCloudinaryConfigured) {
    throw new AppError(
      "Image storage is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET.",
      503
    );
  }
}

/** Uploads an in-memory file buffer and resolves with the Cloudinary result. */
const WEB_IMAGE_TRANSFORMATION = [
  // Large source photos are kept sharp enough for full-width hero frames while
  // preventing camera originals from being delivered to visitors.
  { width: 2400, height: 1600, crop: "limit" },
  { quality: "auto:good" },
];

function uploadBuffer(buffer, { folder, publicId }) {
  assertCloudinaryIsConfigured();

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
        public_id: publicId,
        overwrite: Boolean(publicId),
        // Store the optimized WebP, not the original multi-megabyte camera
        // upload. This is shared by admin uploads and the content seeder.
        format: "webp",
        transformation: WEB_IMAGE_TRANSFORMATION,
      },
      (error, result) => {
        if (error) return reject(error);
        if (!result) return reject(new Error("Cloudinary returned no result"));
        resolve(result);
      }
    );
    stream.end(buffer);
  });
}

/**
 * Normalizes a multer memory-storage file into the shape the models store, so
 * controllers never deal with the raw Cloudinary response.
 */
/**
 * `artwork: true` is for drawn images such as maps: no contrast stretch (it
 * turns flat colours dark) and a higher quality for crisp lines and labels.
 */
export async function optimizeImageBuffer(buffer, { artwork = false } = {}) {
  // Compression & auto-adjustment happen before the file reaches Cloudinary.
  // This keeps large camera originals within provider limits, enhances contrast/dynamic range,
  // and reduces storage and bandwidth for every current and future admin upload.
  let image = sharp(buffer, { animated: false, limitInputPixels: false })
    .rotate() // Auto-orient based on camera EXIF tags
    .resize({ width: 2400, height: artwork ? 2400 : 1600, fit: "inside", withoutEnlargement: true });
  if (!artwork) image = image.normalize(); // Auto-adjust contrast & dynamic range across color channels
  return image.webp({ quality: artwork ? 92 : 82, smartSubsample: !artwork }).toBuffer();
}

export async function uploadImage(file, folder, { publicId, artwork = false } = {}) {
  const optimizedBuffer = await optimizeImageBuffer(file.buffer, { artwork });
  const result = await uploadBuffer(optimizedBuffer, { folder, publicId });

  return {
    url: result.secure_url,
    publicId: result.public_id,
    width: result.width,
    height: result.height,
    format: result.format,
    bytes: result.bytes,
  };
}

/**
 * Best-effort cleanup. A failed remote delete must not fail the caller's request,
 * because the database record is already gone or replaced.
 */
export async function destroyImage(publicId) {
  if (!publicId || !isCloudinaryConfigured) return;
  // Only images this site uploaded (under its own folder) are ever deleted.
  if (!String(publicId).startsWith(`${env.cloudinary.folder}/`)) {
    console.warn(`[cloudinary] Refusing to delete ${publicId}: outside ${env.cloudinary.folder}/`);
    return;
  }
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.warn(`[cloudinary] Could not delete ${publicId}: ${error.message}`);
  }
}
