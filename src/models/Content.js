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
    featuredBlogs: { type: [{ type: String, trim: true }], default: [] },
    featuredGallery: { type: [{ type: String, trim: true }], default: [] },
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

// ── Birds Section ──────────────────────────────────────────────────────────────
const birdFamilySchema = new Schema(
  {
    group: text(160),
    desc: text(500),
    species: { type: [text(160)], default: [] },
  },
  { _id: false }
);

const restrictedRangeBirdSchema = new Schema(
  {
    name: text(200),
    status: text(200),
  },
  { _id: false }
);

const birdsSectionSchema = new Schema(
  {
    overview: text(2000),
    stats: new Schema(
      {
        totalSpecies: text(40),
        residentSpecies: text(40),
        winterMigrants: text(40),
        altitudinalMigrants: text(40),
        woodpeckers: text(40),
        barbets: text(40),
        hornbills: text(40),
      },
      { _id: false }
    ),
    families: { type: [birdFamilySchema], default: [] },
    restrictedRange: { type: [restrictedRangeBirdSchema], default: [] },
  },
  { _id: false }
);

// ── Fauna Section ──────────────────────────────────────────────────────────────
const primeAttractionSchema = new Schema(
  {
    name: text(200),
    count: text(40),
    details: text(1000),
  },
  { _id: false }
);

const faunaItemSchema = new Schema(
  {
    name: text(200),
    info: text(500),
  },
  { _id: false }
);

const reptileItemSchema = new Schema(
  {
    name: text(200),
    status: text(500),
  },
  { _id: false }
);

const faunaSectionSchema = new Schema(
  {
    overview: text(2000),
    primeAttractions: { type: [primeAttractionSchema], default: [] },
    herbivores: { type: [faunaItemSchema], default: [] },
    carnivores: { type: [faunaItemSchema], default: [] },
    reptiles: { type: [reptileItemSchema], default: [] },
    aquaticLife: new Schema(
      {
        rivers: text(500),
        fishes: { type: [text(160)], default: [] },
      },
      { _id: false }
    ),
  },
  { _id: false }
);

// ── Flora Section ──────────────────────────────────────────────────────────────
const altitudinalBandSchema = new Schema(
  {
    band: text(200),
    trees: text(500),
  },
  { _id: false }
);

const dominantTreeSchema = new Schema(
  {
    common: text(100),
    scientific: text(200),
    family: text(100),
    desc: text(500),
  },
  { _id: false }
);

const floraSectionSchema = new Schema(
  {
    overview: text(2000),
    altitudinalBands: { type: [altitudinalBandSchema], default: [] },
    dominantTrees: { type: [dominantTreeSchema], default: [] },
  },
  { _id: false }
);

// ── Butterflies Section ────────────────────────────────────────────────────────
const butterflyItemSchema = new Schema(
  {
    name: text(200),
    family: text(100),
    habitat: text(300),
  },
  { _id: false }
);

const butterfliesSectionSchema = new Schema(
  {
    overview: text(2000),
    mudPuddling: text(2000),
    species: { type: [butterflyItemSchema], default: [] },
  },
  { _id: false }
);

// ── Park Rules Section ─────────────────────────────────────────────────────────
const ruleItemSchema = new Schema(
  {
    title: text(200),
    desc: text(1000),
  },
  { _id: false }
);

const parkRulesSectionSchema = new Schema(
  {
    overview: text(2000),
    dos: { type: [ruleItemSchema], default: [] },
    donts: { type: [ruleItemSchema], default: [] },
  },
  { _id: false }
);

// ── Tickets / Tariff Section ───────────────────────────────────────────────────
const entranceFeeSchema = new Schema(
  {
    category: text(200),
    indian: text(40),
    foreigner: text(40),
    note: text(300),
  },
  { _id: false }
);

const gypsyRateSchema = new Schema(
  {
    zone: text(200),
    rate: text(40),
    capacity: text(200),
  },
  { _id: false }
);

const guideFeeSchema = new Schema(
  {
    type: text(200),
    fee: text(100),
    note: text(300),
  },
  { _id: false }
);

const ticketsSectionSchema = new Schema(
  {
    timings: new Schema(
      {
        summer: text(300),
        winter: text(300),
        openDates: text(300),
      },
      { _id: false }
    ),
    entranceFees: { type: [entranceFeeSchema], default: [] },
    gypsyRates: { type: [gypsyRateSchema], default: [] },
    guideFees: { type: [guideFeeSchema], default: [] },
    importantNotes: { type: [text(500)], default: [] },
  },
  { _id: false }
);

// ── How To Reach Section ───────────────────────────────────────────────────────
const trainSchema = new Schema(
  {
    name: text(200),
    number: text(40),
    frequency: text(100),
  },
  { _id: false }
);

const stationSchema = new Schema(
  {
    name: text(200),
    distance: text(100),
    note: text(300),
  },
  { _id: false }
);

const distanceSchema = new Schema(
  {
    from: text(100),
    distance: text(40),
  },
  { _id: false }
);

const howToReachSectionSchema = new Schema(
  {
    overview: text(2000),
    air: new Schema(
      {
        airport: text(200),
        distance: text(100),
        flightTime: text(200),
        details: text(1000),
      },
      { _id: false }
    ),
    rail: new Schema(
      {
        nearestRailhead: text(200),
        stations: { type: [stationSchema], default: [] },
        popularTrains: { type: [trainSchema], default: [] },
      },
      { _id: false }
    ),
    road: new Schema(
      {
        delhiDistance: text(200),
        routeSteps: { type: [text(100)], default: [] },
        distances: { type: [distanceSchema], default: [] },
      },
      { _id: false }
    ),
    coordinates: new Schema(
      {
        latitude: text(100),
        longitude: text(100),
        altitude: text(100),
      },
      { _id: false }
    ),
  },
  { _id: false }
);

// ── Stay Section ───────────────────────────────────────────────────────────────
const forestRestHouseSchema = new Schema(
  {
    name: text(100),
    suites: text(40),
    status: text(40),
    gate: text(100),
    setting: text(300),
  },
  { _id: false }
);

const staySectionSchema = new Schema(
  {
    overview: text(2000),
    wildBrook: new Schema(
      {
        name: text(160),
        tagline: text(300),
        location: text(500),
        distance: text(100),
        phone: text(100),
        email: text(200),
        features: { type: [text(300)], default: [] },
      },
      { _id: false }
    ),
    forestRestHouses: { type: [forestRestHouseSchema], default: [] },
    frhBookingInfo: new Schema(
      {
        authority: text(200),
        address: text(500),
        phone: text(40),
        fax: text(40),
        bookingRule: text(500),
      },
      { _id: false }
    ),
  },
  { _id: false }
);

// ── Birding Areas Section ──────────────────────────────────────────────────────
const birdingAreaSchema = new Schema(
  {
    name: text(200),
    badge: text(100),
    distance: text(100),
    season: text(100),
    fee: text(100),
    description: text(1000),
    highlights: { type: [text(200)], default: [] },
  },
  { _id: false }
);

const birdingAreasSectionSchema = new Schema(
  {
    overview: text(2000),
    areas: { type: [birdingAreaSchema], default: [] },
  },
  { _id: false }
);

// ── Eco-Tourism Section ────────────────────────────────────────────────────────
const ecoPillarSchema = new Schema(
  {
    title: text(200),
    desc: text(1000),
  },
  { _id: false }
);

const ecoTourismSectionSchema = new Schema(
  {
    philosophy: text(2000),
    pillars: { type: [ecoPillarSchema], default: [] },
  },
  { _id: false }
);

// ── Main Content Schema ────────────────────────────────────────────────────────
const contentSchema = new Schema(
  {
    home: { type: homeSectionSchema, default: () => ({}) },
    about: { type: aboutSectionSchema, default: () => ({}) },
    safari: { type: safariSectionSchema, default: () => ({}) },
    settings: { type: settingsSectionSchema, default: () => ({}) },
    birds: { type: birdsSectionSchema, default: () => ({}) },
    fauna: { type: faunaSectionSchema, default: () => ({}) },
    flora: { type: floraSectionSchema, default: () => ({}) },
    butterflies: { type: butterfliesSectionSchema, default: () => ({}) },
    parkRules: { type: parkRulesSectionSchema, default: () => ({}) },
    tickets: { type: ticketsSectionSchema, default: () => ({}) },
    howToReach: { type: howToReachSectionSchema, default: () => ({}) },
    stay: { type: staySectionSchema, default: () => ({}) },
    birdingAreas: { type: birdingAreasSectionSchema, default: () => ({}) },
    ecoTourism: { type: ecoTourismSectionSchema, default: () => ({}) },
  },
  { timestamps: true }
);

export const CONTENT_SECTIONS = [
  "home", "about", "safari", "settings",
  "birds", "fauna", "flora", "butterflies",
  "parkRules", "tickets", "howToReach", "stay",
  "birdingAreas", "ecoTourism",
];

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
