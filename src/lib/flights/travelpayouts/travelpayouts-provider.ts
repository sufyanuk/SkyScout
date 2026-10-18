import "server-only";
import { AIRLINE_NAMES } from "@/lib/catalog/airline-names";
import { getAirline } from "@/lib/catalog/airlines";
import { getAirport } from "@/lib/catalog/airports";
import { addDays, diffDays, startOfNextMonth, todayIso } from "@/lib/dates";
import {
  capPerDestination,
  computeFacets,
  EMPTY_FILTERS,
  matchesFilters,
  matchesTripLength,
  sortDeals,
} from "@/lib/flights/filtering";
import { isSingleRoute } from "@/lib/flights/params";
import { bagFeeFor } from "@/lib/flights/pricing";
import { ratingFor, typicalPrice } from "@/lib/flights/mock/generator";
import { bestPerDestination, COLLECTIONS, MockFlightProvider } from "@/lib/flights/mock/mock-provider";
import type { ExploreOptions, FlightSearchProvider, SearchOptions } from "@/lib/flights/provider";
import type {
  Airline,
  Airport,
  Cabin,
  DealQuery,
  DestinationQuote,
  FlightDeal,
  FlightSearchParams,
  FlightSearchResult,
  FlightSlice,
  IsoDate,
  PricePoint,
} from "@/lib/flights/types";
import { distanceKm } from "@/lib/geo";

/**
 * Real fares from the Travelpayouts (Aviasales) Data API.
 *
 * These are cached prices: fares Aviasales users found in the last few days,
 * not a live seat-availability search. That suits a deals site, but prices can
 * change by the time someone clicks through, so the UI says so.
 *
 * Limitations of the Data API, and what we do about them:
 *  - Economy only → other cabins use the demo provider.
 *  - No baggage or fare rules → shown as "check with the airline".
 *  - No connection airports → stops are counted, not itemised.
 *  - No price-history endpoint → charts and Fare Forecast use the demo model.
 * Any API failure falls back to the demo provider so pages never break.
 *
 * Config (server-only env): TRAVELPAYOUTS_TOKEN (required),
 * TRAVELPAYOUTS_MARKER (affiliate id, added to booking links),
 * TRAVELPAYOUTS_BOOKING_HOST (default https://www.aviasales.com).
 */

const API = `${process.env.TRAVELPAYOUTS_API_BASE || "https://api.travelpayouts.com"}/aviasales/v3/prices_for_dates`;
export const TRAVELPAYOUTS_PROVIDER_NAME = "travelpayouts";
const CACHE_SECONDS = 60 * 30;
const MAX_REQUESTS_PER_SEARCH = 12;

/** City codes Aviasales may return, mapped to the airport we list. */
const CITY_TO_AIRPORT: Record<string, string> = {
  LON: "LHR",
  PAR: "CDG",
  NYC: "JFK",
  TYO: "NRT",
  ROM: "FCO",
  BAK: "GYD",
  MOW: "",
};

export interface TpTicket {
  origin: string;
  destination: string;
  origin_airport?: string;
  destination_airport?: string;
  price: number;
  airline: string;
  flight_number?: string | number;
  departure_at: string;
  return_at?: string;
  transfers?: number;
  return_transfers?: number;
  duration?: number;
  duration_to?: number;
  duration_back?: number;
  link?: string;
  found_at?: string;
}

interface TpQuery {
  origin: string;
  destination?: string;
  departureAt?: string;
  returnAt?: string;
  oneWay: boolean;
  direct?: boolean;
  unique?: boolean;
  limit?: number;
}

export class TravelpayoutsError extends Error {}

export function travelpayoutsConfigured(): boolean {
  return Boolean(process.env.TRAVELPAYOUTS_TOKEN);
}

/** One call to prices_for_dates. Throws on network/API errors. */
export async function fetchTickets(q: TpQuery): Promise<TpTicket[]> {
  const token = process.env.TRAVELPAYOUTS_TOKEN;
  if (!token) throw new TravelpayoutsError("TRAVELPAYOUTS_TOKEN is not set");
  await loadAirlineDirectory();
  const sp = new URLSearchParams({
    origin: q.origin,
    currency: "usd",
    sorting: "price",
    one_way: String(q.oneWay),
    unique: String(q.unique ?? false),
    limit: String(q.limit ?? 200),
    page: "1",
  });
  if (q.destination) sp.set("destination", q.destination);
  if (q.departureAt) sp.set("departure_at", q.departureAt);
  if (q.returnAt && !q.oneWay) sp.set("return_at", q.returnAt);
  if (q.direct) sp.set("direct", "true");

  const res = await fetch(`${API}?${sp}`, {
    headers: { "X-Access-Token": token, "Accept-Encoding": "gzip, deflate" },
    next: { revalidate: CACHE_SECONDS },
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new TravelpayoutsError(`Travelpayouts API responded ${res.status}`);
  const body = (await res.json()) as { success?: boolean; data?: TpTicket[]; error?: string | null };
  if (body.success === false) throw new TravelpayoutsError(body.error || "Travelpayouts API error");
  return Array.isArray(body.data) ? body.data : [];
}

// ─── Mapping ──────────────────────────────────────────────────────────────────

function airportFor(airportCode: string | undefined, cityCode: string): Airport | undefined {
  return getAirport(airportCode) ?? getAirport(cityCode) ?? getAirport(CITY_TO_AIRPORT[cityCode]);
}

/** Travelpayouts' public airline directory (code → name), loaded once a day. */
let airlineDirectory: Map<string, { name: string; lowCost: boolean }> | null = null;
let directoryLoadedAt = 0;

interface TpAirline {
  code?: string;
  name?: string | null;
  is_lowcost?: boolean;
  name_translations?: { en?: string | null };
}

export async function loadAirlineDirectory(): Promise<void> {
  if (airlineDirectory && Date.now() - directoryLoadedAt < 86_400_000) return;
  try {
    const base = process.env.TRAVELPAYOUTS_API_BASE || "https://api.travelpayouts.com";
    const res = await fetch(`${base}/data/en/airlines.json`, {
      next: { revalidate: 86_400 },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) throw new Error(`airlines.json responded ${res.status}`);
    const list = (await res.json()) as TpAirline[];
    const map = new Map<string, { name: string; lowCost: boolean }>();
    for (const a of list) {
      const name = a.name_translations?.en || a.name;
      if (a.code && name) map.set(a.code.toUpperCase(), { name, lowCost: Boolean(a.is_lowcost) });
    }
    airlineDirectory = map;
    directoryLoadedAt = Date.now();
  } catch (error) {
    // The built-in AIRLINE_NAMES list covers the common carriers meanwhile.
    console.warn("[travelpayouts] airline directory unavailable:", error instanceof Error ? error.message : error);
    airlineDirectory ??= new Map();
    directoryLoadedAt = Date.now() - 86_400_000 + 600_000; // retry in 10 minutes
  }
}

function airlineFor(code: string): Airline {
  const known = getAirline(code);
  if (known) return known;
  const listed = airlineDirectory?.get(code);
  const name = listed?.name ?? AIRLINE_NAMES[code] ?? code;
  return { code, name, hubs: [], lowCost: listed?.lowCost, priceFactor: 1, color: "#475569" };
}

/** "2026-11-12T03:15:00+03:00" → "2026-11-12T03:15" (local wall-clock time). */
const localTime = (iso: string) => iso.slice(0, 16);

function addMinutes(local: string, minutes: number): string {
  const d = new Date(`${local}:00Z`);
  d.setUTCMinutes(d.getUTCMinutes() + minutes);
  return d.toISOString().slice(0, 16);
}

/** Rough flight time when the API omits it: taxi + cruise + a stop penalty. */
function estimateMinutes(from: Airport, to: Airport, stops: number): number {
  return Math.round(35 + distanceKm(from, to) / 13.4 + stops * 150);
}

function slice(from: Airport, to: Airport, departureAt: string, minutes: number, stops: number, airline: Airline, flightNumber: string): FlightSlice {
  const departure = localTime(departureAt);
  // Arrival in destination local time = departure + flight time + time-zone shift.
  const arrival = addMinutes(departure, minutes + (to.utcOffset - from.utcOffset));
  return {
    from: from.code,
    to: to.code,
    departure,
    arrival,
    durationMinutes: minutes,
    stops,
    segments: [
      { flightNumber, airlineCode: airline.code, airlineName: airline.name, from: from.code, to: to.code, departure, arrival, durationMinutes: minutes, aircraft: "" },
    ],
    layovers: [],
  };
}

function bookingUrl(link: string | undefined): string | undefined {
  if (!link) return undefined;
  const host = process.env.TRAVELPAYOUTS_BOOKING_HOST || "https://www.aviasales.com";
  const marker = process.env.TRAVELPAYOUTS_MARKER;
  const url = new URL(link, host);
  if (marker) url.searchParams.set("marker", marker);
  return url.toString();
}

const compact = (date: string) => date.replace(/-/g, "");

/** Stable, URL-safe id that carries enough to find the fare again. */
export function encodeTpId(t: { from: string; to: string; dep: IsoDate; ret: IsoDate | null; airline: string; stops: number; price: number }) {
  return ["TP", t.from, t.to, compact(t.dep), t.ret ? compact(t.ret) : "OW", t.airline, t.stops, Math.round(t.price)].join("-");
}

export function decodeTpId(id: string) {
  const m = /^TP-([A-Z]{3})-([A-Z]{3})-(\d{8})-(\d{8}|OW)-([A-Z0-9]{2})-(\d+)-(\d+)$/.exec(id);
  if (!m) return null;
  const iso = (c: string) => `${c.slice(0, 4)}-${c.slice(4, 6)}-${c.slice(6, 8)}`;
  return { from: m[1], to: m[2], dep: iso(m[3]), ret: m[4] === "OW" ? null : iso(m[4]), airline: m[5], stops: Number(m[6]), price: Number(m[7]) };
}

/** Map an API ticket to a FlightDeal; `typical` is the benchmark price for the route. */
export function toDeal(t: TpTicket, typical?: number): FlightDeal | null {
  const origin = airportFor(t.origin_airport, t.origin);
  const destination = airportFor(t.destination_airport, t.destination);
  if (!origin || !destination || origin.code === destination.code || !t.price || !t.departure_at) return null;

  const airline = airlineFor(t.airline);
  const departureDate = t.departure_at.slice(0, 10);
  const returnDate = t.return_at ? t.return_at.slice(0, 10) : null;
  const stopsOut = t.transfers ?? 0;
  const stopsBack = t.return_transfers ?? stopsOut;
  const outMinutes = t.duration_to || (returnDate ? 0 : t.duration) || estimateMinutes(origin, destination, stopsOut);
  const backMinutes = t.duration_back || estimateMinutes(destination, origin, stopsBack);
  const flightNumber = t.flight_number ? `${t.airline} ${t.flight_number}` : t.airline;
  const price = Math.round(t.price);
  const benchmark = Math.max(price, typical ?? typicalPrice(origin.code, destination.code, "economy", departureDate, !returnDate));
  const savingsPercent = Math.max(0, Math.round(((benchmark - price) / benchmark) * 100));
  const distance = Math.round(distanceKm(origin, destination));

  const deal: FlightDeal = {
    id: encodeTpId({ from: origin.code, to: destination.code, dep: departureDate, ret: returnDate, airline: airline.code, stops: stopsOut, price }),
    provider: TRAVELPAYOUTS_PROVIDER_NAME,
    origin,
    destination,
    airline,
    cabin: "economy",
    outbound: slice(origin, destination, t.departure_at, outMinutes, stopsOut, airline, flightNumber),
    inbound: t.return_at ? slice(destination, origin, t.return_at, backMinutes, stopsBack, airline, airline.code) : null,
    departureDate,
    returnDate,
    nights: returnDate ? diffDays(departureDate, returnDate) : null,
    price,
    typicalPrice: benchmark,
    currency: "USD",
    savingsPercent,
    rating: ratingFor(savingsPercent),
    score: 0,
    // The Data API doesn't include baggage or fare rules.
    baggage: { personalItem: true, cabinKg: 0, checkedBags: 0, checkedKg: 0 },
    fare: { fareBrand: "Check with the airline", refundable: false, changeFee: null, seatSelection: "paid", mealsIncluded: false },
    seatsLeft: null,
    selfTransfer: false,
    bagFee: 0,
    distanceKm: distance,
    bookingUrl: bookingUrl(t.link),
    foundAt: t.found_at,
  };
  const idealMinutes = 28 + distance / 13.4;
  deal.score =
    Math.round(
      Math.min(10, Math.min(6, savingsPercent / 10) + 2.5 * Math.min(1, idealMinutes / outMinutes) + Math.max(0, 1.5 - stopsOut * 0.35)) * 10,
    ) / 10;
  return deal;
}

/** Map a batch, benchmarking each fare against the median of its route. */
export function toDeals(tickets: TpTicket[]): FlightDeal[] {
  const byRoute = new Map<string, number[]>();
  for (const t of tickets) {
    const key = `${t.origin_airport ?? t.origin}-${t.destination_airport ?? t.destination}-${t.return_at ? "rt" : "ow"}`;
    byRoute.set(key, [...(byRoute.get(key) ?? []), t.price]);
  }
  const median = (xs: number[]) => {
    const s = [...xs].sort((a, b) => a - b);
    return s[Math.floor(s.length / 2)];
  };
  const seen = new Set<string>();
  const deals: FlightDeal[] = [];
  for (const t of tickets) {
    const prices = byRoute.get(`${t.origin_airport ?? t.origin}-${t.destination_airport ?? t.destination}-${t.return_at ? "rt" : "ow"}`)!;
    // A route median only means something with a few fares to compare.
    const deal = toDeal(t, prices.length >= 4 ? median(prices) : undefined);
    if (deal && !seen.has(deal.id)) {
      seen.add(deal.id);
      deals.push(deal);
    }
  }
  return deals;
}

// ─── Query planning ───────────────────────────────────────────────────────────

const month = (date: IsoDate) => date.slice(0, 7);

/** Months (YYYY-MM) between two dates, at most `max`. */
function monthsBetween(start: IsoDate, end: IsoDate, max = 3): string[] {
  const out: string[] = [];
  for (let d = `${month(start)}-01`; month(d) <= month(end) && out.length < max; d = startOfNextMonth(d)) out.push(month(d));
  return out.length ? out : [month(start)];
}

/** Departure window a search covers, mirroring the demo provider's date logic. */
function departureWindow(params: FlightSearchParams, today: IsoDate): { start: IsoDate; end: IsoDate } {
  const tomorrow = addDays(today, 1);
  switch (params.when) {
    case "exact":
      return { start: params.departure ?? tomorrow, end: params.departure ?? tomorrow };
    case "flexible":
      return { start: addDays(params.departure ?? tomorrow, -3), end: addDays(params.departure ?? tomorrow, 3) };
    case "range":
      return { start: params.departure ?? tomorrow, end: params.departureEnd ?? addDays(params.departure ?? tomorrow, 30) };
    case "weekend":
      return { start: tomorrow, end: addDays(today, 31) };
    case "next-month": {
      const first = startOfNextMonth(today);
      return { start: first, end: addDays(startOfNextMonth(first), -1) };
    }
    default:
      return { start: tomorrow, end: addDays(today, 90) };
  }
}

function withinSearch(deal: FlightDeal, params: FlightSearchParams, window: { start: IsoDate; end: IsoDate }): boolean {
  if (deal.departureDate < window.start || deal.departureDate > window.end) return false;
  if (params.oneWay !== (deal.returnDate === null)) return false;
  if (params.when === "exact" && params.returnDate && deal.returnDate !== params.returnDate) return false;
  if (params.when === "flexible" && params.returnDate && deal.returnDate) {
    if (Math.abs(diffDays(params.returnDate, deal.returnDate)) > 3) return false;
  }
  if (params.returnFrom && deal.returnDate && deal.returnDate < params.returnFrom) return false;
  if (params.returnUntil && deal.returnDate && deal.returnDate > params.returnUntil) return false;
  if (params.when === "exact") return true;
  return matchesTripLength(deal, params.tripLength, { min: params.minNights, max: params.maxNights });
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export class TravelpayoutsProvider implements FlightSearchProvider {
  readonly name = TRAVELPAYOUTS_PROVIDER_NAME;
  private readonly demo = new MockFlightProvider();

  private warn(where: string, error: unknown) {
    console.warn(`[travelpayouts] ${where} failed, using demo data:`, error instanceof Error ? error.message : error);
  }

  async searchFlights(params: FlightSearchParams, options: SearchOptions = {}): Promise<FlightSearchResult> {
    // The Data API only covers economy.
    if (params.cabin !== "economy") return this.demo.searchFlights(params, options);
    const filters = { ...EMPTY_FILTERS, ...options.filters };
    try {
      const today = todayIso();
      const window = departureWindow(params, today);
      const exactDay = params.when === "exact" && params.departure;
      const months = exactDay ? [params.departure!] : monthsBetween(window.start, window.end);
      const destinations: (string | undefined)[] = params.destinations ?? [undefined];

      const queries: TpQuery[] = [];
      for (const origin of params.origins) {
        for (const destination of destinations) {
          if (destination === origin) continue;
          for (const m of months) {
            queries.push({
              origin,
              destination,
              departureAt: m,
              returnAt: exactDay && params.returnDate ? params.returnDate : undefined,
              oneWay: params.oneWay,
              limit: destination ? 200 : 500,
            });
          }
        }
      }
      const batches = await Promise.all(queries.slice(0, MAX_REQUESTS_PER_SEARCH).map(fetchTickets));
      let all = toDeals(batches.flat()).filter((d) => withinSearch(d, params, window));
      if (filters.transfer === "only") all = []; // Aviasales fares are single tickets.
      if (filters.bags.cabin > 0 || filters.bags.checked > 0) all = all.map((d) => ({ ...d, bagFee: bagFeeFor(d, filters.bags) }));
      let deals = sortDeals(all.filter((d) => matchesFilters(d, filters)), options.sort ?? "best");
      if (!isSingleRoute(params)) deals = capPerDestination(deals, 3);
      return { params, deals, facets: computeFacets(all) };
    } catch (error) {
      this.warn("searchFlights", error);
      return this.demo.searchFlights(params, options);
    }
  }

  async getDeal(id: string): Promise<FlightDeal | null> {
    const key = decodeTpId(id);
    if (!key) return this.demo.getDeal(id);
    try {
      const tickets = await fetchTickets({
        origin: key.from,
        destination: key.to,
        departureAt: key.dep,
        returnAt: key.ret ?? undefined,
        oneWay: key.ret === null,
        limit: 100,
      });
      const deals = toDeals(tickets).filter((d) => d.airline.code === key.airline && d.returnDate === key.ret);
      // Same fare if it's still there; otherwise the closest current price for that flight.
      return deals.find((d) => d.id === id) ?? deals.sort((a, b) => Math.abs(a.price - key.price) - Math.abs(b.price - key.price))[0] ?? null;
    } catch (error) {
      this.warn("getDeal", error);
      return null;
    }
  }

  /** Cheapest recent fares from an origin over the next two months. */
  private async pool(origin: string, unique: boolean): Promise<FlightDeal[]> {
    const today = todayIso();
    const months = monthsBetween(addDays(today, 1), addDays(today, 60), 2);
    const batches = await Promise.all(months.map((m) => fetchTickets({ origin, departureAt: m, oneWay: false, unique, limit: 500 })));
    return toDeals(batches.flat()).filter((d) => d.departureDate > today);
  }

  async getDeals(query: DealQuery): Promise<FlightDeal[]> {
    if (!getAirport(query.origin) || (query.cabin && query.cabin !== "economy")) return this.demo.getDeals(query);
    try {
      const { filter, compare } = COLLECTIONS[query.collection];
      const deals = bestPerDestination((await this.pool(query.origin, false)).filter(filter), compare).slice(0, query.limit ?? 12);
      return deals.length ? deals : this.demo.getDeals(query);
    } catch (error) {
      this.warn("getDeals", error);
      return this.demo.getDeals(query);
    }
  }

  async exploreDestinations(origin: string, options: ExploreOptions = {}): Promise<DestinationQuote[]> {
    if (!getAirport(origin) || (options.cabin && options.cabin !== "economy")) return this.demo.exploreDestinations(origin, options);
    try {
      let deals = await this.pool(origin, !options.nights);
      if (options.nights) deals = deals.filter((d) => d.nights === options.nights);
      if (options.directOnly) deals = deals.filter((d) => d.outbound.stops === 0);
      const byDestination = new Map<string, FlightDeal[]>();
      for (const d of deals) byDestination.set(d.destination.code, [...(byDestination.get(d.destination.code) ?? []), d]);
      const quotes: DestinationQuote[] = [];
      for (const list of byDestination.values()) {
        const cheapest = list.reduce((min, d) => (d.price < min.price ? d : min));
        if (options.maxPrice && cheapest.price > options.maxPrice) continue;
        quotes.push({ destination: cheapest.destination, cheapest, optionCount: list.length, hasDirect: list.some((d) => d.outbound.stops === 0) });
      }
      // Too little cached data for this origin (e.g. a specific trip length) → demo data.
      return quotes.length >= 3 ? quotes.sort((a, b) => a.cheapest.price - b.cheapest.price) : this.demo.exploreDestinations(origin, options);
    } catch (error) {
      this.warn("exploreDestinations", error);
      return this.demo.exploreDestinations(origin, options);
    }
  }

  /** The Data API has no price history, so charts use the demo model. */
  async getPriceHistory(origin: string, destination: string, cabin?: Cabin, days?: number): Promise<PricePoint[]> {
    return this.demo.getPriceHistory(origin, destination, cabin, days);
  }

  async getSimilarDeals(deal: FlightDeal, limit = 6): Promise<FlightDeal[]> {
    if (deal.provider !== this.name) return this.demo.getSimilarDeals(deal, limit);
    try {
      const tickets = await fetchTickets({
        origin: deal.origin.code,
        destination: deal.destination.code,
        departureAt: month(deal.departureDate),
        oneWay: deal.returnDate === null,
        limit: 50,
      });
      return toDeals(tickets)
        .filter((d) => d.id !== deal.id && d.departureDate > todayIso())
        .slice(0, limit);
    } catch (error) {
      this.warn("getSimilarDeals", error);
      return [];
    }
  }
}
