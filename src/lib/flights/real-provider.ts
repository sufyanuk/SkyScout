import "server-only";
import type { FlightSearchProvider } from "./provider";
import { ProviderNotConfiguredError } from "./provider";

/**
 * Placeholder for a live flight API.
 *
 * To connect a real provider (e.g. Amadeus Self-Service, Duffel, Kiwi Tequila):
 *  1. Add its credentials to .env (FLIGHT_API_KEY / FLIGHT_API_SECRET) — they
 *     are only ever read on the server.
 *  2. Implement each method by calling the API and mapping the response into
 *     the types in ./types.ts (see MockFlightProvider for the expected shape:
 *     price per traveller, local wall-clock times, typicalPrice for savings).
 *  3. Set FLIGHT_PROVIDER=live. getFlightProvider() will pick this class.
 *
 * Tips: issue stable deal ids (or encode the offer token in the id) so saved
 * favourites can be re-fetched; cache searches (unstable_cache / Redis) to stay
 * within rate limits; record cheapest fares into PriceHistory for charts.
 */
export class RealFlightProvider implements FlightSearchProvider {
  readonly name = "live";

  constructor(
    private readonly config = {
      apiKey: process.env.FLIGHT_API_KEY,
      apiSecret: process.env.FLIGHT_API_SECRET,
      baseUrl: process.env.FLIGHT_API_BASE_URL,
    },
  ) {}

  static isConfigured(): boolean {
    return Boolean(process.env.FLIGHT_API_KEY && process.env.FLIGHT_API_BASE_URL);
  }

  private notImplemented(method: string): never {
    if (!this.config.apiKey || !this.config.baseUrl) {
      throw new ProviderNotConfiguredError(this.name, ["FLIGHT_API_KEY", "FLIGHT_API_BASE_URL"]);
    }
    throw new Error(`RealFlightProvider.${method} is not implemented yet — see src/lib/flights/real-provider.ts`);
  }

  async searchFlights(): ReturnType<FlightSearchProvider["searchFlights"]> {
    return this.notImplemented("searchFlights");
  }
  async getDeal(): ReturnType<FlightSearchProvider["getDeal"]> {
    return this.notImplemented("getDeal");
  }
  async getDeals(): ReturnType<FlightSearchProvider["getDeals"]> {
    return this.notImplemented("getDeals");
  }
  async exploreDestinations(): ReturnType<FlightSearchProvider["exploreDestinations"]> {
    return this.notImplemented("exploreDestinations");
  }
  async getPriceHistory(): ReturnType<FlightSearchProvider["getPriceHistory"]> {
    return this.notImplemented("getPriceHistory");
  }
  async getSimilarDeals(): ReturnType<FlightSearchProvider["getSimilarDeals"]> {
    return this.notImplemented("getSimilarDeals");
  }
}
