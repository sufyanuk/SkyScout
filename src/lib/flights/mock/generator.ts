import { AIRLINES, CONNECTING_HUBS, getAirline } from "@/lib/catalog/airlines";
import { getAirport } from "@/lib/catalog/airports";
import { compactDate, diffDays, expandCompactDate, monthOf, parseIsoDate } from "@/lib/dates";
import { distanceKm } from "@/lib/geo";
import type {
  Airline,
  Airport,
  BaggageInfo,
  Cabin,
  DealRating,
  FareDetails,
  FlightDeal,
  FlightSegment,
  FlightSlice,
  IsoDate,
  Layover,
} from "../types";
import { createRng, hashString, type Rng } from "./random";

/**
 * Deterministic itinerary generator for the mock provider.
 *
 * A deal id encodes everything needed to rebuild it:
 *   DOH-BKK-20261112-20261119-QR-1E
 *   from-to-departure-return(or OW)-airline-variant+cabin
 * so detail pages, favourites and alerts never need a database round-trip
 * to know what a mock fare looks like.
 */

export interface ItineraryKey {
  from: string;
  to: string;
  departure: IsoDate;
  returnDate: IsoDate | null;
  airline: string;
  variant: number;
  cabin: Cabin;
}

export const MOCK_PROVIDER_NAME = "mock";
export const VARIANTS = [0, 1, 2, 3] as const;
/** Variant 4 = self-transfer: two separate tickets on different airlines. */
export const SELF_TRANSFER_VARIANT = 4;

const CABIN_TO_CODE: Record<Cabin, string> = { economy: "E", premium: "P", business: "B", first: "F" };
const CODE_TO_CABIN: Record<string, Cabin> = { E: "economy", P: "premium", B: "business", F: "first" };

export function encodeDealId(k: ItineraryKey): string {
  return [
    k.from,
    k.to,
    compactDate(k.departure),
    k.returnDate ? compactDate(k.returnDate) : "OW",
    k.airline,
    `${k.variant}${CABIN_TO_CODE[k.cabin]}`,
  ].join("-");
}

export function decodeDealId(id: string): ItineraryKey | null {
  const parts = id.toUpperCase().split("-");
  if (parts.length !== 6) return null;
  const [from, to, dep, ret, airline, tail] = parts;
  const departure = expandCompactDate(dep);
  const returnDate = ret === "OW" ? null : expandCompactDate(ret);
  const variant = Number(tail.slice(0, -1));
  const cabin = CODE_TO_CABIN[tail.slice(-1)];
  if (!getAirport(from) || !getAirport(to) || from === to) return null;
  if (!departure || (ret !== "OW" && !returnDate)) return null;
  if (returnDate && diffDays(departure, returnDate) < 1) return null;
  const knownVariant = VARIANTS.includes(variant as (typeof VARIANTS)[number]) || variant === SELF_TRANSFER_VARIANT;
  if (!getAirline(airline) || !cabin || !knownVariant) return null;
  return { from, to, departure, returnDate, airline, variant, cabin };
}

// ─── Routing ──────────────────────────────────────────────────────────────────

const LONG_RANGE = new Set(["QR", "EK", "EY", "SQ", "QF", "CX", "TK", "DL", "AA", "BA", "AF", "KL", "JL"]);
const MIN_ROUTE_KM = 350;

function maxRange(airline: Airline): number {
  if (airline.lowCost) return 4800;
  return LONG_RANGE.has(airline.code) ? 15500 : 11000;
}

const km = (a: string, b: string) => distanceKm(getAirport(a)!, getAirport(b)!);

export interface RouteOption {
  airline: Airline;
  via: string[];
  detour: number;
}

const routeCache = new Map<string, RouteOption[]>();

/** Which airlines fly a route, and through which hub. Deterministic and cached. */
export function routeOptions(from: string, to: string): RouteOption[] {
  const cacheKey = `${from}-${to}`;
  const cached = routeCache.get(cacheKey);
  if (cached) return cached;

  const direct = km(from, to);
  const options: RouteOption[] = [];

  if (direct >= MIN_ROUTE_KM) {
    for (const airline of AIRLINES) {
      const touchesHub = airline.hubs.includes(from) || airline.hubs.includes(to);
      if (touchesHub) {
        if (direct <= maxRange(airline)) {
          options.push({ airline, via: [], detour: 1 });
        } else if (!airline.lowCost) {
          const hub = bestConnection(from, to, maxRange(airline), [from, to]);
          if (hub) options.push({ airline, via: [hub.code], detour: hub.detour });
        }
        continue;
      }
      if (airline.lowCost) continue;
      const hub = airline.hubs[0];
      const d1 = km(from, hub);
      const d2 = km(hub, to);
      if (d1 < 300 || d2 < 300) continue;
      const detour = (d1 + d2) / direct;
      if (detour <= 1.3 && d1 <= maxRange(airline) && d2 <= maxRange(airline)) {
        options.push({ airline, via: [hub], detour });
      }
    }

    if (options.length === 0) {
      // Remote pairs: fall back to the best-placed long-range carrier.
      const fallback = AIRLINES.filter((a) => LONG_RANGE.has(a.code))
        .map((airline) => {
          const hub = airline.hubs[0];
          return { airline, via: [hub], detour: (km(from, hub) + km(hub, to)) / direct };
        })
        .filter((o) => !o.via.includes(from) && !o.via.includes(to))
        .sort((a, b) => a.detour - b.detour);
      options.push(...fallback.slice(0, 2));
    }
  }

  options.sort((a, b) => a.via.length - b.via.length || a.detour - b.detour);
  const result = options.slice(0, 8);
  routeCache.set(cacheKey, result);
  return result;
}

function bestConnection(from: string, to: string, range: number, exclude: string[]) {
  const direct = km(from, to);
  let best: { code: string; detour: number } | null = null;
  for (const hub of CONNECTING_HUBS) {
    if (exclude.includes(hub)) continue;
    const d1 = km(from, hub);
    const d2 = km(hub, to);
    if (d1 > range || d2 > range || d1 < 300 || d2 < 300) continue;
    const detour = (d1 + d2) / direct;
    if (!best || detour < best.detour) best = { code: hub, detour };
  }
  return best;
}

/** Variant 3 of a one-stop routing adds a second, cheaper connection. */
function routingFor(key: ItineraryKey, option: RouteOption): string[] {
  if (key.variant !== 3 || option.via.length !== 1 || km(key.from, key.to) < 6000) return option.via;
  const first = option.via[0];
  const direct = km(key.from, key.to);
  let best: { code: string; detour: number } | null = null;
  for (const hub of CONNECTING_HUBS) {
    if ([key.from, key.to, first].includes(hub)) continue;
    const total = km(key.from, first) + km(first, hub) + km(hub, key.to);
    const detour = total / direct;
    if (km(first, hub) < 400 || km(hub, key.to) < 300) continue;
    if (detour <= 1.35 && (!best || detour < best.detour)) best = { code: hub, detour };
  }
  return best ? [first, best.code] : option.via;
}

// ─── Self-transfer ────────────────────────────────────────────────────────────

export interface SelfTransferOption {
  first: Airline;
  hub: string;
  second: Airline;
  detour: number;
}

const selfTransferCache = new Map<string, SelfTransferOption[]>();

/**
 * "Virtual interlining": combine the cheapest carrier into a hub with a
 * different carrier out of it. Cheaper, but the traveller re-checks bags and
 * isn't protected if the first flight is late — the UI says so clearly.
 */
export function selfTransferOptions(from: string, to: string): SelfTransferOption[] {
  const cacheKey = `${from}-${to}`;
  const cached = selfTransferCache.get(cacheKey);
  if (cached) return cached;

  const direct = km(from, to);
  const options: SelfTransferOption[] = [];
  if (direct >= 1200) {
    const cheapest = (candidates: Airline[]) => [...candidates].sort((a, b) => a.priceFactor - b.priceFactor)[0];
    for (const hub of CONNECTING_HUBS) {
      if (hub === from || hub === to) continue;
      const d1 = km(from, hub);
      const d2 = km(hub, to);
      const detour = (d1 + d2) / direct;
      if (d1 < 300 || d2 < 300 || detour > 1.35) continue;
      const first = cheapest(AIRLINES.filter((a) => (a.hubs.includes(from) || a.hubs.includes(hub)) && d1 <= maxRange(a)));
      if (!first) continue;
      const second = cheapest(
        AIRLINES.filter((a) => a.code !== first.code && (a.hubs.includes(hub) || a.hubs.includes(to)) && d2 <= maxRange(a)),
      );
      if (second) options.push({ first, hub, second, detour });
    }
  }
  const unique = options
    .sort((a, b) => a.detour - b.detour)
    .filter((o, i, arr) => arr.findIndex((x) => x.first.code === o.first.code) === i)
    .slice(0, 3);
  selfTransferCache.set(cacheKey, unique);
  return unique;
}

// ─── Schedules ────────────────────────────────────────────────────────────────

const DEPARTURE_SLOTS = [
  [0, 45], [2, 10], [3, 35], [6, 20], [7, 55], [9, 40], [11, 15],
  [13, 30], [15, 5], [16, 50], [18, 25], [20, 10], [21, 45], [23, 20],
] as const;

const round5 = (n: number) => Math.round(n / 5) * 5;

function localTime(utcMs: number, offsetMinutes: number): string {
  return new Date(utcMs + offsetMinutes * 60_000).toISOString().slice(0, 16);
}

function aircraftFor(distance: number, rng: Rng): string {
  if (distance < 2500) return rng.pick(["Airbus A320neo", "Boeing 737 MAX 8", "Airbus A321neo"]);
  if (distance < 6000) return rng.pick(["Boeing 787-8", "Airbus A330-300", "Airbus A321LR", "Boeing 787-9"]);
  return rng.pick(["Boeing 777-300ER", "Airbus A350-900", "Boeing 787-9", "Airbus A350-1000", "Airbus A380"]);
}

function buildSlice(
  rng: Rng,
  legAirlines: Airline[],
  points: string[],
  date: IsoDate,
  layoverRange: [number, number] = [65, 290],
): FlightSlice {
  const [h, m] = rng.pick(DEPARTURE_SLOTS);
  const d = parseIsoDate(date);
  const origin = getAirport(points[0])!;
  const startUtc = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), h, m) - origin.utcOffset * 60_000;

  let cursor = startUtc;
  const segments: FlightSegment[] = [];
  const layovers: Layover[] = [];

  for (let i = 0; i < points.length - 1; i++) {
    const a = getAirport(points[i])!;
    const b = getAirport(points[i + 1])!;
    const distance = distanceKm(a, b);
    const duration = round5(Math.max(50, 28 + distance / 13.4));
    const arrival = cursor + duration * 60_000;
    const airline = legAirlines[Math.min(i, legAirlines.length - 1)];
    segments.push({
      flightNumber: `${airline.code} ${rng.int(airline.lowCost ? 1000 : 100, airline.lowCost ? 1999 : 989)}`,
      airlineCode: airline.code,
      from: a.code,
      to: b.code,
      departure: localTime(cursor, a.utcOffset),
      arrival: localTime(arrival, b.utcOffset),
      durationMinutes: duration,
      aircraft: aircraftFor(distance, rng),
    });
    cursor = arrival;
    if (i < points.length - 2) {
      const layover = round5(rng.int(layoverRange[0], layoverRange[1]));
      layovers.push({ airport: b.code, durationMinutes: layover });
      cursor += layover * 60_000;
    }
  }

  const last = getAirport(points[points.length - 1])!;
  return {
    from: origin.code,
    to: last.code,
    departure: segments[0].departure,
    arrival: localTime(cursor, last.utcOffset),
    durationMinutes: Math.round((cursor - startUtc) / 60_000),
    stops: points.length - 2,
    segments,
    layovers,
  };
}

// ─── Pricing ──────────────────────────────────────────────────────────────────

/** Month multipliers: December holidays and July/August are peak. */
const SEASONALITY = [0.92, 0.88, 0.95, 1.0, 0.97, 1.05, 1.18, 1.15, 0.96, 0.94, 0.98, 1.22];
const CABIN_MULTIPLIER: Record<Cabin, number> = { economy: 1, premium: 1.7, business: 3.6, first: 6.2 };
const STOP_FACTOR = [1.06, 0.93, 0.84];

function regionFactor(a: Airport, b: Airport): number {
  const regions = new Set([a.region, b.region]);
  if (regions.has("north-america") || regions.has("oceania")) return 1.06;
  if (regions.has("middle-east") && regions.has("south-asia")) return 0.82;
  if (regions.has("middle-east") && regions.has("europe")) return 1.12;
  if (regions.has("middle-east") && regions.has("caucasus")) return 0.9;
  return 1;
}

/** What a route usually costs per traveller for the given month and cabin. */
export function typicalPrice(from: string, to: string, cabin: Cabin, departure: IsoDate, oneWay: boolean): number {
  const a = getAirport(from)!;
  const b = getAirport(to)!;
  const distance = distanceKm(a, b);
  const routeNoise = 0.9 + ((hashString([from, to].sort().join("")) % 1000) / 1000) * 0.2;
  const roundTrip =
    (95 + 0.082 * distance) * regionFactor(a, b) * SEASONALITY[monthOf(departure) - 1] * CABIN_MULTIPLIER[cabin] * routeNoise;
  return Math.round((oneWay ? roundTrip * 0.64 : roundTrip) / 5) * 5;
}

function dealMultiplier(rng: Rng): number {
  const r = rng.next();
  if (r < 0.12) return rng.range(0.42, 0.6); // rare "how is this so cheap?" fares
  if (r < 0.42) return rng.range(0.6, 0.8);
  return rng.range(0.8, 1.08);
}

export function ratingFor(savingsPercent: number): DealRating {
  if (savingsPercent >= 45) return "exceptional";
  if (savingsPercent >= 30) return "great";
  if (savingsPercent >= 15) return "good";
  return "fair";
}

function baggageFor(airline: Airline, cabin: Cabin, variant: number): BaggageInfo {
  if (cabin === "first") return { personalItem: true, cabinKg: 14, checkedBags: 3, checkedKg: 32 };
  if (cabin === "business") return { personalItem: true, cabinKg: 14, checkedBags: 2, checkedKg: 32 };
  if (cabin === "premium") return { personalItem: true, cabinKg: 10, checkedBags: 2, checkedKg: 23 };
  if (airline.lowCost) return { personalItem: true, cabinKg: variant === 2 ? 7 : 0, checkedBags: 0, checkedKg: 0 };
  return { personalItem: true, cabinKg: 7, checkedBags: variant === 1 ? 0 : 1, checkedKg: variant === 1 ? 0 : 23 };
}

function fareFor(airline: Airline, cabin: Cabin, variant: number): FareDetails {
  if (cabin === "business" || cabin === "first") {
    return { fareBrand: cabin === "first" ? "First Flex" : "Business Classic", refundable: true, changeFee: 0, seatSelection: "free", mealsIncluded: true };
  }
  if (airline.lowCost) {
    return { fareBrand: variant === 2 ? "Value" : "Basic", refundable: false, changeFee: variant === 2 ? 45 : null, seatSelection: "paid", mealsIncluded: false };
  }
  if (variant === 1) {
    return { fareBrand: `${cabin === "premium" ? "Premium" : "Economy"} Light`, refundable: false, changeFee: null, seatSelection: "paid", mealsIncluded: true };
  }
  if (variant === 2) {
    return { fareBrand: `${cabin === "premium" ? "Premium" : "Economy"} Flex`, refundable: true, changeFee: 0, seatSelection: "free", mealsIncluded: true };
  }
  return { fareBrand: `${cabin === "premium" ? "Premium" : "Economy"} Classic`, refundable: false, changeFee: 75, seatSelection: "free", mealsIncluded: true };
}

function selfTransferBaggage(option: SelfTransferOption, cabin: Cabin): BaggageInfo {
  // Allowance is only as good as the stingier of the two tickets.
  const a = baggageFor(option.first, cabin, 0);
  const b = baggageFor(option.second, cabin, 0);
  return {
    personalItem: true,
    cabinKg: Math.min(a.cabinKg, b.cabinKg),
    checkedBags: Math.min(a.checkedBags, b.checkedBags),
    checkedKg: Math.min(a.checkedKg, b.checkedKg),
  };
}

function scoreFor(deal: Omit<FlightDeal, "score">): number {
  const savingsPts = Math.min(6, deal.savingsPercent / 10);
  const idealMinutes = 28 + deal.distanceKm / 13.4;
  const durationPts = 2.5 * Math.min(1, idealMinutes / deal.outbound.durationMinutes);
  const depHour = Number(deal.outbound.departure.slice(11, 13));
  let convenience = 1.5 - deal.outbound.stops * 0.35 - (depHour < 5 ? 0.4 : 0);
  if (deal.baggage.checkedBags > 0) convenience += 0.2;
  if (deal.selfTransfer) convenience -= 0.6;
  const score = savingsPts + durationPts + Math.max(0, Math.min(1.5, convenience));
  return Math.round(Math.min(10, score) * 10) / 10;
}

// ─── Assembly ─────────────────────────────────────────────────────────────────

const dealCache = new Map<string, FlightDeal | null>();
const DEAL_CACHE_LIMIT = 20_000;

/**
 * Build the full deal for an itinerary key. Returns null when the airline
 * doesn't serve the route. `today` affects only last-minute pricing.
 */
export function buildDeal(key: ItineraryKey, today: IsoDate): FlightDeal | null {
  const id = encodeDealId(key);
  const cacheKey = `${id}@${today}`;
  if (dealCache.has(cacheKey)) return dealCache.get(cacheKey)!;

  const selfTransfer = key.variant === SELF_TRANSFER_VARIANT;
  const option = selfTransfer
    ? null
    : routeOptions(key.from, key.to).find((o) => o.airline.code === key.airline);
  const transferOption = selfTransfer
    ? selfTransferOptions(key.from, key.to).find((o) => o.first.code === key.airline)
    : null;
  if (!option && !transferOption) {
    remember(cacheKey, null);
    return null;
  }

  const rng = createRng(id);
  const airline = option?.airline ?? transferOption!.first;
  const origin = getAirport(key.from)!;
  const destination = getAirport(key.to)!;
  const via = option ? routingFor(key, option) : [transferOption!.hub];
  const outboundAirlines = transferOption ? [transferOption.first, transferOption.second] : [airline];
  const inboundAirlines = transferOption ? [transferOption.second, transferOption.first] : [airline];
  // Separate tickets need time to collect and re-check bags.
  const layovers: [number, number] = transferOption ? [150, 420] : [65, 290];

  const outbound = buildSlice(rng, outboundAirlines, [key.from, ...via, key.to], key.departure, layovers);
  const inbound = key.returnDate
    ? buildSlice(rng, inboundAirlines, [key.to, ...[...via].reverse(), key.from], key.returnDate, layovers)
    : null;

  const typical = typicalPrice(key.from, key.to, key.cabin, key.departure, !key.returnDate);
  const lead = diffDays(today, key.departure);
  const leadFactor = lead < 10 ? 1.18 : lead < 21 ? 1.06 : 1;
  const priceFactor = transferOption ? (transferOption.first.priceFactor + transferOption.second.priceFactor) / 2 : airline.priceFactor;
  const stopFactor = transferOption ? 0.8 : STOP_FACTOR[Math.min(2, via.length)];
  const price = Math.max(29, Math.round(typical * priceFactor * stopFactor * dealMultiplier(rng) * leadFactor));
  const savingsPercent = Math.max(0, Math.min(90, Math.round(((typical - price) / typical) * 100)));

  const partial: Omit<FlightDeal, "score"> = {
    id,
    provider: MOCK_PROVIDER_NAME,
    origin,
    destination,
    airline,
    cabin: key.cabin,
    outbound,
    inbound,
    departureDate: key.departure,
    returnDate: key.returnDate,
    nights: key.returnDate ? diffDays(key.departure, key.returnDate) : null,
    price,
    typicalPrice: typical,
    currency: "USD",
    savingsPercent,
    rating: ratingFor(savingsPercent),
    baggage: transferOption
      ? selfTransferBaggage(transferOption, key.cabin)
      : baggageFor(airline, key.cabin, key.variant),
    fare: transferOption
      ? { fareBrand: "Self-transfer · 2 tickets", refundable: false, changeFee: null, seatSelection: "paid", mealsIncluded: !transferOption.first.lowCost && !transferOption.second.lowCost }
      : fareFor(airline, key.cabin, key.variant),
    seatsLeft: rng.chance(0.3) ? rng.int(1, 7) : null,
    selfTransfer: !!transferOption,
    bagFee: 0,
    distanceKm: Math.round(distanceKm(origin, destination)),
  };
  const deal: FlightDeal = { ...partial, score: scoreFor(partial) };
  remember(cacheKey, deal);
  return deal;
}

function remember(key: string, value: FlightDeal | null) {
  if (dealCache.size >= DEAL_CACHE_LIMIT) dealCache.clear();
  dealCache.set(key, value);
}
