import "server-only";
import type { FlightSearchProvider } from "./provider";
import { MockFlightProvider } from "./mock/mock-provider";
import { RealFlightProvider } from "./real-provider";

let instance: FlightSearchProvider | undefined;

/**
 * Returns the configured flight-data provider. FLIGHT_PROVIDER=live selects the
 * real API (when its credentials exist); anything else uses the mock provider.
 */
export function getFlightProvider(): FlightSearchProvider {
  if (instance) return instance;
  const wanted = process.env.FLIGHT_PROVIDER ?? "mock";
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
