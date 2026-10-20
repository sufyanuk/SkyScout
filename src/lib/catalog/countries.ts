import type { CurrencyCode } from "@/lib/currency";
import { AIRPORTS } from "./airports";

export interface Country {
  code: string;
  name: string;
  /** Airport used as the departure point when someone picks this country. */
  mainAirport: string;
}

/** Countries SkyScout flies from: one entry per country in the airport catalogue. */
export const COUNTRIES: Country[] = AIRPORTS.filter((a, i) => AIRPORTS.findIndex((b) => b.countryCode === a.countryCode) === i)
  .map((a) => ({ code: a.countryCode, name: a.country, mainAirport: a.code }))
  .sort((a, b) => a.name.localeCompare(b.name));

export function getCountry(code: string | null | undefined): Country | undefined {
  return COUNTRIES.find((c) => c.code === code?.toUpperCase());
}

const EUROZONE = ["AT", "BE", "CY", "DE", "EE", "ES", "FI", "FR", "GR", "HR", "IE", "IT", "LT", "LU", "LV", "MT", "NL", "PT", "SI", "SK"];
const LOCAL_CURRENCY: Record<string, CurrencyCode> = {
  QA: "QAR", AE: "AED", SA: "SAR", OM: "OMR", KW: "KWD", BH: "BHD", IN: "INR", PK: "PKR", TR: "TRY",
  SG: "SGD", AU: "AUD", CA: "CAD", JP: "JPY", GB: "GBP", US: "USD",
  TH: "THB", MY: "MYR", ID: "IDR", HK: "HKD", LK: "LKR", MV: "MVR", NP: "NPR", EG: "EGP",
  GE: "GEL", AZ: "AZN", CZ: "CZK", ZA: "ZAR", TZ: "TZS",
};

/** The local currency for a country, when SkyScout supports it. */
export function currencyForCountry(code: string): CurrencyCode | undefined {
  return EUROZONE.includes(code) ? "EUR" : LOCAL_CURRENCY[code];
}
