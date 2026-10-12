import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { connectDatabase, disconnectDatabase } from "../config/db.js";
import { FOLDERS, uploadImage } from "../config/cloudinary.js";
import { env } from "../config/env.js";
import { Blog } from "../models/Blog.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(here, "../../..");
const sourceRoot = path.join(projectRoot, "documentation", "wetransfer_photos-for-website_2026-10-10_0653");

// Demo posts shown on /blog until real posts replace them. Each image path is
// relative to the WeTransfer documentation folder shipped with the repo.
const BLOGS = [
  {
    slug: "the-great-elephant-gathering-of-rajaji",
    title: "The Great Elephant Gathering of Rajaji",
    category: "Conservation",
    summary:
      "Every summer, hundreds of Asian elephants converge on the grasslands of Rajaji. Inside the corridor science, community work, and long nights that keep this migration alive.",
    featured: true,
    imageRelativePath:
      "PAGE - Wildlife & Biodiversity/Photos - Sub-page - Mammals of Rajaji/Asian Elephant Herd in Forest Grassland.png",
    quote:
      "A herd does not wander into the grasslands by accident. Every step of that migration is memory, written across generations.",
    quoteAuthor: "Field Notes, Rajaji Elephant Monitoring Unit",
    content: `Rajaji National Park holds one of the healthiest populations of Asian elephants in northern India. Each year, as the Sal forests dry and the Himalayan streams shrink, herds move down from the higher ranges toward the perennial grasslands near the Ganga and the Ramgarh block — a slow, deliberate migration that researchers have been mapping for over a decade.

### Why the grasslands matter

The elephant grass of Rajaji is not scenery. It is food, cover, and a nursery. Tall clumps of Saccharum and Miscanthus hide calves from heat and predators, while the tender shoots provide the bulk of an adult elephant's daily intake. When the grasslands are grazed too hard by livestock, the herds push closer to villages — the first spark of human-wildlife conflict.

### Corridors under pressure

Four major corridors link Rajaji to the forests of Lansdowne and the Shivalik ranges beyond. Fencing, quarrying, and the widening of the Haridwar–Dehradun highway have narrowed two of them to barely two hundred metres. The Forest Department, with support from conservation groups, has planted native fodder species and negotiated seasonal route adjustments with local communities.

### What visitors can do

- **Keep distance:** Elephants on the move are unpredictable. Never block a herd's path in a vehicle.
- **Stay silent:** Engine noise and shouting cause herds to split, which separates calves from mothers.
- **Support corridors:** Choosing registered safari operators who follow zone rules is a direct contribution to corridor safety.

Every jeep that respects a crossing herd helps keep this migration — older than the park itself — intact for the next monsoon.`,
  },
  {
    slug: "tracking-the-elusive-leopard-at-ranipur",
    title: "Tracking the Elusive Leopard at Ranipur",
    category: "Big Cats",
    summary:
      "The Ranipur range hides its leopards well. Our naturalists share the alarm calls, pugmark techniques, and light windows that make a sighting possible.",
    imageRelativePath:
      "PAGE - Wildlife & Biodiversity/Photos - Sub-page - Mammals of Rajaji/leopard at Ranipur.png",
    quote:
      "The forest tells you a leopard is near long before you see one — you only have to learn its language.",
    quoteAuthor: "Senior Ranger, Ranipur Range",
    content: `If tigers rule the river valleys of Rajaji, leopards own the rocky ridges. Ranipur, on the park's western edge, is the most reliable place to try for a sighting of Panthera pardus fusca — though reliability here still means patience measured in seasons, not hours.

### Reading the alarm calls

A leopard on the move announces itself through other animals. Sambar deer give a deep, resonant bark. Langurs deliver a sharp staccato cough that tracks the cat's progress across the canopy. Spot the direction of the calls, and you are already halfway to the sighting.

### The hour that matters

Dawn (6:00–8:30 AM) and the last light before gates close are the golden windows. Leopards hunt along the fringe forest where Sal meets scrub, often crossing the firebreak tracks that run below the ridgeline.

### Field craft

- **Scan the branches:** Unlike tigers, leopards rest in trees — a horizontal limb two-thirds up a Sal is a favourite bed.
- **Check the firebreaks:** Fresh pugmarks on soft ash tell you the cat passed within the hour.
- **Travel light:** Loud groups scatter prey, and prey scatters leopards. Small, silent jeeps see more.

A leopard sighting at Ranipur is never guaranteed. But every dawn drive teaches you the forest's quieter signals — which is, in the end, the real prize.`,
  },
  {
    slug: "a-morning-with-the-great-hornbill",
    title: "A Morning with the Great Hornbill",
    category: "Bird Watching",
    summary:
      "The canopy drummer of Rajaji. How to find the Great Pied Hornbill in the Sal forests, and why its presence is a health report for the whole ecosystem.",
    imageRelativePath:
      "PAGE - Jungle Safari Jeep Safari Zones/Photos - Jeep Safari Jungle safari Chillawali/hornbill Mohand.png",
    quote:
      "Where the hornbill still drums, the forest still breathes.",
    quoteAuthor: "Birding Log, Chillawali Range",
    content: `Few sounds define Rajaji's Sal forests like the wing-whoosh of the Great Pied Hornbill. Heavy-bodied and loud, the bird moves through the canopy in pairs, its casque echoing like a slow drumbeat across the ravines of Chillawali and Mohand.

### Why the hornbill matters

Hornbills are gardeners of the forest. A single bird can disperse seeds from dozens of fruiting trees over several kilometres, literally planting the next generation of Sal, fig, and wild plum. Where hornbills vanish, the forest's natural regeneration slows — which is why ornithologists treat every hornbill territory as a conservation unit.

### Where to look

- **Chillawali & Mohand:** The park's most reliable territory. Arrive by 6:30 AM and listen for the whoosh.
- **Fruiting figs in summer:** When wild figs ripen, pairs camp in a single tree for hours — the best photographic window of the year.
- **Song River track:** A quieter alternative with lower visitor pressure.

### Field etiquette

Carry 8x42 or 10x42 binoculars and a long lens if you shoot. Wear muted colours, keep the vehicle engine off during viewing, and never call or play playback — it costs the pair the energy they need during nesting season, when the female seals herself inside a tree cavity for weeks.

Seeing the Great Hornbill is not a checklist moment. It is confirmation that this forest still works the way forests are supposed to.`,
  },
  {
    slug: "through-the-lens-butterflies-of-the-shiwaliks",
    title: "Through the Lens: Butterflies of the Shiwalik Foothills",
    category: "Photography",
    summary:
      "Over 130 butterfly species ride the thermal currents of Rajaji. A practical guide to the photogenic ones, the right hours, and ethical macro etiquette.",
    imageRelativePath:
      "PAGE - Wildlife & Biodiversity/Photos - Sub-page - Butterflies of Rajaji/Common Palmfly.png",
    quote:
      "Macro patience is jungle patience, compressed to one metre and one second.",
    quoteAuthor: "Field Photography Notes",
    content: `While the big mammals draw the headlines, Rajaji's butterfly diversity is quietly extraordinary. More than 130 species have been recorded in the park's mosaic of Sal forest, riverine scrub, and monsoon grassland — a living index of habitat health that rewards anyone willing to slow down.

### Photogenic targets

- **Common Palmfly:** Ubiquitous along sunny forest edges; its slow, skipping flight makes it a perfect first subject.
- **Blue Mormon:** One of India's largest swallowtails — look for it mud-puddling on the Chilla river tracks after rain.
- **Brown Eyed and the crow butterflies:** Regulars at overripe fruit stations near resthouses.

### The golden hours

Butterflies are cold-blooded. They are sluggish in the cool first hour after dawn, most active between 9:00 AM and 12:30 PM when thermals lift, and they settle again by late afternoon. Plan your macro session mid-morning, not at safari start.

### Ethical macro etiquette

- **Never touch wings:** A single brush removes the scales that make the colour.
- **Shoot habitat, not harassment:** If a subject takes flight, wait. Chasing burns the shot and stresses the animal.
- **Use the trail edges:** Most Rajaji butterflies work sunlit margins, so you rarely need to leave the path.

A butterfly morning costs nothing, needs no permit beyond park entry, and teaches you to read light the way the best wildlife photographers do.`,
  },
  {
    slug: "choosing-your-safari-zone-in-rajaji",
    title: "Choosing Your Safari Zone: Chilla, Motichur, Ranipur or Jhilmil",
    category: "Travel Tips",
    summary:
      "Four entry gates, four different forests. A zone-by-zone breakdown of wildlife odds, scenery, and who each range suits best before you book your gypsy.",
    imageRelativePath:
      "PAGE - Jungle Safari Jeep Safari Zones/Photos - Jeep safari Jungle safari Jhilmil/Jhilmil safari.png",
    quote:
      "The best zone is the one that matches your patience — elephants reward the quiet, leopards the persistent.",
    quoteAuthor: "Safari Desk Field Brief",
    content: `Rajaji is not one forest. It is a chain of ranges stitched along the Himalayan foothills, each with its own character. Choosing well is the difference between a good drive and a story you tell for years.

### Chilla Range

The park's busiest and most connected gate, opening onto wide riverbeds and grasslands. Highest odds of elephant herds and, in winter, tiger tracks along the Ramgarh side. Best for first-time visitors and photographers who want open sightlines.

### Motichur Range

Closer to Haridwar, denser Sal, and the classic "jungle" feel. Sambar and barking deer are common, with leopard sightings on the ridge tracks. Suits visitors who prefer forest ambience over big-open views.

### Ranipur Range

Quietest of the motorized ranges, with rocky ridges that leopards favour. Lower vehicle pressure means longer, undisturbed sightings if you are willing to trade certainty for solitude.

### Jhilmil Jheel

A conservation zone renowned for swamp deer (barasingha) and wetland birds. Photography-focused drives, restricted numbers, and a slower pace. Ideal for birders and second-time visitors.

### Before you book

- **Timings:** Gates open 6:00 AM and 2:30 PM (seasonal shifts apply; closed Tuesdays).
- **Proof:** Carry the same government ID used for your permit.
- **Quotas:** Daily vehicle numbers are capped per range — book ahead in peak season.

Match the zone to what you most want to see, and let the forest do the rest.`,
  },
  {
    slug: "when-an-elephant-charges-staying-safe-on-safari",
    title: "When an Elephant Charges: Staying Safe on a Rajaji Safari",
    category: "Travel Tips",
    summary:
      "A mock charge is theatre; a real one is physics. What our guides watch for, what you should never do, and why the rules exist.",
    imageRelativePath:
      "PAGE - Ticket and Entry/DSC_2647 n Elephant Charging 12 x18-Picsart-AiImageEnhancer.jpg",
    quote:
      "Most charges are questions, not attacks. The elephant is asking whether you will move. Answer correctly and everyone goes home.",
    quoteAuthor: "Field Safety Brief, Chilla Gate",
    content: `Charging elephants are the defining drama of an open-gypsy safari in Rajaji. Almost every visitor who spends enough time in the grasslands will one day hear the rumble and see the ears flare. Knowing what happens next — and what never to do — is part of travelling here responsibly.

### Mock charge vs. real charge

A mock charge is theatre: ears spread wide, trunk curled, a thunderous run that stops metres short, often ending in a dust kick. A real charge is quieter — ears pinned back, head low, a direct line with no performance. Your guide will call it. Trust the call.

### What you must never do

- **Never exit the vehicle:** A gypsy is not a cage for you — it is a shape the elephant already accepts. A human on foot changes the equation entirely.
- **Never crowd the path:** If a herd is crossing, wait. Blocking their route escalates the situation every time.
- **Never honk or shout:** Noise reads as provocation. Engine off, windows up, silence.

### What guides watch for

Ears, trunk position, and whether calves are present. A female with a calf within twenty metres of the track will hold her ground longer — the safest response is the simplest: give the corridor room and let the herd pass.

### Why the rules are non-negotiable

Every reported "aggressive elephant" in Rajaji traces back to a vehicle that got too close, blocked a crossing, or refused to switch off. The park's charging incidents are overwhelmingly avoidable — and the visitors who follow the brief come home with the best photographs of all.`,
  },
];

function publicIdFor(slug) {
  return `blogs/seed-${slug}`;
}

async function main() {
  try {
    await fs.access(sourceRoot);
  } catch {
    throw new Error(`Website image folder was not found: ${sourceRoot}`);
  }

  console.log(`[seed-blogs] Connecting to database`);
  await connectDatabase();

  let created = 0;
  let skipped = 0;

  for (const entry of BLOGS) {
    const existing = await Blog.findOne({ slug: entry.slug });
    if (existing) {
      skipped += 1;
      console.log(`[seed-blogs] Skipped (already exists): ${entry.slug}`);
      continue;
    }

    const absolutePath = path.join(sourceRoot, entry.imageRelativePath);
    let image = { url: "", publicId: "" };
    try {
      const buffer = await fs.readFile(absolutePath);
      image = await uploadImage(
        { buffer, originalname: path.basename(absolutePath) },
        FOLDERS.blogs,
        { publicId: publicIdFor(entry.slug) }
      );
      console.log(`[seed-blogs] Uploaded image: ${entry.imageRelativePath}`);
    } catch (error) {
      console.warn(`[seed-blogs] Image upload failed for ${entry.slug}, continuing without: ${error.message}`);
    }

    await Blog.create({
      title: entry.title,
      slug: entry.slug,
      category: entry.category,
      summary: entry.summary,
      content: entry.content,
      quote: entry.quote || "",
      quoteAuthor: entry.quoteAuthor || "",
      image: image.url || "",
      imagePublicId: image.publicId || "",
      published: true,
      featured: Boolean(entry.featured),
    });
    created += 1;
    console.log(`[seed-blogs] Created: ${entry.title}`);
  }

  console.log(`[seed-blogs] Done. Created ${created}; already present ${skipped}.`);
  await disconnectDatabase();
}

main().catch((error) => {
  console.error(`[seed-blogs] Failed: ${error.message}`);
  disconnectDatabase().catch(() => {});
  process.exitCode = 1;
});
