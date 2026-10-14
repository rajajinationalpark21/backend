import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { connectDatabase, disconnectDatabase } from "../config/db.js";
import { FOLDERS, uploadImage } from "../config/cloudinary.js";
import { getContentDocument } from "../models/Content.js";
import { seedContent } from "../seed/content.data.js";

// Aligns live text with the client's page documents and replaces bird photos
// that showed the wrong species. Only the fields named here are changed.
//
//   node src/scripts/applyClientDocContent.js --dry-run   (report only)
//   node src/scripts/applyClientDocContent.js

const dryRun = process.argv.includes("--dry-run");
const here = path.dirname(fileURLToPath(import.meta.url));
const birdsRoot = path.resolve(
  here, "../../..", "documentation", "wetransfer_photos-for-website_2026-10-10_0653",
  "PAGE - Wildlife & Biodiversity", "Photos - Sub-page - Birds of Rajaji"
);

// Birds doc: "Birds of Rajaji – बर्ड्स फोटोस" gallery.
const BIRD_GALLERY = [
  "hornbill Mohand.png", "DSC_4648 G Oriole.jpg", "DSC_9036 red.jpg", "DSC_1103 red.jpg",
  "DSC_6888 red.jpg", "DSC_6731 red.jpg", "DSC_6883 red.jpg", "DSCN7115 red.JPG",
  "DSC_9429 red.jpg", "DSC_6953 red.jpg", "DSC_7284 short toed eagle red.JPG", "BS kite.png",
  "DSCN7066 red.JPG", "DSC_9149 red.jpg", "DSC_9379.jpg", "DSC_4152.JPG",
];
const BLACK_NECKED_STORK = "DSC_6888 red.jpg";

const uploaded = new Map();
async function uploadBird(fileName) {
  if (uploaded.has(fileName)) return uploaded.get(fileName);
  const slug = path.basename(fileName, path.extname(fileName)).toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const publicId = `media-plan/wildlife-biodiversity/birds-of-rajaji/${slug}`;
  let url = `(upload ${fileName})`;
  if (!dryRun) {
    const buffer = await fs.readFile(path.join(birdsRoot, fileName));
    ({ url } = await uploadImage({ buffer, originalname: fileName }, FOLDERS.content, { publicId }));
  }
  uploaded.set(fileName, url);
  return url;
}

const changes = [];
function set(target, key, value, label) {
  const before = JSON.stringify(target[key] ?? "");
  const after = JSON.stringify(value);
  if (before === after) return;
  changes.push(`${label}\n    was: ${before.slice(0, 300)}\n    now: ${after.slice(0, 300)}`);
  target[key] = value;
}

async function main() {
  for (const fileName of BIRD_GALLERY) await fs.access(path.join(birdsRoot, fileName));

  await connectDatabase();
  const doc = await getContentDocument();

  // Bird species: the Birds doc and the homepage content both give ~400.
  for (const [section, field] of [["home", "aboutStats"], ["about", "overviewStats"]]) {
    (doc[section][field] || []).forEach((stat, index) => {
      if (/bird/i.test(stat.label) && stat.value === "300+") set(stat, "value", "400+", `${section}.${field}[${index}].value`);
    });
    doc.markModified(section);
  }

  const zones = doc.safari.zones;
  const gohri = zones.find((zone) => zone.slug === "gohri-range-safari");
  if (gohri) {
    // The Gohri doc: "generally open year-round, except during August and
    // September ... should not be treated as guaranteed".
    set(gohri, "seoTitle", "Gohri Range Jungle Safari | Rajaji Tiger Reserve Near Rishikesh", "safari.zones[gohri].seoTitle");
    set(
      gohri,
      "metaDescription",
      "Gohri Range jungle safari in Rajaji Tiger Reserve near Rishikesh. Generally open except August and September, subject to Forest Department permissions.",
      "safari.zones[gohri].metaDescription"
    );
  }
  // "Wildlife You May Encounter" lists from each zone doc; the live copies are empty.
  for (const seedZone of seedContent.safari.zones) {
    const zone = zones.find((item) => item.slug === seedZone.slug);
    if (zone && !zone.wildlife?.length && seedZone.wildlife?.length) {
      set(zone, "wildlife", seedZone.wildlife, `safari.zones[${zone.slug}].wildlife`);
    }
  }
  doc.markModified("safari.zones");

  const stay = doc.stay?.wildBrook?.features;
  if (stay) {
    const index = stay.indexOf("Direct access to Gohri Range year-round buffer safari");
    if (index >= 0) {
      stay[index] = "Direct access to Gohri Range safari (generally open except August & September)";
      changes.push(`stay.wildBrook.features[${index}] -> generally open except August & September`);
      doc.markModified("stay");
    }
  }

  const birds = doc.birds;
  for (const [index, family] of birds.families.entries()) {
    if (family.species.includes("Black-bellied Tern") && !/water/i.test(family.group)) {
      // A tern, not a bird of prey: move it to the wetland group.
      set(family, "species", family.species.filter((name) => name !== "Black-bellied Tern"), `birds.families[${index}].species`);
      const wetland = birds.families.find((item) => /water/i.test(item.group));
      if (wetland && !wetland.species.includes("Black-bellied Tern")) {
        set(wetland, "species", [...wetland.species, "Black-bellied Tern"], `birds.families[${wetland.group}].species`);
      }
    }
    // No client photo shows a kingfisher; a placeholder beats a non-Indian species.
    if (/kingfisher/i.test(family.group)) set(family, "image", "", `birds.families[${family.group}].image`);
    if (/water/i.test(family.group)) set(family, "image", await uploadBird(BLACK_NECKED_STORK), `birds.families[${family.group}].image`);
  }
  for (const bird of birds.restrictedRange) {
    // The photo was a Common Stonechat; no client photo shows this warbler.
    if (/tytler/i.test(bird.name)) set(bird, "image", "", `birds.restrictedRange[${bird.name}].image`);
  }

  set(birds, "watchingTitle", "Bird Watching in Rajaji National Park and Uttarakhand", "birds.watchingTitle");
  set(birds, "watchingParagraphs", [
    "Explore the fascinating birdlife of Rajaji National Park and the surrounding Uttarakhand landscape through birdwatching and wildlife safari experiences. Depending on the season, habitat and weather conditions, visitors may encounter a variety of resident, migratory and altitudinal migrant birds.",
    "During a Rajaji Jeep Safari / Jungle Safari, visitors may observe colourful forest birds, birds of prey, woodpeckers, hornbills, kingfishers, parakeets, pheasants and other birds in their natural surroundings. The combination of forest, grassland and riverine habitats makes Rajaji an appealing destination for birdwatchers, nature enthusiasts and wildlife photographers.",
    "The Indian Peafowl, India's national bird, is commonly observed in suitable habitats of the reserve. Other birds recorded or associated with the Rajaji landscape include the species below, along with numerous woodpeckers, kingfishers, barbets, finches, thrushes and other forest birds.",
    "Winter can provide additional birdwatching opportunities as migratory and altitudinal migrant species occur in suitable habitats, wetlands and water bodies around the Rajaji landscape.",
    "Birdwatching in Rajaji offers visitors an opportunity to experience the reserve beyond its famous large mammals and appreciate the diversity of forest, grassland and riverine ecosystems that support its rich birdlife.",
  ], "birds.watchingParagraphs");
  set(birds, "notableSpecies", [
    "Indian Peafowl", "Rusty-cheeked Scimitar Babbler", "Golden-spectacled Warbler", "Chestnut-tailed Starling",
    "Brown Hawk-Owl", "Brown Fish Owl", "Drongo Cuckoo", "Slaty-headed Parakeet", "Great Hornbill",
    "Red Junglefowl", "Lineated Barbet", "Black-hooded Oriole", "Kalij Pheasant",
  ], "birds.notableSpecies");
  const gallery = [];
  for (const fileName of BIRD_GALLERY) gallery.push(await uploadBird(fileName));
  set(birds, "galleryImages", gallery, "birds.galleryImages");
  set(birds, "packagesTitle", "Birdwatching Packages and Enquiries", "birds.packagesTitle");
  set(
    birds,
    "packagesText",
    "Birdwatching and wildlife tour packages are available on request. Experience the rich birdlife of Rajaji National Park / Rajaji Tiger Reserve while exploring the beautiful Shivalik landscape on a guided wildlife safari.",
    "birds.packagesText"
  );
  set(birds, "packagesContactName", "Dr. Chaturbhuj", "birds.packagesContactName");
  set(birds, "packagesPhones", ["+91 98298 50501", "+91 99829 07130"], "birds.packagesPhones");
  doc.markModified("birds");

  console.log(changes.join("\n"));
  if (dryRun) {
    console.log(`[doc-content] Dry run: ${changes.length} changes, ${uploaded.size} bird photos. Nothing was saved.`);
  } else {
    await doc.save();
    console.log(`[doc-content] Saved ${changes.length} changes; uploaded ${uploaded.size} bird photos.`);
  }
  await disconnectDatabase();
}

main().catch((error) => {
  console.error(`[doc-content] Failed: ${error.message}`);
  disconnectDatabase().catch(() => {});
  process.exitCode = 1;
});
