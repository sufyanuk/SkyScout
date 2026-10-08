import { dayOfWeek } from "@/lib/dates";
import type {
  FlightDeal,
  FlightFilters,
  SearchFacets,
  SortOption,
  TimeBucket,
  TripLength,
} from "./types";

/**
 * Filtering, sorting and facet logic shared by every provider. A real API may
 * support some of these server-side; anything it doesn't can still run here.
 */

export const EMPTY_FILTERS: FlightFilters = {
  maxPrice: null,
  stops: [],
  airlines: [],
  departureTimes: [],
  arrivalTimes: [],
  maxDurationMinutes: null,
  maxLayoverMinutes: null,
  transfer: "include",
  bags: { cabin: 0, checked: 0 },
};

/** What one traveller actually pays: fare plus any bags they asked for. */
export function totalPrice(deal: Pick<FlightDeal, "price" | "bagFee">): number {
  return deal.price + (deal.bagFee ?? 0);
}

/** Every airline operating a segment (more than one for self-transfer trips). */
export function carrierCodes(deal: Pick<FlightDeal, "outbound">): string[] {
  return [...new Set(deal.outbound.segments.map((s) => s.airlineCode))];
}

/** Longest single connection across both directions, minutes. */
export function longestLayover(deal: FlightDeal): number {
  const all = [...deal.outbound.layovers, ...(deal.inbound?.layovers ?? [])];
  return all.reduce((max, l) => Math.max(max, l.durationMinutes), 0);
}

/** Bucket a local "YYYY-MM-DDTHH:mm" time into part of the day. */
export function timeBucket(localDateTime: string): TimeBucket {
  const hour = Number(localDateTime.slice(11, 13));
  if (hour < 5) return "night";
  if (hour < 12) return "morning";
  if (hour < 18) return "afternoon";
  return "evening";
}

export const TIME_BUCKET_LABELS: Record<TimeBucket, string> = {
  night: "Night (00–05)",
  morning: "Morning (05–12)",
  afternoon: "Afternoon (12–18)",
  evening: "Evening (18–24)",
};

/** Night ranges for each trip-length preset. */
export function nightsRange(
  tripLength: TripLength,
  custom?: { min: number | null; max: number | null },
): { min: number; max: number } | null {
  switch (tripLength) {
    case "weekend":
      return { min: 1, max: 3 };
    case "short":
      return { min: 3, max: 5 };
    case "week":
      return { min: 6, max: 8 };
    case "two-weeks":
      return { min: 12, max: 16 };
    case "custom":
      return { min: custom?.min ?? 1, max: custom?.max ?? 30 };
    default:
      return null;
  }
}

export function matchesTripLength(
  deal: FlightDeal,
  tripLength: TripLength,
  custom?: { min: number | null; max: number | null },
): boolean {
  const range = nightsRange(tripLength, custom);
  if (!range || deal.nights === null) return true;
  if (deal.nights < range.min || deal.nights > range.max) return false;
  if (tripLength === "weekend") return [4, 5, 6].includes(dayOfWeek(deal.departureDate));
  return true;
}

export function matchesFilters(deal: FlightDeal, filters: FlightFilters): boolean {
  if (filters.maxPrice !== null && totalPrice(deal) > filters.maxPrice) return false;
  if (filters.transfer === "exclude" && deal.selfTransfer) return false;
  if (filters.transfer === "only" && !deal.selfTransfer) return false;
  if (filters.maxDurationMinutes !== null && deal.outbound.durationMinutes > filters.maxDurationMinutes) return false;
  if (filters.maxLayoverMinutes !== null && longestLayover(deal) > filters.maxLayoverMinutes) return false;
  if (filters.stops.length > 0) {
    const stops = Math.min(2, deal.outbound.stops);
    if (!filters.stops.includes(stops)) return false;
  }
  if (filters.airlines.length > 0 && !carrierCodes(deal).some((c) => filters.airlines.includes(c))) return false;
  if (filters.departureTimes.length > 0 && !filters.departureTimes.includes(timeBucket(deal.outbound.departure))) {
    return false;
  }
  if (filters.arrivalTimes.length > 0 && !filters.arrivalTimes.includes(timeBucket(deal.outbound.arrival))) {
    return false;
  }
  return true;
}

export function totalDuration(deal: FlightDeal): number {
  return deal.outbound.durationMinutes + (deal.inbound?.durationMinutes ?? 0);
}

const SORTERS: Record<SortOption, (a: FlightDeal, b: FlightDeal) => number> = {
  best: (a, b) => b.score - a.score || totalPrice(a) - totalPrice(b),
  cheapest: (a, b) => totalPrice(a) - totalPrice(b) || totalDuration(a) - totalDuration(b),
  fastest: (a, b) => totalDuration(a) - totalDuration(b) || totalPrice(a) - totalPrice(b),
  value: (a, b) => b.savingsPercent - a.savingsPercent || totalPrice(a) - totalPrice(b),
};

export function sortDeals(deals: FlightDeal[], sort: SortOption): FlightDeal[] {
  return [...deals].sort(SORTERS[sort]);
}

export function computeFacets(deals: FlightDeal[]): SearchFacets {
  const airlines = new Map<string, { code: string; name: string; minPrice: number; count: number }>();
  const stops = new Map<number, { stops: number; minPrice: number; count: number }>();
  let min = Infinity;
  let max = -Infinity;

  for (const deal of deals) {
    const price = totalPrice(deal);
    min = Math.min(min, price);
    max = Math.max(max, price);

    const a = airlines.get(deal.airline.code);
    if (a) {
      a.count++;
      a.minPrice = Math.min(a.minPrice, price);
    } else {
      airlines.set(deal.airline.code, { code: deal.airline.code, name: deal.airline.name, minPrice: price, count: 1 });
    }

    const s = Math.min(2, deal.outbound.stops);
    const st = stops.get(s);
    if (st) {
      st.count++;
      st.minPrice = Math.min(st.minPrice, price);
    } else {
      stops.set(s, { stops: s, minPrice: price, count: 1 });
    }
  }

  return {
    airlines: [...airlines.values()].sort((a, b) => a.minPrice - b.minPrice),
    stops: [...stops.values()].sort((a, b) => a.stops - b.stops),
    priceRange: deals.length ? { min, max } : null,
  };
}

/** Keep at most `perKey` deals per destination, preserving order. */
export function capPerDestination(deals: FlightDeal[], perKey: number): FlightDeal[] {
  const seen = new Map<string, number>();
  return deals.filter((d) => {
    const n = seen.get(d.destination.code) ?? 0;
    if (n >= perKey) return false;
    seen.set(d.destination.code, n + 1);
    return true;
  });
}
