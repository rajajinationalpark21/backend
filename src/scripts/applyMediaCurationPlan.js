import fs from "node:fs/promises";
import path from "node:path";
import { connectDatabase, disconnectDatabase } from "../config/db.js";
import { getContentDocument } from "../models/Content.js";
import { TICKETS, WILDLIFE, ZONES, createUploader, sourceRoot } from "./clientMedia.js";

// Applies documentation/media-curation-plan.md: every page frame gets the
// approved client photo, uploaded through the same optimizer as admin uploads.
// Fixed public IDs make reruns overwrite rather than duplicate.
//
// Rotating header sets keep the photos already chosen for them, minus
// duplicates and photos from another page's folder, with the plan's hero first.
//
//   node src/scripts/applyMediaCurationPlan.js --dry-run   (report only)
//   node src/scripts/applyMediaCurationPlan.js

const dryRun = process.argv.includes("--dry-run");
const CHILLA = `${ZONES}/Photos - Jeep safari Jungle safari Chilla`;
const CHILLAWALI = `${ZONES}/Photos - Jeep Safari Jungle safari Chillawali`;
const GOHARI = `${ZONES}/Photos - Jeep Safari Jungle safari Gohari`;
const JHILMIL = `${ZONES}/Photos - Jeep safari Jungle safari Jhilmil`;
const MOTICHUR = `${ZONES}/Photos - Jeep Safari Jungle safari Motichur`;
const RANIPUR = `${ZONES}/Photos - Jeep safari Jungle safari Ranipur`;
const MAMMALS = `${WILDLIFE}/Photos - Sub-page - Mammals of Rajaji`;
const BUTTERFLIES = `${WILDLIFE}/Photos - Sub-page - Butterflies of Rajaji`;
const FLORA = `${WILDLIFE}/Photos - Sub-page - Flora of Rajaji`;

const TIGER = `${MAMMALS}/tiger 1.png`;
const ELEPHANT_HERD = `${GOHARI}/Asian Elephant Herd in Forest Grassland.png`;

// `header` is the rotating header set (first photo = the plan's hero);
// `gallery` is the plan's six photos for the zone page "Gallery" section.
const ZONE_PLAN = {
  "chilla-jeep-safari": {
    alt: "Wild tusker elephant standing beside safari Gypsy near Chilla gate entrance",
    header: [
      `${CHILLA}/chilla gate 3.png`, `${CHILLA}/chila.png`, `${CHILLA}/tiger chilla.png`,
      `${CHILLA}/DSC_2647 n Elephant Charging 12 x18.jpg`, `${CHILLA}/DSC_5310 n.jpg`,
      `${CHILLA}/elephant ride at chilla.png`,
    ],
    gallery: [
      `${CHILLA}/chila.png`, `${CHILLA}/tiger chilla.png`, `${CHILLA}/elephant ride at chilla.png`,
      `${CHILLA}/spotted deers.png`, `${CHILLA}/jackal.png`, `${CHILLA}/Bengal monitor (Varanus bengalensis).JPG`,
    ],
  },
  "chillawali-jeep-safari": {
    alt: "Indian leopard moving through dense sal tree foliage in Chillawali Mohand range",
    header: [
      `${CHILLAWALI}/panther Mohand.png`, `${CHILLAWALI}/DSCN5485 red.JPG`, `${CHILLAWALI}/hornbill Mohand.png`,
      `${CHILLAWALI}/Asian elephant 2.png`, `${CHILLAWALI}/DSC_6223.png`, `${CHILLAWALI}/sambhar 2.png`,
    ],
    gallery: [
      `${CHILLAWALI}/DSC_7934-.jpg`, `${CHILLAWALI}/hornbill Mohand.png`, `${CHILLAWALI}/DSC_6223.png`,
      `${CHILLAWALI}/DSC_6559.png`, `${CHILLAWALI}/white eyed buzzard.jpg`, `${CHILLAWALI}/Asian elephant 2.png`,
    ],
  },
  "gohri-range-safari": {
    alt: "Open 4x4 safari Gypsy crossing a wide stony riverbed beneath the forested Shivalik hills in Gohri range",
    header: [
      `${GOHARI}/DSC_5270.JPG`, `${GOHARI}/2  doifchoi.JPG`, `${GOHARI}/DSC_5271.JPG`,
      `${GOHARI}/2 jfojide.JPG`, ELEPHANT_HERD,
    ],
    gallery: [
      ELEPHANT_HERD, `${GOHARI}/gohari range.png`, `${GOHARI}/DSC_3709.png`,
      `${GOHARI}/2  doifchoi.JPG`, `${GOHARI}/DSCN2274.JPG`, `${GOHARI}/DSC_5271.JPG`,
    ],
  },
  "jhilmil-jheel-safari": {
    alt: "Open safari vehicle on a wetland track through tall grassland at Jhilmil Jheel Conservation Reserve",
    header: [
      `${JHILMIL}/jhilmil 2.png`, `${JHILMIL}/fauna 3.png`, `${JHILMIL}/fauna 2.png`,
      `${JHILMIL}/DSC_6888.jpg`, `${JHILMIL}/DSC_6731 red.jpg`, `${JHILMIL}/fauna 1.png`,
    ],
    gallery: [
      `${JHILMIL}/fauna 3.png`, `${JHILMIL}/fauna 1.png`, `${JHILMIL}/fauna 2.png`,
      `${JHILMIL}/gate.png`, `${JHILMIL}/Jhilmil safari.png`, `${JHILMIL}/DSC_6731 red.jpg`,
    ],
  },
  "motichur-jeep-safari": {
    alt: "Indian leopard resting in a dry sal forest clearing along the Motichur safari track",
    header: [
      `${MOTICHUR}/DSC_6223 red.png`, `${MOTICHUR}/DSCN0314.JPG`, `${MOTICHUR}/spotted deers.png`,
      `${MOTICHUR}/DSCN1354.JPG`, `${MOTICHUR}/DSC_6559.png`,
    ],
    gallery: [
      `${MOTICHUR}/DSC_9382.png`, `${MOTICHUR}/DSC_5683.png`, `${MOTICHUR}/DSC_6559.png`,
      `${MOTICHUR}/sambhar deer 1.png`, `${MOTICHUR}/asian elephant.png`, `${MOTICHUR}/DSCN1354.JPG`,
    ],
  },
  "ranipur-gate-jeep-safari": {
    alt: "Camouflaged Indian leopard perched on dry tree timber in Ranipur range",
    header: [
      `${RANIPUR}/leopard at Ranipur.png`, `${RANIPUR}/Asian elephant 2.png`, `${RANIPUR}/DSC_3709.png`,
      `${RANIPUR}/sambhar 2.png`,
    ],
    gallery: [
      `${RANIPUR}/DSC_1429-Enhanced-NR.png`, `${RANIPUR}/DSC_4276.png`, `${RANIPUR}/DSC_3709.png`,
      `${RANIPUR}/Asian elephant 2.png`, `${RANIPUR}/sambhar 2.png`, `${RANIPUR}/spotted deers.png`,
    ],
  },
};

// Section header sets: heroBanner = first photo, heroImages = all of them.
const HEADER_PLAN = {
  fauna: [TIGER, ELEPHANT_HERD, `${MAMMALS}/DSC_3709.png`, `${MAMMALS}/DSC_1429-Enhanced-NR.png`, `${MAMMALS}/DSC_8130.png`],
  butterflies: [
    `${BUTTERFLIES}/DSCN8033 red.JPG`, `${BUTTERFLIES}/Common Palmfly.png`, `${BUTTERFLIES}/DSC_5824 red.jpg`,
    `${BUTTERFLIES}/DSCN9798 r.png`, `${BUTTERFLIES}/DSC_5495 red.jpg`, `${BUTTERFLIES}/DSCN7356 red.JPG`,
    `${BUTTERFLIES}/DSC_5960 red.jpg`,
  ],
  flora: [
    `${FLORA}/DSC_9400.jpg`, `${FLORA}/DSC_9121.jpg`, `${FLORA}/DSCN1926.JPG`,
    `${FLORA}/DSCN5457 red.JPG`, `${FLORA}/DSC_9440.jpg`, `${FLORA}/DSCN7232.JPG`,
  ],
  tickets: [`${TICKETS}/DSC_5386.JPG`, `${TICKETS}/DSC_5320.JPG`, `${TICKETS}/IMG-20251217-WA0009.jpg`],
  // Not in the plan; these are the two photos embedded in the Terms & Conditions doc.
  parkRules: [`${TICKETS}/P1019731 red.JPG`, `${CHILLA}/DSC_5278.JPG`],
};

// Single image fields: [section, field, source].
const FIELD_PLAN = [
  ["home", "heroBanner", `${CHILLA}/chila.png`],
  ["home", "aboutImage", TIGER],
  ["fauna", "hubHeroBanner", `${WILDLIFE}/Photo- Main page - Wildlife & Biodiversity/DSC_2647 n Elephant Charging 12 x18-Picsart-AiImageEnhancer.jpg`],
];

// URL list fields: [section, field, sources].
const LIST_PLAN = [
  ["home", "aboutImages", [TIGER, `${TICKETS}/IMG-20251217-WA0010.jpg`, ELEPHANT_HERD]],
  ["home", "galleryImages", [
    `${TICKETS}/DSC_2647 n Elephant Charging 12 x18-Picsart-AiImageEnhancer.jpg`,
    `${RANIPUR}/leopard at Ranipur.png`,
    `${CHILLAWALI}/hornbill Mohand.png`,
    `${GOHARI}/DSC_3709.png`,
    `${JHILMIL}/jhilmil 2.png`,
  ]],
];

const upload = createUploader({ dryRun });

async function uploadAll(sources) {
  const images = [];
  for (const source of sources) images.push(await upload(source));
  return images;
}

function report(label, before, after) {
  const show = (value) => (Array.isArray(value) ? `[${value.length}] ${value.join(", ")}` : value || "(empty)");
  console.log(`${label}\n    was: ${show(before)}\n    now: ${show(after)}`);
}

async function main() {
  // Fail before touching anything if a planned source file is missing.
  const sources = new Set([
    ...Object.values(ZONE_PLAN).flatMap((zone) => [...zone.header, ...zone.gallery]),
    ...Object.values(HEADER_PLAN).flat(),
    ...FIELD_PLAN.map(([, , source]) => source),
    ...LIST_PLAN.flatMap(([, , list]) => list),
  ]);
  const missing = [];
  for (const source of sources) {
    await fs.access(path.join(sourceRoot, source)).catch(() => missing.push(source));
  }
  if (missing.length) throw new Error(`Source photos not found:\n  ${missing.join("\n  ")}`);
  console.log(`[media-plan] ${sources.size} source photos found${dryRun ? " (dry run: nothing is uploaded or saved)" : ""}`);

  await connectDatabase();
  const doc = await getContentDocument();

  for (const [slug, plan] of Object.entries(ZONE_PLAN)) {
    const zone = doc.safari?.zones?.find((item) => item.slug === slug);
    if (!zone) {
      console.warn(`[media-plan] Zone not found in content, skipping: ${slug}`);
      continue;
    }
    const header = await uploadAll(plan.header);
    const gallery = (await uploadAll(plan.gallery)).map((image) => image.url);
    report(`safari.zones[${slug}].heroImages`, zone.heroImages, header.map((image) => image.url));
    report(`safari.zones[${slug}].galleryImages`, zone.galleryImages, gallery);
    zone.heroImage = header[0].url;
    zone.heroImagePublicId = header[0].publicId;
    zone.heroImageAlt = plan.alt;
    zone.heroImages = header.map((image) => image.url);
    zone.galleryImages = gallery;
  }
  doc.markModified("safari.zones");

  for (const [section, sources] of Object.entries(HEADER_PLAN)) {
    const header = await uploadAll(sources);
    report(`${section}.heroImages`, doc[section].heroImages, header.map((image) => image.url));
    doc[section].heroBanner = header[0].url;
    doc[section].heroBannerPublicId = header[0].publicId;
    doc[section].heroImages = header.map((image) => image.url);
    doc.markModified(section);
  }

  for (const [section, field, source] of FIELD_PLAN) {
    const image = await upload(source);
    report(`${section}.${field}`, doc[section][field], image.url);
    doc[section][field] = image.url;
    doc[section][`${field}PublicId`] = image.publicId;
    doc.markModified(section);
  }

  for (const [section, field, list] of LIST_PLAN) {
    const urls = (await uploadAll(list)).map((image) => image.url);
    report(`${section}.${field}`, doc[section][field], urls);
    doc[section][field] = urls;
    doc.markModified(section);
  }

  if (dryRun) {
    console.log(`[media-plan] Dry run complete: ${uploaded.size} photos would be uploaded. Nothing was saved.`);
  } else {
    await doc.save();
    console.log(`[media-plan] Saved. ${uploaded.size} photos uploaded.`);
  }
  await disconnectDatabase();
}

main().catch((error) => {
  console.error(`[media-plan] Failed: ${error.message}`);
  disconnectDatabase().catch(() => {});
  process.exitCode = 1;
});
