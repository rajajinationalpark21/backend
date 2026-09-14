/**
 * Sample copy for a fresh install. Image fields are left empty on purpose -
 * the owner uploads real photography through the admin panel, which is what
 * populates the Cloudinary URLs.
 */
export const seedContent = {
  home: {
    tagline: "Unleash Your Wild Side",
    heroTitle: "Experience the Heart of the Jungle",
    heroSubtitle:
      "Track royal Bengal tigers across open meadows, listen to the forest wake at dawn, and discover a national park where every trail tells a story.",
    heroBanner: "",
    timings: "06:00 AM - 06:00 PM",
    zones: "Buffer, Core & River Safari",
    rules: "Do's & Don'ts Guide",
    aboutTitle: "About the National Park",
    aboutDescription:
      "Spread across sal forest, grassland and winding rivers, the park protects one of the region's richest concentrations of wildlife. Visitors come for the tiger, and stay for the hundreds of bird species, herds of deer and the deep quiet that only an old forest can offer.",
    stats: {
      tigers: "50+",
      acres: "120k",
    },
  },

  about: {
    title: "Our Wild Legacy",
    subtitle: "Exploring the heart of nature, one safari at a time",
    missionTitle: "Preserving Nature & Wildlife",
    missionText:
      "The park exists to keep this landscape wild for the generations that follow. That means protecting habitat, supporting the villages that live alongside the forest, and teaching every visitor to leave nothing behind but tyre tracks. Tourism here funds conservation - your visit directly supports anti-poaching patrols, habitat restoration and wildlife monitoring.",
    stats: {
      tigers: "50+",
      birds: "300+",
      sqKm: "120",
      visitors: "1M+",
    },
    journey: [
      {
        year: "1995",
        title: "Declared a Protected Area",
        description:
          "The forest was granted protected status, closing it to commercial logging and hunting.",
      },
      {
        year: "2005",
        title: "First Tiger Census",
        description:
          "A dedicated census confirmed a breeding tiger population and shaped the zone plan still used today.",
      },
      {
        year: "2018",
        title: "Community Conservation Programme",
        description:
          "Villages bordering the park joined as forest guardians, guides and eco-tourism partners.",
      },
    ],
    activities: [
      { name: "Jeep Safari", image: "" },
      { name: "Bird Watching", image: "" },
      { name: "Nature Walks", image: "" },
      { name: "Wildlife Photography", image: "" },
    ],
  },

  safari: {
    title: "Safari Zones & Experiences",
    subtitle: "Explore the diverse habitats that make every drive different",
    zones: [
      {
        name: "Core Zone",
        description:
          "Dense sal forest and open meadows with the highest density of tiger sightings. Entry is limited and permits fill quickly.",
        timings: "6:00 AM - 10:00 AM & 2:30 PM - 6:00 PM",
      },
      {
        name: "Buffer Zone",
        description:
          "A quieter mixed forest on the park's edge, ideal for birding, sloth bear and relaxed drives with fewer vehicles.",
        timings: "6:30 AM - 11:00 AM & 2:00 PM - 5:30 PM",
      },
      {
        name: "River Safari",
        description:
          "A boat route along the park's river, offering a completely different angle on crocodile, otter and waterbird life.",
        timings: "7:00 AM - 11:00 AM",
      },
    ],
    animals: [
      "Bengal Tiger",
      "Indian Leopard",
      "Sloth Bear",
      "Indian Bison (Gaur)",
      "Sambar Deer",
      "Chital (Spotted Deer)",
      "Hanuman Langur",
      "Indian Peafowl",
    ],
    rules: [
      "Maintain silence inside the zone - the animals hear you long before you see them.",
      "Stay inside the vehicle at all times.",
      "Never feed, call out to or tease any animal.",
      "Carry no plastic into the park; whatever goes in must come out.",
      "Keep to the designated tracks and follow your guide's instructions.",
      "Carry a valid photo ID matching the name on your permit.",
    ],
    vehicles: [
      {
        name: "Gypsy (4x4 Open Jeep)",
        description:
          "Seats up to six visitors plus a guide and driver. Best for small groups, photographers and reaching narrower tracks.",
      },
      {
        name: "Canter (Open Bus)",
        description:
          "Seats around twenty visitors. A shared, budget-friendly option that runs fixed routes through the core zone.",
      },
    ],
  },

  settings: {
    siteName: "Jungle Safari National Park",
    // Left blank deliberately: real phone numbers and addresses belong to the
    // owner, and inventing them risks publishing someone else's details.
    contact: {
      name: "",
      phone: "",
      email: "info@junglesafari.com",
      address: "",
      mapUrl: "",
    },
    social: {
      facebook: "",
      instagram: "",
      twitter: "",
      youtube: "",
      linkedin: "",
    },
    footer: {
      copyright: `© ${new Date().getFullYear()} Jungle Safari National Park. All rights reserved.`,
      developedBy: "Vansh Arora",
    },
  },
};
