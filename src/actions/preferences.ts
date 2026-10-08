"use server";

import { revalidatePath } from "next/cache";
import { getAirport } from "@/lib/catalog/airports";
import { setHomeAirportCookie } from "@/lib/services/preferences";
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
