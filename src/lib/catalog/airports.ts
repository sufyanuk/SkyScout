import type { Airport } from "@/lib/flights/types";

/**
 * Airports SkyScout knows about. A real provider would expose many more via a
 * location-search endpoint; this static list keeps the mock provider and the
 * airport pickers fast and dependency-free.
 */
export const AIRPORTS: Airport[] = [
  { code: "DOH", name: "Hamad International", city: "Doha", country: "Qatar", countryCode: "QA", lat: 25.273, lon: 51.608, timezone: "Asia/Qatar", utcOffset: 180, region: "middle-east" },
  { code: "DXB", name: "Dubai International", city: "Dubai", country: "United Arab Emirates", countryCode: "AE", lat: 25.253, lon: 55.364, timezone: "Asia/Dubai", utcOffset: 240, region: "middle-east" },
  { code: "AUH", name: "Zayed International", city: "Abu Dhabi", country: "United Arab Emirates", countryCode: "AE", lat: 24.433, lon: 54.651, timezone: "Asia/Dubai", utcOffset: 240, region: "middle-east" },
  { code: "MCT", name: "Muscat International", city: "Muscat", country: "Oman", countryCode: "OM", lat: 23.593, lon: 58.284, timezone: "Asia/Muscat", utcOffset: 240, region: "middle-east" },
  { code: "CAI", name: "Cairo International", city: "Cairo", country: "Egypt", countryCode: "EG", lat: 30.122, lon: 31.406, timezone: "Africa/Cairo", utcOffset: 120, region: "africa" },
  { code: "IST", name: "Istanbul Airport", city: "Istanbul", country: "Türkiye", countryCode: "TR", lat: 41.275, lon: 28.752, timezone: "Europe/Istanbul", utcOffset: 180, region: "europe" },
  { code: "TBS", name: "Tbilisi International", city: "Tbilisi", country: "Georgia", countryCode: "GE", lat: 41.669, lon: 44.955, timezone: "Asia/Tbilisi", utcOffset: 240, region: "caucasus" },
  { code: "GYD", name: "Heydar Aliyev International", city: "Baku", country: "Azerbaijan", countryCode: "AZ", lat: 40.467, lon: 50.047, timezone: "Asia/Baku", utcOffset: 240, region: "caucasus" },
  { code: "LHR", name: "Heathrow", city: "London", country: "United Kingdom", countryCode: "GB", lat: 51.47, lon: -0.454, timezone: "Europe/London", utcOffset: 0, region: "europe" },
  { code: "CDG", name: "Charles de Gaulle", city: "Paris", country: "France", countryCode: "FR", lat: 49.009, lon: 2.548, timezone: "Europe/Paris", utcOffset: 60, region: "europe" },
  { code: "AMS", name: "Schiphol", city: "Amsterdam", country: "Netherlands", countryCode: "NL", lat: 52.31, lon: 4.768, timezone: "Europe/Amsterdam", utcOffset: 60, region: "europe" },
  { code: "FCO", name: "Fiumicino", city: "Rome", country: "Italy", countryCode: "IT", lat: 41.8, lon: 12.239, timezone: "Europe/Rome", utcOffset: 60, region: "europe" },
  { code: "BCN", name: "El Prat", city: "Barcelona", country: "Spain", countryCode: "ES", lat: 41.297, lon: 2.078, timezone: "Europe/Madrid", utcOffset: 60, region: "europe" },
  { code: "LIS", name: "Humberto Delgado", city: "Lisbon", country: "Portugal", countryCode: "PT", lat: 38.774, lon: -9.134, timezone: "Europe/Lisbon", utcOffset: 0, region: "europe" },
  { code: "PRG", name: "Václav Havel", city: "Prague", country: "Czechia", countryCode: "CZ", lat: 50.101, lon: 14.26, timezone: "Europe/Prague", utcOffset: 60, region: "europe" },
  { code: "ATH", name: "Athens International", city: "Athens", country: "Greece", countryCode: "GR", lat: 37.936, lon: 23.944, timezone: "Europe/Athens", utcOffset: 120, region: "europe" },
  { code: "BOM", name: "Chhatrapati Shivaji Maharaj", city: "Mumbai", country: "India", countryCode: "IN", lat: 19.089, lon: 72.866, timezone: "Asia/Kolkata", utcOffset: 330, region: "south-asia" },
  { code: "DEL", name: "Indira Gandhi International", city: "Delhi", country: "India", countryCode: "IN", lat: 28.556, lon: 77.1, timezone: "Asia/Kolkata", utcOffset: 330, region: "south-asia" },
  { code: "CMB", name: "Bandaranaike International", city: "Colombo", country: "Sri Lanka", countryCode: "LK", lat: 7.18, lon: 79.884, timezone: "Asia/Colombo", utcOffset: 330, region: "south-asia" },
  { code: "MLE", name: "Velana International", city: "Malé", country: "Maldives", countryCode: "MV", lat: 4.192, lon: 73.529, timezone: "Indian/Maldives", utcOffset: 300, region: "south-asia" },
  { code: "KTM", name: "Tribhuvan International", city: "Kathmandu", country: "Nepal", countryCode: "NP", lat: 27.697, lon: 85.359, timezone: "Asia/Kathmandu", utcOffset: 345, region: "south-asia" },
  { code: "BKK", name: "Suvarnabhumi", city: "Bangkok", country: "Thailand", countryCode: "TH", lat: 13.69, lon: 100.75, timezone: "Asia/Bangkok", utcOffset: 420, region: "southeast-asia" },
  { code: "HKT", name: "Phuket International", city: "Phuket", country: "Thailand", countryCode: "TH", lat: 8.113, lon: 98.317, timezone: "Asia/Bangkok", utcOffset: 420, region: "southeast-asia" },
  { code: "SIN", name: "Changi", city: "Singapore", country: "Singapore", countryCode: "SG", lat: 1.364, lon: 103.991, timezone: "Asia/Singapore", utcOffset: 480, region: "southeast-asia" },
  { code: "KUL", name: "Kuala Lumpur International", city: "Kuala Lumpur", country: "Malaysia", countryCode: "MY", lat: 2.746, lon: 101.71, timezone: "Asia/Kuala_Lumpur", utcOffset: 480, region: "southeast-asia" },
  { code: "DPS", name: "Ngurah Rai International", city: "Bali", country: "Indonesia", countryCode: "ID", lat: -8.748, lon: 115.167, timezone: "Asia/Makassar", utcOffset: 480, region: "southeast-asia" },
  { code: "HKG", name: "Hong Kong International", city: "Hong Kong", country: "Hong Kong SAR", countryCode: "HK", lat: 22.308, lon: 113.918, timezone: "Asia/Hong_Kong", utcOffset: 480, region: "east-asia" },
  { code: "NRT", name: "Narita International", city: "Tokyo", country: "Japan", countryCode: "JP", lat: 35.772, lon: 140.393, timezone: "Asia/Tokyo", utcOffset: 540, region: "east-asia" },
  { code: "SYD", name: "Kingsford Smith", city: "Sydney", country: "Australia", countryCode: "AU", lat: -33.946, lon: 151.177, timezone: "Australia/Sydney", utcOffset: 600, region: "oceania" },
  { code: "ZNZ", name: "Abeid Amani Karume", city: "Zanzibar", country: "Tanzania", countryCode: "TZ", lat: -6.222, lon: 39.225, timezone: "Africa/Dar_es_Salaam", utcOffset: 180, region: "africa" },
  { code: "CPT", name: "Cape Town International", city: "Cape Town", country: "South Africa", countryCode: "ZA", lat: -33.965, lon: 18.602, timezone: "Africa/Johannesburg", utcOffset: 120, region: "africa" },
  { code: "JFK", name: "John F. Kennedy International", city: "New York", country: "United States", countryCode: "US", lat: 40.641, lon: -73.778, timezone: "America/New_York", utcOffset: -300, region: "north-america" },
  { code: "LAX", name: "Los Angeles International", city: "Los Angeles", country: "United States", countryCode: "US", lat: 33.942, lon: -118.408, timezone: "America/Los_Angeles", utcOffset: -480, region: "north-america" },
];

const BY_CODE = new Map(AIRPORTS.map((a) => [a.code, a]));

export function getAirport(code: string | null | undefined): Airport | undefined {
  if (!code) return undefined;
  return BY_CODE.get(code.toUpperCase());
}

export function isAirportCode(code: string | null | undefined): boolean {
  return !!getAirport(code);
}

/** Airports offered as quick "popular origin" chips. */
export const POPULAR_ORIGINS = ["DOH", "DXB", "AUH", "LHR", "JFK", "SIN", "BOM"];

export const DEFAULT_ORIGIN = "DOH";

/** Lightweight shape sent to client-side pickers. */
export type AirportOption = Pick<Airport, "code" | "name" | "city" | "country">;

export const AIRPORT_OPTIONS: AirportOption[] = AIRPORTS.map(({ code, name, city, country }) => ({
  code,
  name,
  city,
  country,
}));
