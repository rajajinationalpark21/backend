import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { connectDatabase, disconnectDatabase } from "../config/db.js";
import { FOLDERS, uploadImage } from "../config/cloudinary.js";
import { getContentDocument } from "../models/Content.js";
import { seedContent } from "./content.data.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(here, "../../..");
const sourceRoot = path.join(
  projectRoot,
  "documentation",
  "wetransfer_photos-for-website_2026-10-10_0653",
  "PAGE - Wildlife & Biodiversity"
);

const MAMMALS = "Photos - Sub-page - Mammals of Rajaji";
const BIRDS = "Photos - Sub-page - Birds of Rajaji";
const BUTTERFLIES = "Photos - Sub-page - Butterflies of Rajaji";
const FLORA = "Photos - Sub-page - Flora of Rajaji";
const REPTILES = "Photos - Sub-page - Reptiles of Rajaji";

// Official page copy for the five wildlife sections. Lists come from
// seedContent (client documentation); titles/subtitles match the frontend
// fallbacks so admin editors start from complete data.
const WILDLIFE_SECTIONS = {
  reptiles: {
    title: "Reptiles of Rajaji Tiger Reserve",
    subtitle:
      "Rajaji Tiger Reserve in Uttarakhand supports a rich diversity of reptiles across its Shivalik hill forests, perennial riverbeds, grasslands, and wetlands. While secretive and well-camouflaged, these cold-blooded apex species are critical indicators of healthy forest ecology.",
  },
  birds: {
    title: "Birds of Rajaji National Park",
    subtitle:
      "Over 400 recorded species of resident, passage, and altitudinal migratory birds across the Sino-Himalayan subtropical and temperate ecotone of Rajaji.",
  },
  fauna: {
    title: "Wildlife (Fauna) of Rajaji",
    subtitle:
      "Spanning 820.42 sq km across three amalgamated sanctuaries, the reserve protects the northernmost habitat of the Asian Elephant and a thriving population of Royal Bengal Tigers.",
  },
  butterflies: {
    title: "Butterflies of Rajaji",
    subtitle:
      "From dazzling swallowtails congregating along wet river sandbanks to cryptic forest species, Rajaji's warm tropical valleys nurture a thriving butterfly realm essential for forest pollination.",
  },
  flora: {
    title: "Flora of Rajaji Tiger Reserve",
    subtitle:
      "Between the Shivalik ridges and the Indo-Gangetic floodplains, Rajaji features exceptional botanical diversity — dense tropical moist deciduous forest, dry thorn scrub, and riverine khair-sissoo belts.",
  },
};

// Photo assignments verified against the WeTransfer documentation folder.
// Only confident filename matches and visually confirmed species are listed;
// anything else keeps an empty image so admin can upload later.
const IMAGE_MAP = {
  reptiles: {
    hero: `${REPTILES}/DSC_2635.JPG`,
    species: {
      "Indian Rock Python": `${REPTILES}/DSCN0314.JPG`,
      "Indian Cobra (Spectacled Cobra)": `${REPTILES}/DSC_2635.JPG`,
      "Bengal Monitor Lizard": `${REPTILES}/Bengal monitor (Varanus bengalensis).JPG`,
      "Oriental Garden Lizard (Calotes)": `${REPTILES}/DSCN6106.JPG`,
    },
  },
  fauna: {
    hero: `${MAMMALS}/Asian Elephant Herd in Forest Grassland.png`,
    primeAttractions: {
      "Asian Elephant (Elephas maximus)": `${MAMMALS}/Asian elephant 2.png`,
      "Royal Bengal Tiger (Panthera tigris)": `${MAMMALS}/tiger 1.png`,
      "Indian Leopard (Panthera pardus)": `${MAMMALS}/leopard 1.png`,
    },
    herbivores: {
      "Spotted Deer (Cheetal)": `${MAMMALS}/spotted deers.png`,
      "Sambar Deer": `${MAMMALS}/sambhar deer 1.png`,
    },
    reptiles: {
      "Bengal Monitor Lizard": `${REPTILES}/Bengal monitor (Varanus bengalensis).JPG`,
      "Indian Rock Python": `${REPTILES}/DSCN0314.JPG`,
    },
  },
  birds: {
    hero: `${BIRDS}/hornbill Mohand.png`,
    families: {
      Hornbills: `${BIRDS}/hornbill Mohand.png`,
      "Raptors & Birds of Prey": `${BIRDS}/white eyed buzzard.jpg`,
    },
  },
  butterflies: {
    hero: `${BUTTERFLIES}/Common Palmfly.png`,
  },
  flora: {
    hero: `${FLORA}/DSC_9121.jpg`,
    dominantTrees: {
      "Palash (Flame of the Forest)": `${FLORA}/DSCN1926.JPG`,
      Rohini: `${FLORA}/DSC_9400.jpg`,
    },
  },
};

// Client-named butterfly photos for species not present in the base seed
// list but documented in the official Butterflies sub-page copy.
const EXTRA_BUTTERFLIES = [
  {
    name: "Common Palmfly (Elymnias hypermnestra)",
    family: "Nymphalidae",
    habitat: "Forest edges, shaded paths and palm thickets",
    imageRelativePath: `${BUTTERFLIES}/Common Palmfly.png`,
  },
  {
    name: "Brown Eyed (Junonia iphita)",
    family: "Nymphalidae",
    habitat: "Moist forest undergrowth and stream-side vegetation",
    imageRelativePath: `${BUTTERFLIES}/Brown Eyed red.png`,
  },
];

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/\([^)]*\)/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

async function main() {
  try {
    await fs.access(sourceRoot);
  } catch {
    throw new Error(`Website image folder was not found: ${sourceRoot}`);
  }

  console.log("[seed-wildlife] Connecting to database");
  await connectDatabase();
  const doc = await getContentDocument();

  const urlCache = new Map();

  async function upload(relativePath, publicId) {
    if (!relativePath) return "";
    if (urlCache.has(relativePath)) return urlCache.get(relativePath);

    const absolutePath = path.join(sourceRoot, relativePath);
    try {
      const buffer = await fs.readFile(absolutePath);
      const result = await uploadImage(
        { buffer, originalname: path.basename(absolutePath) },
        FOLDERS.content,
        { publicId }
      );
      urlCache.set(relativePath, result.url);
      console.log(`[seed-wildlife] Uploaded ${relativePath}`);
      return result.url;
    } catch (error) {
      console.warn(
        `[seed-wildlife] Upload failed for ${relativePath}, continuing without: ${error.message}`
      );
      urlCache.set(relativePath, "");
      return "";
    }
  }

  // ── Reptiles ────────────────────────────────────────────────────────────────
  {
    const base = seedContent.reptiles;
    const map = IMAGE_MAP.reptiles;
    const heroUrl = await upload(map.hero, "wildlife/reptiles/hero");
    const species = [];
    for (const item of base.species) {
      const relative = map.species[item.name] || "";
      const image = relative
        ? await upload(relative, `wildlife/reptiles/${slugify(item.name)}`)
        : "";
      species.push({ ...item, image });
    }
    doc.set("reptiles", {
      ...WILDLIFE_SECTIONS.reptiles,
      overview: base.overview,
      species,
      seoTitle: base.seoTitle,
      metaDescription: base.metaDescription,
      heroBanner: heroUrl,
      heroBannerPublicId: heroUrl ? "wildlife/reptiles/hero" : "",
    });
    doc.markModified("reptiles");
    console.log(`[seed-wildlife] Reptiles: ${species.length} species`);
  }

  // ── Fauna (Mammals) ─────────────────────────────────────────────────────────
  {
    const base = seedContent.fauna;
    const map = IMAGE_MAP.fauna;
    const heroUrl = await upload(map.hero, "wildlife/fauna/hero");

    const primeAttractions = [];
    for (const item of base.primeAttractions) {
      const relative = map.primeAttractions[item.name] || "";
      const image = relative
        ? await upload(relative, `wildlife/fauna/${slugify(item.name)}`)
        : "";
      primeAttractions.push({ ...item, image });
    }

    const herbivores = [];
    for (const item of base.herbivores) {
      const relative = map.herbivores[item.name] || "";
      const image = relative
        ? await upload(relative, `wildlife/fauna/${slugify(item.name)}`)
        : "";
      herbivores.push({ ...item, image });
    }

    const carnivores = base.carnivores.map((item) => ({ ...item, image: "" }));

    const reptileItems = [];
    for (const item of base.reptiles) {
      const relative = map.reptiles[item.name] || "";
      const image = relative
        ? await upload(relative, `wildlife/fauna/${slugify(item.name)}`)
        : "";
      reptileItems.push({ ...item, image });
    }

    doc.set("fauna", {
      ...WILDLIFE_SECTIONS.fauna,
      overview: base.overview,
      primeAttractions,
      herbivores,
      carnivores,
      reptiles: reptileItems,
      aquaticLife: base.aquaticLife,
      heroBanner: heroUrl,
      heroBannerPublicId: heroUrl ? "wildlife/fauna/hero" : "",
    });
    doc.markModified("fauna");
    console.log(
      `[seed-wildlife] Fauna: ${primeAttractions.length} attractions, ${herbivores.length} herbivores, ${carnivores.length} carnivores`
    );
  }

  // ── Birds ───────────────────────────────────────────────────────────────────
  {
    const base = seedContent.birds;
    const map = IMAGE_MAP.birds;
    const heroUrl = await upload(map.hero, "wildlife/birds/hero");

    const families = [];
    for (const item of base.families) {
      const relative = map.families[item.group] || "";
      const image = relative
        ? await upload(relative, `wildlife/birds/${slugify(item.group)}`)
        : "";
      families.push({ ...item, image });
    }

    const restrictedRange = base.restrictedRange.map((item) => ({
      ...item,
      image: "",
    }));

    doc.set("birds", {
      ...WILDLIFE_SECTIONS.birds,
      overview: base.overview,
      stats: base.stats,
      families,
      restrictedRange,
      heroBanner: heroUrl,
      heroBannerPublicId: heroUrl ? "wildlife/birds/hero" : "",
    });
    doc.markModified("birds");
    console.log(`[seed-wildlife] Birds: ${families.length} families`);
  }

  // ── Butterflies ─────────────────────────────────────────────────────────────
  {
    const base = seedContent.butterflies;
    const map = IMAGE_MAP.butterflies;
    const heroUrl = await upload(map.hero, "wildlife/butterflies/hero");

    const species = base.species.map((item) => ({ ...item, image: "" }));
    for (const extra of EXTRA_BUTTERFLIES) {
      const image = await upload(
        extra.imageRelativePath,
        `wildlife/butterflies/${slugify(extra.name)}`
      );
      species.push({
        name: extra.name,
        family: extra.family,
        habitat: extra.habitat,
        image,
      });
    }

    doc.set("butterflies", {
      ...WILDLIFE_SECTIONS.butterflies,
      overview: base.overview,
      mudPuddling: base.mudPuddling,
      species,
      heroBanner: heroUrl,
      heroBannerPublicId: heroUrl ? "wildlife/butterflies/hero" : "",
    });
    doc.markModified("butterflies");
    console.log(`[seed-wildlife] Butterflies: ${species.length} species`);
  }

  // ── Flora ───────────────────────────────────────────────────────────────────
  {
    const base = seedContent.flora;
    const map = IMAGE_MAP.flora;
    const heroUrl = await upload(map.hero, "wildlife/flora/hero");

    const dominantTrees = [];
    for (const item of base.dominantTrees) {
      const relative = map.dominantTrees[item.common] || "";
      const image = relative
        ? await upload(relative, `wildlife/flora/${slugify(item.common)}`)
        : "";
      dominantTrees.push({ ...item, image });
    }

    doc.set("flora", {
      ...WILDLIFE_SECTIONS.flora,
      overview: base.overview,
      altitudinalBands: base.altitudinalBands,
      dominantTrees,
      heroBanner: heroUrl,
      heroBannerPublicId: heroUrl ? "wildlife/flora/hero" : "",
    });
    doc.markModified("flora");
    console.log(`[seed-wildlife] Flora: ${dominantTrees.length} trees`);
  }

  await doc.save();
  console.log("[seed-wildlife] Wildlife sections saved (dummy data replaced).");
  await disconnectDatabase();
}

main().catch((error) => {
  console.error(`[seed-wildlife] Failed: ${error.message}`);
  disconnectDatabase().catch(() => {});
  process.exitCode = 1;
});
