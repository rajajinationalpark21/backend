import { connectDatabase, disconnectDatabase } from "../config/db.js";
import { getContentDocument } from "../models/Content.js";

/**
 * The client's handwritten corrections of October 2026 that are content, not code:
 *   - Home: "15th June" in bold in the opening-dates line
 *   - Home: Sal's botanical name (Shorea robusta) in italics
 *   - Tickets: "Butterflies and Insects of Rajaji" in the Explore Rajaji links
 *   - SEO: search keywords for the zone pages that have none (filled only when empty)
 *
 * Each change only applies when the text is still in its expected form, so running
 * the script twice, or after an admin has edited the line, changes nothing.
 *
 *   node src/scripts/applyClientNotes2026Oct.js --dry-run   # show the changes
 *   node src/scripts/applyClientNotes2026Oct.js             # write them
 */
const DRY_RUN = process.argv.includes("--dry-run");

const BUTTERFLIES_LINK = { label: "Butterflies and Insects of Rajaji", to: "/butterflies-of-rajaji-national-park", desc: "" };

const ZONE_KEYWORDS = {
  "jhilmil-jheel-safari": ["Jhilmil Jheel Safari", "Jhilmil Jheel Conservation Reserve", "Jhilmil Jeep Safari", "swamp deer Rajaji", "Jhilmil Jheel Haridwar"],
  "gohri-range-safari": ["Gohri Range Safari", "Gohri Jeep Safari", "Gohri Range Rajaji", "Gohri safari near Rishikesh", "Rajaji Gohri zone"],
  "chaurasi-kutiya-beatles-ashram": ["Chaurasi Kutiya", "Beatles Ashram Rishikesh", "Beatles Ashram Rajaji", "Chaurasi Kutiya Rishikesh timings"],
};

function markInList(list, find, replace) {
  const index = (list || []).findIndex((line) => typeof line === "string" && line.includes(find) && !line.includes(replace));
  if (index === -1) return null;
  return { index, before: list[index], after: list[index].replace(find, replace) };
}

async function run() {
  await connectDatabase();
  const content = await getContentDocument();
  const changes = [];

  const details = [...(content.home.aboutDetails || [])];
  for (const [find, replace] of [
    ["15th June", "**15th June**"],
    ["Sal (Shorea robusta)", "Sal (*Shorea robusta*)"],
  ]) {
    const change = markInList(details, find, replace);
    if (change) {
      details[change.index] = change.after;
      changes.push({ field: `home.aboutDetails[${change.index}]`, before: change.before, after: change.after });
    }
  }

  const blocks = [...(content.tickets.docBlocks || [])];
  const heading = blocks.findIndex((block) => block?.t === "h3" && /^Explore Rajaji$/i.test(block.text || ""));
  const links = heading >= 0 ? blocks[heading + 1] : null;
  if (links?.t === "links" && !links.items.some((item) => item.to === BUTTERFLIES_LINK.to)) {
    // After "Birds of Rajaji", where the wildlife pages are listed.
    const birds = links.items.findIndex((item) => item.to === "/birds-of-rajaji-national-park");
    const items = [...links.items];
    items.splice(birds >= 0 ? birds + 1 : items.length, 0, BUTTERFLIES_LINK);
    blocks[heading + 1] = { ...links, items };
    changes.push({
      field: `tickets.docBlocks[${heading + 1}] (Explore Rajaji links)`,
      before: links.items.map((item) => item.label).join(" · "),
      after: items.map((item) => item.label).join(" · "),
    });
  }

  const zones = content.safari.zones || [];
  zones.forEach((zone, index) => {
    const keywords = ZONE_KEYWORDS[zone.slug];
    if (keywords && !(zone.keywords || []).length) {
      zone.keywords = keywords;
      changes.push({ field: `safari.zones[${index}].keywords (${zone.slug})`, before: "(none)", after: keywords.join(", ") });
    }
  });

  for (const change of changes) {
    console.log(`\n${change.field}\n  before: ${change.before}\n  after:  ${change.after}`);
  }
  console.log(`\n[client-notes] ${changes.length} change(s)${DRY_RUN ? " (dry run, nothing written)" : ""}.`);

  if (!DRY_RUN && changes.length) {
    content.home.aboutDetails = details;
    content.tickets.docBlocks = blocks;
    content.markModified("home");
    content.markModified("tickets");
    content.markModified("safari");
    await content.save();
    console.log("[client-notes] Saved.");
  }
  await disconnectDatabase();
}

run().catch(async (error) => {
  console.error("[client-notes] Error:", error);
  await disconnectDatabase().catch(() => {});
  process.exit(1);
});
