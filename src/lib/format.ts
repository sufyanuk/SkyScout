import { parseIsoDate } from "@/lib/dates";
import type { Cabin, DealRating, IsoDate } from "@/lib/flights/types";

const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

export function formatPrice(amount: number): string {
  return usd.format(amount);
}

/** 425 → "7h 05m" */
export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  return `${h}h ${String(m).padStart(2, "0")}m`;
}

/** "2026-11-12T23:20" → "23:20" */
export function formatTime(localDateTime: string): string {
  return localDateTime.slice(11, 16);
}

/** Days between the local departure and arrival dates (for "+1" badges). */
export function dayOffset(departure: string, arrival: string): number {
  return Math.round(
    (parseIsoDate(arrival.slice(0, 10)).getTime() - parseIsoDate(departure.slice(0, 10)).getTime()) / 86_400_000,
  );
}

const dayMonth = new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", day: "numeric", month: "short" });
const day = new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", day: "numeric" });
const month = new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", month: "short" });
const longDate = new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", weekday: "short", day: "numeric", month: "short", year: "numeric" });
const weekdayShort = new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", weekday: "short", day: "numeric", month: "short" });
const monthYear = new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", month: "long", year: "numeric" });

/** "12 Nov" */
export function formatDate(value: IsoDate): string {
  return dayMonth.format(parseIsoDate(value));
}

/** "Thu 12 Nov" */
export function formatDateWeekday(value: IsoDate): string {
  return weekdayShort.format(parseIsoDate(value)).replace(",", "");
}

/** "Thu, 12 Nov 2026" */
export function formatDateLong(value: IsoDate): string {
  return longDate.format(parseIsoDate(value));
}

export function formatMonthYear(value: IsoDate): string {
  return monthYear.format(parseIsoDate(value));
}

/** "12–19 Nov", "28 Nov – 3 Dec", or "12 Nov" for one-way. */
export function formatDateRange(start: IsoDate, end: IsoDate | null): string {
  if (!end) return formatDate(start);
  const a = parseIsoDate(start);
  const b = parseIsoDate(end);
  if (month.format(a) === month.format(b) && a.getUTCFullYear() === b.getUTCFullYear()) {
    return `${day.format(a)}–${day.format(b)} ${month.format(b)}`;
  }
  return `${dayMonth.format(a)} – ${dayMonth.format(b)}`;
}

export function formatStops(stops: number): string {
  if (stops === 0) return "Direct";
  return stops === 1 ? "1 stop" : `${stops} stops`;
}

export const CABIN_LABELS: Record<Cabin, string> = {
  economy: "Economy",
  premium: "Premium economy",
  business: "Business",
  first: "First",
};

export const RATING_LABELS: Record<DealRating, string> = {
  exceptional: "Exceptional deal",
  great: "Great deal",
  good: "Good deal",
  fair: "Fair price",
};

const relative = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

export function formatRelative(date: Date, now = new Date()): string {
  const seconds = Math.round((date.getTime() - now.getTime()) / 1000);
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ["day", 86_400],
    ["hour", 3_600],
    ["minute", 60],
  ];
  for (const [unit, size] of units) {
    if (Math.abs(seconds) >= size) return relative.format(Math.round(seconds / size), unit);
  }
  return "just now";
}

export function pluralize(count: number, singular: string, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`;
}
