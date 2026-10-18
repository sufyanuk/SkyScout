import "server-only";
import type { FlightSearchProvider } from "./provider";
import { MockFlightProvider } from "./mock/mock-provider";
import { RealFlightProvider } from "./real-provider";
import { TravelpayoutsProvider, travelpayoutsConfigured } from "./travelpayouts/travelpayouts-provider";

let instance: FlightSearchProvider | undefined;

/**
 * Returns the configured flight-data provider:
 *  - FLIGHT_PROVIDER=travelpayouts + TRAVELPAYOUTS_TOKEN → real cached fares from Aviasales
 *  - FLIGHT_PROVIDER=live → the RealFlightProvider placeholder (when its credentials exist)
 *  - anything else → the mock provider (demo data)
 */
export function getFlightProvider(): FlightSearchProvider {
  if (instance) return instance;
  const wanted = process.env.FLIGHT_PROVIDER ?? "mock";
  if (wanted === "travelpayouts") {
    if (travelpayoutsConfigured()) {
      instance = new TravelpayoutsProvider();
      return instance;
    }
    console.warn("[flights] FLIGHT_PROVIDER=travelpayouts but TRAVELPAYOUTS_TOKEN is missing — using mock data.");
  }
  if (wanted === "live") {
    if (RealFlightProvider.isConfigured()) {
      instance = new RealFlightProvider();
      return instance;
    }
    console.warn("[flights] FLIGHT_PROVIDER=live but FLIGHT_API_KEY/FLIGHT_API_BASE_URL are missing — using mock data.");
  }
  instance = new MockFlightProvider();
  return instance;
}

export type { FlightSearchProvider } from "./provider";
