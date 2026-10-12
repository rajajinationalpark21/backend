import { connectDatabase, disconnectDatabase } from "../config/db.js";
import { Content, getContentDocument } from "../models/Content.js";

/**
 * Corrects the live content document where it disagrees with the client's Word
 * documents in `documentation/wetransfer_photos-for-website_*`. Only the listed
 * fields are touched; everything else an admin has edited is left alone.
 *
 *   node src/scripts/fixContentFromClientDocs.js           # dry run, prints the diff
 *   node src/scripts/fixContentFromClientDocs.js --apply   # writes the changes
 */
const APPLY = process.argv.includes("--apply");

const SEASONAL_TIMINGS =
  "15 Nov – 15 Feb: 6:30 AM – 8:00 AM & 1:30 PM – 3:00 PM | " +
  "16 Feb – 15 Apr: 6:00 AM – 7:30 AM & 2:00 PM – 3:30 PM | " +
  "16 Apr – 15 Jun: 5:30 AM – 7:00 AM & 3:00 PM – 4:30 PM";

const ZONE_FIXES = {
  "chilla-jeep-safari": {
    timings: SEASONAL_TIMINGS,
    metaDescription:
      "Book a Chilla Jeep Safari in Rajaji National Park near Rishikesh. Explore forests, grasslands and riverine habitats and discover elephants and diverse wildlife.",
  },
  "ranipur-gate-jeep-safari": {
    timings: SEASONAL_TIMINGS,
    metaDescription:
      "Book a Rajaji National Park Jeep Safari from Ranipur Gate, Haridwar. Explore Rajaji Tiger Reserve forests, elephants, deer, birds and leopard habitat.",
  },
  "chillawali-jeep-safari": {
    timings: SEASONAL_TIMINGS,
    duration: "Approx. 2 to 2.5 Hours",
    routeKm: "Approx. 30–36 km Track",
    metaDescription:
      "Book a Chillawali Jeep Safari through Mohand Gate, Rajaji National Park. Explore the Chillawali Range near Dehradun and discover its forests and wildlife.",
  },
  "motichur-jeep-safari": {
    timings: SEASONAL_TIMINGS,
    description:
      "Motichur was one of the former wildlife sanctuaries that, together with Rajaji and Chilla, became part of Rajaji National Park in 1983. Located along the Haridwar–Rishikesh route, the zone is characterised by Sal (Shorea robusta) forests, open clearings and varied forest habitats. The approximately 25 km safari route offers opportunities to observe Asian Elephant, Spotted Deer (Chital), Sambar, Barking Deer, Wild Boar, Hanuman Langur and a variety of forest birds.",
    metaDescription:
      "Book a Motichur Jeep Safari in Rajaji National Park near Haridwar, Rishikesh and Dehradun. Explore Sal forests, elephants, deer, birds and diverse wildlife.",
  },
  "jhilmil-jheel-safari": {
    tag: "Wetland Reserve – Swamp Deer (Barasingha) Habitat",
    duration: "Approx. 2 to 2.5 Hours",
    description:
      "Jhilmil Jheel Conservation Reserve is a scenic wetland on the left bank of the River Ganga in Haridwar district, declared a Conservation Reserve in 2005 and covering approximately 37.84 sq. km. It is recognised as an important habitat of the Swamp Deer (Barasingha) in Uttarakhand. With wetlands, grasslands, riverine habitats and mixed moist deciduous forest, it also supports Asian Elephants, Spotted Deer, Sambar, Wild Boar, Nilgai and 238 recorded bird species.",
    highlights: [
      "Important habitat of the Swamp Deer (Barasingha)",
      "238 bird species in the Forest Department's preliminary checklist",
      "Extended safari season: Open from 15 October to 30 June",
      "Unique wetland ecosystem contrasting with typical Sal hill forests",
    ],
    metaDescription:
      "Book Jhilmil Jheel Safari near Haridwar and explore Swamp Deer habitat, wetlands, grasslands, birds, elephants and riverine landscapes in Uttarakhand.",
  },
  "gohri-range-safari": {
    duration: "Approx. 2 Hours",
    timings: "Morning: 6:30 AM – 9:00 AM | Evening: 2:30 PM – 5:00 PM",
  },
  "chaurasi-kutiya-beatles-ashram": {
    gypsyCost: "Entry Ticket: ₹200 Indian / ₹1,200 Foreigner (Walking tour)",
  },
};

function applyFixes(content) {
  // ── Home: remove the test text from the About block ───────────────────────
  content.home.aboutTitle = "About Rajaji National Park";
  content.home.aboutDescription =
    "Rajaji National Park, now part of Rajaji Tiger Reserve, spreads across 820.42 sq km of the Shivalik foothills on both sides of the River Ganga in Uttarakhand. Formed in 1983 by merging the Rajaji, Motichur and Chilla sanctuaries, it shelters Asian elephants, Bengal tigers, leopards, deer and around 400 species of birds, and is within easy reach of Haridwar, Rishikesh and Dehradun.";
  content.home.aboutBadge = "EST. 1983";
  content.home.timings = "Morning & Evening Safaris";
  content.home.zones = "Chilla, Motichur, Ranipur & more";
  content.home.stats = { ...content.home.stats, sqKm: "820" };

  // ── About: seed placeholders that contradict the park's history ───────────
  content.about.stats = { ...content.about.stats, birds: "400+", sqKm: "820" };
  content.about.journey = [
    {
      year: "1977",
      title: "Chilla Notified as a Sanctuary",
      description: "Chilla was originally notified as a wildlife sanctuary.",
    },
    {
      year: "1983",
      title: "Rajaji National Park Formed",
      description:
        "The Rajaji, Motichur and Chilla sanctuaries were merged to form Rajaji National Park, named after C. Rajagopalachari.",
    },
    {
      year: "2015",
      title: "Declared a Tiger Reserve",
      description: "Rajaji was notified as a Tiger Reserve under Project Tiger.",
    },
  ];

  // ── Tickets ───────────────────────────────────────────────────────────────
  for (const fee of content.tickets.entranceFees) {
    if (fee.category.startsWith("Jhilmil")) fee.foreigner = "₹800 ticket + ₹400 permit";
    if (fee.category === "General Nature Guide") {
      fee.note = "Nature guide, where required by the Forest Department";
    }
  }
  for (const fee of content.tickets.filmingFees) {
    if (fee.type.startsWith("Ramganga")) fee.foreigner = "₹2,000 + GST";
  }
  for (const fee of content.tickets.guideFees) {
    if (fee.type === "Mandatory Nature Guide") {
      fee.type = "General Nature Guide";
      fee.note = "Mandatory wherever required under Forest Department rules";
    }
  }
  content.tickets.cancellationPolicy = content.tickets.cancellationPolicy.map((line) =>
    line.startsWith("7.")
      ? "7. Permit Changes, Cancellations & Refunds: Once a safari permit has been issued, changes to the safari date, slot or zone may not be permitted, subject to the rules of the concerned Forest Department. Cancellation, modification or refund requests are handled strictly according to the applicable Forest Department/park rules; where those rules do not permit a refund or change, no refund will be provided."
      : line
  );
  content.tickets.importantNotes = content.tickets.importantNotes.map((line) =>
    line.startsWith("Strict No-Refund Policy")
      ? "Changes & Refunds: Once a safari permit is issued, changes to date, slot or zone may not be permitted. Where Forest Department rules do not permit a refund or change, no refund will be provided."
      : line
  );

  // ── Safari zones ──────────────────────────────────────────────────────────
  for (const zone of content.safari.zones) {
    Object.assign(zone, ZONE_FIXES[zone.slug] ?? {});
  }
  content.safari.animals = [
    "Asian Elephant",
    "Bengal Tiger",
    "Leopard",
    "Chital (Spotted Deer)",
    "Sambar",
    "Barking Deer",
    "Goral",
    "Nilgai",
    "Wild Boar",
    "Hanuman Langur",
  ];
  content.safari.vehicles = content.safari.vehicles.filter((v) => !v.name.startsWith("Canter"));

  // ── FAQs ──────────────────────────────────────────────────────────────────
  for (const item of content.faqs.items) {
    item.a = item.a.replace(
      "Mandatory Nature Guide (₹1,000 per Gypsy)",
      "Nature Guide (₹1,000 per Gypsy, where required)"
    );
  }

  alignWithClientDocs(content);
  return normaliseSpellings(content);
}

// The documents describe six safari zones; Chaurasi Kutiya is a heritage
// attraction near the park, kept in the list but not counted as a zone.
const ZONE_CONTENT = {
  "chilla-jeep-safari": {
    tag: "Sal Forests, Grasslands & Riverine Habitats",
    entryGate: "Chilla Gate (Haridwar–Rishikesh bypass road)",
    duration: "Approx. 2.5 Hours",
    routeKm: "Approx. 36 km Circular Route",
    description:
      "Chilla Range is one of the most popular safari areas of Rajaji National Park (Rajaji Tiger Reserve), located on the Haridwar–Rishikesh bypass road, approximately 10 km from Haridwar and 20 km from Rishikesh. The Chilla Jeep Safari follows an approximately 2 hours 30 minutes route covering scenic forest areas around Mundal, Mithawali and Khara. Chilla was originally notified as a wildlife sanctuary in 1977 and was later incorporated with the Rajaji and Motichur sanctuaries to form Rajaji National Park in 1983; Rajaji was designated a Tiger Reserve in 2015. Wildlife sightings are not guaranteed and depend on animal movement, weather, season and other natural factors.",
    landscape: "Dense Sal forests, open grasslands and riverine habitats associated with the Chilla area and the Ganga.",
    highlights: [
      "Short halts at the Mundal and Ghasiram machans (watchtowers)",
      "Interpretation Centre and Library at the Chilla Complex",
      "Elephant safari in the early morning, subject to Forest Department availability",
      "Approximately 36 km circular route through forest, grassland and riverine habitats",
    ],
    wildlife: [
      "Bengal Tiger", "Leopard", "Asian Elephant", "Wild Boar", "Sloth Bear", "Chital (Spotted Deer)",
      "Sambar", "Barking Deer", "Hanuman Langur", "Rhesus Macaque", "Great Hornbill", "Kingfishers", "Peafowl",
    ],
  },
  "ranipur-gate-jeep-safari": {
    tag: "Jeep Safari & Leopard Safari near Haridwar",
    entryGate: "Ranipur Gate (near the Ranipur and BHEL area, Haridwar)",
    description:
      "The Haridwar Zone, accessed through Ranipur Gate, is one of the safari entry points for exploring Rajaji National Park (Rajaji Tiger Reserve) near Haridwar. Located close to the Ranipur and BHEL area, the zone offers an opportunity to explore the Shivalik forest landscape by Jeep Safari. Leopards occur in the wider forest landscape around Ranipur, making the area relevant for visitors looking for a leopard safari near Haridwar; however, wildlife sightings are never guaranteed and depend on animal movement, season, weather and habitat conditions.",
    landscape: "Mixed forest, open grassland patches, small hills and seasonal streams.",
    highlights: [
      "Convenient access from Haridwar",
      "Mixed forest and grassland landscapes",
      "Opportunities for elephant and deer sightings",
      "A chance to explore leopard habitat and observe forest birds",
    ],
    wildlife: [
      "Asian Elephant", "Spotted Deer", "Sambar Deer", "Nilgai", "Barking Deer", "Wild Boar", "Leopard",
      "Forest birds and raptors", "Owls",
    ],
  },
  "chillawali-jeep-safari": {
    tag: "Peaceful Leopard Safari in the Shivalik Foothills",
    entryGate: "Mohand Gate (near Ganeshpur, Dehradun–Haridwar highway)",
    description:
      "Chillawali Zone, accessed through Mohand Gate, is a forest tourism area of Rajaji National Park (Rajaji Tiger Reserve). Located near Ganeshpur on the Dehradun–Haridwar highway, it offers an opportunity to explore the scenic Shivalik foothill forests of the Chillawali Range by Jeep Safari. Compared with some of the busier safari areas, the Mohand–Chillawali landscape offers a relatively peaceful forest experience, with quiet trails, wooded surroundings and varied habitats. Leopard and other wildlife sightings are not guaranteed and depend on animal movement, season, weather and habitat conditions.",
    landscape: "Sal, Shisham and Rohini forests, open clearings, seasonal streams and the gently undulating terrain of the Shivalik foothills.",
    highlights: [
      "Route through the Chillawali and Andheri Rau forest areas towards the Dholkhand Forest Rest House",
      "A quieter forest setting on the Dehradun side of Rajaji",
      "Opportunities to look for leopards and other forest wildlife",
      "Suitable for birding, wildlife photography and family safaris",
    ],
    wildlife: [
      "Leopard", "Wild Boar", "Asian Elephant", "Spotted Deer (Chital)", "Sambar", "Barking Deer",
      "Hanuman Langur", "Indian Peafowl", "Indian Grey Hornbill", "Kingfishers",
    ],
  },
  "motichur-jeep-safari": {
    tag: "Sal Forests, Elephants & Forest Birdlife",
    entryGate: "Motichur Gate (Haridwar–Rishikesh route)",
    routeKm: "Approx. 25 km Circular Route",
    landscape: "Sal (Shorea robusta) forests, grasslands, open clearings and varied forest habitats.",
    highlights: [
      "Approximately 25 km circular safari route",
      "Former wildlife sanctuary, part of Rajaji National Park since 1983",
      "Opportunities to observe Asian Elephant, Chital, Sambar and forest birds",
      "About 9 km from Haridwar, 20 km from Rishikesh and 35 km from Dehradun",
    ],
    wildlife: [
      "Asian Elephant", "Spotted Deer (Chital)", "Sambar", "Barking Deer", "Wild Boar", "Hanuman Langur",
      "Leopard", "Forest birds",
    ],
  },
  "jhilmil-jheel-safari": {
    entryGate: "Haridwar–Najibabad road, approx. 20 km from Haridwar",
    routeKm: "Route varies with season and Forest Department regulations",
    landscape: "Wetlands, grasslands, riverine habitats, tropical mixed moist deciduous forests and scrubland.",
    highlights: [
      "Important habitat of the Swamp Deer (Barasingha)",
      "238 bird species in the Forest Department's preliminary checklist",
      "Safari season from 15 October to 30 June",
      "Wildlife observation from designated viewpoints and watchtowers",
    ],
    wildlife: [
      "Swamp Deer (Barasingha)", "Asian Elephant", "Spotted Deer", "Sambar", "Wild Boar", "Nilgai", "Leopard",
      "Waterbirds and waders",
    ],
  },
  "gohri-range-safari": {
    tag: "Peaceful Buffer-Zone Safari near Rishikesh & Haridwar",
    entryGate: "Gohri Range (near Rishikesh and Haridwar)",
    gypsyCost: "₹3,500 per Gypsy (Guide ₹800 per safari)",
    routeKm: "Routes subject to prevailing permissions",
    openSeason: "Generally open year-round, except August & September",
    timings: "All open months: 6:30 AM – 9:00 AM & 2:30 PM – 5:00 PM",
    description:
      "Gohri Range is part of the Rajaji Tiger Reserve (buffer zone) landscape in Uttarakhand and offers an opportunity to explore forested foothills, riverine habitats and the surrounding Himalayan wilderness. With its relatively quiet forest routes and diverse habitats, Gohri is an interesting destination for visitors looking for a peaceful jungle safari near Rishikesh and Haridwar. The range is generally open throughout the year, except during August and September, subject to Forest Department regulations, weather conditions, route conditions and local management decisions.",
    landscape: "Dense vegetation, foothills, seasonal streams and riverine areas.",
    highlights: [
      "Quieter forest routes away from more heavily visited areas",
      "Elephant and deer habitats with opportunities for leopard sightings",
      "Birdwatching: kingfishers, barbets, hornbills, eagles and woodland birds",
      "Vindhyavasini Temple near the Ganges, surrounded by hills and forest",
    ],
    wildlife: [
      "Asian Elephant", "Sambar", "Spotted Deer", "Barking Deer", "Nilgai", "Wild Boar", "Goral", "Leopard",
      "Forest and riverine birds",
    ],
  },
  "chaurasi-kutiya-beatles-ashram": {
    tag: "Historic Ashram, Meditation Huts & Murals near Rajaji",
    entryGate: "Rishikesh, Uttarakhand (close to Rajaji National Park)",
    duration: "Walking visit",
    routeKm: "",
    openSeason: "Visiting hours may change – verify before visiting",
    timings: "",
    description:
      "Chaurasi Kutiya, popularly known as the Beatles Ashram, is a famous tourist attraction in Rishikesh, Uttarakhand, located close to Rajaji National Park. Set in a peaceful forested landscape near the River Ganga, the historic ashram is known for its meditation huts, colourful murals, artwork and association with The Beatles and Maharishi Mahesh Yogi. The ashram gained international recognition when The Beatles visited Rishikesh in 1968 to practise Transcendental Meditation under the guidance of Maharishi Mahesh Yogi. Visitors can combine a visit with a Rajaji Jeep Safari, Rishikesh sightseeing and attractions around Haridwar and Dehradun.",
    landscape: "Peaceful forest and hill surroundings near the River Ganga.",
    highlights: [
      "Historic meditation huts and structures",
      "Colourful murals and artwork",
      "Areas associated with the history of The Beatles Ashram",
      "Visitor facilities and a small canteen",
    ],
    wildlife: [],
    metaDescription:
      "Visit Chaurasi Kutiya, the Beatles Ashram in Rishikesh near Rajaji National Park. Meditation huts, murals, the story of The Beatles' 1968 visit and entry fees.",
  },
};

const CANCELLATION_POLICY = [
  "1. Arrival at Gate: Guests must reach the designated safari gate at least 20 minutes before the scheduled reporting/last entry time mentioned on the safari permit or confirmation.",
  "2. Late Arrival: Guests arriving after the permitted entry or reporting time may be denied entry. In such cases, the safari fee will not be refundable.",
  "3. Final Safari Timing: Guests are advised to check the final date, timing, zone and reporting details mentioned on their safari permit or booking confirmation before travelling.",
  "4. Student Concession: Student concessions are available only for recognised institutional educational tours, subject to applicable Forest Department rules, eligibility and approval.",
  "5. Children: Children above 11 years will be charged the applicable park entry fee, subject to the prevailing rules and regulations.",
  "6. Nature Guide: An authorised nature guide/local guide is mandatory with each safari vehicle wherever required under the applicable park and Forest Department regulations.",
  "7. Permit Changes, Cancellations & Refunds: Once a safari permit has been issued, changes to the safari date, slot or zone may not be permitted, subject to the rules of the concerned Forest Department. Cancellation, modification or refund requests are handled strictly according to the applicable Forest Department/park rules; where those rules do not permit a refund or change, no refund will be provided.",
  "8. Safari Cancellation Due to Circumstances Beyond Our Control: If a safari is cancelled, suspended or does not operate due to natural calamities, adverse weather conditions, government or Forest Department restrictions, wildlife-related safety concerns, park closure, or other circumstances beyond our control, no refund will be provided.",
];

const DOS = [
  ["Obtain Valid Permits Before Entry", "Obtain the required permits before entering the Park and strictly follow all Forest Department rules and regulations."],
  ["Use an Authorised Nature Guide", "Use the services of an authorised Nature Guide. Trained guides can assist with wildlife sightings, interpretation and safe navigation through the forest."],
  ["Drive Slowly and Carefully", "A slow and quiet safari allows you to observe wildlife and enjoy the natural surroundings without causing unnecessary disturbance."],
  ["Stay on Designated Roads", "Stay on designated roads and safari trails. Do not drive off-track, as this can damage vegetation and disturb resting animals or their young."],
  ["Maintain Safe Distance from Wildlife", "Respect wild animals and remember that the forest is their natural home."],
  ["Keep Noise to a Minimum", "Switch off car stereos and avoid loud conversations so that you can enjoy the natural sounds of the forest and improve your chances of observing wildlife."],
  ["Wear Natural or Subdued Colours", "Wear natural or subdued colours where possible, as bright colours may disturb or attract the attention of wildlife."],
  ["Carry Binoculars and Camera", "Carry a camera and binoculars to enjoy and photograph wildlife responsibly."],
];

const DONTS = [
  ["No Firearms or Prohibited Items", "Do not carry firearms or other prohibited items into the Park."],
  ["No Smoking or Fires", "Do not smoke or light fires inside the forest. Even a small accidental fire can cause serious damage to wildlife and vegetation."],
  ["Do Not Leave the Vehicle", "Do not get out of your safari vehicle except at officially designated and permitted locations."],
  ["Never Feed or Tease Wildlife", "Do not feed, chase, tease or attempt to attract wildlife."],
  ["Rajaji Is Not a Zoo", "Do not expect to see wildlife at every moment. Rajaji is a natural forest, not a zoo; enjoy its forests, rivers, grasslands and landscapes as well as its wildlife."],
  ["Tiger Sightings Are Unpredictable", "Do not be disappointed if you do not see a tiger. Wildlife sightings are unpredictable, and every safari offers an opportunity to experience different species and natural habitats."],
  ["No Alcohol or Non-Vegetarian Food", "Alcohol and non-vegetarian food are not permitted inside the Park, subject to applicable Park regulations."],
  ["Do Not Litter", "Carry all non-biodegradable waste, including plastic, cans, glass bottles, wrappers and metal foils, back with you and dispose of it at the designated facility outside the Park."],
  ["Do Not Disturb the Environment", "Avoid plucking flowers, damaging plants, collecting natural materials or otherwise altering the forest."],
];

const FAQ_ANSWERS = {
  "What is the entry fee for Rajaji National Park?":
    "Park entry is ₹150 per person for Indian visitors and ₹600 per person for foreign visitors in the Chilla, Haridwar/Ranipur, Motichur and Chillawali/Mohand zones. In the Jhilmil zone the entry ticket is ₹200 per person for Indian visitors and ₹800 for foreign visitors. Children above 11 years are charged the applicable park entry fee. Fees may change without prior notice under Forest Department regulations.",
  "How can I book a Rajaji Jeep Safari online?":
    "Choose your preferred safari date, morning or afternoon/evening slot and safari zone, provide the name, age and gender of all travellers along with the identification details required for the permit, and submit the online booking form or contact our team by call or WhatsApp. After confirmation, the booking details, reporting location and permit information are shared by email or WhatsApp.",
  "How many people can travel in one Rajaji safari Jeep?":
    "The maximum capacity is up to 6 persons per Gypsy, subject to applicable rules.",
  "Which Rajaji safari zone is accessible from Haridwar?":
    "Ranipur Gate (Haridwar Zone), close to the Ranipur and BHEL area, is particularly convenient for visitors staying in Haridwar. Chilla Range is approximately 10 km from Haridwar and Motichur about 9 km, and Jhilmil Jheel is approximately 20 km away.",
  "Can I book a Rajaji Jeep Safari from Rishikesh?":
    "Yes. Chilla Range and Motichur are each approximately 20 km from Rishikesh, and Gohri Range offers a quieter jungle safari near Rishikesh and Haridwar. Chaurasi Kutiya (Beatles Ashram) is in Rishikesh itself.",
  "Is advance booking available for Rajaji National Park safari?":
    "Yes. Safari vehicles and permits are subject to availability, and as demand may exceed the number of available vehicles, advance booking is recommended, particularly during weekends, public holidays and peak tourist periods.",
  "Are wildlife sightings guaranteed during a Rajaji Jeep Safari?":
    "No. Wildlife sightings are not guaranteed and depend on natural animal movements, season, weather and habitat conditions. Rajaji is a natural forest, not a zoo, and every safari offers an opportunity to experience different species and natural habitats.",
};

const BUTTERFLIES = [
  ["Blue Pansy", "Nymphalidae"], ["Blue Tiger", "Nymphalidae"], ["Common Bush Brown", "Nymphalidae"],
  ["Common Castor", "Nymphalidae"], ["Common Crow", "Nymphalidae"], ["Common Emigrant", "Pieridae"],
  ["Common Evening Brown", "Nymphalidae"], ["Common Five-ring", "Nymphalidae"], ["Common Grass Yellow", "Pieridae"],
  ["Common Jay", "Papilionidae"], ["Common Mormon", "Papilionidae"], ["Common Palmfly", "Nymphalidae"],
  ["Common Pierrot", "Lycaenidae"], ["Common Pioneer", "Pieridae"], ["Common Sailer", "Nymphalidae"],
  ["Danaid Eggfly", "Nymphalidae"], ["Great Eggfly", "Nymphalidae"], ["Lemon Pansy", "Nymphalidae"],
  ["Lime Swallowtail", "Papilionidae"], ["Orange Oakleaf", "Nymphalidae"], ["Pea Blue", "Lycaenidae"],
  ["Peacock Pansy", "Nymphalidae"], ["Plain Tiger", "Nymphalidae"], ["Psyche", "Pieridae"],
  ["Indian Wanderer", "Pieridae"], ["Tailed Jay", "Papilionidae"],
];

const EXTRA_TREES = [
  ["Sandan", "Ougeinia oojeinensis", "Fabaceae"],
  ["Chamaror", "Ehretia laevis", "Boraginaceae"],
  ["Ber", "Ziziphus mauritiana", "Rhamnaceae"],
  ["Chilla", "Casearia tomentosa", "Salicaceae"],
  ["Kachnar", "Bauhinia variegata", "Fabaceae"],
];

const FOREST_REST_HOUSES = [
  ["Dholkhand FRH", "2", "OK", "Mohand & Ranipur"],
  ["Beribara FRH", "2", "OK", "Ranipur"],
  ["Chilla FRH", "3+2", "OK", "Chilla"],
  ["Ranipur FRH", "2", "Under Repair", "BHEL Haridwar"],
  ["Kansrao FRH", "2", "OK", "Asharori & Motichur"],
  ["Kunnao FRH", "2", "Under Repair", "Rishikesh"],
  ["Motichur FRH", "2", "OK", "Motichur"],
  ["Phandowala FRH", "2", "OK", "Asharori"],
  ["Satyanarayan FRH", "2+2", "OK", "Haridwar-Dehradun Highway"],
  ["Asharori FRH", "2", "Under Repair", "Dehradun-Delhi Highway (12km)"],
];

const rules = (pairs) => pairs.map(([title, desc]) => ({ title, desc }));

function alignWithClientDocs(content) {
  // ── Safari zones ──────────────────────────────────────────────────────────
  for (const zone of content.safari.zones) {
    Object.assign(zone, ZONE_CONTENT[zone.slug] ?? {});
  }
  const safariActivity = content.activities.items.find((item) => item.slug === "/zones");
  if (safariActivity) {
    safariActivity.desc =
      "Explore Rajaji Tiger Reserve on a guided Jeep Safari across six safari zones: Chilla, Motichur, Ranipur, Mohand–Chillawali, Jhilmil Jheel and Gohri. Depending on the season and natural conditions, visitors may encounter Asian Elephants, deer, Wild Boar, birds and other wildlife.";
  }

  // ── Tickets ───────────────────────────────────────────────────────────────
  const tickets = content.tickets;
  tickets.title = "Rajaji National Park Jeep Safari – Tickets, Entry Fees & Safari Charges";
  tickets.subtitle =
    "Safari entry, permits, vehicle charges and operating timings vary according to the entry gate, safari zone, visitor category, season and applicable Forest Department regulations.";
  tickets.entranceFees[0].category = "Park Entry (Chilla, Haridwar/Ranipur, Motichur, Chillawali/Mohand)";
  for (const rate of tickets.gypsyRates) rate.capacity = "Up to 6 persons, subject to applicable rules";
  tickets.elephantRide.note =
    "Early-morning elephant safari at Chilla, approx. 1–1.5 hours, subject to Forest Department availability.";
  tickets.cancellationPolicy = CANCELLATION_POLICY;
  tickets.importantNotes = tickets.importantNotes.map((line) =>
    line.startsWith("Identification")
      ? "Identification: Indian and foreign visitors should carry valid identification documents as required under the applicable Forest Department rules."
      : line
  );

  // ── Terms, do's and don'ts ────────────────────────────────────────────────
  content.parkRules.title = "Rajaji Jeep Safari Terms & Conditions – Cancellation, Refund & Safari Rules";
  content.parkRules.overview =
    "Safari operations are subject to the rules, regulations and decisions of the concerned Forest Department and park authorities.";
  content.parkRules.dos = rules(DOS);
  content.parkRules.donts = rules(DONTS);

  // ── FAQs ──────────────────────────────────────────────────────────────────
  for (const item of content.faqs.items) {
    if (FAQ_ANSWERS[item.q]) item.a = FAQ_ANSWERS[item.q];
  }

  // ── Mammals ───────────────────────────────────────────────────────────────
  const fauna = content.fauna;
  fauna.title = "Mammals of Rajaji Tiger Reserve";
  fauna.subtitle =
    "Rajaji Tiger Reserve is home to several iconic mammal species, including the Asian Elephant, Bengal Tiger, Leopard, Chital, Sambar, Barking Deer, Goral, Nilgai and Wild Boar.";
  fauna.overview =
    "Rajaji National Park supports a rich diversity of wildlife across its Sal forests, deciduous forests, Khair-Sissoo woodlands, riverine habitats, grasslands, scrublands and pine forests. The reserve plays an important role in the conservation of Asian Elephants and Bengal Tigers under Project Elephant and Project Tiger, and was notified as a Tiger Reserve in 2015. Wildlife sightings depend on animal movements, habitat conditions, season and other natural factors and cannot be guaranteed.";
  const attractionDetails = [
    "Rajaji marks the northern and western-most boundary of the Asian Elephant's range. Protected under Project Elephant.",
    "Conserved under Project Tiger. Rajaji was notified as a Tiger Reserve in 2015.",
    "Leopards occur across the forest landscape; sightings depend on natural animal movement and cannot be guaranteed.",
    "Sloth Bear and Himalayan Black Bear are both recorded in the Rajaji landscape.",
  ];
  fauna.primeAttractions.forEach((attraction, index) => {
    attraction.details = attractionDetails[index] ?? attraction.details;
    if (index === 3) attraction.name = "Sloth Bear & Himalayan Black Bear";
  });
  const addAnimal = (list, name, info) => {
    if (!list.some((animal) => animal.name === name)) list.push({ name, info, image: "" });
  };
  addAnimal(fauna.herbivores, "Hanuman Langur & Rhesus Macaque", "Primates commonly seen along forest tracks");
  addAnimal(fauna.herbivores, "Indian Hare & Indian Porcupine", "Small mammals recorded in the Rajaji landscape");
  addAnimal(fauna.carnivores, "Rusty-spotted Cat", "Documented from the wider Rajaji landscape");
  addAnimal(fauna.carnivores, "Pangolin", "Recorded in the Rajaji landscape");
  fauna.reptiles = fauna.reptiles.filter((reptile) => !reptile.name.startsWith("Gharial"));
  for (const reptile of fauna.reptiles) {
    if (reptile.name === "Bengal Monitor Lizard") reptile.name = "Indian Monitor Lizard";
  }

  // ── Reptiles ──────────────────────────────────────────────────────────────
  const reptiles = content.reptiles;
  reptiles.subtitle =
    "Reptiles recorded or reported from the wider Rajaji landscape include the Indian Cobra, King Cobra, Indian Rock Python, Common Krait and Indian Monitor Lizard.";
  reptiles.overview =
    "Rajaji Tiger Reserve in Uttarakhand supports a variety of reptiles associated with its forests, grasslands, rocky areas, streams and riverine habitats. These reptiles form an important part of the reserve's biodiversity and contribute to the ecological balance of the forest ecosystem. During a Rajaji Jeep Safari, visitors may occasionally observe reptiles in suitable habitats; sightings depend on season, weather, habitat conditions and natural animal movements and cannot be guaranteed.";
  reptiles.metaDescription =
    "Explore reptiles of Rajaji Tiger Reserve, including Indian Cobra, King Cobra, Indian Rock Python, Common Krait and Indian Monitor Lizard. Discover Rajaji wildlife.";
  reptiles.species = reptiles.species.filter(
    (species) => !species.name.startsWith("Yellow Monitor") && !species.name.startsWith("Indian Star Tortoise")
  );
  for (const species of reptiles.species) {
    if (species.name === "Bengal Monitor Lizard") species.name = "Indian Monitor Lizard";
  }

  // ── Butterflies ───────────────────────────────────────────────────────────
  const butterflies = content.butterflies;
  const butterflyImage = (name) =>
    butterflies.species.find((s) => s.name.startsWith(name) || (name === "Lime Swallowtail" && s.name.startsWith("Lime Butterfly")))
      ?.image ?? "";
  butterflies.title = "Butterflies of Rajaji National Park";
  butterflies.subtitle =
    "During a Rajaji Jeep Safari, visitors may observe colourful butterflies along forest trails, grasslands, sunny clearings, forest edges and areas with flowering vegetation.";
  butterflies.overview =
    "Rajaji Tiger Reserve in Uttarakhand supports a rich diversity of butterflies. Its varied habitats, including Sal forests, grasslands, riverine areas, forest edges, open clearings and flowering plant communities, provide suitable conditions for a wide range of butterfly species. This is an indicative list rather than a complete checklist; butterfly occurrence can vary between locations, seasons and habitats.";
  butterflies.mudPuddling =
    "Butterflies are generally more active during warm, sunny conditions, particularly around forest edges, grasslands, flowering plants, riverine habitats and sunny clearings. Morning hours can be particularly suitable for butterfly watching and photography, when many species become active as temperatures rise.";
  butterflies.species = BUTTERFLIES.map(([name, family]) => ({ name, family, habitat: "", image: butterflyImage(name) }));

  // ── Flora ─────────────────────────────────────────────────────────────────
  const flora = content.flora;
  flora.title = "Flora of Rajaji National Park";
  flora.subtitle =
    "From towering Sal trees and flowering Amaltas to riverine trees, shrubs and native grasses, the flora of Rajaji Tiger Reserve plays an important role in maintaining the ecological balance of this Himalayan foothill ecosystem.";
  flora.overview =
    "Rajaji National Park, now part of Rajaji Tiger Reserve, lies in the Shivalik Hills and Himalayan foothills of Uttarakhand. The reserve supports a diverse range of natural habitats, including Sal forests, mixed deciduous forests, riverine vegetation, scrublands, grasslands and subtropical pine forests.";
  for (const tree of flora.dominantTrees) {
    if (tree.common === "Khair") tree.scientific = "Senegalia catechu";
    if (tree.common.startsWith("Aonla")) Object.assign(tree, { common: "Amla (Aonla)", scientific: "Phyllanthus emblica" });
    if (tree.common.startsWith("Baans")) tree.common = "Bamboo (Baans)";
  }
  for (const [common, scientific, family] of EXTRA_TREES) {
    if (!flora.dominantTrees.some((tree) => tree.common === common)) {
      flora.dominantTrees.push({ common, scientific, family, desc: "", image: "" });
    }
  }

  // ── Birds ─────────────────────────────────────────────────────────────────
  content.birds.subtitle =
    "Rajaji supports approximately 400 species of birds across its diverse forest, grassland and riverine habitats.";
  content.birds.overview =
    "Rajaji National Park, also known as Rajaji Tiger Reserve, is a fascinating destination for birdwatching in Uttarakhand, supporting approximately 400 species of birds. Its Sal forests, mixed deciduous forests, grasslands, riverine areas, forest edges and open clearings support a diverse assemblage of resident, migratory and altitudinal migrant birds.";

  // ── Stay ──────────────────────────────────────────────────────────────────
  content.stay.forestRestHouses = FOREST_REST_HOUSES.map(([name, suites, status, gate]) => ({
    name, suites, status, gate, setting: "",
  }));
  Object.assign(content.stay.frhBookingInfo, {
    authority: "Director, Rajaji National Park",
    address: "5/1 Ansari Road, Dehradun-248001, Uttarakhand (India)",
    phone: "0135-2621669",
    fax: "0135-2621669",
  });

  // ── Settings: the documents give no Facebook or Twitter link ──────────────
  Object.assign(content.settings.social, { facebook: "", twitter: "" });
}

/** One spelling per place name, as used in the zone documents. */
function normaliseSpellings(node) {
  if (typeof node === "string") return node.replace(/\bGohari\b/g, "Gohri").replace(/\bChila\b/g, "Chilla");
  if (Array.isArray(node)) return node.map(normaliseSpellings);
  if (node && typeof node === "object" && node.constructor === Object) {
    for (const key of Object.keys(node)) node[key] = normaliseSpellings(node[key]);
  }
  return node;
}

function diff(before, after, path = "") {
  if (JSON.stringify(before) === JSON.stringify(after)) return [];
  const bothObjects =
    before && after && typeof before === "object" && typeof after === "object";
  if (!bothObjects || Array.isArray(before) !== Array.isArray(after)) {
    return [{ path, before, after }];
  }
  const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
  return [...keys].flatMap((key) => diff(before[key], after[key], path ? `${path}.${key}` : key));
}

async function run() {
  await connectDatabase();
  const doc = await getContentDocument();

  const before = doc.toObject();
  const after = applyFixes(structuredClone(before));
  const changes = diff(before, after);

  for (const { path, before: from, after: to } of changes) {
    console.log(`\n${path}\n  - ${JSON.stringify(from)}\n  + ${JSON.stringify(to)}`);
  }
  console.log(`\n[fix] ${changes.length} field(s) differ from the client documents.`);

  if (APPLY && changes.length > 0) {
    // Written path-by-path through the driver: zones carry fields the schema
    // does not declare (`wildlife`), which a strict `doc.set(section)` would drop.
    const $set = { updatedAt: new Date() };
    for (const { path, before: from, after: to } of changes) {
      const lengthChanged = from === undefined || to === undefined;
      const target = lengthChanged ? path.slice(0, path.lastIndexOf(".")) : path;
      $set[target] = target.split(".").reduce((node, key) => node[key], after);
    }
    // MongoDB rejects a $set that names both an array and one of its elements.
    for (const key of Object.keys($set)) {
      if (Object.keys($set).some((other) => key.startsWith(`${other}.`))) delete $set[key];
    }
    await Content.collection.updateOne({ _id: doc._id }, { $set });
    console.log("[fix] Changes saved.");
  } else if (!APPLY) {
    console.log("[fix] Dry run - nothing written. Re-run with --apply to save.");
  }

  await disconnectDatabase();
}

run().catch((err) => {
  console.error("[fix] Error:", err);
  process.exit(1);
});
