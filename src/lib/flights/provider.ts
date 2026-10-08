import type {
  DealQuery,
  DestinationQuote,
  FlightDeal,
  FlightSearchParams,
  FlightSearchResult,
  FlightFilters,
  PricePoint,
  Cabin,
  SortOption,
} from "./types";

export interface SearchOptions {
  filters?: Partial<FlightFilters>;
  sort?: SortOption;
}

export interface ExploreOptions {
  cabin?: Cabin;
  maxPrice?: number | null;
  directOnly?: boolean;
  when?: "anytime" | "weekend" | "next-month";
  /** Only consider trips of exactly this many nights (whole-trip budgeting). */
  nights?: number | null;
}

/**
 * The single seam between SkyScout and any flight-data source.
 *
 * Implementations: MockFlightProvider (default, no credentials needed) and
 * RealFlightProvider (placeholder showing where Amadeus, Duffel, Kiwi Tequila
 * or another licensed API plugs in). The rest of the app only talks to this
 * interface via getFlightProvider().
 */
export interface FlightSearchProvider {
  /** Short identifier stored with persisted deals, e.g. "mock" or "amadeus". */
  readonly name: string;

  /** Search itineraries; filters and sort are applied by the provider. */
  searchFlights(params: FlightSearchParams, options?: SearchOptions): Promise<FlightSearchResult>;

  /** Look up a single deal by the id the provider issued. */
  getDeal(id: string): Promise<FlightDeal | null>;

  /** Curated deal feeds for the homepage and /deals. */
  getDeals(query: DealQuery): Promise<FlightDeal[]>;

  /** Cheapest fare to every reachable destination from an origin. */
  exploreDestinations(origin: string, options?: ExploreOptions): Promise<DestinationQuote[]>;

  /** Lowest observed fare per day for a route, oldest first. */
  getPriceHistory(origin: string, destination: string, cabin?: Cabin, days?: number): Promise<PricePoint[]>;

  /** Alternatives to show next to a deal. */
  getSimilarDeals(deal: FlightDeal, limit?: number): Promise<FlightDeal[]>;
}

export class ProviderNotConfiguredError extends Error {
  constructor(provider: string, missing: string[]) {
    super(`Flight provider "${provider}" is not configured. Missing: ${missing.join(", ")}`);
    this.name = "ProviderNotConfiguredError";
  }
}
