import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { connectDatabase, disconnectDatabase } from "../config/db.js";
import { FOLDERS, uploadImage } from "../config/cloudinary.js";
import { env } from "../config/env.js";
import { GalleryImage } from "../models/GalleryImage.js";
import { getContentDocument } from "../models/Content.js";
import { redactUri } from "../utils/redactUri.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(here, "../../..");
const sourceRoot = path.join(projectRoot, "documentation", "wetransfer_photos-for-website_2026-10-10_0653");
const imageExtensions = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif", ".gif"]);

const zoneSlugs = new Map([
  ["chilla", "chilla"], ["chillawali", "chillawali"], ["gohari", "gohari"],
  ["jhilmil", "jhilmil"], ["motichur", "motichur"], ["ranipur", "ranipur"],
]);

function titleFromFilename(fileName) {
  return path.basename(fileName, path.extname(fileName)).replace(/[._-]+/g, " ").replace(/\s+/g, " ").trim();
}

function classify(relativePath) {
  const normalized = relativePath.replace(/\\/g, "/");
  const lower = normalized.toLowerCase();
  const zone = [...zoneSlugs.keys()].find((name) => lower.includes(name));
  if (zone) return { category: `Safari Zone — ${zone[0].toUpperCase()}${zone.slice(1)}`, zone: zoneSlugs.get(zone) };
  if (lower.includes("ticket and entry")) return { category: "Tickets & Entry" };
  if (lower.includes("birds")) return { category: "Birds of Rajaji" };
  if (lower.includes("butterflies")) return { category: "Butterflies of Rajaji" };
  if (lower.includes("flora")) return { category: "Flora of Rajaji" };
  if (lower.includes("mammals")) return { category: "Mammals of Rajaji" };
  if (lower.includes("reptiles")) return { category: "Reptiles of Rajaji" };
  return { category: "Wildlife & Biodiversity", homeHero: true };
}

function publicIdFor(sourceKey) {
  const digest = crypto.createHash("sha1").update(sourceKey).digest("hex").slice(0, 12);
  return `website-seed/${digest}`;
}

async function findImages(directory) {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) return findImages(absolutePath);
    return imageExtensions.has(path.extname(entry.name).toLowerCase()) ? [absolutePath] : [];
  }));
  return nested.flat();
}

async function main() {
  try {
    await fs.access(sourceRoot);
  } catch {
    throw new Error(`Website image folder was not found: ${sourceRoot}`);
  }

  const imagePaths = await findImages(sourceRoot);
  if (imagePaths.length === 0) throw new Error("No supported images were found in the website image folder.");

  console.log(`[website-images] Connecting to ${redactUri(env.mongoUri)}`);
  await connectDatabase();
  const doc = await getContentDocument();
  let added = 0;
  let skipped = 0;

  for (const absolutePath of imagePaths.sort()) {
    const sourceKey = path.relative(sourceRoot, absolutePath).replace(/\\/g, "/");
    const existing = await GalleryImage.exists({ sourceKey });
    if (existing) {
      skipped += 1;
      continue;
    }

    const buffer = await fs.readFile(absolutePath);
    const details = classify(sourceKey);
    const image = await uploadImage(
      { buffer, originalname: path.basename(absolutePath) },
      FOLDERS.gallery,
      { publicId: publicIdFor(sourceKey) }
    );

    await GalleryImage.create({
      ...image,
      title: titleFromFilename(absolutePath),
      category: details.category,
      sourceKey,
    });
    added += 1;

    // The first supplied photo for each safari-zone folder becomes that zone's
    // hero. Existing admin-selected heroes are never overwritten.
    if (details.zone) {
        const zone = doc.safari?.zones?.find((item) =>
          item.slug?.includes(details.zone) || (details.zone === "gohari" && item.slug?.includes("gohri"))
        );
      if (zone && !zone.heroImage) {
        zone.heroImage = image.url;
        zone.heroImagePublicId = image.publicId;
        doc.markModified("safari.zones");
      }
    }
    if (details.homeHero && !doc.home?.heroBanner) {
      doc.home.heroBanner = image.url;
      doc.home.heroBannerPublicId = image.publicId;
      doc.markModified("home");
    }
    console.log(`[website-images] ${added + skipped}/${imagePaths.length}: ${sourceKey}`);
  }

  await doc.save();
  // Reconcile page frames from every imported record as well. This also fixes
  // a partial import: records skipped on a later run can still populate a
  // previously empty hero field.
  const seededImages = await GalleryImage.find({ sourceKey: { $exists: true } }).sort({ sourceKey: 1 });
  for (const record of seededImages) {
    const details = classify(record.sourceKey);
    if (details.zone) {
      const zone = doc.safari?.zones?.find((item) =>
        item.slug?.includes(details.zone) || (details.zone === "gohari" && item.slug?.includes("gohri"))
      );
      if (zone && !zone.heroImage) {
        zone.heroImage = record.url;
        zone.heroImagePublicId = record.publicId;
        doc.markModified("safari.zones");
      }
    }
    if (details.homeHero && !doc.home?.heroBanner) {
      doc.home.heroBanner = record.url;
      doc.home.heroBannerPublicId = record.publicId;
      doc.markModified("home");
    }
  }
  await doc.save();
  console.log(`[website-images] Imported ${added}; already present ${skipped}.`);
  await disconnectDatabase();
}

main().catch((error) => {
  console.error(`[website-images] Failed: ${error.message}`);
  disconnectDatabase().catch(() => {});
  process.exitCode = 1;
});
