import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { FOLDERS, uploadImage } from "../config/cloudinary.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(here, "../../..");
const sourceRoot = path.join(projectRoot, "documentation", "wetransfer_photos-for-website_2026-10-10_0653");
const sourceFile = path.join(
  sourceRoot,
  "PAGE - Jungle Safari Jeep Safari Zones",
  "Photos - Jeep safari Jungle safari Chilla",
  "chilla gate 3.png"
);

const buffer = await fs.readFile(sourceFile);
const result = await uploadImage(
  { buffer, originalname: "chilla-gate-3.png" },
  FOLDERS.content,
  { publicId: "contact/hero-gate" }
);
console.log(JSON.stringify(result, null, 2));
