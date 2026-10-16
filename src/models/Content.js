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

// A client page document, as ordered blocks ({ t: "h2" | "p" | "ul" | "table" | ... })
// produced by tools/extract_client_docs.py and rendered by the site's DocContent.
const docBlocks = () => ({ type: [Schema.Types.Mixed], default: [] });

// What every page managed from the admin panel carries: its URL, its client
// document, SEO settings taken from that document, and its photo gallery.
const pageFields = () => ({
  slug: text(200),
  docTitle: text(300),
  docBlocks: docBlocks(),
  seoTitle: text(200),
  metaDescription: text(500),
  keywords: { type: [text(160)], default: [] },
  heroImageAlt: text(300),
  galleryTitle: text(200),
  galleryImages: { type: [text(600)], default: [] },
});

/** Adds the page fields a section does not declare yet; existing paths are left as they are. */
function withPageFields(schema) {
  const missing = Object.fromEntries(
    Object.entries(pageFields()).filter(([name]) => !schema.path(name))
  );
  schema.add(missing);
  return schema;
}

const labelValueSchema = new Schema(
  { value: text(80), label: text(160) },
  { _id: false }
);

const homeSectionSchema = new Schema(
  {
    tagline: text(160),
    heroTitle: text(200),
    heroSubtitle: text(1000),
    heroBanner: text(600),
    heroBannerPublicId: text(300),
    heroImages: { type: [text(600)], default: [] },
    timings: text(160),
    zones: text(160),
    rules: text(160),
    aboutTitle: text(200),
    aboutDescription: text(3000),
    // New editorial fields retain the legacy description for existing clients.
    aboutIntro: text(3000),
    aboutDetails: { type: [text(3000)], default: [] },
    aboutStats: { type: [labelValueSchema], default: [] },
    aboutReadMoreLabel: text(80),
    aboutReadLessLabel: text(80),
    aboutImage: text(600),
    aboutImagePublicId: text(300),
    aboutImages: { type: [text(600)], default: [] },
    aboutBadge: text(80),
    stats: new Schema(
      {
        tigers: text(40),
        acres: text(40),
        sqKm: text(40),
        forestArea: text(40),
      },
      { _id: false }
    ),
    galleryTitle: text(200),
    gallerySubtitle: text(300),
    // "Captured Moments" photos in display order, any number. None means stock images.
    galleryImages: { type: [text(600)], default: [] },
    featuredBlogs: { type: [{ type: String, trim: true }], default: [] },
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
    overviewTitle: text(200),
    overviewIntro: text(3000),
    overviewParagraphs: { type: [text(3000)], default: [] },
    overviewStats: { type: [labelValueSchema], default: [] },
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
    // The client's "Page – Home About Rajaji" document after its opening
    // section; a `gallery` block marks where the photo strip goes.
    docBlocks: docBlocks(),
    galleryImages: { type: [text(600)], default: [] },
  },
  { _id: false }
);

const zoneItemSchema = new Schema(
  {
    slug: text(100),
    name: text(160),
    tag: text(200),
    entryGate: text(160),
    gypsyCost: text(160),
    duration: text(100),
    routeKm: text(100),
    openSeason: text(200),
    timings: text(500),
    description: text(5000),
    landscape: text(2000),
    highlights: { type: [text(300)], default: [] },
    wildlife: { type: [text(300)], default: [] },
    seoTitle: text(200),
    metaDescription: text(500),
    heroImage: text(600),
    heroImagePublicId: text(300),
    heroImageAlt: text(300),
    heroImages: { type: [text(600)], default: [] },
    // Zone page "Gallery" section, in display order.
    galleryImages: { type: [text(600)], default: [] },
    // The zone's page document; when present the page shows it in full.
    docTitle: text(300),
    docKicker: { type: [text(300)], default: [] },
    docBlocks: docBlocks(),
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
    heroBanner: text(600),
    heroBannerPublicId: text(300),
    heroImages: { type: [text(600)], default: [] },
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
        secondaryPhone: text(40),
        tertiaryPhone: text(40),
        whatsapp: text(40),
        email: text(160),
        address: text(500),
        mapUrl: text(600),
        drChaturbhuj: text(100),
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
        brandTitle: text(200),
        brandDesc: text(1000),
        address: text(500),
        phone: text(40),
        copyright: text(300),
        developedBy: text(160),
      },
      { _id: false }
    ),
    // The site menu, in the order of the client's "Website structure" document.
    navigation: {
      type: [
        new Schema(
          {
            label: text(120),
            path: text(300),
            children: {
              type: [new Schema({ label: text(120), path: text(300), desc: text(200) }, { _id: false })],
              default: [],
            },
          },
          { _id: false }
        ),
      ],
      default: [],
    },
    // Wording of the booking call-to-action bands shared by many pages.
    ctaCopy: new Schema(
      {
        title: text(200),
        subtitle: text(600),
        badges: { type: [text(120)], default: [] },
        primaryLabel: text(80),
        secondaryLabel: text(80),
        whatsappMessage: text(300),
        disclaimer: text(600),
        zoneSidebarKicker: text(120),
        zoneSidebarText: text(400),
        zoneCtaSubtitle: text(600),
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
    image: text(600),
  },
  { _id: false }
);

const restrictedRangeBirdSchema = new Schema(
  {
    name: text(200),
    status: text(200),
    image: text(600),
  },
  { _id: false }
);

const birdsSectionSchema = new Schema(
  {
    title: text(200),
    subtitle: text(1000),
    heroBanner: text(600),
    heroBannerPublicId: text(300),
    heroImages: { type: [text(600)], default: [] },
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
    // "Bird Watching in Rajaji" and "Birdwatching Packages" sections of the client doc.
    watchingTitle: text(200),
    watchingParagraphs: { type: [text(3000)], default: [] },
    notableSpecies: { type: [text(160)], default: [] },
    galleryImages: { type: [text(600)], default: [] },
    packagesTitle: text(200),
    packagesText: text(1000),
    packagesContactName: text(160),
    packagesPhones: { type: [text(40)], default: [] },
    docBlocks: docBlocks(),
  },
  { _id: false }
);

// ── Fauna Section ──────────────────────────────────────────────────────────────
const primeAttractionSchema = new Schema(
  {
    name: text(200),
    count: text(40),
    details: text(1000),
    image: text(600),
  },
  { _id: false }
);

const faunaItemSchema = new Schema(
  {
    name: text(200),
    info: text(500),
    image: text(600),
  },
  { _id: false }
);

const reptileItemSchema = new Schema(
  {
    name: text(200),
    status: text(500),
    image: text(600),
  },
  { _id: false }
);

const faunaSectionSchema = new Schema(
  {
    title: text(200),
    subtitle: text(1000),
    heroBanner: text(600),
    heroBannerPublicId: text(300),
    heroImages: { type: [text(600)], default: [] },
    // The Wildlife & Biodiversity hub has no section of its own; its header
    // lives here so it no longer shares the Mammals page photo.
    hubHeroBanner: text(600),
    hubHeroBannerPublicId: text(300),
    // The hub's page document (Wildlife & Biodiversity main page).
    hubDocTitle: text(300),
    hubDocBlocks: docBlocks(),
    // Mammals page document sections and photo gallery.
    docBlocks: docBlocks(),
    galleryTitle: text(200),
    galleryImages: { type: [text(600)], default: [] },
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
    image: text(600),
  },
  { _id: false }
);

const floraSectionSchema = new Schema(
  {
    title: text(200),
    subtitle: text(1000),
    heroBanner: text(600),
    heroBannerPublicId: text(300),
    heroImages: { type: [text(600)], default: [] },
    overview: text(2000),
    altitudinalBands: { type: [altitudinalBandSchema], default: [] },
    dominantTrees: { type: [dominantTreeSchema], default: [] },
    docBlocks: docBlocks(),
    galleryTitle: text(200),
    galleryImages: { type: [text(600)], default: [] },
  },
  { _id: false }
);

// ── Butterflies Section ────────────────────────────────────────────────────────
const butterflyItemSchema = new Schema(
  {
    name: text(200),
    family: text(100),
    habitat: text(300),
    image: text(600),
  },
  { _id: false }
);

const butterfliesSectionSchema = new Schema(
  {
    title: text(200),
    subtitle: text(1000),
    heroBanner: text(600),
    heroBannerPublicId: text(300),
    heroImages: { type: [text(600)], default: [] },
    overview: text(2000),
    mudPuddling: text(2000),
    species: { type: [butterflyItemSchema], default: [] },
    docBlocks: docBlocks(),
    galleryTitle: text(200),
    galleryImages: { type: [text(600)], default: [] },
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
    title: text(200),
    subtitle: text(1000),
    heroBanner: text(600),
    heroBannerPublicId: text(300),
    heroImages: { type: [text(600)], default: [] },
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

const elephantRideSchema = new Schema(
  {
    availability: text(200),
    indianRate: text(100),
    foreignerRate: text(100),
    note: text(500),
  },
  { _id: false }
);

const filmFeeSchema = new Schema(
  {
    type: text(200),
    indian: text(100),
    foreigner: text(100),
    security: text(200),
    note: text(300),
  },
  { _id: false }
);

const ticketsSectionSchema = new Schema(
  {
    title: text(200),
    subtitle: text(1000),
    heroBanner: text(600),
    heroBannerPublicId: text(300),
    heroImages: { type: [text(600)], default: [] },
    // The Tickets page document; when present the page shows it in full.
    docTitle: text(300),
    docBlocks: docBlocks(),
    galleryImages: { type: [text(600)], default: [] },
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
    elephantRide: { type: elephantRideSchema, default: () => ({}) },
    filmingFees: { type: [filmFeeSchema], default: [] },
    cancellationPolicy: { type: [text(1000)], default: [] },
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
    title: text(200),
    subtitle: text(1000),
    heroBanner: text(600),
    heroBannerPublicId: text(300),
    heroImages: { type: [text(600)], default: [] },
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
        mainImage: text(600),
        leafImage: text(600),
        sunsetImage: text(600),
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

// ── Reptiles Section ───────────────────────────────────────────────────────────
const reptileDetailSchema = new Schema(
  {
    name: text(200),
    scientific: text(200),
    status: text(200),
    habitat: text(500),
    description: text(2000),
    image: text(600),
  },
  { _id: false }
);

const reptilesSectionSchema = new Schema(
  {
    title: text(200),
    subtitle: text(1000),
    heroBanner: text(600),
    heroBannerPublicId: text(300),
    heroImages: { type: [text(600)], default: [] },
    overview: text(3000),
    species: { type: [reptileDetailSchema], default: [] },
    seoTitle: text(200),
    metaDescription: text(500),
    docBlocks: docBlocks(),
    galleryTitle: text(200),
    galleryImages: { type: [text(600)], default: [] },
  },
  { _id: false }
);

// ── FAQs Section ───────────────────────────────────────────────────────────────
const faqItemSchema = new Schema(
  {
    q: text(500),
    a: text(3000),
    category: text(100),
  },
  { _id: false }
);

const faqsSectionSchema = new Schema(
  {
    title: text(200),
    subtitle: text(1000),
    heroBanner: text(600),
    heroBannerPublicId: text(300),
    heroImages: { type: [text(600)], default: [] },
    overview: text(1000),
    items: { type: [faqItemSchema], default: [] },
  },
  { _id: false }
);

// ── Activities Section ─────────────────────────────────────────────────────────
const activityDetailSchema = new Schema(
  {
    title: text(200),
    tagline: text(300),
    slug: text(100),
    desc: text(2000),
    image: text(600),
    cta: text(100),
  },
  { _id: false }
);

const activitiesSectionSchema = new Schema(
  {
    title: text(200),
    subtitle: text(1000),
    heroBanner: text(600),
    heroBannerPublicId: text(300),
    heroImages: { type: [text(600)], default: [] },
    items: { type: [activityDetailSchema], default: [] },
  },
  { _id: false }
);

// ── Rafting Section ────────────────────────────────────────────────────────────
const rapidStretchSchema = new Schema(
  {
    name: text(200),
    distance: text(100),
    grade: text(100),
    duration: text(100),
    level: text(100),
    price: text(100),
    desc: text(2000),
    rapids: text(500),
    image: text(600),
  },
  { _id: false }
);

const raftingSectionSchema = new Schema(
  {
    title: text(200),
    subtitle: text(1000),
    heroBanner: text(600),
    heroBannerPublicId: text(300),
    heroImages: { type: [text(600)], default: [] },
    overview: text(3000),
    stretches: { type: [rapidStretchSchema], default: [] },
    safetyGuidelines: { type: [text(500)], default: [] },
  },
  { _id: false }
);

const bookingPhoneSchema = new Schema(
  { label: text(100), number: text(40) },
  { _id: false }
);

const bookingSectionSchema = new Schema(
  {
    heroTitle: text(200),
    heroSubtitle: text(1000),
    heroBanner: text(600),
    heroBannerPublicId: text(300),
    heroImages: { type: [text(600)], default: [] },
    overviewTitle: text(200),
    overviewParagraphs: { type: [text(3000)], default: [] },
    enquiryTitle: text(200),
    enquirySubtitle: text(500),
    assistanceItems: { type: [text(300)], default: [] },
    responseMessage: text(300),
    onlineBookingTitle: text(200),
    onlineBookingDescription: text(1500),
    disclaimerTitle: text(200),
    disclaimerParagraphs: { type: [text(1500)], default: [] },
    contactTitle: text(200),
    contactAddress: text(500),
    contactPhones: { type: [bookingPhoneSchema], default: [] },
    guidelinesTitle: text(200),
    guidelines: { type: [text(600)], default: [] },
  },
  { _id: false }
);

// ── Activities sub-pages written from client documents ─────────────────────────
const docPageSectionSchema = () =>
  new Schema(
    {
      title: text(200),
      subtitle: text(1000),
      heroBanner: text(600),
      heroBannerPublicId: text(300),
      heroImages: { type: [text(600)], default: [] },
      ...pageFields(),
    },
    { _id: false }
  );

[
  homeSectionSchema, aboutSectionSchema, safariSectionSchema, birdsSectionSchema,
  faunaSectionSchema, floraSectionSchema, butterfliesSectionSchema, reptilesSectionSchema,
  parkRulesSectionSchema, ticketsSectionSchema, howToReachSectionSchema, staySectionSchema,
  faqsSectionSchema, activitiesSectionSchema, raftingSectionSchema, bookingSectionSchema,
  zoneItemSchema,
].forEach(withPageFields);

// The Wildlife & Biodiversity hub lives on the fauna section with a `hub` prefix.
faunaSectionSchema.add({
  hubSlug: text(200),
  hubSeoTitle: text(200),
  hubMetaDescription: text(500),
  hubKeywords: { type: [text(160)], default: [] },
  hubHeroImages: { type: [text(600)], default: [] },
  hubGalleryImages: { type: [text(600)], default: [] },
});

// "How to Reach" is a page of its own in the client's site structure.
howToReachSectionSchema.add({
  title: text(200),
  subtitle: text(1000),
  heroBanner: text(600),
  heroImages: { type: [text(600)], default: [] },
  // Route map shown above the directions.
  mapImage: text(600),
  mapImageAlt: text(300),
});

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
    reptiles: { type: reptilesSectionSchema, default: () => ({}) },
    parkRules: { type: parkRulesSectionSchema, default: () => ({}) },
    tickets: { type: ticketsSectionSchema, default: () => ({}) },
    howToReach: { type: howToReachSectionSchema, default: () => ({}) },
    stay: { type: staySectionSchema, default: () => ({}) },
    birdingAreas: { type: birdingAreasSectionSchema, default: () => ({}) },
    ecoTourism: { type: ecoTourismSectionSchema, default: () => ({}) },
    faqs: { type: faqsSectionSchema, default: () => ({}) },
    activities: { type: activitiesSectionSchema, default: () => ({}) },
    rafting: { type: raftingSectionSchema, default: () => ({}) },
    booking: { type: bookingSectionSchema, default: () => ({}) },
    jeepSafari: { type: docPageSectionSchema(), default: () => ({}) },
    birdWatching: { type: docPageSectionSchema(), default: () => ({}) },
    trekking: { type: docPageSectionSchema(), default: () => ({}) },
  },
  { timestamps: true }
);

export const CONTENT_SECTIONS = [
  "home", "about", "safari", "settings",
  "birds", "fauna", "flora", "butterflies", "reptiles",
  "parkRules", "tickets", "howToReach", "stay",
  "birdingAreas", "ecoTourism",
  "faqs", "activities", "rafting", "booking",
  "jeepSafari", "birdWatching", "trekking",
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
