import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { connectDatabase, disconnectDatabase } from "../config/db.js";
import { getContentDocument } from "../models/Content.js";
import { TICKETS, WILDLIFE, ZONES, createUploader, slugFor, sourceRoot } from "./clientMedia.js";

// Puts the client's page documents and photo folders on their pages: every
// zone page, Tickets, the Wildlife & Biodiversity hub and Chaurasi Kutiya show
// their document in full; the wildlife sub-pages get the document sections
// their layouts do not already show; every page's gallery holds every photo
// from its folder.
//
// The documents are read from src/seed/clientDocPages.json; regenerate it
// with `python tools/extract_client_docs.py` after the client edits a document.
//
//   node src/scripts/applyClientDocPages.js --dry-run
//   node src/scripts/applyClientDocPages.js
//   node src/scripts/applyClientDocPages.js --local-media=<dir> --media-base=<url>
//       (local preview: photos are written to <dir> instead of Cloudinary)

const args = Object.fromEntries(
  process.argv.slice(2).map((arg) => {
    const [key, ...value] = arg.replace(/^--/, "").split("=");
    return [key, value.length ? value.join("=") : true];
  })
);
const dryRun = Boolean(args["dry-run"]);
const upload = createUploader({
  dryRun,
  localDir: args["local-media"] ? path.resolve(args["local-media"]) : null,
  localBase: args["media-base"] || "",
});

const here = path.dirname(fileURLToPath(import.meta.url));
const docs = JSON.parse(await fs.readFile(path.join(here, "../seed/clientDocPages.json"), "utf8"));

const ZONE_FOLDERS = {
  "chilla-jeep-safari": `${ZONES}/Photos - Jeep safari Jungle safari Chilla`,
  "ranipur-gate-jeep-safari": `${ZONES}/Photos - Jeep safari Jungle safari Ranipur`,
  "chillawali-jeep-safari": `${ZONES}/Photos - Jeep Safari Jungle safari Chillawali`,
  "motichur-jeep-safari": `${ZONES}/Photos - Jeep Safari Jungle safari Motichur`,
  "jhilmil-jheel-safari": `${ZONES}/Photos - Jeep safari Jungle safari Jhilmil`,
  "gohri-range-safari": `${ZONES}/Photos - Jeep Safari Jungle safari Gohari`,
};
const BIRDS = `${WILDLIFE}/Photos - Sub-page - Birds of Rajaji`;
const MAMMALS = `${WILDLIFE}/Photos - Sub-page - Mammals of Rajaji`;
const BUTTERFLIES = `${WILDLIFE}/Photos - Sub-page - Butterflies of Rajaji`;
const FLORA = `${WILDLIFE}/Photos - Sub-page - Flora of Rajaji`;
const REPTILES = `${WILDLIFE}/Photos - Sub-page - Reptiles of Rajaji`;

// Wildlife sub-page sections their page layouts already show.
const SHOWN_BY_LAYOUT = {
  birds: ["Bird Watching in Rajaji National Park and Uttarakhand", "Birdwatching Packages and Enquiries"],
  butterflies: ["Best Time for Butterfly Watching in Rajaji"],
};

/** "DSC_6883 red.jpg" and "DSC_6883.jpg" are one photo; the edited "red" copy is preferred. */
const photoKey = (file) =>
  path.basename(file, path.extname(file)).replace(/(?:[\s.\-]+(?:red|r))?[\s.\-]*$/i, "").trim().toLowerCase();

async function folderPhotos(folder) {
  const files = (await fs.readdir(path.join(sourceRoot, folder)))
    .filter((file) => /\.(jpe?g|png|webp)$/i.test(file))
    .sort((a, b) => a.localeCompare(b, "en", { numeric: true }));
  const chosen = new Map();
  for (const file of files) {
    const key = photoKey(file);
    const edited = /red\W*\.\w+$|\sr\.\w+$/i.test(file);
    if (!chosen.has(key) || edited) chosen.set(key, file);
  }
  return [...chosen.values()].map((file) => `${folder}/${file}`);
}

/**
 * The page's current gallery order is kept; every photo of the folder that is
 * not in it yet (in any copy) is added after it.
 */
async function fullGallery(current, folder) {
  const sources = await folderPhotos(folder);
  const allFiles = (await fs.readdir(path.join(sourceRoot, folder))).map((file) => `${folder}/${file}`);
  const inGallery = (source) => {
    const key = photoKey(source);
    return allFiles
      .filter((file) => photoKey(file) === key)
      .some((file) => current.some((url) => url.includes(`/${slugFor(file)}.`)));
  };
  const added = [];
  for (const source of sources) {
    if (!inGallery(source)) added.push((await upload(source)).url);
  }
  return [...current.filter(Boolean), ...added];
}

/** Drops each named section: its heading up to the next heading of the same or a higher level. */
function withoutSections(blocks, headings) {
  const out = [];
  let skipLevel = null;
  for (const block of blocks) {
    const level = block.t === "h2" ? 2 : block.t === "h3" ? 3 : null;
    if (skipLevel && level && level <= skipLevel) skipLevel = null;
    if (!skipLevel && level && headings.includes(block.text)) {
      skipLevel = level;
      continue;
    }
    if (!skipLevel) out.push(block);
  }
  return out;
}

/** Sub-page blocks: no gallery markers; a document without h2 sections gets its h3s promoted. */
function subPageBlocks(page, key) {
  // Lines above the first section ("Wildlife in Rajaji – Book Your Jungle Safari")
  // head the intro card; the page header keeps its own title.
  const lead = page.kicker.map((text) => ({ t: "h3", text }));
  let blocks = [...lead, ...withoutSections(page.blocks, SHOWN_BY_LAYOUT[key] || [])].filter((block) => block.t !== "gallery");
  if (!blocks.some((block) => block.t === "h2")) {
    blocks = blocks.map((block, index) => (block.t === "h3" && index > 0 ? { ...block, t: "h2" } : block));
  }
  return blocks;
}

const RULE_7 =
  "7. Permit Changes, Cancellations & Refunds: Once a safari permit has been issued, changes to the safari date, " +
  "slot or zone may not be permitted, subject to the rules of the concerned Forest Department. " +
  "Any cancellation, modification or refund request will be handled strictly according to the applicable " +
  "Forest Department/park rules and the terms applicable to the booking. " +
  "Where the applicable rules do not permit a refund or change, no refund will be provided.";

// The photos of the "Page – Home About Rajaji" document, matched to the
// originals in the photo folders (the document holds small copies). The lizard
// on the rock is only in the document; it was saved to the About folder.
const ABOUT_HEADER_PHOTOS = [
  `${WILDLIFE}/Photos - Sub-page - Mammals of Rajaji/tiger 1.png`,
  `${ZONES}/Photos - Jeep safari Jungle safari Chilla/asian elephant.png`,
  `${ZONES}/Photos - Jeep safari Jungle safari Chilla/DSC_8338-.png`,
  `${ZONES}/Photos - Jeep Safari Jungle safari Gohari/DSC_3709.png`,
  `${ZONES}/Photos - Jeep Safari Jungle safari Chillawali/hornbill Mohand.png`,
  `${WILDLIFE}/Photos - Sub-page - Birds of Rajaji/DSC_6953 red.jpg`,
];
const ABOUT_STRIP_PHOTOS = [
  `${TICKETS}/DSC_2647 n Elephant Charging 12 x18-Picsart-AiImageEnhancer.jpg`,
  `${WILDLIFE}/Photos - Sub-page - Mammals of Rajaji/DSC_8130.png`,
  `${WILDLIFE}/Photos - Sub-page - Butterflies of Rajaji/DSC_5824 red.jpg`,
  `${WILDLIFE}/Photos - Sub-page - Birds of Rajaji/white eyed buzzard.jpg`,
  "PAGE - Home About Rajaji/monitor lizard on rock.png",
  `${WILDLIFE}/Photos - Sub-page - Flora of Rajaji/DSCN1926.JPG`,
];

/**
 * Splits the About document: its first section (heading, paragraphs and the
 * figures table) fills the existing About fields; the rest becomes doc blocks
 * with the photo strip after "Overview". The contact details and social list
 * at the end are the site footer's.
 */
function aboutParts(page) {
  const blocks = page.blocks;
  const tableAt = blocks.findIndex((block) => block.t === "table");
  const title = blocks[0].text;
  const intro = blocks.slice(1, tableAt).filter((block) => block.t === "p").map((block) => block.text);
  const stats = blocks[tableAt].rows.flat().map((cell) => {
    const [value, ...label] = cell.split("\n");
    return { value: value.trim(), label: label.join(" ").trim() };
  });
  const address = blocks
    .flatMap((block) => block.items || [block.text || ""])
    .filter((line) => typeof line === "string")
    .map((line) => line.match(/^\*\*Address:\*\*\s*(.+)$/)?.[1])
    .find(Boolean);

  const rest = [];
  let afterOverview = false;
  for (const block of blocks.slice(tableAt + 1)) {
    if (block.t === "p" && block.text === "Contact Information") break;
    if (afterOverview && block.t === "h2") {
      rest.push({ t: "gallery" });
      afterOverview = false;
    }
    if (block.t === "h2" && block.text === "Overview") afterOverview = true;
    // "Disclaimer" is its own card, not part of "Book Online".
    rest.push(block.t === "h3" && block.text === "Disclaimer" ? { ...block, t: "h2" } : block);
    if (rest.at(-2)?.text === "Send Your Safari Enquiry") {
      rest.push({ t: "cta", items: [{ kind: "booking", label: "Send Enquiry" }, { kind: "whatsapp", label: "WhatsApp Us" }] });
    }
  }
  return { title, intro, stats, address, blocks: rest };
}

const galleryTitle = (page) => page.blocks.find((block) => block.t === "gallery" && block.title)?.title || "";

const changes = [];
function set(target, key, value, label) {
  const before = JSON.stringify(target[key] ?? "");
  const after = JSON.stringify(value);
  if (before === after) return;
  const size = (v) => (Array.isArray(v) ? `[${v.length}]` : JSON.stringify(v).slice(0, 100));
  changes.push(`${label}: ${size(target[key] ?? "")} -> ${size(value)}`);
  target[key] = value;
}

async function main() {
  await connectDatabase();
  const doc = await getContentDocument();

  for (const zone of doc.safari.zones) {
    const page = docs.zones[zone.slug];
    if (!page) continue;
    set(zone, "docTitle", page.title, `safari.zones[${zone.slug}].docTitle`);
    set(zone, "docKicker", page.kicker, `safari.zones[${zone.slug}].docKicker`);
    set(zone, "docBlocks", page.blocks, `safari.zones[${zone.slug}].docBlocks`);
    if (ZONE_FOLDERS[zone.slug]) {
      const gallery = await fullGallery([...(zone.galleryImages || [])], ZONE_FOLDERS[zone.slug]);
      set(zone, "galleryImages", gallery, `safari.zones[${zone.slug}].galleryImages`);
    }
  }
  doc.markModified("safari");

  // "Page – Home About Rajaji": the About page and the home page's About section.
  const about = aboutParts(docs.about);
  const headerPhotos = [];
  for (const source of ABOUT_HEADER_PHOTOS) headerPhotos.push((await upload(source)).url);
  const stripPhotos = [];
  for (const source of ABOUT_STRIP_PHOTOS) stripPhotos.push((await upload(source)).url);
  set(doc.about, "title", about.title, "about.title");
  set(doc.about, "overviewIntro", about.intro[0], "about.overviewIntro");
  set(doc.about, "overviewParagraphs", about.intro.slice(1), "about.overviewParagraphs");
  set(doc.about, "overviewStats", about.stats, "about.overviewStats");
  set(doc.about, "docBlocks", about.blocks, "about.docBlocks");
  set(doc.about, "galleryImages", stripPhotos, "about.galleryImages");
  doc.markModified("about");
  set(doc.home, "aboutTitle", about.title, "home.aboutTitle");
  set(doc.home, "aboutIntro", about.intro[0], "home.aboutIntro");
  set(doc.home, "aboutDetails", about.intro.slice(1), "home.aboutDetails");
  set(doc.home, "aboutStats", about.stats, "home.aboutStats");
  set(doc.home, "aboutImages", headerPhotos, "home.aboutImages");
  doc.markModified("home");
  if (about.address) {
    set(doc.settings.contact, "address", about.address, "settings.contact.address");
    set(doc.settings.footer, "address", about.address, "settings.footer.address");
    doc.markModified("settings");
  }

  const tickets = doc.tickets;
  // Terms rule 7 in the Terms & Conditions document's own words.
  const policy = [...(tickets.cancellationPolicy || [])];
  const rule7 = policy.findIndex((item) => item.startsWith("7. Permit Changes"));
  if (rule7 >= 0) {
    policy[rule7] = RULE_7;
    set(tickets, "cancellationPolicy", policy, "tickets.cancellationPolicy[7]");
  }
  set(tickets, "docTitle", docs.tickets.title, "tickets.docTitle");
  set(tickets, "docBlocks", docs.tickets.blocks, "tickets.docBlocks");
  set(tickets, "galleryImages", await fullGallery([...(tickets.galleryImages || [])], TICKETS), "tickets.galleryImages");
  doc.markModified("tickets");

  // Bird Watching is no longer an activity; the Birds page stays under Wildlife.
  const activities = doc.activities;
  set(
    activities,
    "items",
    (activities.items || []).filter((item) => item.slug !== "/birds-of-rajaji-national-park"),
    "activities.items"
  );
  if (activities.subtitle?.includes("peaceful birdwatching trails and ")) {
    set(activities, "subtitle", activities.subtitle.replace("peaceful birdwatching trails and ", ""), "activities.subtitle");
  }
  doc.markModified("activities");

  const fauna = doc.fauna;
  set(fauna, "hubDocTitle", docs.wildlife.title, "fauna.hubDocTitle");
  set(fauna, "hubDocBlocks", docs.wildlife.blocks, "fauna.hubDocBlocks");
  set(fauna, "docBlocks", subPageBlocks(docs.mammals, "mammals"), "fauna.docBlocks");
  set(fauna, "galleryTitle", galleryTitle(docs.mammals), "fauna.galleryTitle");
  set(fauna, "galleryImages", await fullGallery([...(fauna.galleryImages || [])], MAMMALS), "fauna.galleryImages");
  doc.markModified("fauna");

  for (const [key, folder] of [["birds", BIRDS], ["butterflies", BUTTERFLIES], ["flora", FLORA], ["reptiles", REPTILES]]) {
    const section = doc[key];
    set(section, "docBlocks", subPageBlocks(docs[key], key), `${key}.docBlocks`);
    if (key !== "birds") set(section, "galleryTitle", galleryTitle(docs[key]), `${key}.galleryTitle`);
    set(section, "galleryImages", await fullGallery([...(section.galleryImages || [])], folder), `${key}.galleryImages`);
    doc.markModified(key);
  }

  console.log(changes.join("\n"));
  if (dryRun) {
    console.log(`[doc-pages] Dry run: ${changes.length} changes. Nothing was saved.`);
  } else {
    await doc.save();
    console.log(`[doc-pages] Saved ${changes.length} changes.`);
  }
  await disconnectDatabase();
}

main().catch((error) => {
  console.error(`[doc-pages] Failed: ${error.message}`);
  disconnectDatabase().catch(() => {});
  process.exitCode = 1;
});
