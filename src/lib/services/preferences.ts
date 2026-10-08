import "server-only";
import { cookies } from "next/headers";
import { DEFAULT_ORIGIN, getAirport } from "@/lib/catalog/airports";
import { CURRENCY_COOKIE, toCurrency, type CurrencyCode } from "@/lib/currency";

export const HOME_AIRPORT_COOKIE = "ss_home";

/** The visitor's preferred departure airport (cookie → default DOH). */
export async function getHomeAirport(): Promise<string> {
  const value = (await cookies()).get(HOME_AIRPORT_COOKIE)?.value;
  return getAirport(value)?.code ?? DEFAULT_ORIGIN;
}

export async function setHomeAirportCookie(code: string) {
  (await cookies()).set(HOME_AIRPORT_COOKIE, code, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
}

/** The visitor's display currency (cookie → USD). Prices stay USD internally. */
export async function getCurrency(): Promise<CurrencyCode> {
  return toCurrency((await cookies()).get(CURRENCY_COOKIE)?.value);
}
