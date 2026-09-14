import mongoose from "mongoose";

const { Schema } = mongoose;

/**
 * Every section is a typed sub-schema on purpose. Mongoose strict mode drops
 * unknown paths, so browser-only fields the admin panel keeps in state
 * (`heroBannerPreview`, `imagePreview` - both `blob:` URLs) never reach the
 * database, while every declared field always resolves to a value the public
 * site can render without null checks.
 */
const text = (max = 2000) => ({ type: String, trim: true, maxlength: max, default: "" });

const homeSectionSchema = new Schema(
  {
    tagline: text(160),
    heroTitle: text(200),
    heroSubtitle: text(1000),
    heroBanner: text(600),
    heroBannerPublicId: text(300),
    timings: text(160),
    zones: text(160),
    rules: text(160),
    aboutTitle: text(200),
    aboutDescription: text(3000),
    stats: new Schema(
      {
        tigers: text(40),
        acres: text(40),
      },
      { _id: false }
    ),
  },
  { _id: false }
);

const journeyItemSchema = new Schema(
  {
    year: text(20),
    title: text(160),
    description: text(1000),
  },
  { _id: false }
);

const activityItemSchema = new Schema(
  {
    name: text(160),
    image: text(600),
    imagePublicId: text(300),
  },
  { _id: false }
);

const aboutSectionSchema = new Schema(
  {
    title: text(200),
    subtitle: text(300),
    missionTitle: text(200),
    missionText: text(5000),
    stats: new Schema(
      {
        tigers: text(40),
        birds: text(40),
        sqKm: text(40),
        visitors: text(40),
      },
      { _id: false }
    ),
    journey: { type: [journeyItemSchema], default: [] },
    activities: { type: [activityItemSchema], default: [] },
  },
  { _id: false }
);

const zoneItemSchema = new Schema(
  {
    name: text(160),
    description: text(1000),
    timings: text(160),
  },
  { _id: false }
);

const vehicleItemSchema = new Schema(
  {
    name: text(160),
    description: text(1000),
  },
  { _id: false }
);

const safariSectionSchema = new Schema(
  {
    title: text(200),
    subtitle: text(300),
    zones: { type: [zoneItemSchema], default: [] },
    animals: { type: [{ type: String, trim: true, maxlength: 120 }], default: [] },
    rules: { type: [{ type: String, trim: true, maxlength: 500 }], default: [] },
    vehicles: { type: [vehicleItemSchema], default: [] },
  },
  { _id: false }
);

const settingsSectionSchema = new Schema(
  {
    siteName: text(160),
    contact: new Schema(
      {
        name: text(160),
        phone: text(40),
        email: text(160),
        address: text(500),
        mapUrl: text(600),
      },
      { _id: false }
    ),
    social: new Schema(
      {
        facebook: text(300),
        instagram: text(300),
        twitter: text(300),
        youtube: text(300),
        linkedin: text(300),
      },
      { _id: false }
    ),
    footer: new Schema(
      {
        copyright: text(300),
        developedBy: text(160),
      },
      { _id: false }
    ),
  },
  { _id: false }
);

const contentSchema = new Schema(
  {
    home: { type: homeSectionSchema, default: () => ({}) },
    about: { type: aboutSectionSchema, default: () => ({}) },
    safari: { type: safariSectionSchema, default: () => ({}) },
    settings: { type: settingsSectionSchema, default: () => ({}) },
  },
  { timestamps: true }
);

export const CONTENT_SECTIONS = ["home", "about", "safari", "settings"];

export const Content = mongoose.model("Content", contentSchema);

/**
 * The site content is a single document. This returns it, creating an empty one
 * on first use so read endpoints never 404 on a fresh database.
 */
export async function getContentDocument() {
  const existing = await Content.findOne().sort({ _id: 1 });
  if (existing) return existing;
  return Content.create({});
}
