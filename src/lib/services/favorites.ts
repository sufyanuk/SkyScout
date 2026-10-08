import "server-only";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { getFlightProvider } from "@/lib/flights";
import type { FlightDeal } from "@/lib/flights/types";
import { todayIso } from "@/lib/dates";
import { CABIN_TO_DB, dateOnly } from "./mappers";

export class DealNotFoundError extends Error {
  constructor() {
    super("This deal is no longer available.");
  }
}

/** Snapshot a provider deal into FlightDeal so a favourite outlives the fare. */
export async function upsertDealSnapshot(deal: FlightDeal) {
  const fields = {
    provider: deal.provider,
    originCode: deal.origin.code,
    destinationCode: deal.destination.code,
    departureDate: dateOnly(deal.departureDate),
    returnDate: deal.returnDate ? dateOnly(deal.returnDate) : null,
    airlineCode: deal.airline.code,
    airlineName: deal.airline.name,
    stops: deal.outbound.stops,
    durationMinutes: deal.outbound.durationMinutes,
    cabin: CABIN_TO_DB[deal.cabin],
    price: deal.price,
    typicalPrice: deal.typicalPrice,
    currency: deal.currency,
    data: deal as unknown as Prisma.InputJsonValue,
  };
  await db.flightDeal.upsert({ where: { id: deal.id }, create: { id: deal.id, ...fields }, update: fields });
}

export async function getFavoriteDealIds(userId: string): Promise<Set<string>> {
  const rows = await db.favorite.findMany({ where: { userId }, select: { dealId: true } });
  return new Set(rows.map((r) => r.dealId));
}

export async function addFavorite(userId: string, dealId: string) {
  const deal = await getFlightProvider().getDeal(dealId);
  if (!deal) throw new DealNotFoundError();
  await upsertDealSnapshot(deal);
  return db.favorite.upsert({
    where: { userId_dealId: { userId, dealId: deal.id } },
    create: { userId, dealId: deal.id },
    update: {},
  });
}

export async function removeFavorite(userId: string, dealId: string) {
  const { count } = await db.favorite.deleteMany({ where: { userId, dealId } });
  return count > 0;
}

export interface SavedDeal {
  favoriteId: string;
  savedAt: Date;
  /** Latest provider data when available, otherwise the saved snapshot. */
  deal: FlightDeal;
  savedPrice: number;
  status: "available" | "departed" | "unavailable";
}

export async function listFavorites(userId: string): Promise<SavedDeal[]> {
  const rows = await db.favorite.findMany({
    where: { userId },
    include: { deal: true },
    orderBy: { createdAt: "desc" },
  });
  const provider = getFlightProvider();
  const today = todayIso();

  return Promise.all(
    rows.map(async (row) => {
      const snapshot = row.deal.data as unknown as FlightDeal;
      const departed = snapshot.departureDate < today;
      const live = departed ? null : await provider.getDeal(row.dealId).catch(() => null);
      return {
        favoriteId: row.id,
        savedAt: row.createdAt,
        deal: live ?? snapshot,
        savedPrice: row.deal.price,
        status: departed ? "departed" : live ? "available" : "unavailable",
      } satisfies SavedDeal;
    }),
  );
}
