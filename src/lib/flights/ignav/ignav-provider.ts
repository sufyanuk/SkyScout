import "server-only";
import { airlineName } from "@/lib/catalog/airline-names";
import { getAirline } from "@/lib/catalog/airlines";
import { getAirport } from "@/lib/catalog/airports";
import { addDays, diffDays, todayIso } from "@/lib/dates";
import { computeFacets, EMPTY_FILTERS, matchesFilters, sortDeals } from "@/lib/flights/filtering";
import { bagFeeFor } from "@/lib/flights/pricing";
import { ratingFor, typicalPrice } from "@/lib/flights/mock/generator";
import type { ExploreOptions, FlightSearchProvider, SearchOptions } from "@/lib/flights/provider";
import type {
  Airline,
  Cabin,
  DealQuery,
  DestinationQuote,
  FlightDeal,
  FlightSearchParams,
  FlightSearchResult,
  FlightSlice,
  IsoDate,
  Layover,
  PricePoint,
} from "@/lib/flights/types";
import { distanceKm } from "@/lib/geo";

/**
 * Live fares from the Ignav flight API (https://ignav.com/docs).
 *
 * Ignav searches real-time prices, and every successful request is billed
 * (first 1,000 free, then $2 per 1,000). So it is used where live prices
 * matter most — searches between two specific airports and the deal pages
 * they lead to — and everything else (homepage, explore, deal feeds, price
 * history) comes from the base provider: Travelpayouts when configured,
 * otherwise demo data. A date window costs at most 1 + MAX_DATE_PAIRS calls
 * per stay length, and results are cached in memory for 30 minutes.
 *
 * Booking links cost a request too, so they're fetched only when someone
 * clicks "Book" (see /api/ignav/book).
 *
 * Config (server-only env): IGNAV_API_KEY (required), IGNAV_MARKET (default
 * "US", which prices in USD), IGNAV_API_BASE (default https://ignav.com/api).
 */

export const IGNAV_PROVIDER_NAME = "ignav";
const API = process.env.IGNAV_API_BASE || "https://ignav.com/api";
const MARKET = process.env.IGNAV_MARKET || "US";
const CACHE_MS = 30 * 60 * 1000;
/** Cheapest date pairs priced in full when the search covers a date window. */
const MAX_DATE_PAIRS = 3;
/** Longest departure window sent to the cheapest-dates endpoint. */
const MAX_WINDOW_DAYS = 60;

export function ignavConfigured(): boolean {
  return Boolean(process.env.IGNAV_API_KEY);
}

export class IgnavError extends Error {}

// ─── API types (subset of https://ignav.com/api/openapi.json) ──────────────────

interface IgnavPrice {
  amount: number;
  currency: string;
  status: "verified" | "unverified";
}

interface IgnavSegment {
  marketing_carrier_code: string | null;
  flight_number: string | null;
  operating_carrier_name: string | null;
  departure_airport: string;
  departure_time_local: string;
  departure_time_utc: string | null;
  arrival_airport: string;
  arrival_time_local: string;
  arrival_time_utc: string | null;
  duration_minutes: number;
  aircraft: string | null;
}

interface IgnavLeg {
  carrier: string | null;
  duration_minutes: number | null;
  segments: IgnavSegment[];
}

export interface IgnavItinerary {
  price: IgnavPrice;
  outbound: IgnavLeg;
  inbound: IgnavLeg | null;
  cabin_class: string | null;
  bags: { carry_on: number | null; checked: number | null } | null;
  requires_self_transfer: boolean | null;
  ignav_id: string;
}

interface IgnavSearchResponse {
  itineraries: IgnavItinerary[];
}

interface IgnavCheapestDatesResponse {
  dates: { departure_date: IsoDate; return_date: IsoDate | null; price: IgnavPrice | null }[];
}

interface IgnavBookingLinksResponse {
  booking_options: { links: { provider_name: string; price: IgnavPrice | null; url: string }[] }[];
}

// ─── HTTP with a small in-memory cache ─────────────────────────────────────────

const cache = new Map<string, { at: number; value: Promise<unknown> }>();

async function post<T>(path: string, body: Record<string, unknown>, cached = true): Promise<T> {
  const key = `${path} ${JSON.stringify(body)}`;
  const hit = cached ? cache.get(key) : undefined;
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.value as Promise<T>;

  const value = (async () => {
    const apiKey = process.env.IGNAV_API_KEY;
    if (!apiKey) throw new IgnavError("IGNAV_API_KEY is not set");
    const res = await fetch(`${API}${path}`, {
      method: "POST",
      headers: { "X-Api-Key": apiKey, "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ market: MARKET, ...body }),
      cache: "no-store",
      signal: AbortSignal.timeout(25_000),
    });
    if (!res.ok) {
      const detail = await res.json().catch(() => null);
      throw new IgnavError(`Ignav ${path} responded ${res.status}${detail?.error?.message ? `: ${detail.error.message}` : ""}`);
    }
    return (await res.json()) as T;
  })();

  if (cached) {
    if (cache.size > 500) cache.clear();
    cache.set(key, { at: Date.now(), value });
    value.catch(() => cache.delete(key));
  }
  return value;
}

const CABIN_CLASS: Record<Cabin, string> = { economy: "economy", premium: "premium_economy", business: "business", first: "first" };

interface FareQuery {
  origin: string;
  destination: string;
  departure: IsoDate;
  returnDate: IsoDate | null;
  cabin: Cabin;
  maxStops?: number | null;
}

export async function searchFares(q: FareQuery): Promise<IgnavItinerary[]> {
  const body = {
    origin: q.origin,
    destination: q.destination,
    departure_date: q.departure,
    ...(q.returnDate ? { return_date: q.returnDate } : {}),
    // Prices are per traveller; SkyScout multiplies by the party itself.
    adults: 1,
    cabin_class: CABIN_CLASS[q.cabin],
    ...(q.maxStops != null ? { max_stops: q.maxStops } : {}),
  };
  const res = await post<IgnavSearchResponse>(q.returnDate ? "/fares/round-trip" : "/fares/one-way", body);
  return res.itineraries ?? [];
}

async function cheapestDates(q: { origin: string; destination: string; start: IsoDate; end: IsoDate; stay: number | null; cabin: Cabin }) {
  const res = await post<IgnavCheapestDatesResponse>("/fares/cheapest-dates", {
    origin: q.origin,
    destination: q.destination,
    departure_date_range: { start: q.start, end: q.end },
    stay_days: q.stay,
    adults: 1,
    cabin_class: CABIN_CLASS[q.cabin],
  });
  return (res.dates ?? []).filter((d) => d.price && d.price.currency === "USD");
}

/** Partner booking page for an itinerary (one billed request, so only on click). */
export async function bookingLink(ignavId: string): Promise<string | null> {
  const res = await post<IgnavBookingLinksResponse>("/fares/booking-links", { ignav_id: ignavId, adults: 1 }, false);
  const links = (res.booking_options ?? []).flatMap((o) => o.links ?? []).filter((l) => /^https?:\/\//.test(l.url));
  links.sort((a, b) => (a.price?.amount ?? Infinity) - (b.price?.amount ?? Infinity));
  return links[0]?.url ?? null;
}

// ─── Mapping ──────────────────────────────────────────────────────────────────

const localTime = (iso: string) => iso.slice(0, 16);

function minutesBetween(a: string, b: string): number {
  return Math.round((Date.parse(`${localTime(b)}:00Z`) - Date.parse(`${localTime(a)}:00Z`)) / 60_000);
}

function airlineFor(code: string, operatingName?: string | null): Airline {
  const known = getAirline(code);
  if (known) return known;
  const name = airlineName(code);
  return { code, name: name !== code ? name : (operatingName ?? code), hubs: [], priceFactor: 1, color: "#475569" };
}

function toSlice(leg: IgnavLeg): FlightSlice | null {
  const segs = leg.segments ?? [];
  if (segs.length === 0) return null;
  const first = segs[0];
  const last = segs[segs.length - 1];
  const layovers: Layover[] = [];
  for (let i = 1; i < segs.length; i++) {
    layovers.push({ airport: segs[i].departure_airport, durationMinutes: Math.max(0, minutesBetween(segs[i - 1].arrival_time_local, segs[i].departure_time_local)) });
  }
  const flying = segs.reduce((sum, s) => sum + (s.duration_minutes || 0), 0);
  return {
    from: first.departure_airport,
    to: last.arrival_airport,
    departure: localTime(first.departure_time_local),
    arrival: localTime(last.arrival_time_local),
    durationMinutes: leg.duration_minutes || flying + layovers.reduce((sum, l) => sum + l.durationMinutes, 0),
    stops: segs.length - 1,
    segments: segs.map((s) => {
      const code = s.marketing_carrier_code ?? "";
      return {
        flightNumber: `${code} ${s.flight_number ?? ""}`.trim(),
        airlineCode: code,
        airlineName: airlineFor(code, s.operating_carrier_name).name,
        from: s.departure_airport,
        to: s.arrival_airport,
        departure: localTime(s.departure_time_local),
        arrival: localTime(s.arrival_time_local),
        durationMinutes: s.duration_minutes,
        aircraft: s.aircraft ?? "",
      };
    }),
    layovers,
  };
}

const compact = (date: IsoDate) => date.replace(/-/g, "");
const flightKey = (leg: IgnavLeg | null) =>
  (leg?.segments ?? []).map((s) => `${s.marketing_carrier_code ?? ""}${s.flight_number ?? ""}`.replace(/[^A-Z0-9]/gi, "").toUpperCase()).join(".");

/** URL-safe id that carries enough to find the itinerary again. */
export function encodeIgnavId(k: { from: string; to: string; dep: IsoDate; ret: IsoDate | null; cabin: Cabin; flights: string; price: number }) {
  return ["IG", k.from, k.to, compact(k.dep), k.ret ? compact(k.ret) : "OW", k.cabin, k.flights, Math.round(k.price)].join("-");
}

export function decodeIgnavId(id: string) {
  const m = /^IG-([A-Z]{3})-([A-Z]{3})-(\d{8})-(\d{8}|OW)-(economy|premium|business|first)-([A-Z0-9._]+)-(\d+)$/.exec(id);
  if (!m) return null;
  const iso = (c: string) => `${c.slice(0, 4)}-${c.slice(4, 6)}-${c.slice(6, 8)}`;
  return { from: m[1], to: m[2], dep: iso(m[3]), ret: m[4] === "OW" ? null : iso(m[4]), cabin: m[5] as Cabin, flights: m[6], price: Number(m[7]) };
}

export function toDeal(it: IgnavItinerary, cabin: Cabin, typical?: number): FlightDeal | null {
  if (!it.price || it.price.currency !== "USD" || !(it.price.amount > 0)) return null;
  const outbound = toSlice(it.outbound);
  const inbound = it.inbound ? toSlice(it.inbound) : null;
  if (!outbound || (it.inbound && !inbound)) return null;
  const origin = getAirport(outbound.from);
  const destination = getAirport(outbound.to);
  if (!origin || !destination || origin.code === destination.code) return null;

  const carrier = it.outbound.segments[0]?.marketing_carrier_code || it.outbound.carrier || "";
  const airline = airlineFor(carrier, it.outbound.segments[0]?.operating_carrier_name);
  const departureDate = outbound.departure.slice(0, 10);
  const returnDate = inbound ? inbound.departure.slice(0, 10) : null;
  const price = Math.round(it.price.amount);
  const benchmark = Math.max(price, typical ?? typicalPrice(origin.code, destination.code, cabin, departureDate, !returnDate));
  const savingsPercent = Math.max(0, Math.round(((benchmark - price) / benchmark) * 100));
  const distance = Math.round(distanceKm(origin, destination));
  const flights = [flightKey(it.outbound), flightKey(it.inbound)].filter(Boolean).join("_") || carrier || "XX";
  const checked = it.bags?.checked ?? 0;

  const deal: FlightDeal = {
    id: encodeIgnavId({ from: origin.code, to: destination.code, dep: departureDate, ret: returnDate, cabin, flights, price }),
    provider: IGNAV_PROVIDER_NAME,
    origin,
    destination,
    airline,
    cabin,
    outbound,
    inbound,
    departureDate,
    returnDate,
    nights: returnDate ? diffDays(departureDate, returnDate) : null,
    price,
    typicalPrice: benchmark,
    currency: "USD",
    savingsPercent,
    rating: ratingFor(savingsPercent),
    score: 0,
    // Ignav reports bag counts but not weights; fare rules are shown on the booking site.
    baggage: { personalItem: true, cabinKg: 0, checkedBags: checked, checkedKg: 0 },
    fare: { fareBrand: "Check with the airline", refundable: false, changeFee: null, seatSelection: "paid", mealsIncluded: false },
    seatsLeft: null,
    selfTransfer: Boolean(it.requires_self_transfer),
    bagFee: 0,
    distanceKm: distance,
    bookingUrl: it.ignav_id ? `/api/ignav/book?id=${encodeURIComponent(it.ignav_id)}` : undefined,
  };
  const idealMinutes = 28 + distance / 13.4;
  deal.score =
    Math.round(
      Math.min(10, Math.min(6, savingsPercent / 10) + 2.5 * Math.min(1, idealMinutes / outbound.durationMinutes) + Math.max(0, 1.5 - outbound.stops * 0.35)) *
        10,
    ) / 10;
  return deal;
}

/** Map a batch, benchmarking against the route's median when there are enough fares. */
function toDeals(itineraries: IgnavItinerary[], cabin: Cabin): FlightDeal[] {
  const prices = itineraries.map((i) => i.price?.amount).filter((p): p is number => p > 0).sort((a, b) => a - b);
  const median = prices.length >= 6 ? prices[Math.floor(prices.length / 2)] : undefined;
  const seen = new Set<string>();
  const deals: FlightDeal[] = [];
  for (const it of itineraries) {
    const deal = toDeal(it, cabin, median);
    if (deal && !seen.has(deal.id)) {
      seen.add(deal.id);
      deals.push(deal);
    }
  }
  return deals;
}

// ─── Query planning ───────────────────────────────────────────────────────────

/** Departure window covered by a search. */
function departureWindow(params: FlightSearchParams, today: IsoDate): { start: IsoDate; end: IsoDate } {
  const tomorrow = addDays(today, 1);
  const dep = params.departure && params.departure > today ? params.departure : tomorrow;
  switch (params.when) {
    case "exact":
      return { start: dep, end: dep };
    case "flexible":
      return { start: addDays(dep, -3) > today ? addDays(dep, -3) : tomorrow, end: addDays(dep, 3) };
    case "range":
      return { start: dep, end: params.departureEnd && params.departureEnd >= dep ? params.departureEnd : dep };
    case "weekend":
    case "next-month":
      return { start: tomorrow, end: addDays(today, 45) };
    default:
      return { start: tomorrow, end: addDays(today, MAX_WINDOW_DAYS) };
  }
}

/** Lengths of stay to price for a round trip (at most two). */
function stayLengths(params: FlightSearchParams, window: { start: IsoDate; end: IsoDate }): number[] {
  if (params.minNights || params.maxNights) {
    const min = params.minNights ?? params.maxNights!;
    const max = params.maxNights ?? min;
    return [...new Set([min, max])];
  }
  if (params.returnFrom && params.returnUntil) {
    const shortest = Math.max(1, diffDays(window.end, params.returnFrom));
    const longest = Math.max(shortest, diffDays(window.start, params.returnUntil));
    return [Math.round((shortest + longest) / 2)];
  }
  if (params.returnDate && params.departure) return [Math.max(1, diffDays(params.departure, params.returnDate))];
  return [7];
}

function inReturnWindow(params: FlightSearchParams, ret: IsoDate | null): boolean {
  if (!ret) return true;
  if (params.returnFrom && ret < params.returnFrom) return false;
  if (params.returnUntil && ret > params.returnUntil) return false;
  return true;
}

/** Departure/return date pairs to price in full. */
async function datePairs(params: FlightSearchParams, origin: string, destination: string): Promise<{ dep: IsoDate; ret: IsoDate | null }[]> {
  const window = departureWindow(params, todayIso());
  const end = diffDays(window.start, window.end) > MAX_WINDOW_DAYS ? addDays(window.start, MAX_WINDOW_DAYS) : window.end;

  if (window.start === end) {
    if (params.oneWay) return [{ dep: window.start, ret: null }];
    const ret =
      params.returnDate ??
      (params.returnFrom && params.returnFrom === params.returnUntil ? params.returnFrom : null) ??
      (params.minNights && params.minNights === params.maxNights ? addDays(window.start, params.minNights) : null);
    if (ret) return [{ dep: window.start, ret }];
  }

  const stays = params.oneWay ? [null] : stayLengths(params, { start: window.start, end });
  const lists = await Promise.all(
    stays.map((stay) => cheapestDates({ origin, destination, start: window.start, end, stay, cabin: params.cabin })),
  );
  return lists
    .flat()
    .filter((d) => d.departure_date >= window.start && d.departure_date <= end && inReturnWindow(params, d.return_date))
    .sort((a, b) => a.price!.amount - b.price!.amount)
    .slice(0, MAX_DATE_PAIRS)
    .map((d) => ({ dep: d.departure_date, ret: params.oneWay ? null : d.return_date }));
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export class IgnavProvider implements FlightSearchProvider {
  readonly name = IGNAV_PROVIDER_NAME;

  /** `base` serves everything Ignav isn't used for, and stands in if Ignav fails. */
  constructor(private readonly base: FlightSearchProvider) {}

  private warn(where: string, error: unknown) {
    console.warn(`[ignav] ${where} failed, using ${this.base.name} data:`, error instanceof Error ? error.message : error);
  }

  /** Ignav prices one airport pair at a time, so only single-route searches use it. */
  private route(params: FlightSearchParams): { origin: string; destination: string } | null {
    if (params.origins.length !== 1 || params.destinations?.length !== 1) return null;
    const [origin] = params.origins;
    const [destination] = params.destinations;
    return origin !== destination && getAirport(origin) && getAirport(destination) ? { origin, destination } : null;
  }

  async searchFlights(params: FlightSearchParams, options: SearchOptions = {}): Promise<FlightSearchResult> {
    const route = this.route(params);
    if (!route) return this.base.searchFlights(params, options);
    const filters = { ...EMPTY_FILTERS, ...options.filters };
    try {
      const pairs = await datePairs(params, route.origin, route.destination);
      const batches = await Promise.all(
        pairs.map((p) => searchFares({ ...route, departure: p.dep, returnDate: p.ret, cabin: params.cabin })),
      );
      let all = toDeals(batches.flat(), params.cabin).filter((d) => params.oneWay === (d.returnDate === null) && inReturnWindow(params, d.returnDate));
      if (all.length === 0 && pairs.length === 0) return this.base.searchFlights(params, options);
      if (filters.bags.cabin > 0 || filters.bags.checked > 0) all = all.map((d) => ({ ...d, bagFee: bagFeeFor(d, filters.bags) }));
      const deals = sortDeals(all.filter((d) => matchesFilters(d, filters)), options.sort ?? "best");
      return { params, deals, facets: computeFacets(all) };
    } catch (error) {
      this.warn("searchFlights", error);
      return this.base.searchFlights(params, options);
    }
  }

  async getDeal(id: string): Promise<FlightDeal | null> {
    const key = decodeIgnavId(id);
    if (!key) return this.base.getDeal(id);
    try {
      const itineraries = await searchFares({ origin: key.from, destination: key.to, departure: key.dep, returnDate: key.ret, cabin: key.cabin });
      const deals = toDeals(itineraries, key.cabin);
      const flights = (d: FlightDeal) => d.id.split("-")[6];
      // Same itinerary if it's still on sale (its price may have moved).
      return deals.find((d) => d.id === id) ?? deals.find((d) => flights(d) === key.flights) ?? null;
    } catch (error) {
      this.warn("getDeal", error);
      return null;
    }
  }

  getDeals(query: DealQuery): Promise<FlightDeal[]> {
    return this.base.getDeals(query);
  }

  exploreDestinations(origin: string, options?: ExploreOptions): Promise<DestinationQuote[]> {
    return this.base.exploreDestinations(origin, options);
  }

  getPriceHistory(origin: string, destination: string, cabin?: Cabin, days?: number): Promise<PricePoint[]> {
    return this.base.getPriceHistory(origin, destination, cabin, days);
  }

  async getSimilarDeals(deal: FlightDeal, limit = 6): Promise<FlightDeal[]> {
    if (deal.provider !== this.name) return this.base.getSimilarDeals(deal, limit);
    try {
      // Other itineraries on the same dates — already cached from the deal lookup.
      const itineraries = await searchFares({
        origin: deal.origin.code,
        destination: deal.destination.code,
        departure: deal.departureDate,
        returnDate: deal.returnDate,
        cabin: deal.cabin,
      });
      return sortDeals(toDeals(itineraries, deal.cabin).filter((d) => d.id !== deal.id), "best").slice(0, limit);
    } catch (error) {
      this.warn("getSimilarDeals", error);
      return [];
    }
  }
}
