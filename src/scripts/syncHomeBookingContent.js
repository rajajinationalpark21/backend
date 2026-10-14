import { connectDatabase, disconnectDatabase } from "../config/db.js";
import { getContentDocument } from "../models/Content.js";
import { seedContent } from "../seed/content.data.js";

// Adds only the document-backed Home About and booking fields. Existing images,
// gallery items and all unrelated admin content remain untouched.
async function run() {
  await connectDatabase();
  const content = await getContentDocument();
  const { home, booking } = seedContent;

  Object.assign(content.home, {
    aboutTitle: home.aboutTitle,
    aboutDescription: home.aboutDescription,
    aboutIntro: home.aboutIntro,
    aboutDetails: home.aboutDetails,
    aboutStats: home.aboutStats,
    aboutReadMoreLabel: home.aboutReadMoreLabel,
    aboutReadLessLabel: home.aboutReadLessLabel,
  });
  content.booking = booking;
  content.about = { ...content.about.toObject(), ...seedContent.about };
  await content.save();
  console.log("[sync] Home About and Booking content saved.");
  await disconnectDatabase();
}

run().catch(async (error) => {
  console.error("[sync] Error:", error);
  await disconnectDatabase().catch(() => {});
  process.exit(1);
});
