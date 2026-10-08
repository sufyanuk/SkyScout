import { resolveLocation } from "@/lib/catalog/locations";
import type { FlightSearchParams } from "./types";

type ParamsInput = Partial<FlightSearchParams> & { from: string };

/** Build complete search params from a few fields, resolving location tokens to airports. */
export function makeSearchParams(input: ParamsInput): FlightSearchParams {
  const from = resolveLocation(input.from);
  const to = input.to ? resolveLocation(input.to) : null;
  return {
    to: null,
    when: "anytime",
    departure: null,
    departureEnd: null,
    returnDate: null,
    oneWay: false,
    adults: 1,
    children: 0,
    infants: 0,
    cabin: "economy",
    tripLength: "any",
    minNights: null,
    maxNights: null,
    ...input,
    origins: input.origins ?? from?.codes ?? [input.from],
    destinations: input.destinations !== undefined ? input.destinations : to ? to.codes : null,
  };
}

/** True when the search is one airport to one airport. */
export function isSingleRoute(params: Pick<FlightSearchParams, "origins" | "destinations">): boolean {
  return params.origins.length === 1 && params.destinations?.length === 1;
}
