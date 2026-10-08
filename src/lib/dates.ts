/**
 * Date helpers that work on plain "YYYY-MM-DD" strings in UTC, so server and
 * client never disagree about which day a flight departs.
 */
import type { IsoDate } from "@/lib/flights/types";

const ISO_RE = /^\d{4}-\d{2}-\d{2}$/;

export function isIsoDate(value: string | null | undefined): value is IsoDate {
  if (!value || !ISO_RE.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

export function toIsoDate(date: Date): IsoDate {
  return date.toISOString().slice(0, 10);
}

export function parseIsoDate(value: IsoDate): Date {
  return new Date(`${value}T00:00:00Z`);
}

export function todayIso(): IsoDate {
  return toIsoDate(new Date());
}

export function addDays(value: IsoDate, days: number): IsoDate {
  const d = parseIsoDate(value);
  d.setUTCDate(d.getUTCDate() + days);
  return toIsoDate(d);
}

/** Whole days from a to b (b - a). */
export function diffDays(a: IsoDate, b: IsoDate): number {
  return Math.round((parseIsoDate(b).getTime() - parseIsoDate(a).getTime()) / 86_400_000);
}

/** 0 = Sunday … 6 = Saturday. */
export function dayOfWeek(value: IsoDate): number {
  return parseIsoDate(value).getUTCDay();
}

export function monthOf(value: IsoDate): number {
  return parseIsoDate(value).getUTCMonth() + 1;
}

/** First day of the month after `value`. */
export function startOfNextMonth(value: IsoDate): IsoDate {
  const d = parseIsoDate(value);
  return toIsoDate(new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1)));
}

/** The next `count` Fridays at least `minLead` days after `from`. */
export function upcomingFridays(from: IsoDate, count: number, minLead = 2): IsoDate[] {
  let cursor = addDays(from, minLead);
  while (dayOfWeek(cursor) !== 5) cursor = addDays(cursor, 1);
  return Array.from({ length: count }, (_, i) => addDays(cursor, i * 7));
}

/** Compact "YYYYMMDD" form used inside deal ids. */
export function compactDate(value: IsoDate): string {
  return value.replaceAll("-", "");
}

export function expandCompactDate(value: string): IsoDate | null {
  if (!/^\d{8}$/.test(value)) return null;
  const iso = `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}`;
  return isIsoDate(iso) ? iso : null;
}
