"use client";

import { useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { addDays, dayOfWeek, diffDays, parseIsoDate, toIsoDate } from "@/lib/dates";
import { cn } from "@/lib/utils";

export interface DateRange {
  start: string;
  end: string;
}

interface DateRangePickerProps {
  label: string;
  /** Heading inside the popover, e.g. "Departure Date Range". */
  title: string;
  subtitle?: string;
  value: DateRange | null;
  onChange: (range: DateRange) => void;
  /** Earliest selectable date (YYYY-MM-DD). */
  min: string;
  /** "today" for computing presets (server-provided to avoid hydration drift). */
  today: string;
  disabled?: boolean;
  disabledLabel?: string;
  className?: string;
}

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const monthTitle = new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", month: "short", year: "numeric" });
const monthDay = new Intl.DateTimeFormat("en-US", { timeZone: "UTC", month: "short", day: "numeric" });
const fullLabel = new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", weekday: "long", day: "numeric", month: "long", year: "numeric" });

function ordinal(n: number) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] ?? s[v] ?? s[0]}`;
}

/** "Oct 8th – Nov 6th, 2026" */
export function formatRange(range: DateRange): string {
  const a = parseIsoDate(range.start);
  const b = parseIsoDate(range.end);
  const part = (d: Date) => `${monthDay.format(d).split(" ")[0]} ${ordinal(d.getUTCDate())}`;
  const year = b.getUTCFullYear();
  return range.start === range.end ? `${part(a)}, ${year}` : `${part(a)} – ${part(b)}, ${year}`;
}

function presetsFor(today: string): { label: string; range: () => DateRange }[] {
  const fromToday = (days: number) => ({ start: addDays(today, 1), end: addDays(today, days) });
  return [
    {
      label: "This Weekend",
      range: () => {
        let fri = addDays(today, 1);
        while (dayOfWeek(fri) !== 5) fri = addDays(fri, 1);
        return { start: fri, end: addDays(fri, 2) };
      },
    },
    { label: "Next 7 Days", range: () => fromToday(7) },
    { label: "Next 30 Days", range: () => fromToday(30) },
    { label: "Next 60 Days", range: () => fromToday(60) },
    { label: "Next 90 Days", range: () => fromToday(90) },
    { label: "Next 180 Days", range: () => fromToday(180) },
  ];
}

function firstOfMonth(iso: string) {
  const d = parseIsoDate(iso);
  return toIsoDate(new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1)));
}

function shiftMonth(iso: string, by: number) {
  const d = parseIsoDate(iso);
  return toIsoDate(new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + by, 1)));
}

/** 6×7 grid of dates for the month containing `first`, Sunday-first. */
function monthGrid(first: string): string[] {
  const start = addDays(first, -dayOfWeek(first));
  return Array.from({ length: 42 }, (_, i) => addDays(start, i));
}

/**
 * Range picker with quick presets and a two-month calendar. Selection is a
 * draft until "Apply", so browsing never changes the search by accident.
 */
export function DateRangePicker({
  label,
  title,
  subtitle,
  value,
  onChange,
  min,
  today,
  disabled,
  disabledLabel,
  className,
}: DateRangePickerProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<{ start: string; end: string | null } | null>(value);
  const [hover, setHover] = useState<string | null>(null);
  const [month, setMonth] = useState(() => firstOfMonth(value?.start ?? min));
  const presets = useMemo(() => presetsFor(today), [today]);

  function openChange(next: boolean) {
    if (next) {
      setDraft(value);
      setMonth(firstOfMonth(value?.start ?? min));
    }
    setOpen(next);
  }

  function pick(date: string) {
    if (!draft || draft.end) {
      setDraft({ start: date, end: null });
    } else if (date < draft.start) {
      setDraft({ start: date, end: draft.start });
    } else {
      setDraft({ start: draft.start, end: date });
    }
  }

  const activePreset = presets.find((p) => {
    const r = p.range();
    return draft?.start === r.start && draft?.end === r.end;
  })?.label;

  const rangeEnd = draft?.end ?? (draft && hover && hover >= draft.start ? hover : null);
  const inRange = (d: string) => !!draft && !!rangeEnd && d > draft.start && d < rangeEnd;

  function apply() {
    if (!draft) return;
    onChange({ start: draft.start, end: draft.end ?? draft.start });
    setOpen(false);
  }

  if (disabled) {
    return (
      <div className={cn("flex min-h-[60px] items-center gap-3 rounded-2xl border border-input bg-muted/60 px-4", className)}>
        <CalendarDays className="size-[18px] text-muted-foreground" aria-hidden="true" />
        <span className="flex flex-col py-2">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</span>
          <span className="text-[15px] text-muted-foreground">{disabledLabel}</span>
        </span>
      </div>
    );
  }

  return (
    <Popover open={open} onOpenChange={openChange}>
      <PopoverTrigger
        className={cn(
          "flex min-h-[60px] w-full items-center gap-3 rounded-2xl border border-input bg-card px-4 text-left outline-none transition hover:border-foreground/25 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/15",
          className,
        )}
        aria-label={`${label}: ${value ? formatRange(value) : "choose dates"}`}
      >
        <CalendarDays className="size-[18px] shrink-0 text-muted-foreground" aria-hidden="true" />
        <span className="flex min-w-0 flex-col py-2">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</span>
          <span className={cn("truncate text-[15px] font-semibold", !value && "font-normal text-muted-foreground")}>
            {value ? formatRange(value) : "Select dates"}
          </span>
        </span>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[min(680px,calc(100vw-1.5rem))] p-0">
        <div className="border-b px-4 py-3 text-sm">
          <span className="font-semibold">{title}</span>
          {subtitle && <span className="text-muted-foreground"> ({subtitle})</span>}
        </div>
        <div className="flex flex-col sm:flex-row">
          <ul className="no-scrollbar flex gap-1 overflow-x-auto border-b p-2 sm:w-40 sm:shrink-0 sm:flex-col sm:border-r sm:border-b-0">
            {presets.map((p) => (
              <li key={p.label} className="shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    const r = p.range();
                    setDraft(r);
                    setMonth(firstOfMonth(r.start));
                  }}
                  className={cn(
                    "w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-muted",
                    activePreset === p.label && "bg-primary text-primary-foreground hover:bg-primary",
                  )}
                >
                  {p.label}
                </button>
              </li>
            ))}
            <li className="shrink-0">
              <span
                className={cn(
                  "block rounded-lg px-3 py-2 text-sm",
                  draft && !activePreset ? "bg-primary text-primary-foreground" : "text-muted-foreground",
                )}
              >
                Custom Range
              </span>
            </li>
          </ul>
          <div className="grid flex-1 gap-4 p-3 sm:grid-cols-2">
            {[0, 1].map((offset) => {
              const first = shiftMonth(month, offset);
              const thisMonth = parseIsoDate(first).getUTCMonth();
              return (
                <div key={first} className={cn(offset === 1 && "hidden sm:block")}>
                  <div className="mb-2 flex items-center justify-between">
                    {offset === 0 ? (
                      <button
                        type="button"
                        onClick={() => setMonth(shiftMonth(month, -1))}
                        disabled={shiftMonth(month, -1) < firstOfMonth(min)}
                        aria-label="Previous month"
                        className="flex size-8 items-center justify-center rounded-full hover:bg-muted disabled:opacity-30"
                      >
                        <ChevronLeft className="size-4" />
                      </button>
                    ) : (
                      <span className="size-8" />
                    )}
                    <span className="text-sm font-semibold">{monthTitle.format(parseIsoDate(first))}</span>
                    <button
                      type="button"
                      onClick={() => setMonth(shiftMonth(month, 1))}
                      aria-label="Next month"
                      className={cn("flex size-8 items-center justify-center rounded-full hover:bg-muted", offset === 0 && "sm:invisible")}
                    >
                      <ChevronRight className="size-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-7 text-center text-xs font-semibold text-muted-foreground">
                    {WEEKDAYS.map((w) => (
                      <span key={w} className="py-1">
                        {w}
                      </span>
                    ))}
                  </div>
                  <div className="grid grid-cols-7" onMouseLeave={() => setHover(null)}>
                    {monthGrid(first).map((d) => {
                      const outside = parseIsoDate(d).getUTCMonth() !== thisMonth;
                      const tooEarly = d < min;
                      const isStart = draft?.start === d;
                      const isEnd = rangeEnd === d;
                      const between = inRange(d);
                      if (outside) return <span key={d} className="h-9" aria-hidden="true" />;
                      return (
                        <button
                          key={d}
                          type="button"
                          disabled={tooEarly}
                          onClick={() => pick(d)}
                          onMouseEnter={() => setHover(d)}
                          aria-label={fullLabel.format(parseIsoDate(d))}
                          aria-pressed={isStart || isEnd}
                          className={cn(
                            "h-9 text-sm tabular-nums transition",
                            "text-foreground",
                            tooEarly && "cursor-not-allowed opacity-30",
                            between && "bg-accent",
                            !tooEarly && !isStart && !isEnd && "hover:bg-muted",
                            (isStart || isEnd) && "rounded-md bg-primary font-semibold text-primary-foreground",
                          )}
                        >
                          {parseIsoDate(d).getUTCDate()}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="flex items-center justify-between gap-2 border-t px-4 py-3">
          <span className="text-sm text-muted-foreground">
            {draft
              ? `${formatRange({ start: draft.start, end: draft.end ?? draft.start })}${
                  draft.end ? ` · ${diffDays(draft.start, draft.end) + 1} days` : " · pick an end date"
                }`
              : "Pick a start date"}
          </span>
          <div className="flex gap-2">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={apply} disabled={!draft}>
              Apply
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
