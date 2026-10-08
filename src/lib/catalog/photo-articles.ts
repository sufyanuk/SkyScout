/** Wikipedia articles whose lead photo represents each destination well; alternatives are tried in order. */
export const DESTINATION_ARTICLES: Record<string, string | string[]> = {
  DOH: "Museum of Islamic Art, Doha",
  DXB: "Burj Khalifa",
  AUH: "Sheikh Zayed Grand Mosque",
  MCT: "Sultan Qaboos Grand Mosque",
  CAI: "Giza pyramid complex",
  IST: "Hagia Sophia",
  TBS: "Narikala",
  GYD: "Flame Towers",
  LHR: "Tower Bridge",
  CDG: "Eiffel Tower",
  AMS: ["Canals of Amsterdam", "Rijksmuseum", "Amsterdam"],
  FCO: "Colosseum",
  BCN: "Sagrada Família",
  LIS: "Belém Tower",
  PRG: "Charles Bridge",
  ATH: "Acropolis of Athens",
  BOM: "Gateway of India",
  DEL: "India Gate",
  CMB: "Gangaramaya Temple",
  MLE: "Malé",
  KTM: "Boudhanath",
  BKK: "Wat Arun",
  HKT: "Phi Phi Islands",
  SIN: "Marina Bay Sands",
  KUL: ["Petronas Towers", "Kuala Lumpur Tower", "Kuala Lumpur"],
  DPS: "Tanah Lot",
  HKG: "Victoria Harbour",
  NRT: "Tokyo Tower",
  SYD: "Sydney Opera House",
  ZNZ: "Stone Town",
  CPT: "Table Mountain",
  JFK: "Statue of Liberty",
  LAX: "Hollywood Sign",
};

/** Candidate articles for a destination, best first. */
export const articlesFor = (code: string): string[] => [DESTINATION_ARTICLES[code] ?? []].flat();

export const hasPhoto = (code: string) => code in DESTINATION_ARTICLES;
