import { z } from "zod";
import { DEFAULT_ORIGIN } from "@/lib/catalog/airports";
import { resolveLocation } from "@/lib/catalog/locations";
import { makeSearchParams } from "@/lib/flights/params";
import { isIsoDate } from "@/lib/dates";
import {
  CABINS,
  SORTS,
  TIME_BUCKETS,
  TRANSFER_OPTIONS,
  TRIP_LENGTHS,
  WHEN_OPTIONS,
  type FlightFilters,
  type FlightSearchParams,
  type SortOption,
} from "@/lib/flights/types";

/**
 * Every search is fully described by its URL, e.g.
 *   /flights?from=DOH&to=BKK&departure=2026-11-12&return=2026-11-19
 * so results can be bookmarked and shared. Parsing is lenient: an invalid
 * value falls back to its default instead of breaking the page.
 */

export const VIEWS = ["list", "grid"] as const;
export type ResultsView = (typeof VIEWS)[number];
export const PAGE_SIZE = 24;

type RawParams = Record<string, string | string[] | undefined>;

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
const list = (v: string | string[] | undefined) =>
  (Array.isArray(v) ? v.join(",") : (v ?? ""))
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

/** Airport ("DOH"), country ("AE") or region ("europe") token. */
const locationToken = z
  .string()
  .trim()
  .transform((t) => resolveLocation(t)?.token ?? t)
  .refine((t) => !!resolveLocation(t), "Unknown airport, country or region");

const isoDate = z.string().refine(isIsoDate, "Expected a date like 2026-11-12");
const intIn = (min: number, max: number) => z.coerce.number().int().min(min).max(max);

/** Strict schema used by the public API — invalid input → 400. */
export const flightsQuerySchema = z.object({
  from: locationToken,
  to: z.union([z.literal("anywhere"), z.literal("ANYWHERE"), locationToken]).optional(),
  departure: isoDate.optional(),
  /** End of the departure window when when=range. */
  until: isoDate.optional(),
  /** Return window for range searches. */
  returnFrom: isoDate.optional(),
  returnUntil: isoDate.optional(),
  return: isoDate.optional(),
  when: z.enum(WHEN_OPTIONS).optional(),
  trip: z.enum(["oneway", "return"]).optional(),
  adults: intIn(1, 9).optional(),
  children: intIn(0, 8).optional(),
  infants: intIn(0, 4).optional(),
  cabin: z.enum(CABINS).optional(),
  length: z.enum(TRIP_LENGTHS).optional(),
  minNights: intIn(1, 30).optional(),
  maxNights: intIn(1, 30).optional(),
  maxPrice: intIn(1, 50_000).optional(),
  stops: z.array(z.coerce.number().int().min(0).max(2)).optional(),
  airlines: z.array(z.string().regex(/^[A-Z0-9]{2}$/)).optional(),
  dep: z.array(z.enum(TIME_BUCKETS)).optional(),
  arr: z.array(z.enum(TIME_BUCKETS)).optional(),
  sort: z.enum(SORTS).optional(),
  view: z.enum(VIEWS).optional(),
  limit: intIn(1, 500).optional(),
  /** Hours. */
  maxDuration: intIn(1, 72).optional(),
  /** Hours. */
  maxLayover: intIn(1, 48).optional(),
  transfer: z.enum(TRANSFER_OPTIONS).optional(),
  cabinBags: intIn(0, 1).optional(),
  checkedBags: intIn(0, 2).optional(),
});

export type FlightsQuery = z.infer<typeof flightsQuerySchema>;

/** Normalise a raw query object (URLSearchParams / Next searchParams). */
export function rawToQueryInput(raw: RawParams) {
  const arrays = ["stops", "airlines", "dep", "arr"];
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(raw)) {
    if (value === undefined || value === "") continue;
    out[key] = arrays.includes(key) ? list(value).map((s) => (key === "airlines" ? s.toUpperCase() : s)) : first(value);
  }
  return out;
}

export function searchParamsToRecord(sp: URLSearchParams): RawParams {
  const out: RawParams = {};
  sp.forEach((value, key) => {
    out[key] = value;
  });
  return out;
}

export interface ParsedSearch {
  params: FlightSearchParams;
  filters: FlightFilters;
  sort: SortOption;
  view: ResultsView;
  limit: number;
}

export function toParsedSearch(q: Partial<FlightsQuery>, fallbackOrigin = DEFAULT_ORIGIN): ParsedSearch {
  const from = q.from ?? fallbackOrigin;
  const toRaw = q.to && q.to.toLowerCase() !== "anywhere" ? q.to : null;
  const to = toRaw && toRaw !== from ? toRaw : null;
  const departure = q.departure ?? null;
  const oneWay = q.trip === "oneway";
  const returnDate = oneWay ? null : q.return && departure && q.return > departure ? q.return : null;
  let when = q.when ?? (departure ? "exact" : "anytime");
  if ((when === "exact" || when === "flexible" || when === "range") && !departure) when = "anytime";
  const lengthGiven = q.minNights !== undefined || q.maxNights !== undefined;
  const adults = q.adults ?? 1;

  return {
    params: makeSearchParams({
      from,
      to,
      when,
      departure,
      departureEnd: when === "range" ? (q.until ?? null) : null,
      returnFrom: when === "range" && !oneWay ? (q.returnFrom ?? null) : null,
      returnUntil: when === "range" && !oneWay ? (q.returnUntil ?? null) : null,
      returnDate: when === "range" ? null : returnDate,
      oneWay,
      adults,
      children: q.children ?? 0,
      infants: Math.min(q.infants ?? 0, adults),
      cabin: q.cabin ?? "economy",
      tripLength: q.length ?? (lengthGiven ? "custom" : "any"),
      minNights: q.minNights ?? null,
      maxNights: q.maxNights ?? null,
    }),
    filters: {
      maxPrice: q.maxPrice ?? null,
      stops: q.stops ?? [],
      airlines: q.airlines ?? [],
      departureTimes: q.dep ?? [],
      arrivalTimes: q.arr ?? [],
      maxDurationMinutes: q.maxDuration ? q.maxDuration * 60 : null,
      maxLayoverMinutes: q.maxLayover ? q.maxLayover * 60 : null,
      transfer: q.transfer ?? "include",
      bags: { cabin: q.cabinBags ?? 0, checked: q.checkedBags ?? 0 },
    },
    sort: q.sort ?? "best",
    view: q.view ?? "list",
    limit: q.limit ?? PAGE_SIZE,
  };
}

/**
 * Lenient parse for pages: drop each invalid field individually, keep the rest.
 */
export function parseSearchPage(raw: RawParams, fallbackOrigin = DEFAULT_ORIGIN): ParsedSearch {
  const input = rawToQueryInput(raw);
  const shape = flightsQuerySchema.shape;
  const clean: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input)) {
    const field = shape[key as keyof typeof shape];
    if (!field) continue;
    const result = field.safeParse(value);
    if (result.success) clean[key] = result.data;
  }
  return toParsedSearch(clean as Partial<FlightsQuery>, fallbackOrigin);
}

/** Build a /flights URL from partial search state. */
export function buildSearchHref(input: {
  from: string;
  to?: string | null;
  departure?: string | null;
  returnDate?: string | null;
  when?: string | null;
  oneWay?: boolean;
  adults?: number;
  children?: number;
  infants?: number;
  cabin?: string;
  extra?: Record<string, string | number | undefined | null>;
}): string {
  const sp = new URLSearchParams();
  sp.set("from", input.from);
  sp.set("to", input.to ?? "anywhere");
  if (input.departure) sp.set("departure", input.departure);
  if (input.returnDate && !input.oneWay) sp.set("return", input.returnDate);
  if (input.when && input.when !== "exact") sp.set("when", input.when);
  if (input.oneWay) sp.set("trip", "oneway");
  if (input.adults && input.adults > 1) sp.set("adults", String(input.adults));
  if (input.children) sp.set("children", String(input.children));
  if (input.infants) sp.set("infants", String(input.infants));
  if (input.cabin && input.cabin !== "economy") sp.set("cabin", input.cabin);
  for (const [k, v] of Object.entries(input.extra ?? {})) {
    if (v !== undefined && v !== null && v !== "") sp.set(k, String(v));
  }
  return `/flights?${sp.toString()}`;
}
