import type { Airline } from "@/lib/flights/types";

/**
 * Carriers used by the mock provider. Names are real so the data feels
 * realistic; SkyScout shows them as neutral monograms, never airline logos.
 */
export const AIRLINES: Airline[] = [
  { code: "QR", name: "Qatar Airways", hubs: ["DOH"], priceFactor: 1.08, color: "#7c2d5b", alliance: "oneworld" },
  { code: "EK", name: "Emirates", hubs: ["DXB"], priceFactor: 1.1, color: "#b42318" },
  { code: "EY", name: "Etihad Airways", hubs: ["AUH"], priceFactor: 1.04, color: "#9a6b2f" },
  { code: "FZ", name: "flydubai", hubs: ["DXB"], lowCost: true, priceFactor: 0.78, color: "#1d4ed8" },
  { code: "G9", name: "Air Arabia", hubs: ["AUH"], lowCost: true, priceFactor: 0.72, color: "#c2410c" },
  { code: "WY", name: "Oman Air", hubs: ["MCT"], priceFactor: 0.98, color: "#0f766e" },
  { code: "TK", name: "Turkish Airlines", hubs: ["IST"], priceFactor: 0.96, color: "#be123c", alliance: "Star Alliance" },
  { code: "PC", name: "Pegasus Airlines", hubs: ["IST"], lowCost: true, priceFactor: 0.74, color: "#ca8a04" },
  { code: "MS", name: "EgyptAir", hubs: ["CAI"], priceFactor: 0.9, color: "#1e3a8a", alliance: "Star Alliance" },
  { code: "J2", name: "Azerbaijan Airlines", hubs: ["GYD"], priceFactor: 0.92, color: "#0369a1" },
  { code: "BA", name: "British Airways", hubs: ["LHR"], priceFactor: 1.12, color: "#1e40af", alliance: "oneworld" },
  { code: "AF", name: "Air France", hubs: ["CDG"], priceFactor: 1.06, color: "#1e3a8a", alliance: "SkyTeam" },
  { code: "KL", name: "KLM", hubs: ["AMS"], priceFactor: 1.04, color: "#0284c7", alliance: "SkyTeam" },
  { code: "AZ", name: "ITA Airways", hubs: ["FCO"], priceFactor: 1.0, color: "#047857", alliance: "SkyTeam" },
  { code: "VY", name: "Vueling", hubs: ["BCN"], lowCost: true, priceFactor: 0.75, color: "#a16207" },
  { code: "TP", name: "TAP Air Portugal", hubs: ["LIS"], priceFactor: 0.97, color: "#15803d", alliance: "Star Alliance" },
  { code: "A3", name: "Aegean Airlines", hubs: ["ATH"], priceFactor: 0.95, color: "#1d4ed8", alliance: "Star Alliance" },
  { code: "AI", name: "Air India", hubs: ["DEL", "BOM"], priceFactor: 0.93, color: "#b91c1c", alliance: "Star Alliance" },
  { code: "6E", name: "IndiGo", hubs: ["DEL", "BOM"], lowCost: true, priceFactor: 0.72, color: "#3730a3" },
  { code: "UL", name: "SriLankan Airlines", hubs: ["CMB"], priceFactor: 0.94, color: "#1e3a8a", alliance: "oneworld" },
  { code: "TG", name: "Thai Airways", hubs: ["BKK"], priceFactor: 0.98, color: "#6d28d9", alliance: "Star Alliance" },
  { code: "SQ", name: "Singapore Airlines", hubs: ["SIN"], priceFactor: 1.12, color: "#a16207", alliance: "Star Alliance" },
  { code: "MH", name: "Malaysia Airlines", hubs: ["KUL"], priceFactor: 0.95, color: "#1e40af", alliance: "oneworld" },
  { code: "AK", name: "AirAsia", hubs: ["KUL"], lowCost: true, priceFactor: 0.68, color: "#dc2626" },
  { code: "CX", name: "Cathay Pacific", hubs: ["HKG"], priceFactor: 1.08, color: "#0f766e", alliance: "oneworld" },
  { code: "JL", name: "Japan Airlines", hubs: ["NRT"], priceFactor: 1.1, color: "#b91c1c", alliance: "oneworld" },
  { code: "QF", name: "Qantas", hubs: ["SYD"], priceFactor: 1.1, color: "#be123c", alliance: "oneworld" },
  { code: "AA", name: "American Airlines", hubs: ["JFK", "LAX"], priceFactor: 1.05, color: "#475569", alliance: "oneworld" },
  { code: "DL", name: "Delta Air Lines", hubs: ["JFK", "LAX"], priceFactor: 1.06, color: "#9f1239", alliance: "SkyTeam" },
];

const BY_CODE = new Map(AIRLINES.map((a) => [a.code, a]));

export function getAirline(code: string): Airline | undefined {
  return BY_CODE.get(code.toUpperCase());
}

/** Airports that work as connecting hubs for one-stop itineraries. */
export const CONNECTING_HUBS = ["DOH", "DXB", "AUH", "IST", "LHR", "CDG", "AMS", "SIN", "BKK", "KUL", "HKG", "DEL", "MCT", "CAI", "JFK"];
