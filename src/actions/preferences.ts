"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { CURRENCY_COOKIE, isCurrency } from "@/lib/currency";
import { getAirport } from "@/lib/catalog/airports";
import { getCountry } from "@/lib/catalog/countries";
import { getHomeAirport, setHomeAirportCookie } from "@/lib/services/preferences";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db";

/** Change the departure airport used for homepage feeds and Explore. */
export async function setHomeAirport(code: string): Promise<{ ok: boolean; error?: string }> {
  const airport = getAirport(code);
  if (!airport) return { ok: false, error: "Unknown airport" };
  await setHomeAirportCookie(airport.code);
  const user = await getCurrentUser();
  if (user) {
    await db.user.update({ where: { id: user.id }, data: { homeAirport: airport.code } }).catch(() => undefined);
  }
  revalidatePath("/", "layout");
  return { ok: true };
}

/** Remember the display currency. */
export async function setCurrency(code: string): Promise<{ ok: boolean }> {
  if (!isCurrency(code)) return { ok: false };
  (await cookies()).set(CURRENCY_COOKIE, code.toUpperCase(), { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
  revalidatePath("/", "layout");
  return { ok: true };
}

/** Save the header's regional settings: country (sets the departure airport) and currency. */
export async function setRegion(countryCode: string, currency: string): Promise<{ ok: boolean; error?: string }> {
  const country = getCountry(countryCode);
  if (!country || !isCurrency(currency)) return { ok: false, error: "Unknown country or currency" };
  // Keep the current airport if it's already in that country (e.g. Abu Dhabi rather than Dubai).
  if (getAirport(await getHomeAirport())?.countryCode !== country.code) {
    const result = await setHomeAirport(country.mainAirport);
    if (!result.ok) return result;
  }
  return setCurrency(currency);
}
