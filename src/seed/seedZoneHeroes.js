import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { connectDatabase, disconnectDatabase } from "../config/db.js";
import { FOLDERS, uploadImage } from "../config/cloudinary.js";
import { getContentDocument } from "../models/Content.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(here, "../../..");
const sourceRoot = path.join(
  projectRoot,
  "documentation",
  "wetransfer_photos-for-website_2026-10-10_0653",
  "PAGE - Jungle Safari Jeep Safari Zones"
);

const CHILLA = "Photos - Jeep safari Jungle safari Chilla";
const CHILLAWALI = "Photos - Jeep Safari Jungle safari Chillawali";
const MOTICHUR = "Photos - Jeep Safari Jungle safari Motichur";
const RANIPUR = "Photos - Jeep safari Jungle safari Ranipur";
const JHILMIL = "Photos - Jeep safari Jungle safari Jhilmil";
const GOHARI = "Photos - Jeep Safari Jungle safari Gohari";

// Zone slug -> hero photo, visually verified against the documentation folder.
// chaurasi-kutiya-beatles-ashram has no client photo; it keeps the stock fallback.
const ZONE_HEROES = {
  "chilla-jeep-safari": `${CHILLA}/chilla gate 3.png`,
  "chillawali-jeep-safari": `${CHILLAWALI}/DSC_7934-.jpg`,
  "motichur-jeep-safari": `${MOTICHUR}/asian elephant.png`,
  "ranipur-gate-jeep-safari": `${RANIPUR}/DSC_1429-Enhanced-NR.png`,
  "jhilmil-jheel-safari": `${JHILMIL}/jhilmil 2.png`,
  "gohri-range-safari": `${GOHARI}/gohari range.png`,
};

async function main() {
  try {
    await fs.access(sourceRoot);
  } catch {
    throw new Error(`Safari zone photo folder was not found: ${sourceRoot}`);
  }

  console.log("[seed-zone-heroes] Connecting to database");
  await connectDatabase();
  const doc = await getContentDocument();

  const zones = doc.safari?.zones || [];
  let updated = 0;

  for (const [slug, relativePath] of Object.entries(ZONE_HEROES)) {
    const zone = zones.find((z) => z.slug === slug);
    if (!zone) {
      console.warn(`[seed-zone-heroes] Zone not found in content, skipping: ${slug}`);
      continue;
    }

    const absolutePath = path.join(sourceRoot, relativePath);
    try {
      const buffer = await fs.readFile(absolutePath);
      const publicId = `safari/zones/${slug}/hero`;
      const result = await uploadImage(
        { buffer, originalname: path.basename(absolutePath) },
        FOLDERS.content,
        { publicId }
      );
      zone.heroImage = result.url;
      zone.heroImagePublicId = publicId;
      updated += 1;
      console.log(`[seed-zone-heroes] ${slug}: ${relativePath}`);
      console.log(`[seed-zone-heroes]   -> ${result.url}`);
    } catch (error) {
      console.warn(
        `[seed-zone-heroes] Upload failed for ${slug} (${relativePath}): ${error.message}`
      );
    }
  }

  if (updated > 0) {
    doc.markModified("safari.zones");
    await doc.save();
    console.log(`[seed-zone-heroes] Saved ${updated} zone hero image(s).`);
  } else {
    console.log("[seed-zone-heroes] Nothing to update.");
  }

  await disconnectDatabase();
}

main().catch((error) => {
  console.error(`[seed-zone-heroes] Failed: ${error.message}`);
  disconnectDatabase().catch(() => {});
  process.exitCode = 1;
});
