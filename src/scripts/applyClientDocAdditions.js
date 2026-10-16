import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { connectDatabase, disconnectDatabase } from "../config/db.js";
import { getContentDocument } from "../models/Content.js";
import { FOLDERS, optimizeImageBuffer, uploadImage } from "../config/cloudinary.js";
import { createUploader, sourceRoot } from "./clientMedia.js";

// Adds what the client's documents contain but the site does not yet show,
// and corrects values that contradict those documents. Nothing is removed:
// fields the documents do not cover are left exactly as they are.
//
//   - the five Activities sub-pages (Jeep Safari, Bird Watching, Stay, Rafting,
//     Trekking) with their documents, SEO settings and photo folders
//   - the "How to Reach" page, from the zone documents' own How to Reach sections
//   - the site menu from "safari Website structure.docx"
//   - SEO title, description, keywords, URL and image alt text from every
//     document that has an SEO section
//   - the corrections listed in documentation/dev-docs/CONTENT_AND_UX_AUDIT_2026-10-16.md
//
// The documents are read from src/seed/clientDocPages.json; regenerate it
// with `python tools/extract_client_docs.py` after the client edits a document.
//
//   node src/scripts/applyClientDocAdditions.js --dry-run
//   node src/scripts/applyClientDocAdditions.js
//   node src/scripts/applyClientDocAdditions.js --local-media=<dir> --media-base=<url>
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

const ACTIVITIES = "Page - Activities at Rajaji";
const ACTIVITY_FOLDERS = {
  jeepSafari: `${ACTIVITIES}/Sub-page - Jungle (Jeep) safari`,
  birdWatching: `${ACTIVITIES}/Sub-page ─ Bird watching`,
  stay: `${ACTIVITIES}/Sub-page - Stay in Rajaji`,
  rafting: `${ACTIVITIES}/Sub-page ─ Rafting`,
  trekking: `${ACTIVITIES}/Sub-page - Trekking in Rajaji`,
};

// Page URLs: the one each document suggests, otherwise the one other documents link to.
const PATHS = {
  home: "/",
  about: "/about",
  tickets: "/rajaji-national-park-jeep-safari-tickets-entry-fees-charges",
  terms: "/rajaji-jeep-safari-terms-conditions-cancellation-refund",
  zones: "/zones",
  activities: "/activities",
  jeepSafari: "/rajaji-jeep-safari",
  birdWatching: "/rajaji-national-park-bird-watching-jungle-safari",
  stay: "/stay-near-rajaji-national-park",
  rafting: "/river-rafting-rishikesh",
  trekking: "/trekking-in-rajaji",
  wildlife: "/wildlife-biodiversity-rajaji-tiger-reserve",
  mammals: "/mammals-of-rajaji-tiger-reserve",
  birds: "/birds-of-rajaji-national-park",
  butterflies: "/butterflies-of-rajaji-national-park",
  reptiles: "/reptiles-of-rajaji-tiger-reserve",
  flora: "/flora-of-rajaji-national-park",
  howToReach: "/how-to-reach",
  booking: "/booking",
  contact: "/contact",
  blog: "/blog",
  faq: "/faq",
};
const ZONE_SLUG_FROM_DOC = { "chillawali-jeep-safari": "chillawali-jeep-safari-mohand-gate" };
/** A zone's document; zones whose URL moved to the document's URL are found under their old key. */
const zoneDocFor = (zone) =>
  docs.zones[zone.slug] ||
  docs.zones[Object.keys(ZONE_SLUG_FROM_DOC).find((key) => ZONE_SLUG_FROM_DOC[key] === zone.slug)];

const changes = [];
const show = (value) => {
  const text = typeof value === "string" ? value : JSON.stringify(value);
  return text.length > 140 ? `${text.slice(0, 137)}...` : text;
};
const isEmpty = (value) =>
  value === undefined || value === null || value === "" || (Array.isArray(value) && value.length === 0);

/** Writes `value` unless it is already there. */
function set(target, key, value, label) {
  const current = target[key]?.toObject ? target[key].toObject() : target[key];
  if (JSON.stringify(current ?? null) === JSON.stringify(value)) return;
  changes.push(`  ${label}\n      ${show(current ?? "")}\n   -> ${show(value)}`);
  target[key] = value;
}

/** Writes `value` only where the field is still empty. */
function fill(target, key, value, label) {
  if (isEmpty(value) || !isEmpty(target[key]?.toObject ? target[key].toObject() : target[key])) return;
  set(target, key, value, label);
}

// Images made for the site rather than supplied in the client's photo folders.
const siteAssets = path.resolve(here, "../../..", "documentation", "site-assets");

/** Uploads one file from documentation/site-assets (or writes it to --local-media). */
async function uploadSiteAsset(file, publicId) {
  if (dryRun) return { url: `(upload site-assets/${file})`, publicId };
  const buffer = await fs.readFile(path.join(siteAssets, file));
  const localDir = args["local-media"] ? path.resolve(args["local-media"]) : null;
  if (localDir) {
    const target = path.join(localDir, `${publicId}.webp`);
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.writeFile(target, await optimizeImageBuffer(buffer, { artwork: true }));
    return { url: `${args["media-base"] || ""}/${publicId}.webp`, publicId };
  }
  const image = await uploadImage({ buffer, originalname: file }, FOLDERS.content, { publicId, artwork: true });
  console.log(`  stored site-assets/${file}\n        -> ${image.url}`);
  return image;
}

async function folderPhotos(folder) {
  const files = (await fs.readdir(path.join(sourceRoot, folder)))
    .filter((file) => /\.(jpe?g|png|webp)$/i.test(file))
    .sort((a, b) => a.localeCompare(b, "en", { numeric: true }));
  return files.map((file) => `${folder}/${file}`);
}

async function uploadFolder(folder) {
  const urls = [];
  for (const source of await folderPhotos(folder)) urls.push((await upload(source)).url);
  return urls;
}

/** SEO settings from a document's SEO section; the slug is only written where the field is empty. */
function applySeo(target, seo, label, { slugKey = "slug", prefix = "" } = {}) {
  if (!seo) return;
  const field = (name) => (prefix ? `${prefix}${name[0].toUpperCase()}${name.slice(1)}` : name);
  if (seo.title) set(target, field("seoTitle"), seo.title, `${label}.${field("seoTitle")}`);
  if (seo.description) set(target, field("metaDescription"), seo.description, `${label}.${field("metaDescription")}`);
  if (seo.keywords?.length) set(target, field("keywords"), seo.keywords, `${label}.${field("keywords")}`);
  if (seo.alts?.length && !prefix) set(target, "heroImageAlt", seo.alts[0], `${label}.heroImageAlt`);
  if (seo.slug && slugKey) fill(target, slugKey, seo.slug, `${label}.${slugKey}`);
}

const plainText = (text) => text.replace(/\*\*/g, "").replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
const firstParagraph = (blocks) => plainText(blocks.find((block) => block.t === "p")?.text || "");

/** The blocks of a zone document's "How to Reach …" section (up to the next h2). */
function howToReachSection(blocks) {
  const start = blocks.findIndex((block) => block.t === "h2" && /how to reach/i.test(block.text));
  if (start < 0) return [];
  const end = blocks.findIndex((block, index) => index > start && block.t === "h2");
  return blocks.slice(start, end < 0 ? undefined : end).filter((block) => !["cta", "gallery"].includes(block.t));
}

// The short lines under each drop-down entry of the site menu (the wording the
// menu had before it moved to the CMS, plus lines for the new Activities pages).
const NAV_DESCRIPTIONS = {
  [PATHS.tickets]: "Entry fees, permits & safari charges",
  [PATHS.zones]: "Overview of all 6 safari zones",
  [PATHS.activities]: "Safari, bird watching, stay, rafting & trekking",
  [PATHS.jeepSafari]: "4x4 open Gypsy forest safaris",
  [PATHS.birdWatching]: "Hornbills, raptors & kingfishers",
  [PATHS.stay]: "Forest Rest Houses & eco-cottages",
  [PATHS.rafting]: "White-water rapids on the Ganges",
  [PATHS.trekking]: "Chilla, Kunao, Phanduwala & Motichur trails",
  [PATHS.wildlife]: "Biodiversity & ecosystems",
  [PATHS.mammals]: "Tigers, elephants & leopards",
  [PATHS.birds]: "Hornbills, eagles & kingfishers",
  [PATHS.butterflies]: "Mud-puddling & Lepidoptera",
  [PATHS.reptiles]: "King Cobras, pythons & monitors",
  [PATHS.flora]: "Sal canopies & medicinal flora",
};

/** Fills drop-down entries that have no description; everything else in the menu is kept. */
function withMenuDescriptions(menu) {
  return menu.map((entry) => ({
    ...entry,
    children: (entry.children || []).map((child) => ({
      ...child,
      desc: child.desc || NAV_DESCRIPTIONS[child.path] || "",
    })),
  }));
}

function navigationFromStructure(structure, zones) {
  const zonePath = (slug) => `/${ZONE_SLUG_FROM_DOC[slug] || slug}`;
  const zoneBy = (slug) => zones.find((zone) => zone.slug === slug || zone.slug === ZONE_SLUG_FROM_DOC[slug]);
  const ZONE_CHILD = [
    [/^chilla$/i, "chilla-jeep-safari"],
    [/ranipur/i, "ranipur-gate-jeep-safari"],
    [/chillawali|mohand/i, "chillawali-jeep-safari"],
    [/motichur/i, "motichur-jeep-safari"],
    [/jhilmil/i, "jhilmil-jheel-safari"],
    [/gohri|gohari/i, "gohri-range-safari"],
    [/chaurasi/i, "chaurasi-kutiya-beatles-ashram"],
  ];
  const ACTIVITY_CHILD = [
    [/jeep|jungle/i, "jeepSafari", "Jungle Safari / Jeep Safari"],
    [/bird/i, "birdWatching", "Bird Watching"],
    [/stay/i, "stay", "Stay in Rajaji"],
    [/raft/i, "rafting", "Rafting"],
    [/tre+king/i, "trekking", "Trekking in Rajaji"],
  ];
  const WILDLIFE_CHILD = [
    [/mammal/i, "mammals"], [/bird/i, "birds"], [/butterfl/i, "butterflies"], [/reptile/i, "reptiles"], [/flora/i, "flora"],
  ];
  const nav = [];
  for (const page of structure) {
    const label = page.label;
    if (/^home/i.test(label)) {
      nav.push({ label: "Home", path: PATHS.home, children: [] });
      // The Home page document is shown on its own About page as well.
      nav.push({ label: "About Rajaji", path: PATHS.about, children: [] });
    } else if (/tickets/i.test(label)) {
      nav.push({
        label: "Tickets & Charges",
        path: PATHS.tickets,
        children: [
          { label: "Tickets, Entry Fees & Safari Charges", path: PATHS.tickets, desc: "" },
          ...page.children.map((child) => ({ label: "Terms & Conditions", path: PATHS.terms, desc: child })),
        ],
      });
    } else if (/zones/i.test(label)) {
      nav.push({
        label: "Safari Zones",
        path: PATHS.zones,
        children: [
          { label: "All Safari Zones", path: PATHS.zones, desc: "" },
          ...page.children.map((child) => {
            const slug = ZONE_CHILD.find(([pattern]) => pattern.test(child))?.[1];
            const zone = zoneBy(slug);
            return { label: child.replace(/\s*\/\s*/g, " / "), path: zonePath(slug), desc: zone?.tag || "" };
          }),
        ],
      });
    } else if (/activities/i.test(label)) {
      nav.push({
        label: "Activities",
        path: PATHS.activities,
        children: [
          { label: "Activities Overview", path: PATHS.activities, desc: "" },
          ...page.children.map((child) => {
            const [, key, name] = ACTIVITY_CHILD.find(([pattern]) => pattern.test(child));
            return { label: name, path: PATHS[key], desc: "" };
          }),
        ],
      });
    } else if (/wildlife/i.test(label)) {
      nav.push({
        label: "Wildlife",
        path: PATHS.wildlife,
        children: [
          { label: "Wildlife & Biodiversity", path: PATHS.wildlife, desc: "" },
          ...page.children.map((child) => ({
            label: child, path: PATHS[WILDLIFE_CHILD.find(([pattern]) => pattern.test(child))[1]], desc: "",
          })),
        ],
      });
    } else if (/how to reach/i.test(label)) {
      nav.push({ label: "How to Reach", path: PATHS.howToReach, children: [] });
    } else if (/book now/i.test(label)) {
      nav.push({
        label: "Book Now",
        path: PATHS.booking,
        children: page.children.map((child) => ({ label: child.replace(/^\w/, (c) => c.toUpperCase()), path: PATHS.booking, desc: "" })),
      });
    } else if (/contact/i.test(label)) {
      nav.push({ label: "Contact Us", path: PATHS.contact, children: [] });
    } else if (/blog/i.test(label)) {
      nav.push({ label: "Blog", path: PATHS.blog, children: [] });
    } else if (/faq/i.test(label)) {
      nav.push({ label: "FAQ", path: PATHS.faq, children: [] });
    } else {
      console.warn(`[doc-additions] Menu entry not mapped: "${label}"`);
    }
  }
  return nav;
}

/** Appends `addition` to `text` unless the text already contains it. */
const withSentence = (text, addition) => (text.includes(addition) ? text : `${text.trim()} ${addition}`);

async function main() {
  await connectDatabase();
  const doc = await getContentDocument();
  const pages = docs.activities;

  // ── Activities sub-pages ────────────────────────────────────────────────────
  for (const key of ["jeepSafari", "birdWatching", "trekking", "stay", "rafting"]) {
    const page = pages[key];
    const section = doc[key];
    const label = key;
    set(section, "docTitle", page.title, `${label}.docTitle`);
    set(section, "docBlocks", page.blocks, `${label}.docBlocks`);
    // The page header carries the document's H1.
    set(section, "title", page.title, `${label}.title`);
    applySeo(section, page.seo, label);
    fill(section, "slug", PATHS[key].slice(1), `${label}.slug`);
    if (!section.heroImageAlt && page.seo?.alts?.length) set(section, "heroImageAlt", page.seo.alts[0], `${label}.heroImageAlt`);
    if (!section.heroImageAlt) fill(section, "heroImageAlt", page.title, `${label}.heroImageAlt`);
    // Photos are uploaded only while a photo field of the page is still empty.
    const needsPhotos = ["heroImages", "heroBanner", "galleryImages"].some((field) => isEmpty(section[field]?.toObject ? section[field].toObject() : section[field]));
    const photos = needsPhotos ? await uploadFolder(ACTIVITY_FOLDERS[key]) : [];
    fill(section, "heroImages", photos, `${label}.heroImages`);
    fill(section, "heroBanner", photos[0], `${label}.heroBanner`);
    fill(section, "galleryImages", photos, `${label}.galleryImages`);
    doc.markModified(key);
  }

  // Stay: the document's wording for the Wild Brook location.
  const stay = doc.stay;
  if (stay.wildBrook) {
    set(stay.wildBrook, "location", "Near the Gohri forest landscape, Bukundi area", "stay.wildBrook.location");
  }

  // Rafting: the document's four routes, prices and durations. Fields the
  // document does not give (rapids, level, grade, image) are kept per route.
  const RAFTING_ROUTES = [
    { match: /brahmpuri/i, name: "Brahmpuri Rafting", distance: "9 km", price: "₹1200 per person", duration: "Around 1–1.5 hours" },
    { match: /shivpuri/i, name: "Shivpuri Rafting", distance: "16 km", price: "₹1,500 per person", duration: "Around 1.5–2 hours" },
    { match: /marine drive/i, name: "Marine Drive Rafting", distance: "24–25 km", price: "₹2000 per person", duration: "Around 2.5–3 hours" },
    { match: /kaudiyala/i, name: "Kaudiyala Rafting", distance: "Longer Routes", price: "₹2,800 onwards per person", duration: "" },
  ];
  const routeDesc = (name) => {
    const blocks = pages.rafting.blocks;
    const at = blocks.findIndex((block) => block.t === "h2" && block.text.includes(name.split(" ")[0]));
    return at >= 0 ? plainText(blocks[at + 1]?.text || "") : "";
  };
  const currentStretches = (doc.rafting.stretches || []).map((stretch) => stretch.toObject());
  const used = new Set();
  const stretches = RAFTING_ROUTES.map(({ match, ...route }) => {
    const index = currentStretches.findIndex((stretch) => match.test(stretch.name));
    if (index >= 0) used.add(index);
    const base = index >= 0 ? currentStretches[index] : {};
    return { ...base, ...route, desc: routeDesc(route.name) || base.desc || "" };
  });
  // Routes the document does not list are kept, after the document's routes.
  currentStretches.forEach((stretch, index) => !used.has(index) && stretches.push(stretch));
  set(doc.rafting, "stretches", stretches, "rafting.stretches");
  doc.markModified("rafting");

  // Activities overview: one card per sub-page of the site structure.
  const activities = doc.activities;
  const items = (activities.items || []).map((item) => item.toObject());
  const ACTIVITY_CARDS = [
    { match: /jeep|jungle safari/i, key: "jeepSafari", title: "Jungle Safari / Jeep Safari", cta: "Explore Jeep Safari" },
    { match: /bird/i, key: "birdWatching", title: "Bird Watching", cta: "Explore Bird Watching" },
    { match: /stay/i, key: "stay", title: "Stay in Rajaji", cta: "View Accommodation Options" },
    { match: /raft/i, key: "rafting", title: "River Rafting", cta: "View Rafting Routes" },
    { match: /trek/i, key: "trekking", title: "Trekking in Rajaji", cta: "Explore Trekking Trails" },
  ];
  const nextItems = [...items];
  for (const card of ACTIVITY_CARDS) {
    const index = nextItems.findIndex((item) => card.match.test(item.title));
    const pagePath = PATHS[card.key];
    if (index >= 0) {
      nextItems[index] = { ...nextItems[index], slug: pagePath };
    } else {
      nextItems.push({
        title: card.title,
        tagline: pages[card.key].title,
        slug: pagePath,
        desc: firstParagraph(pages[card.key].blocks),
        image: doc[card.key].heroImages?.[0] || "",
        cta: card.cta,
      });
    }
  }
  set(activities, "items", nextItems, "activities.items");
  fill(activities, "slug", "activities", "activities.slug");
  doc.markModified("activities");

  // ── How to Reach: each zone document's own "How to Reach" section ──────────
  const howToReach = doc.howToReach;
  const reachBlocks = [];
  for (const zone of doc.safari.zones) {
    const zoneDoc = zoneDocFor(zone);
    if (!zoneDoc) continue;
    const section = howToReachSection(zoneDoc.blocks);
    if (section.length) reachBlocks.push(...section);
  }
  set(howToReach, "docBlocks", reachBlocks, "howToReach.docBlocks");
  fill(howToReach, "title", "How to Reach Rajaji National Park", "howToReach.title");
  fill(howToReach, "slug", "how-to-reach", "howToReach.slug");
  const chilla = doc.safari.zones.find((zone) => zone.slug === "chilla-jeep-safari");
  fill(howToReach, "heroImages", chilla?.heroImages || [], "howToReach.heroImages");
  fill(howToReach, "heroBanner", chilla?.heroImage || "", "howToReach.heroBanner");
  fill(howToReach, "heroImageAlt", "How to reach Rajaji National Park", "howToReach.heroImageAlt");
  if (!howToReach.mapImage) {
    const map = await uploadSiteAsset("how-to-reach-route-map.png", "media-plan/how-to-reach/route-map");
    set(howToReach, "mapImage", map.url, "howToReach.mapImage");
  }
  fill(
    howToReach,
    "mapImageAlt",
    "Route map to Rajaji National Park: Delhi, Meerut, Roorkee, Haridwar, Rishikesh, Dehradun, Chilla and Wild Brook Retreat",
    "howToReach.mapImageAlt"
  );
  doc.markModified("howToReach");

  // ── Zones: SEO from each document, links the documents ask for ─────────────
  for (const zone of doc.safari.zones) {
    const zoneDoc = zoneDocFor(zone);
    if (!zoneDoc) continue;
    const label = `safari.zones[${zone.slug}]`;
    applySeo(zone, zoneDoc.seo, label, { slugKey: null });
    if (ZONE_SLUG_FROM_DOC[zone.slug]) set(zone, "slug", ZONE_SLUG_FROM_DOC[zone.slug], `${label}.slug`);
  }
  const chillawali = doc.safari.zones.find((zone) => /chillawali/.test(zone.slug));
  if (chillawali && !chillawali.docBlocks.some((block) => block.t === "links" && block.items?.some((item) => item.to === PATHS.howToReach))) {
    const links = [
      { label: "Rajaji National Park Safari Tickets & Entry", to: PATHS.tickets, desc: "" },
      { label: "Chillawali Jeep Safari Booking", to: PATHS.booking, desc: "" },
      { label: "Rajaji Jeep Safari", to: PATHS.jeepSafari, desc: "" },
      { label: "Safari Zones of Rajaji National Park", to: PATHS.zones, desc: "" },
      { label: "Flora & Fauna of Rajaji National Park", to: PATHS.wildlife, desc: "" },
      { label: "Birds of Rajaji National Park", to: PATHS.birds, desc: "" },
      { label: "How to Reach Rajaji National Park", to: PATHS.howToReach, desc: "" },
      { label: "Rajaji Safari Timings", to: PATHS.tickets, desc: "" },
    ];
    const blocks = [...chillawali.docBlocks];
    const galleryAt = blocks.findIndex((block) => block.t === "gallery");
    blocks.splice(galleryAt < 0 ? blocks.length : galleryAt, 0, { t: "h2", text: "Explore Rajaji National Park" }, { t: "links", items: links });
    set(chillawali, "docBlocks", blocks, "safari.zones[chillawali].docBlocks (internal links)");
  }
  doc.markModified("safari");

  // ── Tickets & Terms ─────────────────────────────────────────────────────────
  const tickets = doc.tickets;
  const ticketSeo = docs.tickets.seo;
  applySeo(tickets, { ...ticketSeo, alts: ["Rajaji National Park Jeep Safari in Rajaji Tiger Reserve"] }, "tickets");
  if (ticketSeo?.h1) set(tickets, "docTitle", ticketSeo.h1, "tickets.docTitle");
  const policies = [...(tickets.cancellationPolicy || [])];
  if (policies[7]) {
    policies[7] = withSentence(
      policies[7],
      "Safari operations are subject to the rules, regulations and decisions of the concerned Forest Department and park authorities."
    );
    set(tickets, "cancellationPolicy", policies, "tickets.cancellationPolicy[7]");
  }
  if (tickets.timings?.openDates) {
    set(
      tickets.timings,
      "openDates",
      withSentence(tickets.timings.openDates, "Jhilmil Zone: generally open from 15 October to the end of July."),
      "tickets.timings.openDates"
    );
  }
  // "H2: Rajaji Safari Zones" and the internal-link anchors of the Tickets document.
  if (!tickets.docBlocks.some((block) => block.t === "h2" && block.text === "Rajaji Safari Zones")) {
    const zonePath = (slug) => `/${ZONE_SLUG_FROM_DOC[slug] || slug}`;
    const zoneLinks = [
      { label: "Rajaji Jeep Safari", to: PATHS.jeepSafari, desc: "" },
      { label: "Chila Jeep Safari", to: zonePath("chilla-jeep-safari"), desc: "" },
      { label: "Motichur Jeep Safari", to: zonePath("motichur-jeep-safari"), desc: "" },
      { label: "Jhilmil Jeep Safari", to: zonePath("jhilmil-jheel-safari"), desc: "" },
      { label: "Gohri Safari", to: zonePath("gohri-range-safari"), desc: "" },
      { label: "Mohand–Chillawali Safari", to: zonePath("chillawali-jeep-safari"), desc: "" },
    ];
    const moreLinks = [
      { label: "Wildlife & Biodiversity of Rajaji", to: PATHS.wildlife, desc: "" },
      { label: "Birds of Rajaji", to: PATHS.birds, desc: "" },
      { label: "Mammals of Rajaji", to: PATHS.mammals, desc: "" },
      { label: "Reptiles of Rajaji", to: PATHS.reptiles, desc: "" },
      { label: "Flora of Rajaji", to: PATHS.flora, desc: "" },
      { label: "Safari Terms & Conditions", to: PATHS.terms, desc: "" },
      { label: "Cancellation & Refund Policy", to: PATHS.terms, desc: "" },
      { label: "Contact & Safari Booking", to: PATHS.contact, desc: "" },
    ];
    const blocks = [...tickets.docBlocks];
    // The document's H2 order puts the zones right after the guide charges.
    const guide = blocks.findIndex((block) => block.t === "h2" && /guide/i.test(block.text));
    const nextH2 = guide >= 0 ? blocks.findIndex((block, index) => index > guide && block.t === "h2") : -1;
    const at = nextH2 >= 0 ? nextH2 : blocks.findIndex((block) => block.t === "gallery");
    blocks.splice(at < 0 ? blocks.length : at, 0,
      { t: "h2", text: "Rajaji Safari Zones" }, { t: "links", items: zoneLinks },
      { t: "h3", text: "Explore Rajaji" }, { t: "links", items: moreLinks });
    set(tickets, "docBlocks", blocks, "tickets.docBlocks (Rajaji Safari Zones + links)");
  }
  doc.markModified("tickets");

  const terms = docs.terms.seo;
  applySeo(doc.parkRules, terms, "parkRules");
  if (terms?.h1) set(doc.parkRules, "title", terms.h1, "parkRules.title");
  doc.markModified("parkRules");

  // ── Wildlife pages ──────────────────────────────────────────────────────────
  const fauna = doc.fauna;
  fill(fauna, "hubSlug", PATHS.wildlife.slice(1), "fauna.hubSlug");
  applySeo(fauna, docs.mammals.seo, "fauna");
  // Mammal names as the Mammals document writes them.
  const MAMMAL_NAMES = {
    "Royal Bengal Tiger (Panthera tigris)": "Bengal Tiger (Panthera tigris)",
    "Indian Leopard (Panthera pardus)": "Leopard (Panthera pardus)",
    "Spotted Deer (Cheetal)": "Chital (Spotted Deer)",
    "Himalayan Goral": "Goral",
    "Golden Jackal": "Jackal",
    "Himalayan Yellow-Throated Marten": "Yellow-throated Marten",
  };
  for (const list of ["primeAttractions", "herbivores", "carnivores"]) {
    const next = (fauna[list] || []).map((item) => item.toObject()).map((item) => ({ ...item, name: MAMMAL_NAMES[item.name] || item.name }));
    set(fauna, list, next, `fauna.${list}[].name`);
  }
  doc.markModified("fauna");

  // Tree names as the Flora document lists them: "Amaltas (Cassia fistula)".
  const floraList = docs.flora.blocks.map((block) => block.text || "").find((text) => text.includes("Shorea robusta")) || "";
  const docTreeNames = [...floraList.matchAll(/([A-Z][\w-]*(?: [A-Z][\w-]*)?) \(/g)].map((match) => match[1]);
  const trees = (doc.flora.dominantTrees || []).map((tree) => tree.toObject()).map((tree) => {
    const name = docTreeNames.find((docName) => tree.common.startsWith(`${docName} (`));
    return name ? { ...tree, common: name } : tree;
  });
  set(doc.flora, "dominantTrees", trees, "flora.dominantTrees[].common");
  applySeo(doc.flora, docs.flora.seo, "flora");
  doc.markModified("flora");

  applySeo(doc.reptiles, docs.reptiles.seo, "reptiles");
  doc.markModified("reptiles");
  applySeo(doc.butterflies, docs.butterflies.seo, "butterflies");
  fill(doc.butterflies, "slug", PATHS.butterflies.slice(1), "butterflies.slug");
  doc.markModified("butterflies");
  set(doc.birds, "title", "Birds of Rajaji National Park and Bird Watching", "birds.title");
  fill(doc.birds, "slug", PATHS.birds.slice(1), "birds.slug");
  doc.markModified("birds");

  // ── Home, FAQ ───────────────────────────────────────────────────────────────
  const home = doc.home;
  // Read by the prerendered page for search engines; the visible page uses aboutIntro.
  if (home.aboutIntro) set(home, "aboutDescription", home.aboutIntro, "home.aboutDescription");
  doc.markModified("home");

  const faqs = doc.faqs;
  const faqItems = (faqs.items || []).map((item) => item.toObject());
  const timingFaq = faqItems.find((item) => /safari timings/i.test(item.q));
  if (timingFaq) {
    timingFaq.a = withSentence(
      timingFaq.a,
      "Jhilmil Jheel follows its own timings (15 October – 31 January: 7:00 AM – 10:00 AM & 2:00 PM – 4:30 PM; " +
        "1 February – 31 March: 6:30 AM – 9:00 AM & 2:30 PM – 4:30 PM; 1 April – 30 June: 6:00 AM – 9:00 AM & 3:00 PM – 5:00 PM), " +
        "and Gohri Range runs Morning 6:30 AM – 9:00 AM & Evening 2:30 PM – 5:00 PM."
    );
  }
  const permitFaq = faqItems.find((item) => /permit fee/i.test(item.q));
  if (permitFaq) {
    permitFaq.a = withSentence(permitFaq.a, "In the Jhilmil Zone the permit fee is ₹300 for Indian visitors and ₹400 for foreign visitors.");
  }
  set(faqs, "items", faqItems, "faqs.items (timings, permit fee)");
  fill(faqs, "slug", "faq", "faqs.slug");
  doc.markModified("faqs");

  // ── Settings: site menu and booking call-to-action wording ─────────────────
  const settings = doc.settings;
  // The menu is built from the structure document once; after that it belongs
  // to the admin panel, and reruns only fill descriptions that are still empty.
  const currentMenu = (settings.navigation || []).map((entry) => entry.toObject());
  const menu = currentMenu.length
    ? currentMenu
    : navigationFromStructure(docs.navigation, doc.safari.zones.map((zone) => zone.toObject()));
  set(settings, "navigation", withMenuDescriptions(menu), "settings.navigation");
  const cta = settings.ctaCopy || {};
  const CTA_COPY = {
    title: "Book Your Rajaji Jeep Safari",
    subtitle: "Check safari availability and book your Rajaji Jeep Safari for your preferred date and safari zone.",
    badges: ["Safari availability", "Safari zone selection", "Entry and permit requirements", "Jeep / Gypsy booking", "Guide arrangements", "Booking and payment assistance"],
    primaryLabel: "Send Your Safari Enquiry",
    secondaryLabel: "Call / WhatsApp",
    whatsappMessage: "Hello! I would like to book a Rajaji Jeep Safari.",
    disclaimer:
      "This is an independently operated, privately owned website providing safari booking assistance and visitor information for Rajaji National Park and Rajaji Tiger Reserve. It is not an official government website.",
    zoneSidebarKicker: "Book Your Safari",
    zoneSidebarText: "Confirmed within 1 hour, or WhatsApp us for an instant reply.",
    zoneCtaSubtitle:
      "Safari vehicles and permits are subject to availability. As demand may exceed the number of available vehicles, advance booking is recommended, particularly during weekends, public holidays and peak tourist periods.",
  };
  const ctaCopy = { ...(cta.toObject ? cta.toObject() : cta) };
  for (const [key, value] of Object.entries(CTA_COPY)) if (isEmpty(ctaCopy[key])) ctaCopy[key] = value;
  set(settings, "ctaCopy", ctaCopy, "settings.ctaCopy");
  doc.markModified("settings");

  console.log(changes.join("\n"));
  if (dryRun) {
    console.log(`[doc-additions] Dry run: ${changes.length} changes. Nothing was saved.`);
  } else {
    await doc.save();
    console.log(`[doc-additions] Saved ${changes.length} changes.`);
  }
  await disconnectDatabase();
}

main().catch((error) => {
  console.error(`[doc-additions] Failed: ${error.stack || error.message}`);
  disconnectDatabase().catch(() => {});
  process.exitCode = 1;
});
