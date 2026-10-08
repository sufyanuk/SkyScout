import type { CabinClass, DateFlexibility, TripDuration } from "@prisma/client";
import type { Cabin, TripLength, WhenOption } from "@/lib/flights/types";

export const CABIN_TO_DB: Record<Cabin, CabinClass> = {
  economy: "ECONOMY",
  premium: "PREMIUM_ECONOMY",
  business: "BUSINESS",
  first: "FIRST",
};

export const CABIN_FROM_DB: Record<CabinClass, Cabin> = {
  ECONOMY: "economy",
  PREMIUM_ECONOMY: "premium",
  BUSINESS: "business",
  FIRST: "first",
};

export const DURATION_TO_TRIP: Record<TripDuration, TripLength> = {
  ANY: "any",
  WEEKEND: "weekend",
  SHORT: "short",
  WEEK: "week",
  TWO_WEEKS: "two-weeks",
};

export const DURATION_NIGHTS: Record<TripDuration, number> = {
  ANY: 7,
  WEEKEND: 2,
  SHORT: 4,
  WEEK: 7,
  TWO_WEEKS: 14,
};

export const FLEX_TO_WHEN: Record<DateFlexibility, WhenOption> = {
  EXACT: "exact",
  PLUS_MINUS_3: "flexible",
  ANY: "anytime",
};

export const FLEX_LABELS: Record<DateFlexibility, string> = {
  EXACT: "Exact date",
  PLUS_MINUS_3: "± 3 days",
  ANY: "Any time",
};

export const DURATION_LABELS: Record<TripDuration, string> = {
  ANY: "Any length",
  WEEKEND: "Weekend",
  SHORT: "3–5 days",
  WEEK: "1 week",
  TWO_WEEKS: "2 weeks",
};

export function dateOnly(iso: string): Date {
  return new Date(`${iso}T00:00:00Z`);
}

export function isoFromDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}
