import "server-only";
import { db } from "@/lib/db";
import type { FlightDeal, FlightSearchParams } from "@/lib/flights/types";
import { todayIso } from "@/lib/dates";
import { CABIN_TO_DB, dateOnly } from "./mappers";

export async function recordSearch(
  userId: string | null,
  params: FlightSearchParams,
  query: string,
  deals: FlightDeal[],
) {
  const cheapest = deals.reduce<number | null>((min, d) => (min === null || d.price < min ? d.price : min), null);
  await db.search.create({
    data: {
      userId,
      originCode: params.from,
      destination: params.to,
      departureDate: params.departure ? dateOnly(params.departure) : null,
      returnDate: params.returnDate ? dateOnly(params.returnDate) : null,
      query,
      resultCount: deals.length,
      cheapestPrice: cheapest,
    },
  });
}

/** Store today's cheapest fare per route so price history accumulates for any provider. */
export async function recordPriceObservations(deals: FlightDeal[]) {
  const cheapest = new Map<string, FlightDeal>();
  for (const d of deals) {
    if (d.returnDate === null) continue; // history is tracked for return fares
    const key = `${d.origin.code}-${d.destination.code}-${d.cabin}`;
    const current = cheapest.get(key);
    if (!current || d.price < current.price) cheapest.set(key, d);
  }
  const observedOn = dateOnly(todayIso());
  await Promise.all(
    [...cheapest.values()].slice(0, 40).map((d) =>
      db.priceHistory.upsert({
        where: {
          originCode_destinationCode_cabin_observedOn: {
            originCode: d.origin.code,
            destinationCode: d.destination.code,
            cabin: CABIN_TO_DB[d.cabin],
            observedOn,
          },
        },
        create: {
          originCode: d.origin.code,
          destinationCode: d.destination.code,
          cabin: CABIN_TO_DB[d.cabin],
          observedOn,
          price: d.price,
        },
        update: {},
      }),
    ),
  );
}

export async function listSearches(userId: string, take = 20) {
  return db.search.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take });
}
