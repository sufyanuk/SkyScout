import type { Region } from "@/lib/flights/types";
import { AIRPORTS, getAirport } from "./airports";

/**
 * A search location can be one airport ("DOH"), every airport in a country
 * ("AE") or every airport in a region ("europe"). Tokens are what appear in
 * the URL, so searches like /flights?from=AE&to=europe stay shareable.
 */
export type LocationKind = "airport" | "country" | "region";

export interface SearchLocation {
  token: string;
  kind: LocationKind;
  label: string;
  /** Short label for chips and titles, e.g. "Doha" or "Europe". */
  shortLabel: string;
  detail: string;
  codes: string[];
}

export const REGION_LABELS: Record<Region, string> = {
  "middle-east": "Middle East",
  europe: "Europe",
  "south-asia": "South Asia",
  "southeast-asia": "Southeast Asia",
  "east-asia": "East Asia",
  africa: "Africa",
  "north-america": "North America",
  oceania: "Oceania",
  caucasus: "Caucasus",
};

function airportsBy<K extends "countryCode" | "region">(key: K, value: string) {
  return AIRPORTS.filter((a) => a[key] === value).map((a) => a.code);
}

const COUNTRY_LOCATIONS: SearchLocation[] = [...new Set(AIRPORTS.map((a) => a.countryCode))]
  .map((cc) => {
    const codes = airportsBy("countryCode", cc);
    const country = AIRPORTS.find((a) => a.countryCode === cc)!.country;
    return { token: cc, kind: "country" as const, label: `${country} (all airports)`, shortLabel: country, detail: codes.join(" · "), codes };
  })
  // A one-airport country is just that airport — no need to list it twice.
  .filter((l) => l.codes.length > 1);

const REGION_LOCATIONS: SearchLocation[] = (Object.keys(REGION_LABELS) as Region[])
  .map((region) => {
    const codes = airportsBy("region", region);
    return { token: region, kind: "region" as const, label: REGION_LABELS[region], shortLabel: REGION_LABELS[region], detail: `${codes.length} airports`, codes };
  })
  .filter((l) => l.codes.length > 0);

/** Countries and regions offered in pickers alongside individual airports. */
export const GROUP_LOCATIONS: SearchLocation[] = [...COUNTRY_LOCATIONS, ...REGION_LOCATIONS];

export function resolveLocation(token: string | null | undefined): SearchLocation | null {
  if (!token) return null;
  const airport = getAirport(token);
  if (airport && token.length === 3) {
    return {
      token: airport.code,
      kind: "airport",
      label: `${airport.city} (${airport.code})`,
      shortLabel: airport.city,
      detail: `${airport.name} · ${airport.country}`,
      codes: [airport.code],
    };
  }
  return GROUP_LOCATIONS.find((l) => l.token.toLowerCase() === token.toLowerCase()) ?? null;
}

export function isLocationToken(token: string | null | undefined): boolean {
  return resolveLocation(token) !== null;
}

/** Human label for a token; falls back to the raw token. */
export function locationLabel(token: string | null | undefined, anywhere = "Anywhere"): string {
  if (!token || token.toLowerCase() === "anywhere") return anywhere;
  return resolveLocation(token)?.shortLabel ?? token;
}
