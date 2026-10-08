import "server-only";
import type { PriceAlert } from "@prisma/client";
import { db } from "@/lib/db";
import { getAirport } from "@/lib/catalog/airports";
import { addDays } from "@/lib/dates";
import { getFlightProvider } from "@/lib/flights";
import type { FlightDeal, FlightSearchParams } from "@/lib/flights/types";
import { formatPrice } from "@/lib/format";
import { buildSearchHref } from "@/lib/search-params";
import { absoluteUrl } from "@/lib/site";
import type { AlertInput } from "@/lib/validation";
import {
  CABIN_FROM_DB,
  DURATION_NIGHTS,
  DURATION_TO_TRIP,
  FLEX_TO_WHEN,
  dateOnly,
  isoFromDate,
} from "./mappers";
import { notifications } from "./notifications";

/** How often an active alert is re-checked when its owner visits. */
const RECHECK_AFTER_MS = 30 * 60 * 1000;

export function alertRouteLabel(alert: Pick<PriceAlert, "originCode" | "destinationCode">) {
  const from = getAirport(alert.originCode)?.city ?? alert.originCode;
  const to = alert.destinationCode ? (getAirport(alert.destinationCode)?.city ?? alert.destinationCode) : "Anywhere";
  return `${from} → ${to}`;
}

export function alertToSearch(alert: PriceAlert): FlightSearchParams {
  const when = FLEX_TO_WHEN[alert.dateFlexibility];
  const departure = alert.departureDate && when !== "anytime" ? isoFromDate(alert.departureDate) : null;
  return {
    from: alert.originCode,
    to: alert.destinationCode,
    when,
    departure,
    returnDate: departure ? addDays(departure, DURATION_NIGHTS[alert.tripDuration]) : null,
    oneWay: false,
    adults: 1,
    children: 0,
    cabin: CABIN_FROM_DB[alert.cabin],
    tripLength: departure ? "any" : DURATION_TO_TRIP[alert.tripDuration],
    minNights: null,
    maxNights: null,
  };
}

export function alertSearchHref(alert: PriceAlert) {
  const p = alertToSearch(alert);
  return buildSearchHref({
    from: p.from,
    to: p.to,
    departure: p.departure,
    returnDate: p.returnDate,
    when: p.when,
    cabin: p.cabin,
    extra: {
      maxPrice: alert.maxPrice,
      stops: alert.maxStops === null ? undefined : Array.from({ length: alert.maxStops + 1 }, (_, i) => i).join(","),
      length: p.tripLength !== "any" ? p.tripLength : undefined,
      sort: "cheapest",
    },
  });
}

async function cheapestFor(alert: PriceAlert): Promise<FlightDeal | null> {
  const stops = alert.maxStops === null ? [] : Array.from({ length: alert.maxStops + 1 }, (_, i) => i);
  const result = await getFlightProvider().searchFlights(alertToSearch(alert), { filters: { stops }, sort: "cheapest" });
  return result.deals[0] ?? null;
}

/** Re-price one alert and trigger it if the fare is at or under the target. */
export async function evaluateAlert(alert: PriceAlert, userEmail: string | null = null) {
  const cheapest = await cheapestFor(alert);
  const now = new Date();
  const price = cheapest?.price ?? null;

  if (cheapest && price !== null && price <= alert.maxPrice && alert.status === "ACTIVE") {
    const updated = await db.priceAlert.update({
      where: { id: alert.id },
      data: {
        status: "TRIGGERED",
        lastCheckedAt: now,
        lastSeenPrice: price,
        triggeredAt: now,
        triggeredPrice: price,
        triggeredDealId: cheapest.id,
        events: {
          create: {
            type: "TRIGGERED",
            price,
            dealId: cheapest.id,
            message: `Price dropped to ${formatPrice(price)} (target ${formatPrice(alert.maxPrice)}) with ${cheapest.airline.name}.`,
          },
        },
      },
    });
    await notifications.send({
      userId: alert.userId,
      email: userEmail,
      subject: `${alertRouteLabel(alert)} is now ${formatPrice(price)}`,
      body: `A fare matching your alert is available for ${formatPrice(price)}.`,
      url: absoluteUrl(`/deals/${cheapest.id}`),
    });
    return updated;
  }

  return db.priceAlert.update({
    where: { id: alert.id },
    data: { lastCheckedAt: now, lastSeenPrice: price },
  });
}

/** Check a user's (or everyone's) active alerts that haven't been checked recently. */
export async function checkDueAlerts(userId?: string, force = false) {
  const due = await db.priceAlert.findMany({
    where: {
      status: "ACTIVE",
      ...(userId ? { userId } : {}),
      ...(force ? {} : { OR: [{ lastCheckedAt: null }, { lastCheckedAt: { lt: new Date(Date.now() - RECHECK_AFTER_MS) } }] }),
    },
    include: { user: { select: { email: true } } },
    take: 200,
  });
  for (const alert of due) {
    await evaluateAlert(alert, alert.user.email);
  }
  return due.length;
}

export async function listAlerts(userId: string) {
  return db.priceAlert.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: { events: { orderBy: { createdAt: "desc" }, take: 20 } },
  });
}

export type AlertWithEvents = Awaited<ReturnType<typeof listAlerts>>[number];

export async function createAlert(userId: string, input: AlertInput) {
  const destination = input.destination && input.destination !== "ANYWHERE" ? input.destination : null;
  const alert = await db.priceAlert.create({
    data: {
      userId,
      originCode: input.origin,
      destinationCode: destination,
      maxPrice: input.maxPrice,
      dateFlexibility: input.dateFlexibility,
      departureDate: input.dateFlexibility !== "ANY" && input.departureDate ? dateOnly(input.departureDate) : null,
      tripDuration: input.tripDuration,
      maxStops: input.maxStops ?? null,
      cabin: input.cabin,
      events: {
        create: {
          type: "CREATED",
          message: `Alert created: ${alertRouteLabel({ originCode: input.origin, destinationCode: destination })} under ${formatPrice(input.maxPrice)}.`,
        },
      },
    },
  });
  const user = await db.user.findUnique({ where: { id: userId }, select: { email: true } });
  return evaluateAlert(alert, user?.email ?? null);
}

export async function deleteAlert(userId: string, alertId: string) {
  const alert = await db.priceAlert.findFirst({ where: { id: alertId, userId, status: { not: "DELETED" } } });
  if (!alert) return false;
  await db.priceAlert.update({
    where: { id: alert.id },
    data: { status: "DELETED", events: { create: { type: "DELETED", message: "Alert deleted." } } },
  });
  return true;
}

export async function setAlertPaused(userId: string, alertId: string, paused: boolean) {
  const alert = await db.priceAlert.findFirst({ where: { id: alertId, userId, status: { not: "DELETED" } } });
  if (!alert) return null;
  const updated = await db.priceAlert.update({
    where: { id: alert.id },
    data: paused
      ? { status: "PAUSED", events: { create: { type: "PAUSED", message: "Alert paused." } } }
      : {
          status: "ACTIVE",
          triggeredAt: null,
          triggeredPrice: null,
          triggeredDealId: null,
          events: { create: { type: "RESUMED", message: "Alert re-armed — watching for new drops." } },
        },
  });
  return paused ? updated : evaluateAlert(updated);
}
