import { AIRPORTS, getAirport } from "@/lib/catalog/airports";
import { addDays, dayOfWeek, diffDays, isIsoDate, startOfNextMonth, todayIso, upcomingFridays } from "@/lib/dates";
import {
  capPerDestination,
  computeFacets,
  EMPTY_FILTERS,
  matchesFilters,
  matchesTripLength,
  nightsRange,
  sortDeals,
} from "../filtering";
import type { ExploreOptions, FlightSearchProvider, SearchOptions } from "../provider";
import type {
  Cabin,
  DealCollection,
  TransferOption,
  DealQuery,
  DestinationQuote,
  FlightDeal,
  FlightSearchParams,
  FlightSearchResult,
  IsoDate,
  PricePoint,
} from "../types";
import { bagFeeFor } from "../pricing";
import {
  buildDeal,
  decodeDealId,
  routeOptions,
  SELF_TRANSFER_VARIANT,
  selfTransferOptions,
  typicalPrice,
  VARIANTS,
} from "./generator";
import { isSingleRoute, makeSearchParams } from "../params";
import { createRng, hashString } from "./random";
import { distanceKm } from "@/lib/geo";

interface DatePair {
  departure: IsoDate;
  returnDate: IsoDate | null;
}

const DEFAULT_NIGHTS = [3, 5, 7, 10, 14];

/** Pick up to `count` evenly spread values from an inclusive range. */
function spread(min: number, max: number, count: number): number[] {
  if (max <= min) return [min];
  const step = (max - min) / (count - 1);
  return [...new Set(Array.from({ length: count }, (_, i) => Math.round(min + i * step)))];
}

function nightsFor(params: FlightSearchParams, count = 4): number[] {
  const range = nightsRange(params.tripLength, { min: params.minNights, max: params.maxNights });
  return range ? spread(range.min, range.max, count) : DEFAULT_NIGHTS;
}

const MAX_RANGE_DAYS = 90;

/** Expand the user's (possibly flexible) dates into concrete date pairs. */
export function datePairs(params: FlightSearchParams, today: IsoDate): DatePair[] {
  const earliest = addDays(today, 1);
  const pair = (departure: IsoDate, nights: number | null): DatePair => ({
    departure,
    returnDate: params.oneWay || nights === null ? null : addDays(departure, nights),
  });
  const explicitNights =
    params.departure && params.returnDate ? Math.max(1, diffDays(params.departure, params.returnDate)) : null;

  let pairs: DatePair[] = [];
  switch (params.when) {
    case "exact":
    case "flexible": {
      const dep = params.departure ?? addDays(today, 21);
      const nights = explicitNights ?? (params.oneWay ? null : 7);
      const offsets = params.when === "flexible" ? [-3, -2, -1, 0, 1, 2, 3] : [0];
      pairs = offsets.map((o) => pair(addDays(dep, o), nights));
      break;
    }
    case "range": {
      // Depart any day inside a window; sample it evenly and try a few stay lengths.
      const start = params.departure ?? addDays(today, 7);
      let end = params.departureEnd && params.departureEnd > start ? params.departureEnd : addDays(start, 30);
      if (diffDays(start, end) > MAX_RANGE_DAYS) end = addDays(start, MAX_RANGE_DAYS);
      const span = diffDays(start, end);
      const offsets = spread(0, span, Math.min(span + 1, 10));
      if (!params.oneWay && params.returnFrom && params.returnUntil) {
        // Departure window × return window, limited by the length of stay.
        const minN = params.minNights ?? 1;
        const maxN = params.maxNights ?? 30;
        for (const offset of offsets) {
          const dep = addDays(start, offset);
          const lo = Math.max(minN, diffDays(dep, params.returnFrom));
          const hi = Math.min(maxN, diffDays(dep, params.returnUntil));
          if (hi < Math.max(1, lo)) continue;
          for (const n of spread(Math.max(1, lo), hi, 3)) pairs.push(pair(dep, n));
        }
        break;
      }
      const nights = params.oneWay ? [null] : nightsFor(params, 3);
      for (const offset of offsets) for (const n of nights) pairs.push(pair(addDays(start, offset), n));
      break;
    }
    case "weekend": {
      for (const friday of upcomingFridays(today, 4)) {
        pairs.push(pair(friday, 2), pair(addDays(friday, -1), 3), pair(friday, 3));
      }
      break;
    }
    case "next-month": {
      const start = startOfNextMonth(today);
      const nights = nightsFor(params);
      [1, 5, 9, 14, 19, 24].forEach((day, i) => pairs.push(pair(addDays(start, day), nights[i % nights.length])));
      break;
    }
    default: {
      const nights = nightsFor(params);
      [8, 15, 23, 32, 41, 52, 64, 78].forEach((lead, i) => pairs.push(pair(addDays(today, lead), nights[i % nights.length])));
    }
  }
  return pairs.filter((p) => p.departure >= earliest);
}

function reachableDestinations(origin: string): string[] {
  return AIRPORTS.filter((a) => a.code !== origin && routeOptions(origin, a.code).length > 0).map((a) => a.code);
}

const COLLECTIONS: Record<
  DealCollection,
  { filter: (d: FlightDeal) => boolean; compare: (a: FlightDeal, b: FlightDeal) => number }
> = {
  best: { filter: (d) => d.savingsPercent >= 20, compare: (a, b) => b.savingsPercent - a.savingsPercent || a.price - b.price },
  cheapest: { filter: () => true, compare: (a, b) => a.price - b.price },
  weekend: {
    filter: (d) =>
      d.nights !== null && d.nights <= 3 && [4, 5].includes(dayOfWeek(d.departureDate)) && d.outbound.durationMinutes <= 6 * 60,
    compare: (a, b) => a.price - b.price,
  },
  "long-haul": { filter: (d) => d.distanceKm >= 5000, compare: (a, b) => b.savingsPercent - a.savingsPercent },
  "under-300": { filter: (d) => d.price <= 300, compare: (a, b) => a.price - b.price },
  direct: { filter: (d) => d.outbound.stops === 0, compare: (a, b) => b.savingsPercent - a.savingsPercent },
};

function bestPerDestination(deals: FlightDeal[], compare: (a: FlightDeal, b: FlightDeal) => number) {
  return capPerDestination([...deals].sort(compare), 1);
}

/**
 * Fully offline provider backed by the deterministic generator. Prices move
 * day to day (feeds are re-seeded daily) but any given deal id is stable.
 */
export class MockFlightProvider implements FlightSearchProvider {
  readonly name = "mock";
  private feedCache = new Map<string, FlightDeal[]>();

  private generate(params: FlightSearchParams, today: IsoDate, transfer: TransferOption = "exclude"): FlightDeal[] {
    let pairs = datePairs(params, today);
    const single = isSingleRoute(params);
    // Broad searches (anywhere / regions / countries) sample fewer dates to stay fast.
    if (!single && pairs.length > 12) {
      // Evenly spaced picks (not a fixed stride) so every stay length stays represented.
      const picks = new Set(Array.from({ length: 12 }, (_, k) => Math.round((k * (pairs.length - 1)) / 11)));
      pairs = pairs.filter((_, i) => picks.has(i));
    }
    const deals: FlightDeal[] = [];
    const add = (deal: FlightDeal | null) => {
      if (deal) deals.push(deal);
    };

    for (const from of params.origins) {
      const destinations = params.destinations ?? reachableDestinations(from);
      for (const to of destinations) {
        if (to === from) continue;
        const options = routeOptions(from, to);
        if (options.length === 0) continue;
        const base = { from, to, cabin: params.cabin };

        if (transfer !== "only") {
          const airlines = single ? options : options.slice(0, 3);
          for (const pair of pairs) {
            const variants = single
              ? pairs.length <= 2
                ? VARIANTS
                : [0, 3]
              : [hashString(`${from}${to}${pair.departure}`) % VARIANTS.length];
            for (const option of airlines) {
              for (const variant of variants) {
                add(buildDeal({ ...base, departure: pair.departure, returnDate: pair.returnDate, airline: option.airline.code, variant }, today));
              }
            }
          }
        }

        if (transfer !== "exclude") {
          const transfers = single ? selfTransferOptions(from, to) : selfTransferOptions(from, to).slice(0, 1);
          for (const pair of pairs) {
            for (const option of transfers) {
              add(
                buildDeal(
                  { ...base, departure: pair.departure, returnDate: pair.returnDate, airline: option.first.code, variant: SELF_TRANSFER_VARIANT },
                  today,
                ),
              );
            }
          }
        }
      }
    }

    if (params.when === "exact") return deals;
    return deals.filter((d) => matchesTripLength(d, params.tripLength, { min: params.minNights, max: params.maxNights }));
  }

  async searchFlights(params: FlightSearchParams, options: SearchOptions = {}): Promise<FlightSearchResult> {
    const today = todayIso();
    const filters = { ...EMPTY_FILTERS, ...options.filters };
    let all = this.generate(params, today, filters.transfer);
    if (filters.bags.cabin > 0 || filters.bags.checked > 0) {
      // Generated deals are cached and shared — copy before attaching per-search fees.
      all = all.map((d) => ({ ...d, bagFee: bagFeeFor(d, filters.bags) }));
    }
    let deals = sortDeals(all.filter((d) => matchesFilters(d, filters)), options.sort ?? "best");
    if (!isSingleRoute(params)) deals = capPerDestination(deals, 3);
    return { params, deals, facets: computeFacets(all) };
  }

  async getDeal(id: string): Promise<FlightDeal | null> {
    const key = decodeDealId(id);
    if (!key) return null;
    return buildDeal(key, todayIso());
  }

  /** Daily-seeded pool of candidate deals from one origin. */
  private feed(origin: string, cabin: Cabin, today: IsoDate): FlightDeal[] {
    const cacheKey = `${origin}:${cabin}:${today}`;
    const cached = this.feedCache.get(cacheKey);
    if (cached) return cached;

    const deals: FlightDeal[] = [];
    const fridays = upcomingFridays(today, 4);
    for (const to of reachableDestinations(origin)) {
      const options = routeOptions(origin, to).slice(0, 4);
      const rng = createRng(`feed:${origin}:${to}:${today}`);
      const add = (departure: IsoDate, nights: number) => {
        const option = rng.pick(options);
        const deal = buildDeal(
          { from: origin, to, departure, returnDate: addDays(departure, nights), airline: option.airline.code, variant: rng.int(0, 3), cabin },
          today,
        );
        if (deal) deals.push(deal);
      };
      for (let i = 0; i < 6; i++) add(addDays(today, rng.int(12, 85)), rng.pick([3, 4, 5, 6, 7, 9, 10, 12, 14]));
      if (distanceKm(getAirport(origin)!, getAirport(to)!) < 4500) {
        for (const friday of fridays) add(rng.chance(0.3) ? addDays(friday, -1) : friday, rng.pick([2, 3]));
      }
    }

    if (this.feedCache.size > 50) this.feedCache.clear();
    this.feedCache.set(cacheKey, deals);
    return deals;
  }

  async getDeals({ origin, collection, limit = 12, cabin = "economy" }: DealQuery): Promise<FlightDeal[]> {
    if (!getAirport(origin)) return [];
    const { filter, compare } = COLLECTIONS[collection];
    return bestPerDestination(this.feed(origin, cabin, todayIso()).filter(filter), compare).slice(0, limit);
  }

  async exploreDestinations(origin: string, options: ExploreOptions = {}): Promise<DestinationQuote[]> {
    if (!getAirport(origin)) return [];
    const today = todayIso();
    const params = makeSearchParams({
      from: origin,
      when: options.when ?? "anytime",
      cabin: options.cabin ?? "economy",
      tripLength: options.when === "weekend" ? "weekend" : options.nights ? "custom" : "any",
      minNights: options.nights ?? null,
      maxNights: options.nights ?? null,
    });
    const deals = options.when === "weekend" || options.when === "next-month" || options.nights
      ? this.generate(params, today)
      : [...this.generate(params, today), ...this.feed(origin, params.cabin, today)];

    const byDestination = new Map<string, FlightDeal[]>();
    for (const deal of deals) {
      if (options.directOnly && deal.outbound.stops > 0) continue;
      const list = byDestination.get(deal.destination.code) ?? [];
      list.push(deal);
      byDestination.set(deal.destination.code, list);
    }

    const quotes: DestinationQuote[] = [];
    for (const list of byDestination.values()) {
      const cheapest = list.reduce((min, d) => (d.price < min.price ? d : min));
      if (options.maxPrice && cheapest.price > options.maxPrice) continue;
      quotes.push({
        destination: cheapest.destination,
        cheapest,
        optionCount: list.length,
        hasDirect: list.some((d) => d.outbound.stops === 0),
      });
    }
    return quotes.sort((a, b) => a.cheapest.price - b.cheapest.price);
  }

  async getPriceHistory(origin: string, destination: string, cabin: Cabin = "economy", days = 90): Promise<PricePoint[]> {
    if (!getAirport(origin) || !getAirport(destination) || origin === destination) return [];
    const today = todayIso();
    // A mean-reverting random walk from a fixed anchor, so yesterday's point
    // never changes when today's is added.
    const anchor = "2025-01-01";
    const start = addDays(today, -days + 1);
    const points: PricePoint[] = [];
    let level = 1;
    for (let date = anchor; date <= today; date = addDays(date, 1)) {
      const rng = createRng(`hist:${origin}:${destination}:${cabin}:${date}`);
      level = Math.min(1.3, Math.max(0.62, level + rng.range(-0.05, 0.05) + (1 - level) * 0.07));
      if (date >= start && isIsoDate(date)) {
        const typical = typicalPrice(origin, destination, cabin, addDays(date, 35), false);
        points.push({ date, price: Math.round(typical * 0.94 * level) });
      }
    }
    return points;
  }

  async getSimilarDeals(deal: FlightDeal, limit = 6): Promise<FlightDeal[]> {
    const today = todayIso();
    const sameRoute = this.generate(
      makeSearchParams({ from: deal.origin.code, to: deal.destination.code, oneWay: deal.returnDate === null, cabin: deal.cabin }),
      today,
    )
      .filter((d) => d.id !== deal.id && d.departureDate !== deal.departureDate)
      .sort((a, b) => a.price - b.price);

    const alternatives = bestPerDestination(
      this.feed(deal.origin.code, deal.cabin, today).filter(
        (d) => d.destination.region === deal.destination.region && d.destination.code !== deal.destination.code,
      ),
      (a, b) => b.savingsPercent - a.savingsPercent,
    );

    const half = Math.ceil(limit / 2);
    const picked = [...capDates(sameRoute, half), ...alternatives.slice(0, limit)];
    return picked.slice(0, limit);
  }
}

/** One option per departure date so "similar" shows a spread of dates. */
function capDates(deals: FlightDeal[], count: number): FlightDeal[] {
  const seen = new Set<string>();
  const out: FlightDeal[] = [];
  for (const d of deals) {
    if (seen.has(d.departureDate)) continue;
    seen.add(d.departureDate);
    out.push(d);
    if (out.length >= count) break;
  }
  return out;
}
