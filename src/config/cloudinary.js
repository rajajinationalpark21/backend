import { v2 as cloudinary } from "cloudinary";
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
function uploadBuffer(buffer, { folder, publicId }) {
  assertCloudinaryIsConfigured();

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: "image", public_id: publicId, overwrite: Boolean(publicId) },
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
export async function uploadImage(file, folder) {
  const result = await uploadBuffer(file.buffer, { folder });

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
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.warn(`[cloudinary] Could not delete ${publicId}: ${error.message}`);
  }
}
