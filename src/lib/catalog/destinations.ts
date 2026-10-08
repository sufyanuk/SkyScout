/**
 * Editorial content for destination pages. Prices are never stored here —
 * they always come from the flight provider at request time.
 */

export type DestinationTag = "beach" | "city" | "culture" | "nature" | "food" | "nightlife" | "adventure";
export type ArtTheme = "beach" | "skyline" | "mountains" | "desert" | "island" | "oldtown";

export interface Itinerary {
  days: number;
  title: string;
  plan: string[];
}

export interface DestinationInfo {
  slug: string;
  airport: string;
  city: string;
  country: string;
  tagline: string;
  summary: string;
  tags: DestinationTag[];
  art: { theme: ArtTheme; from: string; to: string };
  bestMonths: number[];
  bestTimeNote: string;
  climate: string;
  currency: string;
  language: string;
  itineraries: Itinerary[];
  tips: string[];
  trending?: boolean;
}

export const DESTINATIONS: DestinationInfo[] = [
  {
    slug: "doha", airport: "DOH", city: "Doha", country: "Qatar",
    tagline: "Desert modernism on the Gulf",
    summary: "Doha pairs bold museums and a breezy corniche with old souqs and desert dunes an hour away. It's also one of the world's great connecting hubs, so stopovers are easy to stretch into a short break.",
    tags: ["city", "culture", "food"], art: { theme: "desert", from: "#f4a259", to: "#7c2d5b" },
    bestMonths: [11, 12, 1, 2, 3], bestTimeNote: "November to March brings warm, dry days and cool evenings.",
    climate: "Hot desert", currency: "Qatari riyal (QAR)", language: "Arabic, English widely spoken",
    itineraries: [
      { days: 2, title: "Stopover weekend", plan: ["Museum of Islamic Art and the corniche at sunset", "Souq Waqif dinner, then a dune drive to the Inland Sea"] },
      { days: 4, title: "Art and the desert", plan: ["National Museum and Msheireb", "Katara cultural village", "Overnight desert camp", "Pearl-Qatar marina brunch"] },
    ],
    tips: ["Dress modestly in souqs and public buildings.", "The metro links the airport to the city centre in about 20 minutes."],
  },
  {
    slug: "dubai", airport: "DXB", city: "Dubai", country: "United Arab Emirates",
    tagline: "Skyline thrills and creekside souqs",
    summary: "Dubai does spectacle well: record-breaking towers, beach clubs and malls, but also the creek, abras and spice souqs of the old town. Winter is peak season for a reason.",
    tags: ["city", "beach", "nightlife", "food"], art: { theme: "skyline", from: "#fbbf24", to: "#0e7490" },
    bestMonths: [11, 12, 1, 2, 3], bestTimeNote: "Mild winters from November to March; summers are very hot.",
    climate: "Hot desert", currency: "UAE dirham (AED)", language: "Arabic, English widely spoken",
    itineraries: [
      { days: 3, title: "First-timer's Dubai", plan: ["Downtown and an observation deck at dusk", "Al Fahidi, the creek and the gold souq", "Beach morning at Kite Beach"] },
      { days: 5, title: "City plus coast", plan: ["Dubai Marina walk", "Museum of the Future", "Desert safari", "Day trip to Abu Dhabi", "Jumeirah beach day"] },
    ],
    tips: ["The metro is cheap and air-conditioned.", "Friday brunch is a local institution — book ahead."],
  },
  {
    slug: "abu-dhabi", airport: "AUH", city: "Abu Dhabi", country: "United Arab Emirates",
    tagline: "Calm capital, grand architecture",
    summary: "Quieter than its neighbour, Abu Dhabi centres on the Sheikh Zayed Grand Mosque, the Louvre Abu Dhabi and long, uncrowded beaches on Saadiyat Island.",
    tags: ["culture", "beach", "city"], art: { theme: "desert", from: "#fde68a", to: "#0f766e" },
    bestMonths: [11, 12, 1, 2, 3], bestTimeNote: "November to March for comfortable sightseeing.",
    climate: "Hot desert", currency: "UAE dirham (AED)", language: "Arabic, English widely spoken",
    itineraries: [
      { days: 3, title: "Culture and coast", plan: ["Grand Mosque at golden hour", "Louvre Abu Dhabi", "Saadiyat beach day"] },
      { days: 5, title: "Island hopping", plan: ["Yas Island theme parks", "Mangrove kayaking", "Qasr Al Watan", "Liwa desert overnight", "Corniche cycling"] },
    ],
    tips: ["Shoulders and knees must be covered at the Grand Mosque.", "Taxis are metered and inexpensive."],
  },
  {
    slug: "muscat", airport: "MCT", city: "Muscat", country: "Oman",
    tagline: "Mountains meet the Arabian Sea",
    summary: "Muscat is low-rise and relaxed, wedged between rugged mountains and turquoise coves. It's a perfect short hop from the Gulf for wadis, forts and seafood by the harbour.",
    tags: ["nature", "culture", "beach", "adventure"], art: { theme: "mountains", from: "#fcd34d", to: "#0e7490" },
    bestMonths: [10, 11, 12, 1, 2, 3], bestTimeNote: "October to March for hiking and wadi swims.",
    climate: "Hot desert", currency: "Omani rial (OMR)", language: "Arabic, English widely spoken",
    itineraries: [
      { days: 3, title: "Long weekend", plan: ["Mutrah souq and corniche", "Sultan Qaboos Grand Mosque", "Boat trip to the Daymaniyat islands"] },
      { days: 6, title: "Road trip", plan: ["Wadi Shab swim", "Bimmah sinkhole", "Sur dhow yards", "Wahiba Sands camp", "Nizwa fort", "Jebel Akhdar terraces"] },
    ],
    tips: ["Renting a car is the best way to explore beyond the city.", "Many wadis require sturdy water shoes."],
    trending: true,
  },
  {
    slug: "cairo", airport: "CAI", city: "Cairo", country: "Egypt",
    tagline: "Pyramids, bazaars and the Nile",
    summary: "Chaotic and unforgettable, Cairo puts the Giza pyramids on the edge of a megacity of mosques, coffee houses and riverside feluccas.",
    tags: ["culture", "city", "food"], art: { theme: "desert", from: "#fcd34d", to: "#b45309" },
    bestMonths: [10, 11, 12, 1, 2, 3, 4], bestTimeNote: "October to April avoids the fierce summer heat.",
    climate: "Hot desert", currency: "Egyptian pound (EGP)", language: "Arabic",
    itineraries: [
      { days: 3, title: "Ancient highlights", plan: ["Giza plateau and the Sphinx", "Grand Egyptian Museum", "Khan el-Khalili and a felucca at sunset"] },
      { days: 6, title: "Cairo and beyond", plan: ["Islamic Cairo walk", "Saqqara and Dahshur", "Coptic Cairo", "Overnight train to Luxor", "Valley of the Kings", "Return flight"] },
    ],
    tips: ["Agree taxi fares up front or use a ride-hailing app.", "Start pyramid visits early to beat crowds and heat."],
  },
  {
    slug: "istanbul", airport: "IST", city: "Istanbul", country: "Türkiye",
    tagline: "Two continents, one great city",
    summary: "Istanbul straddles Europe and Asia across the Bosphorus. Byzantine domes, Ottoman palaces, ferry rides and some of the best street food anywhere make it a year-round favourite.",
    tags: ["culture", "food", "city", "nightlife"], art: { theme: "oldtown", from: "#fda4af", to: "#1e3a8a" },
    bestMonths: [4, 5, 6, 9, 10], bestTimeNote: "Spring and autumn are mild and less crowded.",
    climate: "Mediterranean", currency: "Turkish lira (TRY)", language: "Turkish",
    itineraries: [
      { days: 3, title: "Classic Istanbul", plan: ["Hagia Sophia, Blue Mosque and the Basilica Cistern", "Grand Bazaar and Spice Market", "Bosphorus ferry to Kadıköy for dinner"] },
      { days: 5, title: "Beyond the old city", plan: ["Topkapı Palace", "Balat and Fener street art", "Princes' Islands day trip", "Karaköy galleries", "Hammam and rooftop sunset"] },
    ],
    tips: ["Get an Istanbulkart for trams, ferries and the metro.", "Istanbul Airport is ~45 minutes from the old city."],
    trending: true,
  },
  {
    slug: "tbilisi", airport: "TBS", city: "Tbilisi", country: "Georgia",
    tagline: "Sulphur baths and supra feasts",
    summary: "Tbilisi is a lively mix of balconied old houses, natural-wine bars and sulphur bathhouses, with the Caucasus mountains a short drive away.",
    tags: ["culture", "food", "nature", "nightlife"], art: { theme: "mountains", from: "#fca5a5", to: "#4c1d95" },
    bestMonths: [5, 6, 9, 10], bestTimeNote: "Late spring and early autumn are ideal — and it's harvest season in October.",
    climate: "Humid subtropical", currency: "Georgian lari (GEL)", language: "Georgian",
    itineraries: [
      { days: 3, title: "City break", plan: ["Old Town and Narikala fortress", "Sulphur baths in Abanotubani", "Fabrika and a natural-wine bar crawl"] },
      { days: 6, title: "Wine and mountains", plan: ["Mtskheta monasteries", "Kazbegi and Gergeti Trinity Church", "Kakheti wineries", "Sighnaghi", "Dry Bridge market", "Food tour"] },
    ],
    tips: ["Many nationalities can visit visa-free — check before you fly.", "Bolt rides are cheap across the city."],
    trending: true,
  },
  {
    slug: "baku", airport: "GYD", city: "Baku", country: "Azerbaijan",
    tagline: "Flame towers on the Caspian",
    summary: "Baku blends a walled medieval old town with futuristic architecture and a long seaside boulevard. It's an easy, affordable long weekend from the Gulf.",
    tags: ["city", "culture", "food"], art: { theme: "skyline", from: "#fdba74", to: "#312e81" },
    bestMonths: [4, 5, 6, 9, 10], bestTimeNote: "Spring and autumn; winters are windy.",
    climate: "Semi-arid", currency: "Azerbaijani manat (AZN)", language: "Azerbaijani",
    itineraries: [
      { days: 3, title: "Old and new Baku", plan: ["Icherisheher old city and Maiden Tower", "Heydar Aliyev Center", "Seaside boulevard and Flame Towers at night"] },
      { days: 5, title: "Fire and mud", plan: ["Yanar Dag burning hillside", "Ateshgah fire temple", "Gobustan petroglyphs and mud volcanoes", "Carpet museum", "Day trip to Shamakhi"] },
    ],
    tips: ["Apply for an e-visa online before travel if required.", "The Baku Card covers metro and buses."],
  },
  {
    slug: "london", airport: "LHR", city: "London", country: "United Kingdom",
    tagline: "Big museums, small-plate dining",
    summary: "London's free museums, parks and theatre scene make it endlessly rewarding. Neighbourhoods from Shoreditch to South Bank each feel like a different city.",
    tags: ["city", "culture", "food", "nightlife"], art: { theme: "skyline", from: "#93c5fd", to: "#1e293b" },
    bestMonths: [5, 6, 7, 8, 9], bestTimeNote: "May to September for long days; December for festive markets.",
    climate: "Temperate oceanic", currency: "Pound sterling (GBP)", language: "English",
    itineraries: [
      { days: 3, title: "Essential London", plan: ["Westminster, the South Bank and Tate Modern", "British Museum and Covent Garden", "Borough Market and a West End show"] },
      { days: 6, title: "London like a local", plan: ["Hampstead Heath", "Columbia Road and Shoreditch", "Greenwich by river bus", "V&A and Hyde Park", "Day trip to Oxford", "Notting Hill"] },
    ],
    tips: ["Tap a contactless card for the Tube — daily fares are capped.", "The Elizabeth line links Heathrow to central London fast."],
  },
  {
    slug: "paris", airport: "CDG", city: "Paris", country: "France",
    tagline: "Boulevards, bistros and the Seine",
    summary: "Paris rewards wandering: café terraces, world-class galleries, markets and riverside walks. Shoulder seasons bring lower fares and softer light.",
    tags: ["city", "culture", "food"], art: { theme: "oldtown", from: "#c4b5fd", to: "#1e3a8a" },
    bestMonths: [4, 5, 6, 9, 10], bestTimeNote: "Spring and autumn are lovely and less busy than summer.",
    climate: "Temperate oceanic", currency: "Euro (EUR)", language: "French",
    itineraries: [
      { days: 3, title: "Paris in a long weekend", plan: ["Louvre and Tuileries", "Le Marais and Île Saint-Louis", "Montmartre and a Seine cruise"] },
      { days: 5, title: "Slow Paris", plan: ["Musée d'Orsay", "Canal Saint-Martin", "Versailles", "Latin Quarter bookshops", "Market morning and picnic"] },
    ],
    tips: ["Book major museums online to skip the queue.", "RER B connects CDG with the city centre."],
  },
  {
    slug: "amsterdam", airport: "AMS", city: "Amsterdam", country: "Netherlands",
    tagline: "Canals, bikes and golden-age art",
    summary: "Amsterdam is compact, walkable and best seen by bike. Rijksmuseum masterpieces, canal-side cafés and easy day trips to windmill villages fill any itinerary.",
    tags: ["city", "culture", "nightlife"], art: { theme: "oldtown", from: "#fdba74", to: "#155e75" },
    bestMonths: [4, 5, 6, 9], bestTimeNote: "April for tulips; September for fewer crowds.",
    climate: "Temperate oceanic", currency: "Euro (EUR)", language: "Dutch, English widely spoken",
    itineraries: [
      { days: 3, title: "Canal-side weekend", plan: ["Rijksmuseum and Vondelpark", "Jordaan and the Nine Streets", "Canal boat and NDSM wharf"] },
      { days: 5, title: "Dutch day trips", plan: ["Van Gogh Museum", "Zaanse Schans windmills", "Haarlem", "Keukenhof (spring)", "Utrecht"] },
    ],
    tips: ["Trains from Schiphol reach Centraal in 15 minutes.", "Watch for bikes — the red lanes are theirs."],
  },
  {
    slug: "rome", airport: "FCO", city: "Rome", country: "Italy",
    tagline: "Three thousand years, one espresso",
    summary: "Rome layers ancient ruins, baroque piazzas and Vatican treasures with trattorias on every corner. It's a city to walk, eat and repeat.",
    tags: ["culture", "food", "city"], art: { theme: "oldtown", from: "#fdba74", to: "#9a3412" },
    bestMonths: [4, 5, 6, 9, 10], bestTimeNote: "April–June and September–October are warm but not scorching.",
    climate: "Mediterranean", currency: "Euro (EUR)", language: "Italian",
    itineraries: [
      { days: 3, title: "Roman highlights", plan: ["Colosseum and Roman Forum", "Vatican Museums and St Peter's", "Trastevere dinner and the Trevi at night"] },
      { days: 6, title: "Rome and around", plan: ["Pantheon and Piazza Navona", "Borghese Gallery", "Appian Way by bike", "Day trip to Florence", "Ostia Antica", "Testaccio food tour"] },
    ],
    tips: ["Book Vatican and Borghese tickets well ahead.", "The Leonardo Express runs from FCO to Termini."],
  },
  {
    slug: "barcelona", airport: "BCN", city: "Barcelona", country: "Spain",
    tagline: "Gaudí, beaches and late dinners",
    summary: "Barcelona mixes modernist architecture, Gothic lanes and a city beach, all fuelled by tapas and vermouth. Evenings start late and run long.",
    tags: ["beach", "city", "food", "nightlife"], art: { theme: "beach", from: "#fde047", to: "#0369a1" },
    bestMonths: [5, 6, 9, 10], bestTimeNote: "May–June and September–October for beach weather without peak crowds.",
    climate: "Mediterranean", currency: "Euro (EUR)", language: "Catalan, Spanish",
    itineraries: [
      { days: 3, title: "Gaudí and the Gothic Quarter", plan: ["Sagrada Família and Passeig de Gràcia", "Gothic Quarter and El Born", "Barceloneta beach and Montjuïc sunset"] },
      { days: 5, title: "City and coast", plan: ["Park Güell", "Boqueria market", "Montserrat", "Sitges beach day", "Gràcia squares"] },
    ],
    tips: ["Book the Sagrada Família in advance.", "Dinner before 9pm is early by local standards."],
    trending: true,
  },
  {
    slug: "lisbon", airport: "LIS", city: "Lisbon", country: "Portugal",
    tagline: "Hills, trams and Atlantic light",
    summary: "Lisbon tumbles down seven hills to the Tagus. Tiled façades, custard tarts, fado bars and nearby surf beaches make it great value in Western Europe.",
    tags: ["city", "food", "beach", "culture"], art: { theme: "oldtown", from: "#fde68a", to: "#0e7490" },
    bestMonths: [4, 5, 6, 9, 10], bestTimeNote: "Spring and autumn are sunny and mild.",
    climate: "Mediterranean", currency: "Euro (EUR)", language: "Portuguese",
    itineraries: [
      { days: 3, title: "Lisbon highlights", plan: ["Alfama and São Jorge castle", "Belém tower and pastéis", "LX Factory and a sunset miradouro"] },
      { days: 5, title: "Lisbon and Sintra", plan: ["Tram 28 and Baixa", "Sintra palaces", "Cascais beach", "Time Out Market", "Fado night in Mouraria"] },
    ],
    tips: ["Wear grippy shoes — the cobbles are slippery.", "The metro reaches the airport directly."],
  },
  {
    slug: "prague", airport: "PRG", city: "Prague", country: "Czechia",
    tagline: "Fairytale spires, honest prices",
    summary: "Prague's medieval centre, castle and riverside beer gardens feel straight from a storybook — and it remains one of Europe's more affordable capitals.",
    tags: ["culture", "city", "nightlife"], art: { theme: "oldtown", from: "#fbcfe8", to: "#4c1d95" },
    bestMonths: [5, 6, 9, 12], bestTimeNote: "Late spring and September; December for Christmas markets.",
    climate: "Temperate continental", currency: "Czech koruna (CZK)", language: "Czech",
    itineraries: [
      { days: 3, title: "Old Town weekend", plan: ["Old Town Square and Charles Bridge", "Prague Castle and Malá Strana", "Vinohrady beer gardens"] },
      { days: 5, title: "Bohemian escape", plan: ["Jewish Quarter", "Vyšehrad", "Kutná Hora day trip", "Letná park views", "Český Krumlov"] },
    ],
    tips: ["Cross Charles Bridge at dawn for empty photos.", "Public transport tickets must be validated."],
  },
  {
    slug: "athens", airport: "ATH", city: "Athens", country: "Greece",
    tagline: "The Acropolis and island gateways",
    summary: "Athens is a gritty, creative capital crowned by the Acropolis — and the launch point for ferries to the Greek islands.",
    tags: ["culture", "food", "beach", "nightlife"], art: { theme: "island", from: "#bae6fd", to: "#1d4ed8" },
    bestMonths: [4, 5, 6, 9, 10], bestTimeNote: "April–June and September–October for warm seas and fewer crowds.",
    climate: "Mediterranean", currency: "Euro (EUR)", language: "Greek",
    itineraries: [
      { days: 3, title: "Ancient Athens", plan: ["Acropolis and its museum", "Plaka, Anafiotika and Monastiraki", "Cape Sounion sunset"] },
      { days: 7, title: "Athens and an island", plan: ["Ancient Agora", "Koukaki food crawl", "Ferry to Naxos", "Naxos beaches", "Village tour", "Return ferry", "Lycabettus Hill"] },
    ],
    tips: ["Visit the Acropolis at opening time.", "Island ferries sell out in August — book ahead."],
  },
  {
    slug: "mumbai", airport: "BOM", city: "Mumbai", country: "India",
    tagline: "Maximum city by the sea",
    summary: "Mumbai is fast, colourful and full of energy: colonial architecture, seaside promenades, Bollywood and an incredible street-food scene.",
    tags: ["city", "food", "culture", "nightlife"], art: { theme: "skyline", from: "#fdba74", to: "#9d174d" },
    bestMonths: [11, 12, 1, 2, 3], bestTimeNote: "November to February is dry and pleasant; June–September is monsoon.",
    climate: "Tropical", currency: "Indian rupee (INR)", language: "Marathi, Hindi, English",
    itineraries: [
      { days: 3, title: "Mumbai essentials", plan: ["Gateway of India and Colaba", "Kala Ghoda and Marine Drive at sunset", "Bandra cafés and street food"] },
      { days: 5, title: "Mumbai and caves", plan: ["Elephanta Caves", "Dhobi Ghat and Crawford Market", "Sanjay Gandhi park and Kanheri caves", "Juhu beach", "Day trip to Alibaug"] },
    ],
    tips: ["Avoid rush-hour local trains with luggage.", "Ride-hailing apps work well across the city."],
  },
  {
    slug: "delhi", airport: "DEL", city: "Delhi", country: "India",
    tagline: "Empires, bazaars and the Taj nearby",
    summary: "Delhi layers Mughal monuments, bustling Old Delhi bazaars and leafy New Delhi avenues, with Agra and Jaipur within easy reach.",
    tags: ["culture", "food", "city"], art: { theme: "oldtown", from: "#fda4af", to: "#7c2d12" },
    bestMonths: [10, 11, 2, 3], bestTimeNote: "October–November and February–March are the most comfortable.",
    climate: "Semi-arid", currency: "Indian rupee (INR)", language: "Hindi, English",
    itineraries: [
      { days: 3, title: "Delhi highlights", plan: ["Old Delhi, Jama Masjid and Chandni Chowk", "Humayun's Tomb and Lodhi Garden", "Qutub Minar and Hauz Khas"] },
      { days: 6, title: "Golden Triangle", plan: ["Delhi", "Train to Agra and the Taj Mahal at sunrise", "Fatehpur Sikri", "Jaipur's Amber Fort", "Jaipur bazaars", "Return to Delhi"] },
    ],
    tips: ["The Airport Express metro is the fastest way into town.", "Winter mornings can be smoggy — check air quality."],
  },
  {
    slug: "colombo", airport: "CMB", city: "Colombo", country: "Sri Lanka",
    tagline: "Gateway to an island of tea and surf",
    summary: "Colombo is a laid-back port city and the starting point for Sri Lanka's beaches, tea country and ancient cities — all within a few hours.",
    tags: ["beach", "nature", "culture", "food"], art: { theme: "beach", from: "#86efac", to: "#0f766e" },
    bestMonths: [12, 1, 2, 3, 4], bestTimeNote: "December to April for the west and south coasts.",
    climate: "Tropical", currency: "Sri Lankan rupee (LKR)", language: "Sinhala, Tamil, English",
    itineraries: [
      { days: 4, title: "Colombo and Galle", plan: ["Galle Face Green and Pettah market", "Train down the coast", "Galle Fort walls", "Unawatuna beach"] },
      { days: 8, title: "Island loop", plan: ["Colombo", "Sigiriya rock", "Dambulla caves", "Kandy", "Train to Ella", "Ella hikes", "Yala safari", "Mirissa"] },
    ],
    tips: ["Apply for the ETA online before you fly.", "The Kandy–Ella train sells reserved seats in advance."],
  },
  {
    slug: "maldives", airport: "MLE", city: "Malé", country: "Maldives",
    tagline: "Overwater dreams, closer than you think",
    summary: "The Maldives means coral atolls, lagoons and world-class snorkelling. Local-island guesthouses make it far more affordable than its reputation.",
    tags: ["beach", "nature"], art: { theme: "island", from: "#99f6e4", to: "#0369a1" },
    bestMonths: [12, 1, 2, 3, 4], bestTimeNote: "December to April is the dry season with calm seas.",
    climate: "Tropical", currency: "Maldivian rufiyaa (MVR); USD widely accepted", language: "Dhivehi, English",
    itineraries: [
      { days: 4, title: "Local-island escape", plan: ["Ferry to Maafushi", "Sandbank picnic and snorkelling", "Dolphin cruise", "Malé fish market"] },
      { days: 7, title: "Resort week", plan: ["Seaplane transfer", "House-reef snorkel", "Manta trip", "Spa day", "Sunset fishing", "Island hopping", "Return via Malé"] },
    ],
    tips: ["Alcohol is only served at resorts and liveaboards.", "Book seaplane transfers with your resort."],
    trending: true,
  },
  {
    slug: "kathmandu", airport: "KTM", city: "Kathmandu", country: "Nepal",
    tagline: "Temples at the foot of the Himalaya",
    summary: "Kathmandu's valley is packed with stupas, palace squares and prayer flags, and it's the jumping-off point for Himalayan treks and mountain flights.",
    tags: ["culture", "nature", "adventure"], art: { theme: "mountains", from: "#bfdbfe", to: "#3730a3" },
    bestMonths: [3, 4, 10, 11], bestTimeNote: "October–November for clear mountain views; March–April for rhododendrons.",
    climate: "Subtropical highland", currency: "Nepalese rupee (NPR)", language: "Nepali",
    itineraries: [
      { days: 4, title: "Valley heritage", plan: ["Boudhanath and Pashupatinath", "Patan Durbar Square", "Bhaktapur", "Nagarkot sunrise"] },
      { days: 9, title: "Trek taster", plan: ["Kathmandu", "Fly to Pokhara", "Ghorepani trek start", "Poon Hill sunrise", "Tadapani", "Ghandruk", "Return to Pokhara", "Phewa lake", "Back to Kathmandu"] },
    ],
    tips: ["Visas on arrival are available for many nationalities.", "Buy trekking permits through a registered agency."],
  },
  {
    slug: "bangkok", airport: "BKK", city: "Bangkok", country: "Thailand",
    tagline: "Temples, rooftops and night markets",
    summary: "Bangkok is a sensory overload in the best way: glittering temples, canal boats, rooftop bars and street food around every corner, at prices that stretch any budget.",
    tags: ["city", "food", "culture", "nightlife"], art: { theme: "skyline", from: "#fcd34d", to: "#be185d" },
    bestMonths: [11, 12, 1, 2], bestTimeNote: "November to February is cooler and dry.",
    climate: "Tropical", currency: "Thai baht (THB)", language: "Thai",
    itineraries: [
      { days: 3, title: "Bangkok blitz", plan: ["Grand Palace and Wat Pho", "Wat Arun by river ferry and Chinatown street food", "Chatuchak market and a rooftop bar"] },
      { days: 7, title: "Bangkok and the islands", plan: ["Old town temples", "Floating market day trip", "Ayutthaya", "Fly to Krabi", "Island-hopping boat", "Railay beach", "Return to Bangkok"] },
    ],
    tips: ["Use the BTS Skytrain to dodge traffic.", "Cover shoulders and knees at temples."],
    trending: true,
  },
  {
    slug: "phuket", airport: "HKT", city: "Phuket", country: "Thailand",
    tagline: "Andaman beaches and island days",
    summary: "Phuket is Thailand's biggest island, with beaches for every mood, a colourful old town and boat trips to Phi Phi and Phang Nga Bay.",
    tags: ["beach", "nature", "nightlife"], art: { theme: "beach", from: "#a7f3d0", to: "#0369a1" },
    bestMonths: [11, 12, 1, 2, 3, 4], bestTimeNote: "November to April for calm seas and sunshine.",
    climate: "Tropical", currency: "Thai baht (THB)", language: "Thai",
    itineraries: [
      { days: 4, title: "Beach break", plan: ["Kata beach and Big Buddha", "Phang Nga Bay by longtail", "Phuket Old Town", "Promthep Cape sunset"] },
      { days: 7, title: "Island-hopper", plan: ["Phuket", "Ferry to Phi Phi", "Maya Bay snorkel", "Ferry to Krabi", "Railay climbing", "Hong islands", "Back to Phuket"] },
    ],
    tips: ["Red-flag beaches mean dangerous currents.", "Book boat trips with licensed operators."],
  },
  {
    slug: "singapore", airport: "SIN", city: "Singapore", country: "Singapore",
    tagline: "Garden city, hawker heaven",
    summary: "Singapore is spotless, green and famously delicious — Michelin-starred hawker stalls, futuristic gardens and neighbourhoods from Chinatown to Kampong Glam.",
    tags: ["city", "food", "culture"], art: { theme: "skyline", from: "#6ee7b7", to: "#1e3a8a" },
    bestMonths: [2, 3, 4, 7, 8], bestTimeNote: "Warm year-round; February to April is the driest.",
    climate: "Tropical", currency: "Singapore dollar (SGD)", language: "English, Malay, Mandarin, Tamil",
    itineraries: [
      { days: 3, title: "Stopover Singapore", plan: ["Gardens by the Bay and Marina Bay", "Chinatown and Maxwell hawker centre", "Kampong Glam and Haji Lane"] },
      { days: 5, title: "Beyond the bay", plan: ["Botanic Gardens", "Sentosa", "Southern Ridges walk", "Little India", "Night safari"] },
    ],
    tips: ["Changi's Jewel is worth arriving early for.", "Tap a contactless card on the MRT."],
  },
  {
    slug: "kuala-lumpur", airport: "KUL", city: "Kuala Lumpur", country: "Malaysia",
    tagline: "Twin towers and night markets",
    summary: "KL is affordable, multicultural and full of great food — from Jalan Alor's night market to the Batu Caves and leafy hill escapes.",
    tags: ["city", "food", "culture"], art: { theme: "skyline", from: "#fca5a5", to: "#1e40af" },
    bestMonths: [1, 2, 6, 7, 8], bestTimeNote: "Hot year-round; mid-year tends to be drier.",
    climate: "Tropical", currency: "Malaysian ringgit (MYR)", language: "Malay, English",
    itineraries: [
      { days: 3, title: "KL in brief", plan: ["Petronas Towers and KLCC park", "Batu Caves and Little India", "Jalan Alor night market"] },
      { days: 6, title: "KL and Penang", plan: ["Merdeka Square", "Bukit Bintang", "Fly to Penang", "George Town street art", "Penang Hill", "Hawker crawl"] },
    ],
    tips: ["Grab is the easiest way to get around.", "The KLIA Ekspres reaches the city in 28 minutes."],
  },
  {
    slug: "bali", airport: "DPS", city: "Bali", country: "Indonesia",
    tagline: "Rice terraces, surf and temples",
    summary: "Bali has it all: surf beaches, jungle villas around Ubud, cliff-top temples and volcano sunrises — plus excellent value once you arrive.",
    tags: ["beach", "nature", "culture", "adventure"], art: { theme: "island", from: "#bbf7d0", to: "#166534" },
    bestMonths: [5, 6, 7, 8, 9], bestTimeNote: "May to September is the dry season.",
    climate: "Tropical", currency: "Indonesian rupiah (IDR)", language: "Indonesian, Balinese",
    itineraries: [
      { days: 5, title: "Bali sampler", plan: ["Seminyak beach", "Uluwatu temple and kecak dance", "Ubud monkey forest", "Tegallalang rice terraces", "Mount Batur sunrise"] },
      { days: 9, title: "Bali and Nusa islands", plan: ["Canggu", "Tanah Lot", "Ubud", "Sidemen valley", "Amed snorkelling", "Fast boat to Nusa Penida", "Kelingking beach", "Manta snorkel", "Jimbaran seafood"] },
    ],
    tips: ["A visa on arrival and tourist levy apply to most visitors.", "Traffic is slow — base yourself in two areas, not five."],
    trending: true,
  },
  {
    slug: "hong-kong", airport: "HKG", city: "Hong Kong", country: "Hong Kong SAR",
    tagline: "Harbour views and dim sum",
    summary: "Hong Kong packs skyscrapers, hiking trails, outlying islands and legendary dim sum into a compact, superbly connected city.",
    tags: ["city", "food", "nature", "nightlife"], art: { theme: "skyline", from: "#f9a8d4", to: "#312e81" },
    bestMonths: [10, 11, 12, 3, 4], bestTimeNote: "October to December is clear and comfortable.",
    climate: "Humid subtropical", currency: "Hong Kong dollar (HKD)", language: "Cantonese, English",
    itineraries: [
      { days: 3, title: "Harbour city", plan: ["Star Ferry and Victoria Peak", "Central, Sheung Wan and dim sum", "Temple Street night market"] },
      { days: 5, title: "City and islands", plan: ["Dragon's Back hike", "Lantau Big Buddha", "Tai O fishing village", "Lamma island seafood", "Sham Shui Po"] },
    ],
    tips: ["An Octopus card works on transit and in shops.", "The Airport Express reaches Central in 24 minutes."],
  },
  {
    slug: "tokyo", airport: "NRT", city: "Tokyo", country: "Japan",
    tagline: "Neon, nature and perfect noodles",
    summary: "Tokyo is endlessly fascinating — serene shrines beside neon crossings, tiny bars, huge parks and the best food scene on the planet.",
    tags: ["city", "food", "culture", "nightlife"], art: { theme: "skyline", from: "#fecdd3", to: "#4338ca" },
    bestMonths: [3, 4, 10, 11], bestTimeNote: "Late March–April for blossoms; October–November for autumn colour.",
    climate: "Humid subtropical", currency: "Japanese yen (JPY)", language: "Japanese",
    itineraries: [
      { days: 4, title: "First time in Tokyo", plan: ["Shibuya and Harajuku", "Asakusa and Senso-ji", "Tsukiji outer market and Ginza", "Shinjuku Golden Gai"] },
      { days: 8, title: "Tokyo and Kyoto", plan: ["Tokyo neighbourhoods", "teamLab and Odaiba", "Day trip to Nikko", "Shinkansen to Kyoto", "Fushimi Inari", "Arashiyama", "Nara", "Return to Tokyo"] },
    ],
    tips: ["Get a Suica card on your phone for trains.", "Narita is about an hour from the city by express train."],
  },
  {
    slug: "sydney", airport: "SYD", city: "Sydney", country: "Australia",
    tagline: "Harbour, beaches and bush walks",
    summary: "Sydney wraps one of the world's great harbours with ocean beaches, coastal walks and a relaxed outdoor café culture.",
    tags: ["beach", "city", "nature", "food"], art: { theme: "beach", from: "#fde68a", to: "#0284c7" },
    bestMonths: [9, 10, 11, 3, 4], bestTimeNote: "Spring (Sep–Nov) and autumn (Mar–May) are sunny and mild.",
    climate: "Humid subtropical", currency: "Australian dollar (AUD)", language: "English",
    itineraries: [
      { days: 4, title: "Sydney highlights", plan: ["Opera House and the Rocks", "Bondi to Coogee walk", "Ferry to Manly", "Blue Mountains day trip"] },
      { days: 7, title: "Coast and wine", plan: ["Harbour Bridge climb", "Surry Hills dining", "Royal National Park", "Hunter Valley wineries", "Palm Beach", "Taronga Zoo", "Newtown"] },
    ],
    tips: ["Most visitors need an ETA or eVisitor visa before arrival.", "Tap on and off with a contactless card."],
  },
  {
    slug: "zanzibar", airport: "ZNZ", city: "Zanzibar", country: "Tanzania",
    tagline: "Spice island on the Indian Ocean",
    summary: "Zanzibar mixes the winding alleys of Stone Town with powder-white beaches, spice farms and dhow sunsets.",
    tags: ["beach", "culture", "nature"], art: { theme: "island", from: "#fef08a", to: "#0e7490" },
    bestMonths: [6, 7, 8, 9, 12, 1, 2], bestTimeNote: "June–October and December–February are dry.",
    climate: "Tropical", currency: "Tanzanian shilling (TZS); USD widely accepted", language: "Swahili, English",
    itineraries: [
      { days: 4, title: "Stone Town and sand", plan: ["Stone Town walking tour", "Spice farm visit", "Nungwi beach", "Sunset dhow cruise"] },
      { days: 7, title: "Island circuit", plan: ["Stone Town", "Prison Island tortoises", "Jozani forest", "Paje kitesurfing", "Mnemba snorkelling", "Kendwa beach", "Forodhani food market"] },
    ],
    tips: ["Carry cash in USD for small vendors.", "Tides on the east coast change the beach dramatically."],
  },
  {
    slug: "cape-town", airport: "CPT", city: "Cape Town", country: "South Africa",
    tagline: "Table Mountain to the winelands",
    summary: "Cape Town is staggeringly scenic: a flat-topped mountain over the city, penguin beaches, the Cape Peninsula and world-class wineries an hour away.",
    tags: ["nature", "beach", "food", "adventure"], art: { theme: "mountains", from: "#fdba74", to: "#1e3a8a" },
    bestMonths: [11, 12, 1, 2, 3], bestTimeNote: "November to March is sunny, dry summer.",
    climate: "Mediterranean", currency: "South African rand (ZAR)", language: "English, Afrikaans, Xhosa",
    itineraries: [
      { days: 4, title: "Mountain and sea", plan: ["Table Mountain cable car", "Bo-Kaap and the V&A Waterfront", "Cape Point and Boulders penguins", "Camps Bay sunset"] },
      { days: 8, title: "Cape and Garden Route", plan: ["City day", "Robben Island", "Stellenbosch and Franschhoek", "Hermanus whales (in season)", "Garden Route drive", "Knysna", "Plettenberg Bay", "Return"] },
    ],
    tips: ["Book Robben Island tickets in advance.", "Use ride-hailing at night rather than walking."],
  },
  {
    slug: "new-york", airport: "JFK", city: "New York", country: "United States",
    tagline: "The city that never runs out of plans",
    summary: "New York is museums, Broadway, bagels, rooftop bars and neighbourhoods that each feel like a small city. Fares from the Gulf drop sharply in shoulder season.",
    tags: ["city", "culture", "food", "nightlife"], art: { theme: "skyline", from: "#fcd34d", to: "#1f2937" },
    bestMonths: [4, 5, 9, 10, 12], bestTimeNote: "Spring and autumn are ideal; December for festive lights.",
    climate: "Humid continental", currency: "US dollar (USD)", language: "English",
    itineraries: [
      { days: 4, title: "NYC essentials", plan: ["Central Park and the Met", "High Line, Chelsea Market and Hudson Yards", "Brooklyn Bridge and DUMBO", "Broadway show"] },
      { days: 7, title: "Five boroughs", plan: ["Lower Manhattan", "MoMA and Midtown", "Williamsburg", "Queens food tour", "Staten Island ferry", "Harlem", "Coney Island"] },
    ],
    tips: ["Most visitors need ESTA approval before flying.", "Tap to pay on subways and buses with OMNY."],
  },
  {
    slug: "los-angeles", airport: "LAX", city: "Los Angeles", country: "United States",
    tagline: "Sunshine, studios and taco trucks",
    summary: "LA sprawls from mountains to Pacific beaches. Hollywood, Venice, great museums and incredible food reward anyone with a car and a plan.",
    tags: ["beach", "city", "food"], art: { theme: "beach", from: "#fdba74", to: "#7e22ce" },
    bestMonths: [3, 4, 5, 9, 10, 11], bestTimeNote: "Spring and autumn are warm and sunny without summer haze.",
    climate: "Mediterranean", currency: "US dollar (USD)", language: "English",
    itineraries: [
      { days: 4, title: "LA highlights", plan: ["Griffith Observatory and Hollywood", "Getty Center", "Santa Monica and Venice", "Downtown Arts District"] },
      { days: 7, title: "SoCal road trip", plan: ["LA neighbourhoods", "Malibu", "Joshua Tree", "Palm Springs", "Laguna Beach", "San Diego", "Return to LA"] },
    ],
    tips: ["Rent a car — distances are large.", "Most visitors need ESTA approval before flying."],
  },
];

const BY_SLUG = new Map(DESTINATIONS.map((d) => [d.slug, d]));
const BY_AIRPORT = new Map(DESTINATIONS.map((d) => [d.airport, d]));

export function getDestination(slug: string): DestinationInfo | undefined {
  return BY_SLUG.get(slug);
}

export function getDestinationByAirport(code: string): DestinationInfo | undefined {
  return BY_AIRPORT.get(code.toUpperCase());
}

export const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
