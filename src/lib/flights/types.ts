/**
 * Provider-agnostic flight domain types. Every FlightSearchProvider (mock or
 * real) maps its data into these shapes, so the UI never knows which provider
 * produced a result.
 */

export type IsoDate = string; // "YYYY-MM-DD"

export const CABINS = ["economy", "premium", "business", "first"] as const;
export type Cabin = (typeof CABINS)[number];

export const SORTS = ["best", "cheapest", "fastest", "value"] as const;
export type SortOption = (typeof SORTS)[number];

export const TIME_BUCKETS = ["night", "morning", "afternoon", "evening"] as const;
export type TimeBucket = (typeof TIME_BUCKETS)[number];

export const TRIP_LENGTHS = ["any", "weekend", "short", "week", "two-weeks", "custom"] as const;
export type TripLength = (typeof TRIP_LENGTHS)[number];

/** Flexible-date shortcuts offered next to the date pickers. */
/** "range" = depart any day inside a window (departure → departureEnd). */
export const WHEN_OPTIONS = ["exact", "flexible", "range", "anytime", "weekend", "next-month"] as const;
export type WhenOption = (typeof WHEN_OPTIONS)[number];

/** Self-transfer itineraries combine separate tickets on different airlines. */
export const TRANSFER_OPTIONS = ["include", "exclude", "only"] as const;
export type TransferOption = (typeof TRANSFER_OPTIONS)[number];

/** Bags each traveller wants; fares that don't include them get the fee added. */
export interface BagRequest {
  cabin: number;
  checked: number;
}

export type Region =
  | "middle-east"
  | "europe"
  | "south-asia"
  | "southeast-asia"
  | "east-asia"
  | "africa"
  | "north-america"
  | "oceania"
  | "caucasus";

export interface Airport {
  code: string;
  name: string;
  city: string;
  country: string;
  countryCode: string;
  lat: number;
  lon: number;
  /** IANA timezone, informational. */
  timezone: string;
  /** Standard-time UTC offset in minutes (DST is ignored by the mock provider). */
  utcOffset: number;
  region: Region;
}

export interface Airline {
  code: string;
  name: string;
  hubs: string[];
  lowCost?: boolean;
  /** 0.8 (budget) … 1.15 (premium) — nudges typical fares. */
  priceFactor: number;
  /** Brand-neutral badge colour used for the airline monogram. */
  color: string;
  alliance?: "oneworld" | "Star Alliance" | "SkyTeam";
}

export interface FlightSegment {
  flightNumber: string;
  airlineCode: string;
  from: string;
  to: string;
  /** Local wall-clock time at the departure airport, "YYYY-MM-DDTHH:mm". */
  departure: string;
  /** Local wall-clock time at the arrival airport. */
  arrival: string;
  durationMinutes: number;
  aircraft: string;
}

export interface Layover {
  airport: string;
  durationMinutes: number;
}

/** One direction of travel (outbound or return). */
export interface FlightSlice {
  from: string;
  to: string;
  departure: string;
  arrival: string;
  durationMinutes: number;
  stops: number;
  segments: FlightSegment[];
  layovers: Layover[];
}

export interface BaggageInfo {
  personalItem: boolean;
  /** Cabin bag allowance in kg (0 = none). */
  cabinKg: number;
  /** Number of included checked bags. */
  checkedBags: number;
  checkedKg: number;
}

export interface FareDetails {
  fareBrand: string;
  refundable: boolean;
  changeFee: number | null; // null = changes not permitted
  seatSelection: "free" | "paid";
  mealsIncluded: boolean;
}

export type DealRating = "exceptional" | "great" | "good" | "fair";

export interface FlightDeal {
  id: string;
  provider: string;
  origin: Airport;
  destination: Airport;
  airline: Airline;
  cabin: Cabin;
  outbound: FlightSlice;
  inbound: FlightSlice | null;
  departureDate: IsoDate;
  returnDate: IsoDate | null;
  /** Nights at the destination (null for one-way). */
  nights: number | null;
  /** Per-traveller total price, whole USD. */
  price: number;
  /** What this route usually costs for comparable dates. */
  typicalPrice: number;
  currency: "USD";
  savingsPercent: number;
  rating: DealRating;
  /** 0–10, combining savings, duration and convenience. */
  score: number;
  baggage: BaggageInfo;
  fare: FareDetails;
  seatsLeft: number | null;
  /** Separate tickets on different airlines, with a self-managed connection. */
  selfTransfer: boolean;
  /** Per-traveller fees for the bags requested in the search (0 if none needed). */
  bagFee: number;
  /** Great-circle distance between origin and destination, km. */
  distanceKm: number;
}

export interface FlightSearchParams {
  /** Location token as typed in the URL: airport ("DOH"), country ("AE") or region ("europe"). */
  from: string;
  /** Location token, or null for "anywhere". */
  to: string | null;
  /** Airports `from` resolves to. */
  origins: string[];
  /** Airports `to` resolves to, or null for anywhere. */
  destinations: string[] | null;
  when: WhenOption;
  departure: IsoDate | null;
  /** Last possible departure date when when === "range". */
  departureEnd: IsoDate | null;
  /** Return window (range searches): earliest and latest return dates. */
  returnFrom: IsoDate | null;
  returnUntil: IsoDate | null;
  returnDate: IsoDate | null;
  oneWay: boolean;
  adults: number;
  children: number;
  /** Lap infants (under 2), priced at 10% of an adult fare. */
  infants: number;
  cabin: Cabin;
  tripLength: TripLength;
  minNights: number | null;
  maxNights: number | null;
}

export interface FlightFilters {
  maxPrice: number | null;
  /** Allowed stop counts; 2 means "2 or more". Empty = any. */
  stops: number[];
  airlines: string[];
  departureTimes: TimeBucket[];
  arrivalTimes: TimeBucket[];
  /** Longest acceptable outbound journey, minutes. */
  maxDurationMinutes: number | null;
  /** Longest acceptable single layover, minutes. */
  maxLayoverMinutes: number | null;
  transfer: TransferOption;
  bags: BagRequest;
}

export interface SearchFacets {
  airlines: { code: string; name: string; minPrice: number; count: number }[];
  stops: { stops: number; minPrice: number; count: number }[];
  priceRange: { min: number; max: number } | null;
}

export interface FlightSearchResult {
  params: FlightSearchParams;
  deals: FlightDeal[];
  facets: SearchFacets;
}

export interface DestinationQuote {
  destination: Airport;
  cheapest: FlightDeal;
  /** Number of priced itineraries considered for this destination. */
  optionCount: number;
  hasDirect: boolean;
}

export interface PricePoint {
  date: IsoDate;
  price: number;
}

export type DealCollection =
  | "best"
  | "cheapest"
  | "weekend"
  | "long-haul"
  | "under-300"
  | "direct";

export interface DealQuery {
  origin: string;
  collection: DealCollection;
  limit?: number;
  cabin?: Cabin;
}
