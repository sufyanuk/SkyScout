import { DAILY_COSTS, type TravelStyle } from "@/lib/catalog/trip-costs";

export interface TripCost {
  flight: number;
  stay: number;
  nights: number;
  perDay: number;
  total: number;
  style: TravelStyle;
}

/**
 * Whole-trip cost per traveller: the fare plus estimated daily costs at the
 * destination. Lets travellers compare a cheap flight to an expensive city
 * against a pricier flight to somewhere affordable.
 */
export function tripCost(destination: string, flight: number, nights: number, style: TravelStyle): TripCost | null {
  const daily = DAILY_COSTS[destination];
  if (!daily) return null;
  const perDay = daily[style];
  const stay = perDay * Math.max(1, nights);
  return { flight, stay, nights, perDay, total: flight + stay, style };
}

export function dailyCost(destination: string, style: TravelStyle): number | null {
  return DAILY_COSTS[destination]?.[style] ?? null;
}
