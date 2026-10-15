import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { FOLDERS, optimizeImageBuffer, uploadImage } from "../config/cloudinary.js";
import { GalleryImage } from "../models/GalleryImage.js";

// Shared by the scripts that publish the client's photo folders
// (documentation/wetransfer_photos-for-website_*). Fixed public IDs make
// reruns overwrite rather than duplicate.

const here = path.dirname(fileURLToPath(import.meta.url));
export const sourceRoot = path.resolve(
  here, "../../..", "documentation", "wetransfer_photos-for-website_2026-10-10_0653"
);

export const ZONES = "PAGE - Jungle Safari Jeep Safari Zones";
export const WILDLIFE = "PAGE - Wildlife & Biodiversity";
export const TICKETS = "PAGE - Ticket and Entry";

export function slugFor(source) {
  return source
    .replace(/^PAGE - /, "")
    .replace(/Photos? ?- ?(Sub-page - |Main page - |Jeep [Ss]afari Jungle safari )?/g, "")
    .toLowerCase()
    .replace(/\.[a-z]+$/, "")
    .replace(/[^a-z0-9/]+/g, "-")
    .replace(/-*\/-*/g, "/")
    .replace(/^-|-$/g, "");
}

export function categoryFor(source) {
  const zone = source.match(/Jungle safari (\w+)\//);
  if (zone) return `Safari Zone — ${zone[1]}`;
  if (source.startsWith(TICKETS)) return "Tickets & Entry";
  const sub = source.match(/Sub-page - (.+?)\//);
  return sub ? sub[1] : "Wildlife & Biodiversity";
}

/**
 * Returns `upload(source) -> { url, publicId }`.
 *   dryRun     report only; nothing is read or written
 *   localDir   write the optimized file to `<localDir>/<publicId>.webp` and
 *              return `<localBase>/<publicId>.webp` instead of uploading
 *              (for previewing on a local copy of the site)
 */
export function createUploader({ dryRun = false, localDir = null, localBase = "" } = {}) {
  const uploaded = new Map();
  return async function upload(source) {
    if (uploaded.has(source)) return uploaded.get(source);
    const publicId = `media-plan/${slugFor(source)}`;
    if (dryRun) {
      const placeholder = { url: `(upload ${source})`, publicId };
      uploaded.set(source, placeholder);
      return placeholder;
    }
    const buffer = await fs.readFile(path.join(sourceRoot, source));
    let image;
    if (localDir) {
      const target = path.join(localDir, `${publicId}.webp`);
      await fs.mkdir(path.dirname(target), { recursive: true });
      await fs.writeFile(target, await optimizeImageBuffer(buffer));
      image = { url: `${localBase}/${publicId}.webp`, publicId, format: "webp" };
    } else {
      image = await uploadImage({ buffer, originalname: path.basename(source) }, FOLDERS.content, { publicId });
    }
    // Keep the admin gallery in step: one record per source photo.
    await GalleryImage.findOneAndUpdate(
      { sourceKey: source },
      {
        url: image.url, publicId: image.publicId, format: image.format,
        width: image.width, height: image.height, bytes: image.bytes,
        title: path.basename(source, path.extname(source)), category: categoryFor(source),
      },
      { upsert: true, setDefaultsOnInsert: true }
    );
    uploaded.set(source, image);
    console.log(`  stored ${source}\n        -> ${image.url}`);
    return image;
  };
}
