import { connectDatabase, disconnectDatabase } from "../config/db.js";
import { getContentDocument } from "../models/Content.js";

async function run() {
  console.log("[seedFullDynamic] Connecting to MongoDB Atlas...");
  await connectDatabase();

  const doc = await getContentDocument();

  // 1. FAQs (10 Official Client Questions & Answers)
  doc.set("faqs", {
    overview: "Find answers to frequently asked questions regarding Rajaji National Park Jeep Safari, ticket fees, vehicle permits, timings, gates, and booking guidelines.",
    items: [
      {
        q: "How much is the Rajaji National Park Jeep Safari?",
        a: "The Gypsy vehicle hire is ₹3,500 per vehicle (capacity up to 6 persons). In addition, mandatory Forest Department charges apply: Park Entry (₹150 Indian / ₹600 Foreigner per person), Vehicle Permit (₹250 Indian / ₹500 Foreigner per vehicle), and Mandatory Nature Guide (₹1,000 per Gypsy).",
        category: "Pricing & Tariffs",
      },
      {
        q: "What is the entry fee for Rajaji National Park?",
        a: "Park entry fee is ₹150 per person for Indian visitors and ₹600 per person for foreign nationals for designated safari zones (Chilla, Ranipur, Motichur, Chillawali). Jhilmil Zone entry is ₹200 per Indian visitor. Children above 11 years are charged full entry fee.",
        category: "Pricing & Tariffs",
      },
      {
        q: "How can I book a Rajaji Jeep Safari online?",
        a: "Booking is simple: choose your preferred safari date, morning or afternoon time slot, and safari zone. Provide the required identification details for all travellers (Aadhaar/Passport/Voter ID) and complete the booking request online or via our dedicated WhatsApp desk.",
        category: "Booking Procedure",
      },
      {
        q: "What are the Rajaji National Park safari timings?",
        a: "Safari shift timings operate seasonally: 15 Nov – 15 Feb: Morning 6:30 AM – 8:00 AM & Afternoon 1:30 PM – 3:00 PM. 16 Feb – 15 Apr: Morning 6:00 AM – 7:30 AM & Afternoon 2:00 PM – 3:30 PM. 16 Apr – 15 Jun: Morning 5:30 AM – 7:00 AM & Afternoon 3:00 PM – 4:30 PM. Visitors must arrive at least 20 minutes prior.",
        category: "Timings & Shifts",
      },
      {
        q: "What is the Jeep permit fee in Rajaji Tiger Reserve?",
        a: "The Forest Department vehicle entry permit is ₹250 per vehicle for Indian nationals and ₹500 per vehicle for foreign nationals, valid for one entry shift.",
        category: "Pricing & Tariffs",
      },
      {
        q: "How many people can travel in one Rajaji safari Jeep?",
        a: "Each authorised 4x4 Gypsy vehicle accommodates up to 6 visitors plus one certified Forest Department nature guide and driver.",
        category: "Vehicle & Capacity",
      },
      {
        q: "Which Rajaji safari zone is accessible from Haridwar?",
        a: "Ranipur Gate (Haridwar Zone) is the closest entry point, located just 9 km from Haridwar Railway Station and near BHEL township. Chilla Gate and Motichur Gate are also easily accessible within 12–15 km.",
        category: "Zones & Locations",
      },
      {
        q: "Can I book a Rajaji Jeep Safari from Rishikesh?",
        a: "Yes! Chilla Range Gate and Gohari Range Gate are directly across the river from Rishikesh (10–15 km), while the historic Chaurasi Kutiya (Beatles Ashram) is located directly at Swargashram in Rishikesh.",
        category: "Zones & Locations",
      },
      {
        q: "Is advance booking available for Rajaji National Park safari?",
        a: "Yes, advance booking is strongly recommended. The Forest Department enforces strict daily vehicle caps per zone to safeguard the wildlife corridors. Weekend and holiday slots fill rapidly.",
        category: "Booking Procedure",
      },
      {
        q: "Are wildlife sightings guaranteed during a Rajaji Jeep Safari?",
        a: "Rajaji is a protected, natural wilderness and not a zoo. Animal sightings depend on natural movement, season, temperature, and habitat conditions. While elephants, deer, and diverse birds are seen daily, tiger and leopard sightings are thrilling wild encounters that cannot be guaranteed.",
        category: "Wildlife & Sightings",
      },
    ],
  });

  // 2. Activities (4 Client Activities)
  doc.set("activities", {
    title: "Activities at Rajaji National Park",
    subtitle: "From adrenaline-fueled 4x4 jeep safaris and white-water rafting to peaceful birdwatching trails and secluded forest stays in the foothills of Uttarakhand.",
    items: [
      {
        title: "Jungle Safari / Jeep Safari",
        tagline: "4x4 Gypsy Wildlife Expeditions",
        slug: "/zones",
        desc: "Experience thrilling guided open 4x4 Gypsy safaris through 7 distinct ranges including Chilla, Motichur, Ranipur, Jhilmil Jheel, and Mohand to observe tigers, wild elephants, and leopards in their natural habitat.",
        image: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=1000&q=85",
        cta: "Explore Safari Zones",
      },
      {
        title: "Bird Watching",
        tagline: "400+ Avian Species & Expert Guides",
        slug: "/birds-of-rajaji-national-park",
        desc: "Explore prime Important Bird Area (IBA) river corridors and Sal canopies with specialised nature guides. Spot Great Hornbills, Crested Kingfishers, Pallas's Fish Eagles, and seasonal migratory waterfowl.",
        image: "https://images.unsplash.com/photo-1535083783855-76ae62b2914e?auto=format&fit=crop&w=1000&q=85",
        cta: "View Bird Watching Guide",
      },
      {
        title: "Stay in Rajaji",
        tagline: "Heritage Forest Rest Houses & Eco Cottages",
        slug: "/stay",
        desc: "Immerse yourself in nature by staying at historic British-era Forest Rest Houses (FRHs) or tranquil eco-resorts nestled amidst the pristine Shivalik foothills on the fringe of the reserve.",
        image: "https://images.unsplash.com/photo-1510312305653-8ed496efae75?auto=format&fit=crop&w=1000&q=85",
        cta: "View Accommodation Options",
      },
      {
        title: "River Rafting",
        tagline: "White-Water Adventures on the Ganges",
        slug: "/rafting",
        desc: "Navigate Grade II, III, and IV rapids along the scenic Ganges river gorges adjoining the northern boundary of Rajaji Tiger Reserve, led by certified river guides and rescue kayakers.",
        image: "https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=1000&q=85",
        cta: "View Rafting Stretches",
      },
    ],
  });

  // 3. Rafting Section
  doc.set("rafting", {
    title: "River Rafting in Rishikesh & Rajaji",
    subtitle: "Navigate the roaring currents of the holy Ganges along the pristine foothills of Rajaji Tiger Reserve.",
    overview: "Experience world-class white-water rafting on the sacred Ganges river as it cuts through the Shivalik foothills on the northern fringe of Rajaji Tiger Reserve. Led by certified river guides, these expeditions offer heart-pumping rapids and serene gorge views.",
    stretches: [
      {
        name: "Shivpuri to Rishikesh",
        distance: "16 km Stretch",
        duration: "Approx. 3 to 3.5 Hours",
        rapids: "Grade II & III (Roller Coaster, Golf Course, Clubhouse)",
        level: "Moderate (Most Popular)",
        price: "₹1,000 – ₹1,200 per person",
        desc: "The classic white-water run navigating exhilarating class III rapids through scenic Shivalik gorges directly adjacent to the northern border of Rajaji Tiger Reserve.",
      },
      {
        name: "Marine Drive to Rishikesh",
        distance: "26 km Extended Run",
        duration: "Approx. 4.5 to 5 Hours",
        rapids: "Grade III & III+ (Three Blind Mice, Roller Coaster, Golf Course)",
        level: "Advanced / Adventurous",
        price: "₹1,500 – ₹1,800 per person",
        desc: "An extended river expedition featuring 10+ exciting rapids, calm swimming sections, body surfing, and stunning riverside cliff vistas.",
      },
      {
        name: "Brahmpuri to Rishikesh",
        distance: "9 km Introductory Run",
        duration: "Approx. 1.5 to 2 Hours",
        rapids: "Grade I & II (Sweet Fall, Initiation, Double Trouble)",
        level: "Beginner & Family Friendly",
        price: "₹600 – ₹800 per person",
        desc: "A gentle introductory rafting run ideal for families, first-timers, and children seeking scenic river time without extreme turbulence.",
      },
    ],
    safetyGuidelines: [
      "Life jackets, helmets, and safety paddles are mandatory and provided for every participant.",
      "Every expedition is accompanied by certified river rescue kayakers.",
      "Minimum age for white-water rafting is 14 years for Class III rapids; 10 years for Class I/II.",
      "Guests with heart ailments, asthma, or physical disabilities must declare conditions in advance.",
      "Zero alcohol or substance use before or during the river descent.",
    ],
  });

  // 4. Stay Section (Forest Rest Houses & Eco Retreats)
  doc.set("stay", {
    overview: "Experience authentic wilderness accommodation inside or on the boundaries of Rajaji Tiger Reserve, ranging from British colonial Forest Rest Houses (FRHs) to tranquil eco-resorts.",
    wildBrook: {
      name: "Wild Brook Retreat",
      tagline: "Eco-Cottages in Gohari Range Buffer",
      location: "Near Vindhyawasini Temple, Gohari Range, Rajaji Reserve",
      distance: "Approx. 24 km from Rishikesh / 30 km from Haridwar",
      phone: "+91 98298 50501",
      email: "jeepsafarirajajinationalpark@gmail.com",
      features: [
        "Stone & bamboo eco-cottages surrounded by Shivalik ridges",
        "Direct access to Gohari Range year-round buffer safari",
        "Birdwatching trails with over 150 resident species",
        "Organic local Garhwali dining and evening bonfire talks",
      ],
    },
    forestRestHouses: [
      {
        name: "Chilla Forest Rest House",
        suites: "4 Suites",
        status: "Heritage (EST. 1886)",
        gate: "Chilla Gate (Core Zone)",
        setting: "Overlooking the Ganges canal and sprawling elephant grasslands",
      },
      {
        name: "Motichur Forest Rest House",
        suites: "2 Suites",
        status: "Heritage (EST. 1930s)",
        gate: "Motichur Gate (Raiwala)",
        setting: "Nestled beneath century-old Sal canopies near natural waterholes",
      },
      {
        name: "Kunao Forest Rest House",
        suites: "2 Suites",
        status: "Secluded Jungle Lodge",
        gate: "Between Chilla & Rishikesh",
        setting: "Tranquil foothill setting famous for nocturnal leopard calls",
      },
      {
        name: "Ranipur Forest Rest House",
        suites: "2 Suites",
        status: "Heritage Outpost",
        gate: "Ranipur Gate (Haridwar)",
        setting: "Bordering dry deciduous Shivalik hills and seasonal riverbeds",
      },
    ],
    frhBookingInfo: {
      authority: "Director, Rajaji Tiger Reserve / Forest Department Uttarakhand",
      address: "5/1 Ansari Road, Dehradun / Chilla Range Headquarters",
      phone: "+91 98298 50501",
      fax: "N/A",
      bookingRule: "FRH accommodation requires advance application and approval by the Forest Department. All permits are subject to forest availability and government protocol.",
    },
  });

  // Mark all modified
  doc.markModified("faqs");
  doc.markModified("activities");
  doc.markModified("rafting");
  doc.markModified("stay");

  await doc.save();
  console.log("[seedFullDynamic] Successfully saved faqs, activities, rafting, and stay to MongoDB Atlas!");

  await disconnectDatabase();
  console.log("[seedFullDynamic] Done.");
}

run().catch((err) => {
  console.error("[seedFullDynamic] Error:", err);
  process.exit(1);
});
