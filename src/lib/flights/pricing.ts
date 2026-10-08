import { getAirline } from "@/lib/catalog/airlines";
import type { BagRequest, FlightDeal } from "./types";

/**
 * Estimated per-traveller cost of the bags someone asked for when the fare
 * doesn't include them. Charged per direction, and roughly per ticket for
 * self-transfer itineraries. Providers that return real ancillary prices can
 * set `bagFee` themselves instead.
 */
export function bagFeeFor(
  deal: Pick<FlightDeal, "baggage" | "distanceKm" | "inbound" | "selfTransfer">,
  bags: BagRequest,
): number {
  const tier = deal.distanceKm < 2500 ? 0 : deal.distanceKm < 6000 ? 1 : 2;
  const cabinFee = [18, 25, 30][tier];
  const checkedFee = [35, 55, 75][tier];
  const missingCabin = bags.cabin > 0 && deal.baggage.cabinKg === 0 ? bags.cabin : 0;
  const missingChecked = Math.max(0, bags.checked - deal.baggage.checkedBags);
  const perDirection = missingCabin * cabinFee + missingChecked * checkedFee;
  const directions = deal.inbound ? 2 : 1;
  return Math.round(perDirection * directions * (deal.selfTransfer ? 1.6 : 1));
}

export interface PartySize {
  /** Adults + children (each needs a seat and pays a full fare). */
  seated: number;
  /** Lap infants. */
  infants: number;
}

/** Infants on a lap typically pay ~10% of the adult fare (plus taxes). */
export const INFANT_FARE_SHARE = 0.1;

/** Total for the whole party, including bag fees for seated travellers. */
export function groupTotal(deal: Pick<FlightDeal, "price" | "bagFee">, party: PartySize): number {
  return Math.round((deal.price + (deal.bagFee ?? 0)) * party.seated + deal.price * INFANT_FARE_SHARE * party.infants);
}

/** "Oman Air" or "Oman Air + Thai Airways" for self-transfer combinations. */
export function carrierNames(deal: Pick<FlightDeal, "outbound" | "airline">): string {
  const codes = [...new Set(deal.outbound.segments.map((s) => s.airlineCode))];
  if (codes.length <= 1) return deal.airline.name;
  return codes.map((c) => getAirline(c)?.name ?? c).join(" + ");
}
