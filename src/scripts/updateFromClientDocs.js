import { connectDatabase, disconnectDatabase } from "../config/db.js";
import { getContentDocument } from "../models/Content.js";

async function run() {
  console.log("[update] Connecting to database...");
  await connectDatabase();

  const doc = await getContentDocument();

  // 1. Settings & Contacts (From Client Documentation)
  doc.set("settings", {
    siteName: "Rajaji National Park – Safari Booking",
    contact: {
      name: "Rajaji Safari Desk / Dr. Chaturbhuj",
      phone: "+91 98298 50501",
      secondaryPhone: "+91 93765 91390",
      tertiaryPhone: "+91 99829 07130",
      whatsapp: "+91 98298 50501",
      email: "jeepsafarirajajinationalpark@gmail.com",
      address: "Chilla Jungle Safari Gate, Haridwar and Rishikesh, Uttarakhand-249306",
      mapUrl: "https://maps.google.com/?q=Chilla+Range+Rajaji+National+Park",
      drChaturbhuj: "+91 98298 50501 | +91 99829 07130",
    },
    social: {
      facebook: "https://facebook.com",
      instagram: "http://instagram.com/rajaji_national_park_veeru",
      twitter: "https://twitter.com",
      youtube: "https://www.youtube.com/user/viru644",
      linkedin: "",
    },
    footer: {
      brandTitle: "RAJAJI NATIONAL PARK – SAFARI BOOKING",
      brandDesc: "Book your Rajaji National Park Safari across the Chilla, Motichur, Ranipur, Jhilmil Jheel, Mohand and Gohari zones with easy online booking and quick confirmation.",
      address: "Chilla Jungle Safari Gate, Haridwar and Rishikesh, Uttarakhand-249306",
      phone: "+91 98298 50501",
      copyright: `© ${new Date().getFullYear()} Rajaji Tiger Reserve & National Park. All rights reserved.`,
      developedBy: "Rajaji Safari Team",
    },
  });

  // 2. Tickets & Charges (From Tickets, Entry Fees & Safari Charges.docx)
  doc.set("tickets", {
    timings: {
      summer: "16 Apr – 15 Jun: Morning 5:30 AM – 7:00 AM | Evening 3:00 PM – 4:30 PM (16 Feb – 15 Apr: 6:00 AM – 7:30 AM | 2:00 PM – 3:30 PM)",
      winter: "15 Nov – 15 Feb: Morning 6:30 AM – 8:00 AM | Evening 1:30 PM – 3:00 PM",
      openDates: "15 November to 15 June (Gohari Range open year-round except August & September)",
    },
    entranceFees: [
      {
        category: "Park Entry (Chila, Ranipur, Motichur, Chillawali)",
        indian: "₹150 per person",
        foreigner: "₹600 per person",
        note: "Government entry fee per person per shift",
      },
      {
        category: "Vehicle / Jeep Permit",
        indian: "₹250 per vehicle",
        foreigner: "₹500 per vehicle",
        note: "Forest Department vehicle permit fee",
      },
      {
        category: "Gypsy / Safari Cost",
        indian: "₹3,500 per vehicle",
        foreigner: "₹3,500 – ₹4,000 per vehicle",
        note: "Authorised 4x4 Gypsy (Up to 6 persons capacity)",
      },
      {
        category: "Jhilmil Zone Entry & Permit",
        indian: "₹200 ticket + ₹300 permit",
        foreigner: "₹600 ticket + ₹500 permit",
        note: "Swamp deer wetland conservation reserve rate",
      },
      {
        category: "General Nature Guide",
        indian: "₹1,000 per vehicle",
        foreigner: "₹1,000 per vehicle",
        note: "Certified Forest Department nature guide (Mandatory)",
      },
      {
        category: "Experienced Bird & Wildlife Guide",
        indian: "₹1,200 – ₹1,800",
        foreigner: "₹1,200 – ₹1,800",
        note: "Specialized expert guide for birdwatching & photography",
      },
      {
        category: "Fixed / Movie Camera (Non-commercial)",
        indian: "FREE",
        foreigner: "FREE",
        note: "Personal photography & videography permitted without charge",
      },
      {
        category: "Movie Camera / Video (Commercial)",
        indian: "₹500",
        foreigner: "₹1,500",
        note: "Commercial handheld video permit",
      },
    ],
    elephantRide: {
      availability: "Early morning, subject to Forest Department availability",
      indianRate: "Approx. ₹1,200 – ₹1,500",
      foreignerRate: "Higher rate — confirm at gate",
      note: "Conducted at designated ranges, seasonal availability.",
    },
    filmingFees: [
      {
        type: "Feature Film Shooting (Per Day)",
        indian: "₹1,00,000 / day",
        foreigner: "₹2,00,000 / day",
        security: "₹1,00,000 / ₹2,00,000 (Refundable)",
        note: "Prior State Forest Department clearance required",
      },
      {
        type: "Documentary Film Shooting (Per Day)",
        indian: "₹10,000 / day",
        foreigner: "₹30,000 / day",
        security: "₹50,000 / ₹1,00,000 (Refundable)",
        note: "Requires documentary permit & security deposit",
      },
      {
        type: "Ramganga Conducted Tour (Per Person)",
        indian: "₹1,000 + GST",
        foreigner: "₹2,00,000 + GST",
        security: "N/A",
        note: "Conducted scenic forest excursion",
      },
    ],
    gypsyRates: [
      { zone: "Chilla Range", rate: "₹3,500", capacity: "Up to 6 visitors + driver & guide" },
      { zone: "Ranipur Gate / Haridwar", rate: "₹3,500", capacity: "Up to 6 visitors + driver & guide" },
      { zone: "Chillawali / Mohand Gate", rate: "₹3,500", capacity: "Up to 6 visitors + driver & guide" },
      { zone: "Motichur Safari Zone", rate: "₹3,500", capacity: "Up to 6 visitors + driver & guide" },
      { zone: "Jhilmil Jheel Safari Zone", rate: "₹3,500", capacity: "Up to 6 visitors + driver & guide" },
      { zone: "Gohari Range (Buffer Zone)", rate: "₹3,500", capacity: "Up to 6 visitors + driver & guide" },
    ],
    guideFees: [
      { type: "Mandatory Nature Guide", fee: "₹1,000 per shift", note: "Authorised guide compulsory per Gypsy" },
      { type: "Experienced Bird & Wildlife Guide", fee: "₹1,200 – ₹1,800 per shift", note: "Recommended for birdwatchers & photographers" },
    ],
    importantNotes: [
      "Arrival at Gate: Guests must reach the designated safari gate at least 20 minutes before reporting time.",
      "Late Arrival: Entry will be denied if arriving after last entry time; fees are non-refundable.",
      "Identification: Valid original Govt ID (Aadhaar / Passport / Voter ID) mandatory for each passenger.",
      "Child Policy: Children above 11 years will be charged the applicable park entry fee.",
      "Student Concession: Available only for recognised institutional educational tours with prior approval.",
      "Strict No-Refund Policy: Once safari permit is issued, cancellations, modifications or date transfers are strictly not permitted.",
      "Force Majeure: No refunds if safari is cancelled due to weather, rain, flooding, park closure, or Forest Dept regulations.",
    ],
    cancellationPolicy: [
      "1. Arrival at Gate: Guests must reach the designated safari gate at least 20 minutes before the scheduled reporting/last entry time mentioned on the permit.",
      "2. Late Arrival: Guests arriving after the permitted entry time may be denied entry. Safari fee is strictly non-refundable.",
      "3. Final Safari Timing: Guests are advised to verify the final date, timing, zone and reporting details before travelling.",
      "4. Student Concession: Available only for recognised institutional educational tours, subject to Forest Department approval.",
      "5. Children: Children above 11 years are charged the applicable park entry fee.",
      "6. Nature Guide: An authorised nature guide is mandatory with each safari vehicle wherever required.",
      "7. Permit Changes, Cancellations & Refunds: Once a safari permit has been issued, changes to date, slot or zone are not permitted. No refund will be provided.",
      "8. Circumstances Beyond Control: If safari is cancelled due to natural calamities, rain, wildlife-related safety, or government restrictions, no refund will be provided.",
    ],
  });

  // 3. 7 Comprehensive Safari Zones (From PAGE - Jungle Safari Jeep Safari Zones)
  doc.set("safari.zones", [
    {
      slug: "chilla-jeep-safari",
      name: "Chilla Range",
      tag: "Core Zone – Asian Elephants & Tiger Territory",
      entryGate: "Chilla Gate (Near Haridwar & Rishikesh)",
      gypsyCost: "₹3,500 per Gypsy (Up to 6 persons)",
      duration: "Approx. 2.5 to 3 Hours",
      routeKm: "Approx. 36 km Circuit",
      openSeason: "15 November to 15 June",
      timings: "Morning: 6:00 AM – 8:00 AM | Afternoon: 1:30 PM – 4:30 PM (Seasonal variation)",
      description: "Chilla Range is the most famous and popular core safari area of Rajaji Tiger Reserve. Spanning diverse Sal forests, open grasslands, and riverbeds along the Ganges, Chilla offers the highest probability of spotting wild Asian Elephants, Bengal Tigers, Leopards, Spotted Deer, and Sambars. The safari features scenic halts at Mundal and Ghasiram watchtowers overlooking sprawling riverbanks.",
      landscape: "Riverine plains, dense Sal forest canopies, open grasslands, and seasonal riverbeds (raos).",
      highlights: [
        "Mundal & Ghasiram watchtower viewpoints",
        "Prime elephant migration corridor",
        "Chilla canal and Ganga riverbed panorama",
        "Rich birdlife including Great Hornbill and Crested Kingfisher",
      ],
      wildlife: ["Bengal Tiger", "Asian Elephant", "Leopard", "Spotted Deer (Chital)", "Sambar", "Wild Boar", "Peafowl", "Hornbill"],
      seoTitle: "Chilla Jeep Safari | Chilla Range – Rajaji National Park",
      metaDescription: "Book Chilla Jeep Safari in Rajaji Tiger Reserve. Explore Asian Elephant corridors, Bengal Tiger habitats, grasslands, and scenic watchtowers near Haridwar and Rishikesh.",
    },
    {
      slug: "ranipur-gate-jeep-safari",
      name: "Haridwar Zone / Ranipur Gate",
      tag: "Prime Leopard Safari Closest to Haridwar",
      entryGate: "Ranipur Gate (Near BHEL Township, Haridwar)",
      gypsyCost: "₹3,500 per Gypsy (Up to 6 persons)",
      duration: "Approx. 2 Hours",
      routeKm: "Approx. 25 km Safari Route",
      openSeason: "15 November to 15 June",
      timings: "Morning: 6:00 AM – 8:00 AM | Afternoon: 1:30 PM – 4:30 PM",
      description: "Ranipur Gate is the nearest safari gate to Haridwar city (approx. 9 km from Haridwar Railway Station). Known as a premier Leopard safari zone, Ranipur traverses undulating Shivalik hills, dry deciduous forest tracks, and seasonal gravel stream beds. It is ideal for visitors staying in Haridwar looking for a convenient morning or evening wildlife safari.",
      landscape: "Shivalik foothills, dry mixed deciduous forests, pebble riverbeds, and small scenic ridges.",
      highlights: [
        "Closest gate to Haridwar Railway Station (9 km)",
        "Famous for Leopard tracking and nocturnal predator sightings",
        "Undulating terrain with seasonal river crossings",
        "Excellent birdwatching along forest streams",
      ],
      wildlife: ["Leopard", "Spotted Deer", "Barking Deer", "Wild Boar", "Sambar", "Langur", "Peafowl", "Jungle Fowl"],
      seoTitle: "Rajaji National Park Jeep Safari | Ranipur Gate, Haridwar",
      metaDescription: "Experience Rajaji Jeep Safari from Ranipur Gate near Haridwar. High leopard encounter rates, picturesque Shivalik foothills, and convenient city access.",
    },
    {
      slug: "chillawali-jeep-safari",
      name: "Chillawali Zone / Mohand Gate",
      tag: "Peaceful Forest & Leopard Safari on Dehradun Highway",
      entryGate: "Mohand Gate (Dehradun – Saharanpur Highway)",
      gypsyCost: "₹3,500 per Gypsy (Up to 6 persons)",
      duration: "Approx. 2.5 Hours",
      routeKm: "Approx. 22 km Route",
      openSeason: "15 November to 15 June",
      timings: "Morning: 6:00 AM – 8:00 AM | Afternoon: 1:30 PM – 4:30 PM",
      description: "Accessed via Mohand Gate on the Dehradun–Saharanpur highway, Chillawali Zone offers an uncrowded, tranquil wilderness experience. Characterized by steep sandstone cliffs, dry deciduous trees, and lush ravines, Chillawali is a renowned stronghold for Leopards, Barking Deer, and diverse raptors.",
      landscape: "Rugged Shivalik gorges, mixed deciduous woods, and quiet dry river washes.",
      highlights: [
        "Tranquil and uncrowded safari experience",
        "High leopard density and steep gorge lookouts",
        "Convenient access for travellers arriving from Dehradun or Delhi via Saharanpur",
        "Spectacular geology of the Shivalik rock formations",
      ],
      wildlife: ["Leopard", "Barking Deer (Kakar)", "Asian Elephant", "Wild Boar", "Rhesus Macaque", "Crested Serpent Eagle"],
      seoTitle: "Chillawali Jeep Safari | Mohand Gate Leopard Safari – Rajaji",
      metaDescription: "Book Chillawali Jeep Safari through Mohand Gate. Enjoy a secluded wildlife safari with leopards, elephants, and breathtaking Shivalik gorges.",
    },
    {
      slug: "motichur-jeep-safari",
      name: "Motichur Safari Zone",
      tag: "Historic Wildlife Sanctuary & Ancient Sal Forest",
      entryGate: "Motichur Gate (Raiwala, Haridwar-Rishikesh Highway)",
      gypsyCost: "₹3,500 per Gypsy (Up to 6 persons)",
      duration: "Approx. 2.5 to 3 Hours",
      routeKm: "Approx. 25 km Circuit",
      openSeason: "15 November to 15 June",
      timings: "Morning: 6:00 AM – 8:00 AM | Afternoon: 1:30 PM – 4:30 PM",
      description: "Motichur was established as a wildlife sanctuary in 1935 before being merged into Rajaji National Park. Situated midway between Haridwar and Rishikesh near Raiwala, Motichur features towering Sal canopies, broad streams, and perennial waterholes. It is an exceptional sanctuary for large Asian Elephant herds, Spotted Deer, and vibrant forest birdlife.",
      landscape: "Dense primeval Sal forests, riverine riverbeds, and lush seasonal stream valleys.",
      highlights: [
        "Centrally located between Haridwar and Rishikesh at Raiwala",
        "Historic sanctuary with massive century-old Sal trees",
        "Prime elephant herd gatherings at forest waterholes",
        "Over 180 recorded avian species including Woodpeckers and Barbets",
      ],
      wildlife: ["Asian Elephant", "Spotted Deer", "Sambar", "Wild Boar", "Leopard", "Langur", "Hornbills", "Woodpeckers"],
      seoTitle: "Motichur Jeep Safari | Motichur Zone – Rajaji National Park",
      metaDescription: "Book Motichur Jeep Safari in Rajaji Tiger Reserve. Explore ancient Sal forests, Asian Elephant herds, and diverse wildlife midway between Haridwar and Rishikesh.",
    },
    {
      slug: "jhilmil-jheel-safari",
      name: "Jhilmil Jheel Safari & Conservation Reserve",
      tag: "Wetland Sanctuary – Only Swamp Deer (Barasingha) Habitat",
      entryGate: "Jhilmil Gate (Near Haridwar)",
      gypsyCost: "₹3,500 per Gypsy (Up to 6 persons)",
      duration: "Approx. 3 Hours",
      routeKm: "Approx. 20 km Wetland Trail",
      openSeason: "15 October to 30 June",
      timings: "15 Oct – 31 Jan: 7:00 AM – 10:00 AM & 2:00 PM – 4:30 PM | 1 Feb – 31 Mar: 6:30 AM – 9:00 AM & 2:30 PM – 4:30 PM | 1 Apr – 30 Jun: 6:00 AM – 9:00 AM & 3:00 PM – 5:00 PM",
      description: "Jhilmil Jheel is a 3,783-hectare saucershaped wetland and conservation reserve located along the Ganges riverbank in Haridwar district. It is globally famous as the only habitat of the endangered Swamp Deer (Barasingha) in Uttarakhand. With rich marshes, tall grassland, and riverine forests, it is an international hotspot for winter migratory waterfowl and wetland birding.",
      landscape: "Wetland oxbow marshes, tall riverine elephant grasslands, and mixed moist deciduous forest.",
      highlights: [
        "Exclusive home of the endangered Swamp Deer (Barasingha)",
        "Over 220 species of resident and migratory waterfowl",
        "Extended safari season: Open from 15 October to 30 June",
        "Unique wetland ecosystem contrasting with typical Sal hill forests",
      ],
      wildlife: ["Swamp Deer (Barasingha)", "Asian Elephant", "Cheetal", "Sambar", "Wild Boar", "Otter", "Migratory Ducks", "Pallas's Fish Eagle"],
      seoTitle: "Jhilmil Jheel Safari | Rajaji National Park Wildlife & Birdwatching",
      metaDescription: "Book Jhilmil Jheel Safari near Haridwar. Discover rare Swamp Deer (Barasingha), lush wetlands, tall grasslands, elephants, and migratory birds in Uttarakhand.",
    },
    {
      slug: "gohri-range-safari",
      name: "Gohri Range Safari",
      tag: "Year-Round Wilderness Safari & Birding Paradise",
      entryGate: "Gohri Gate (Near Rishikesh / Vindhyawasini Temple)",
      gypsyCost: "₹3,500 per Gypsy (Up to 6 persons)",
      duration: "Approx. 2.5 Hours",
      routeKm: "Approx. 28 km Circuit",
      openSeason: "Open Year-Round (Closed only in August & September)",
      timings: "Morning: 6:00 AM – 9:00 AM | Afternoon: 2:00 PM – 5:30 PM",
      description: "Gohri Range is the buffer landscape of Rajaji Tiger Reserve situated across the river from Rishikesh and Haridwar. Uniquely, Gohri Range remains open for wildlife safaris throughout the year except during the heavy monsoon months of August and September. Its peaceful hill valleys and mountain streams make it a haven for nature lovers and birdwatchers.",
      landscape: "Shivalik river valleys, foothill scrub, Song river tributaries, and dense buffer woods.",
      highlights: [
        "Open year-round (except August & September)",
        "Closest safari range to Rishikesh yoga centres and river resorts",
        "Vindhyawasini temple circuit and tranquil river views",
        "Pristine birding territory with minimal vehicular interference",
      ],
      wildlife: ["Leopard", "Asian Elephant", "Spotted Deer", "Barking Deer", "Himalayan Black Bear", "Kingfisher", "Hornbill"],
      seoTitle: "Gohri Range Jungle Safari | Year-Round Safari Near Rishikesh",
      metaDescription: "Experience Gohri Range Jungle Safari in Rajaji Tiger Reserve. Open year-round near Rishikesh with magnificent wildlife, elephant trails, and tranquil birding.",
    },
    {
      slug: "chaurasi-kutiya-beatles-ashram",
      name: "Chaurasi Kutiya – Beatles Ashram",
      tag: "Historic 1968 Ashram, Meditation Caves & Forest Heritage",
      entryGate: "Swargashram, Rishikesh (Rajaji Reserve Boundary)",
      gypsyCost: "Entry Ticket: ₹150 Indian / ₹600 Foreigner (Walking tour)",
      duration: "2 to 3 Hours Self-Guided / Guided Walk",
      routeKm: "Sprawling 14-acre forested ashram complex",
      openSeason: "Open Daily Throughout the Year (10:00 AM – 4:00 PM)",
      timings: "Daily: 10:00 AM – 4:00 PM",
      description: "Chaurasi Kutiya, internationally celebrated as the Beatles Ashram, is a legendary spiritual and historical attraction located inside the boundary of Rajaji Tiger Reserve in Rishikesh. In February 1968, the British rock band The Beatles visited this ashram founded by Maharishi Mahesh Yogi to practise Transcendental Meditation, composing over 40 songs here including most of the White Album.",
      landscape: "Lush forested cliffs overlooking the Ganges, 84 stone meditation huts (kutiyas), lecture halls, and vibrant graffiti murals.",
      highlights: [
        "Historical meditation huts (Chaurasi Kutiya) built with natural Ganga stones",
        "Famous Beatles Cathedral and Ved Bhavan adorned with stunning global murals",
        "Panoramic river views of the sacred Ganges and Rishikesh valley",
        "Rare blend of rock music history, transcendental meditation, and tiger reserve wildlife",
      ],
      wildlife: ["Hanuman Langur", "Rhesus Macaque", "Peafowl", "Himalayan Bulbul", "Great Barbet", "Butterflies"],
      seoTitle: "Chaurasi Kutiya – Beatles Ashram | Rishikesh & Rajaji Heritage",
      metaDescription: "Explore Chaurasi Kutiya (The Beatles Ashram) in Rishikesh at Rajaji National Park. Tour the 84 meditation huts, vibrant graffiti art, and legendary 1968 Beatles history.",
    },
  ]);

  // 4. Park Rules & Do's / Don'ts (From Rajaji Safari Terms & Conditions.docx)
  doc.set("parkRules", {
    overview: "To safeguard the wild Asian Elephants, Bengal Tigers, and delicate forest ecosystem, all visitors and drivers must strictly adhere to the following Wildlife Protection guidelines.",
    dos: [
      { title: "Obtain Valid Permits Before Entry", desc: "Obtain the required permits before entering the Park and strictly follow all Forest Department rules and regulations." },
      { title: "Use an Authorised Nature Guide", desc: "Use the services of an authorised Nature Guide. Trained guides assist with wildlife sightings, interpretation and safe navigation through the forest." },
      { title: "Drive Slowly and Carefully", desc: "A slow and quiet safari allows you to observe wildlife and enjoy the natural surroundings without causing disturbance." },
      { title: "Stay on Designated Roads", desc: "Stay on designated roads and safari trails. Do not drive off-track, as this damages vegetation and disturbs resting animals." },
      { title: "Maintain Safe Distance from Wildlife", desc: "Respect wild animals and maintain a safe, respectful distance. Remember that the forest is their natural home." },
      { title: "Keep Noise to an Absolute Minimum", desc: "Switch off stereos and avoid loud conversations to enjoy the natural sounds and improve chances of observing wildlife." },
      { title: "Wear Natural or Subdued Colours", desc: "Wear khaki, olive green, or earthy tones. Bright colours like white and neon red may disturb or attract wild animals." },
      { title: "Carry Binoculars and Camera", desc: "Carry a camera and binoculars to enjoy and photograph wildlife responsibly without disturbing animal behavior." },
    ],
    donts: [
      { title: "No Firearms or Weapons", desc: "Do not carry firearms, weapons, or other prohibited items into the Park." },
      { title: "No Smoking or Fires", desc: "Do not smoke or light fires inside the forest. Even a small accidental spark can cause catastrophic damage." },
      { title: "Never Exit the Vehicle", desc: "Do not get out of your safari vehicle except at officially designated watchtowers and permitted rest locations." },
      { title: "Never Feed or Tease Wildlife", desc: "Do not feed, chase, tease or attempt to attract wild animals under any circumstances." },
      { title: "Do Not Expect a Zoo", desc: "Rajaji is a natural, wild ecosystem. Enjoy its forests, rivers, grasslands, and landscapes alongside its wildlife." },
      { title: "No Tiger Disappointment", desc: "Wildlife sightings are natural and unpredictable. Every safari offers a unique chance to experience rare biodiversity." },
      { title: "Alcohol & Non-Veg Prohibited", desc: "Alcohol and non-vegetarian food are strictly not permitted inside the Park boundary." },
      { title: "Zero Plastic & Zero Litter", desc: "Carry all waste back with you, including plastics, wrappers, bottles, and cans. Dispose of them outside the reserve." },
      { title: "Do Not Alter Environment", desc: "Avoid plucking flowers, damaging plants, collecting natural stones or timber, or altering forest habitats." },
      { title: "No Honking or Speeding", desc: "Vehicle speed must never exceed 30 km/h. Blowing vehicle horns or playing music is strictly outlawed." },
    ],
  });

  // 5. Reptiles Section (From Sub-page - Reptiles of Rajaji.docx)
  doc.set("reptiles", {
    overview: "Rajaji Tiger Reserve in Uttarakhand supports a rich variety of reptiles associated with its forests, grasslands, rocky hillsides, and riverbeds. While reptile sightings require patience and quiet observation, the reserve provides critical habitats for apex reptiles including the King Cobra and Indian Rock Python.",
    species: [
      {
        name: "King Cobra",
        scientific: "Ophiophagus hannah",
        status: "Vulnerable",
        habitat: "Moist Sal forests, deep ravines and bamboo thickets",
        description: "The world's longest venomous snake, growing over 4 metres in length. Highly secretive and essential for controlling snake populations.",
      },
      {
        name: "Indian Rock Python",
        scientific: "Python molurus",
        status: "Near Threatened",
        habitat: "Rocky outcrops, marshes, hollow tree trunks and riverbanks",
        description: "A massive non-venomous constrictor often observed basking in the morning sun near watercourses and rocky crags during cooler months.",
      },
      {
        name: "Indian Cobra (Spectacled Cobra)",
        scientific: "Naja naja",
        status: "Protected (Schedule I)",
        habitat: "Forest fringes, open scrub and near waterholes",
        description: "One of India's iconic 'Big Four' snakes, identifiable by the distinctive spectacled marking on its hood.",
      },
      {
        name: "Common Krait",
        scientific: "Bungarus caeruleus",
        status: "Common",
        habitat: "Forest litter, grasslands and termite mounds",
        description: "Nocturnal venomous snake with dark blackish-blue scales banded with thin white crossbars.",
      },
      {
        name: "Bengal Monitor Lizard",
        scientific: "Varanus bengalensis",
        status: "Protected (Schedule I)",
        habitat: "Fallen logs, agricultural edges, river banks and tree hollows",
        description: "Large, robust terrestrial lizard frequently seen foraging along sunny forest tracks and rocky riverbeds.",
      },
      {
        name: "Yellow Monitor Lizard",
        scientific: "Varanus flavescens",
        status: "Endangered",
        habitat: "Wetland edges and riparian marshes of Jhilmil Jheel",
        description: "Specialized wetland monitor identifiable by its yellow-olive coloration, closely associated with marshes and seasonal swamps.",
      },
      {
        name: "Indian Star Tortoise & Pond Turtles",
        scientific: "Geochelone elegans / Pangshura sp.",
        status: "Vulnerable",
        habitat: "Forest scrub, river pools and tranquil streams",
        description: "Aquatic and terrestrial chelonians thriving in the unpolluted streams and wetland pools of Rajaji.",
      },
      {
        name: "Oriental Garden Lizard (Calotes)",
        scientific: "Calotes versicolor",
        status: "Common",
        habitat: "Bushes, tree trunks and forest edges",
        description: "Agile tree-dwelling lizard famous for the male's vibrant scarlet and yellow coloration during breeding season.",
      },
    ],
    seoTitle: "Reptiles of Rajaji Tiger Reserve | Snakes, Lizards & Wildlife",
    metaDescription: "Discover the reptiles of Rajaji Tiger Reserve, Uttarakhand. Learn about King Cobras, Indian Rock Pythons, Monitor Lizards, and safe wildlife viewing guidelines.",
  });

  doc.markModified("settings");
  doc.markModified("tickets");
  doc.markModified("safari");
  doc.markModified("parkRules");
  doc.markModified("reptiles");

  await doc.save();
  console.log("[update] Successfully updated MongoDB with all official client documentation details!");

  await disconnectDatabase();
  console.log("[update] Database disconnected. Done.");
}

run().catch((err) => {
  console.error("[update] Error:", err);
  process.exit(1);
});
