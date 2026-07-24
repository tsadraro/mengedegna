// Ethiopian intercity transport data — operators, cities, amenities
// Used for search dropdowns and operator showcase

export const CITIES = [
  "Addis Ababa", "Bahir Dar", "Gondar", "Mekelle", "Hawassa", "Harar",
  "Arbaminch", "Jijiga", "Adama", "Dire Dawa", "Jimma", "Dessie", "Semera"
];

export const OPERATORS = [
  {
    name: "Selam Bus",
    klass: "luxury",
    est: "1996",
    fleet: "Scania & Marcopolo — 51 seats",
    desc: "Ethiopia's largest intercity network, operating since 1996 with modern Scania Marcopolo buses featuring full air conditioning and entertainment systems.",
    routes: "Mekelle, Bahir Dar, Gondar, Harar, Arbaminch",
    seats: "51 seats"
  },
  {
    name: "ODAA Integrated",
    klass: "luxury",
    est: "2018",
    fleet: "Volvo Marcopolo — 50+ buses",
    desc: "A 400-million-Birr fleet of ultra-modern Volvo buses delivering premium cross-country services across the highlands.",
    routes: "Mekelle, Gondar, Nekemte",
    seats: "49 seats"
  },
  {
    name: "Zemen Bus",
    klass: "luxury",
    est: "2012",
    fleet: "Golden Dragon — 2x2 reclining",
    desc: "Modern Golden Dragon coaches imported from China with free Wi-Fi, charging ports, and full entertainment on every journey.",
    routes: "Bahir Dar, Hawassa, Mekelle",
    seats: "45 seats"
  },
  {
    name: "Yegna Bus",
    klass: "luxury",
    est: "2018",
    fleet: "Luxury coaches",
    desc: "Premium operator with onboard chargers, toilets, Wi-Fi, and complimentary breakfast service on long-haul routes.",
    routes: "Mekelle, Gondar, Hawassa",
    seats: "47 seats"
  },
  {
    name: "Velocity Express",
    klass: "electric",
    est: "2024",
    fleet: "100 Golden Dragon electric buses",
    desc: "East Africa's largest electric bus project — 100% electric, zero emissions, leading the future of sustainable Ethiopian transport.",
    routes: "Various routes across Ethiopia",
    seats: "40 seats"
  },
  {
    name: "Golden Bus",
    klass: "established",
    est: "2016",
    fleet: "20+ luxury coaches",
    desc: "Luxury long-distance services connecting Addis Ababa to eastern and southern destinations since 2016.",
    routes: "Hawassa, Jijiga, Harar",
    seats: "45 seats"
  }
];

export const AMENITY_ICONS = {
  "Air Conditioning": "Wind",
  "Reclining Seats": "Armchair",
  "Entertainment": "Tv",
  "Safety Belts": "ShieldCheck",
  "Free Wi-Fi": "Wifi",
  "2x2 Reclining": "Armchair",
  "Charging Ports": "Plug",
  "Premium Seating": "Sparkles",
  "Wi-Fi": "Wifi",
  "Toilet": "Bath",
  "Breakfast": "Coffee",
  "Chargers": "Plug",
  "100% Electric": "Zap",
  "Zero Emissions": "Leaf",
  "Comfortable Seating": "Armchair"
};