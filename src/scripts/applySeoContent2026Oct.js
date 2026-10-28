import { readFile } from "node:fs/promises";
import { connectDatabase, disconnectDatabase } from "../config/db.js";
import { getContentDocument } from "../models/Content.js";
import { Blog } from "../models/Blog.js";

/**
 * Search-engine content of October 2026:
 *   - Shorter Google titles (under 60 characters, where Google cuts them off) for the
 *     pages whose titles were too long. They are saved as each page's SEO title, so
 *     they stay editable in the admin. A title an admin already shortened is kept.
 *   - Google titles for the two blog posts with long headlines (headlines unchanged).
 *   - New blog posts from src/seed/seoBlogPosts2026Oct.json, written from the client's
 *     documents. A post whose address already exists is skipped.
 *
 *   node src/scripts/applySeoContent2026Oct.js --dry-run   # show the changes
 *   node src/scripts/applySeoContent2026Oct.js             # write them
 */
const DRY_RUN = process.argv.includes("--dry-run");
const MAX_TITLE = 60;

const SECTION_TITLES = {
  tickets: "Rajaji Jeep Safari Tickets, Entry Fees & Charges",
  parkRules: "Rajaji Jeep Safari Terms, Cancellation & Refunds",
  stay: "Stay Near Rajaji National Park | Resorts & Rest Houses",
  flora: "Flora of Rajaji National Park | Trees & Plants",
  activities: "Activities at Rajaji | Jeep Safari, Stay & Rafting",
  reptiles: "Reptiles of Rajaji Tiger Reserve | Snakes & Lizards",
};
const ZONE_TITLES = {
  "jhilmil-jheel-safari": "Jhilmil Jheel Safari | Rajaji Wildlife & Birdwatching",
  "chaurasi-kutiya-beatles-ashram": "Chaurasi Kutiya – Beatles Ashram | Rishikesh & Rajaji",
};
const BLOG_TITLES = {
  "choosing-your-safari-zone-in-rajaji": "Which Rajaji Safari Zone to Choose? Chilla, Jhilmil & More",
  "through-the-lens-butterflies-of-the-shiwaliks": "Butterflies of the Shiwalik Foothills | Rajaji Blog",
};
const NEW_POSTS = new URL("../seed/seoBlogPosts2026Oct.json", import.meta.url);

// The site adds " | Rajaji National Park" to a title without "Rajaji", so each one names it.
for (const title of [...Object.values(SECTION_TITLES), ...Object.values(ZONE_TITLES), ...Object.values(BLOG_TITLES)]) {
  if (title.length > MAX_TITLE || !title.includes("Rajaji")) throw new Error(`Title over ${MAX_TITLE} characters or without "Rajaji": ${title}`);
}

// Only an empty title (the long built-in one shows) or one still too long is replaced.
const needsTitle = (current) => !current || current.length > MAX_TITLE;

async function readNewPosts() {
  try {
    return JSON.parse(await readFile(NEW_POSTS, "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
}

/** A post's photo: the first header photo of the zone or page it is about. */
function photoFor(content, imageFrom) {
  if (imageFrom === "tickets") return content.tickets?.heroImages?.find(Boolean) || content.tickets?.heroBanner || "";
  const zone = (content.safari?.zones || []).find((item) => item.slug === imageFrom);
  return zone?.heroImages?.find(Boolean) || zone?.heroImage || "";
}

async function run() {
  await connectDatabase();
  const content = await getContentDocument();
  const changes = [];

  for (const [key, title] of Object.entries(SECTION_TITLES)) {
    const current = content[key]?.seoTitle || "";
    if (needsTitle(current)) {
      changes.push({ field: `${key}.seoTitle`, before: current || "(built-in title)", after: title });
      if (!DRY_RUN) content[key].seoTitle = title;
    }
  }
  (content.safari?.zones || []).forEach((zone, index) => {
    const title = ZONE_TITLES[zone.slug];
    if (title && needsTitle(zone.seoTitle)) {
      changes.push({ field: `safari.zones[${index}].seoTitle (${zone.slug})`, before: zone.seoTitle || "(built-in title)", after: title });
      if (!DRY_RUN) zone.seoTitle = title;
    }
  });

  const blogUpdates = [];
  for (const [slug, title] of Object.entries(BLOG_TITLES)) {
    const post = await Blog.findOne({ slug });
    if (post && needsTitle(post.seoTitle)) {
      changes.push({ field: `blog "${slug}" Google title`, before: post.seoTitle || `(headline) ${post.title}`, after: title });
      post.seoTitle = title;
      blogUpdates.push(post);
    }
  }

  const newPosts = [];
  for (const draft of await readNewPosts()) {
    if (await Blog.exists({ slug: draft.slug })) continue;
    if (!draft.seoTitle || draft.seoTitle.length > MAX_TITLE) throw new Error(`Post "${draft.slug}" needs a Google title under ${MAX_TITLE} characters`);
    const image = photoFor(content, draft.imageFrom);
    newPosts.push({
      title: draft.title,
      seoTitle: draft.seoTitle,
      slug: draft.slug,
      category: draft.category,
      summary: draft.summary,
      content: draft.content,
      image,
      published: true,
    });
    changes.push({
      field: `new blog post /blog/${draft.slug}`,
      before: "(none)",
      after: `${draft.title} · ${draft.content.split(/\s+/).length} words · photo from ${draft.imageFrom}${image ? "" : " (none found)"}`,
    });
  }

  for (const change of changes) {
    console.log(`\n${change.field}\n  before: ${change.before}\n  after:  ${change.after}`);
  }
  console.log(`\n[seo-content] ${changes.length} change(s)${DRY_RUN ? " (dry run, nothing written)" : ""}.`);

  if (!DRY_RUN && changes.length) {
    for (const key of Object.keys(SECTION_TITLES)) content.markModified(key);
    content.markModified("safari");
    await content.save();
    for (const post of blogUpdates) await post.save();
    // One at a time, oldest first, so the newest post is the first draft listed.
    for (const post of newPosts) await Blog.create(post);
    console.log("[seo-content] Saved.");
  }
  await disconnectDatabase();
}

run().catch(async (error) => {
  console.error("[seo-content] Error:", error);
  await disconnectDatabase().catch(() => {});
  process.exit(1);
});
