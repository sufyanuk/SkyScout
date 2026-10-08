"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeftRight,
  Armchair,
  ChevronDown,
  Coins,
  Loader2,
  MoonStar,
  PlaneLanding,
  PlaneTakeoff,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import { toast } from "sonner";
import { setCurrency } from "@/actions/preferences";
import { useCurrency } from "@/components/common/currency-provider";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AIRLINES } from "@/lib/catalog/airlines";
import { CURRENCIES } from "@/lib/currency";
import { addDays } from "@/lib/dates";
import { CABINS, type Cabin, type SortOption, type TimeBucket, type TransferOption } from "@/lib/flights/types";
import { CABIN_LABELS } from "@/lib/format";
import { buildSearchHref } from "@/lib/search-params";
import { cn } from "@/lib/utils";
import { AirportSelector, ANYWHERE } from "./airport-selector";
import { DateRangePicker, type DateRange } from "./date-range-picker";
import { TravelerSelector } from "./traveler-selector";

export interface SearchBoxValues {
  from: string;
  to: string;
  /** Departure window (YYYY-MM-DD). */
  departure: string;
  until: string;
  /** Return window (YYYY-MM-DD); ignored for one-way trips. */
  returnFrom: string;
  returnUntil: string;
  oneWay: boolean;
  adults: number;
  children: number;
  infants: number;
  cabin: Cabin;
  minNights: number | null;
  maxNights: number | null;
  // Additional options
  sort: SortOption;
  stops: "any" | "0" | "1";
  limit: number;
  /** Max budget per person in USD (shown in the visitor's currency). */
  maxPriceUsd: number | null;
  maxLayover: number | null;
  dep: TimeBucket | "any";
  transfer: TransferOption;
  airlines: string[];
}

interface SearchBoxProps {
  initial: Partial<SearchBoxValues> & { from: string };
  /** Server "today" (YYYY-MM-DD) so server and client agree on min dates. */
  today: string;
  variant?: "hero" | "compact";
  /** Extra URL params to keep (e.g. the current view on the results page). */
  keep?: Record<string, string>;
  onSubmitted?: () => void;
  className?: string;
}

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "cheapest", label: "Lowest price" },
  { value: "best", label: "Best overall" },
  { value: "fastest", label: "Fastest" },
  { value: "value", label: "Biggest saving" },
];

const DEFAULTS: Omit<SearchBoxValues, "from" | "departure" | "until" | "returnFrom" | "returnUntil"> = {
  to: ANYWHERE,
  oneWay: false,
  adults: 1,
  children: 0,
  infants: 0,
  cabin: "economy",
  minNights: null,
  maxNights: null,
  sort: "best",
  stops: "any",
  limit: 24,
  maxPriceUsd: null,
  maxLayover: null,
  dep: "any",
  transfer: "include",
  airlines: [],
};

/** A return window that fits a departure window: a couple of days after it starts to two weeks after it ends. */
function defaultReturn(departure: DateRange): DateRange {
  return { start: addDays(departure.start, 2), end: addDays(departure.end, 14) };
}

function initialValues(initial: SearchBoxProps["initial"], today: string): SearchBoxValues {
  const departure =
    initial.departure && initial.departure > today
      ? { start: initial.departure, end: initial.until && initial.until >= initial.departure ? initial.until : initial.departure }
      : { start: addDays(today, 1), end: addDays(today, 30) };
  const ret =
    initial.returnFrom && initial.returnUntil && initial.returnUntil >= initial.returnFrom && initial.returnUntil > departure.start
      ? { start: initial.returnFrom, end: initial.returnUntil }
      : defaultReturn(departure);
  return {
    ...DEFAULTS,
    ...initial,
    departure: departure.start,
    until: departure.end,
    returnFrom: ret.start,
    returnUntil: ret.end,
  };
}

/** How many "Additional options" differ from their defaults. */
function advancedCount(v: SearchBoxValues) {
  return [
    v.sort !== DEFAULTS.sort,
    v.stops !== "any",
    v.limit !== DEFAULTS.limit,
    v.maxPriceUsd !== null,
    v.maxLayover !== null,
    v.dep !== "any",
    v.transfer !== "include",
    v.airlines.length > 0,
  ].filter(Boolean).length;
}

const numOrNull = (value: string) => {
  const n = Number(value);
  return value.trim() === "" || !Number.isFinite(n) || n <= 0 ? null : n;
};

export function SearchBox({ initial, today, variant = "hero", keep, onSubmitted, className }: SearchBoxProps) {
  const router = useRouter();
  const money = useCurrency();
  const [pending, startTransition] = useTransition();
  const [currencyPending, startCurrency] = useTransition();
  const [v, setV] = useState<SearchBoxValues>(() => initialValues(initial, today));
  const [showMore, setShowMore] = useState(() => advancedCount(initialValues(initial, today)) > 0 && variant === "compact");
  const [budgetText, setBudgetText] = useState(() =>
    initial.maxPriceUsd ? String(Math.round(money.convert(initial.maxPriceUsd))) : "",
  );
  const update = (patch: Partial<SearchBoxValues>) => setV((prev) => ({ ...prev, ...patch }));
  const minDate = addDays(today, 1);
  const moreCount = advancedCount(v);

  function changeDeparture(range: DateRange) {
    // Keep the return window valid: it must end after the first possible departure.
    const keepReturn = v.returnUntil > range.start;
    const ret = keepReturn ? { start: v.returnFrom, end: v.returnUntil } : defaultReturn(range);
    update({ departure: range.start, until: range.end, returnFrom: ret.start, returnUntil: ret.end });
  }

  function changeCurrency(code: string) {
    startCurrency(async () => {
      await setCurrency(code);
      router.refresh();
    });
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!v.oneWay && v.returnUntil <= v.departure) {
      toast.error("Return dates must be after departure", { description: "Pick a return range that ends after you leave." });
      return;
    }
    if (v.minNights && v.maxNights && v.minNights > v.maxNights) {
      toast.error("Minimum stay is longer than the maximum");
      return;
    }
    if (v.to === v.from) {
      toast.error("Origin and destination are the same", { description: "Pick another destination or try “Anywhere”." });
      return;
    }
    const budget = numOrNull(budgetText);
    const href = buildSearchHref({
      from: v.from,
      to: v.to,
      departure: v.departure,
      when: "range",
      oneWay: v.oneWay,
      adults: v.adults,
      children: v.children,
      infants: v.infants,
      cabin: v.cabin,
      extra: {
        ...keep,
        until: v.until,
        returnFrom: v.oneWay ? null : v.returnFrom,
        returnUntil: v.oneWay ? null : v.returnUntil,
        minNights: v.oneWay ? null : v.minNights,
        maxNights: v.oneWay ? null : v.maxNights,
        sort: v.sort !== "best" ? v.sort : null,
        stops: v.stops === "any" ? null : v.stops === "0" ? "0" : "0,1",
        limit: v.limit !== DEFAULTS.limit ? v.limit : null,
        maxPrice: budget ? Math.round(money.toUsd(budget)) : null,
        maxLayover: v.maxLayover,
        dep: v.dep !== "any" ? v.dep : null,
        transfer: v.transfer !== "include" ? v.transfer : null,
        airlines: v.airlines.length ? v.airlines.join(",") : null,
      },
    });
    startTransition(() => {
      router.push(href);
      onSubmitted?.();
    });
  }

  const compact = variant === "compact";

  return (
    <form
      onSubmit={submit}
      role="search"
      aria-label="Search flights"
      className={cn(
        "rounded-[28px] border bg-card/95 p-3 shadow-float backdrop-blur sm:p-4",
        compact && "rounded-3xl p-3 shadow-card sm:p-3",
        className,
      )}
    >
      {/* Trip type */}
      <div className="mb-3 flex items-center gap-2">
        <div role="radiogroup" aria-label="Trip type" className="flex shrink-0 rounded-full bg-muted p-1">
          {[
            { label: "Return", oneWay: false },
            { label: "One-way", oneWay: true },
          ].map((opt) => (
            <button
              key={opt.label}
              type="button"
              role="radio"
              aria-checked={v.oneWay === opt.oneWay}
              onClick={() => update({ oneWay: opt.oneWay })}
              className={cn(
                "rounded-full px-3.5 py-1.5 text-[13px] font-semibold text-muted-foreground transition",
                v.oneWay === opt.oneWay && "bg-card text-foreground shadow-sm",
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-2 lg:grid-cols-[1fr_1fr_0.8fr_0.8fr]">
        <div className="relative grid gap-2 sm:grid-cols-2 lg:col-span-2">
          <AirportSelector
            label="From"
            value={v.from}
            onChange={(from) => update({ from })}
            icon={<PlaneTakeoff />}
            exclude={v.to}
            allowGroups
          />
          <AirportSelector
            label="To"
            value={v.to || ANYWHERE}
            onChange={(to) => update({ to })}
            allowAnywhere
            allowGroups
            icon={v.to === ANYWHERE ? undefined : <PlaneLanding />}
            exclude={v.from}
          />
          <button
            type="button"
            onClick={() => v.to !== ANYWHERE && update({ from: v.to, to: v.from })}
            disabled={v.to === ANYWHERE}
            aria-label="Swap origin and destination"
            className="absolute top-1/2 left-1/2 z-10 hidden size-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border bg-card shadow-sm transition hover:rotate-180 hover:bg-muted disabled:opacity-40 sm:flex"
          >
            <ArrowLeftRight className="size-4" aria-hidden="true" />
          </button>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 lg:col-span-2">
          <DateRangePicker
            label="Departure date range"
            title="Departure Date Range"
            subtitle="select range of dates to leave"
            value={{ start: v.departure, end: v.until }}
            onChange={changeDeparture}
            min={minDate}
            today={today}
          />
          <DateRangePicker
            label="Return date range"
            title="Return Date Range"
            subtitle="select range of dates to come back"
            value={{ start: v.returnFrom, end: v.returnUntil }}
            onChange={(r) => update({ returnFrom: r.start, returnUntil: r.end })}
            min={addDays(v.departure, 1)}
            today={today}
            disabled={v.oneWay}
            disabledLabel="One-way"
          />
        </div>

        <div className="grid grid-cols-2 gap-2 lg:col-span-4 lg:grid-cols-[1.2fr_1.1fr_1fr_1fr_auto]">
          <TravelerSelector
            adults={v.adults}
            childCount={v.children}
            infants={v.infants}
            onChange={(t) => update(t)}
            className="col-span-2 lg:col-span-1"
          />
          <StayField
            min={v.minNights}
            max={v.maxNights}
            onChange={(patch) => update(patch)}
            disabled={v.oneWay}
            className="col-span-2 lg:col-span-1"
          />
          <Select value={v.cabin} onValueChange={(cabin) => update({ cabin: cabin as Cabin })}>
            <SelectTrigger aria-label="Cabin class" className="h-auto min-h-[60px] rounded-2xl px-4 [&>span]:flex [&>span]:items-center">
              <span className="flex items-center gap-3">
                <Armchair className="size-[18px] text-muted-foreground" aria-hidden="true" />
                <span className="flex flex-col items-start py-2">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Cabin</span>
                  <span className="text-[15px] font-semibold text-foreground">
                    <SelectValue />
                  </span>
                </span>
              </span>
            </SelectTrigger>
            <SelectContent>
              {CABINS.map((c) => (
                <SelectItem key={c} value={c}>
                  {CABIN_LABELS[c]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={money.currency} onValueChange={changeCurrency}>
            <SelectTrigger
              aria-label="Currency"
              disabled={currencyPending}
              className="h-auto min-h-[60px] rounded-2xl px-4 [&>span]:flex [&>span]:items-center"
            >
              <span className="flex items-center gap-3">
                {currencyPending ? (
                  <Loader2 className="size-[18px] animate-spin text-muted-foreground" aria-hidden="true" />
                ) : (
                  <Coins className="size-[18px] text-muted-foreground" aria-hidden="true" />
                )}
                <span className="flex flex-col items-start py-2">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Currency</span>
                  <span className="text-[15px] font-semibold text-foreground">
                    <SelectValue />
                  </span>
                </span>
              </span>
            </SelectTrigger>
            <SelectContent className="max-h-72">
              {CURRENCIES.map((c) => (
                <SelectItem key={c.code} value={c.code}>
                  {c.code} · {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button type="submit" size="xl" disabled={pending} className="col-span-2 h-[60px] rounded-2xl px-8 text-base lg:col-span-1 lg:min-w-44">
            {pending ? <Loader2 className="size-5 animate-spin" aria-hidden="true" /> : <Search className="size-5" aria-hidden="true" />}
            {compact ? "Search" : "Find Flights"}
          </Button>
        </div>
      </div>

      {/* Additional options */}
      <div className="mt-3">
        <button
          type="button"
          onClick={() => setShowMore((s) => !s)}
          aria-expanded={showMore}
          aria-controls="search-more-options"
          className="inline-flex items-center gap-2 rounded-full px-2 py-1 text-sm font-semibold text-primary hover:bg-accent"
        >
          <SlidersHorizontal className="size-4" aria-hidden="true" />
          Additional options
          {moreCount > 0 && (
            <span className="rounded-full bg-primary px-1.5 text-[11px] text-primary-foreground">{moreCount}</span>
          )}
          <ChevronDown className={cn("size-4 transition-transform", showMore && "rotate-180")} aria-hidden="true" />
        </button>

        {showMore && (
          <div id="search-more-options" className="mt-3 grid grid-cols-2 gap-x-3 gap-y-4 border-t pt-4 lg:grid-cols-4">
            <OptionSelect
              label="Sort by"
              value={v.sort}
              onChange={(sort) => update({ sort: sort as SortOption })}
              options={SORT_OPTIONS}
            />
            <OptionSelect
              label="Stops"
              value={v.stops}
              onChange={(stops) => update({ stops: stops as SearchBoxValues["stops"] })}
              options={[
                { value: "any", label: "Any stops" },
                { value: "0", label: "Direct only" },
                { value: "1", label: "1 stop or fewer" },
              ]}
            />
            <OptionSelect
              label="Results quantity"
              value={String(v.limit)}
              onChange={(limit) => update({ limit: Number(limit) })}
              options={[24, 50, 100, 200].map((n) => ({ value: String(n), label: `${n} results` }))}
            />
            <OptionSelect
              label="Connections"
              hint="Self-transfer combines separate tickets: cheaper, but you re-check bags and aren't protected if a flight is late."
              value={v.transfer}
              onChange={(transfer) => update({ transfer: transfer as TransferOption })}
              options={[
                { value: "include", label: "Include self-transfer" },
                { value: "exclude", label: "Protected connections only" },
                { value: "only", label: "Self-transfer only" },
              ]}
            />
            <NumberField
              label="Max budget"
              prefix={money.currency}
              value={budgetText}
              onChange={setBudgetText}
              placeholder="Any"
              hint="Per person."
            />
            <OptionSelect
              label="Departure time"
              value={v.dep}
              onChange={(dep) => update({ dep: dep as SearchBoxValues["dep"] })}
              options={[
                { value: "any", label: "Anytime" },
                { value: "morning", label: "Morning (05–12)" },
                { value: "afternoon", label: "Afternoon (12–18)" },
                { value: "evening", label: "Evening (18–24)" },
                { value: "night", label: "Night (00–05)" },
              ]}
            />
            <NumberField
              label="Max layover"
              suffix="Hours"
              value={v.maxLayover ? String(v.maxLayover) : ""}
              onChange={(t) => update({ maxLayover: numOrNull(t) })}
              placeholder="Any"
              max={48}
            />
            <AirlinePicker value={v.airlines} onChange={(airlines) => update({ airlines })} />
          </div>
        )}
      </div>
    </form>
  );
}

/** Min–max nights, styled like the other main search fields. */
function StayField({
  min,
  max,
  onChange,
  disabled,
  className,
}: {
  min: number | null;
  max: number | null;
  onChange: (patch: { minNights?: number | null; maxNights?: number | null }) => void;
  disabled?: boolean;
  className?: string;
}) {
  const input =
    "w-14 min-w-0 rounded-lg border border-input bg-card px-1.5 py-1 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none text-center text-[15px] font-semibold tabular-nums outline-none placeholder:font-normal placeholder:text-muted-foreground/70 focus:border-ring focus:ring-[3px] focus:ring-ring/15 disabled:bg-transparent";
  return (
    <div
      className={cn(
        "flex min-h-[60px] items-center gap-3 rounded-2xl border border-input bg-card px-4",
        disabled && "bg-muted/60",
        className,
      )}
    >
      <MoonStar className="size-[18px] shrink-0 text-muted-foreground" aria-hidden="true" />
      <div className="flex min-w-0 flex-col py-1.5">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Length of stay</span>
        {disabled ? (
          <span className="text-[15px] text-muted-foreground">One-way</span>
        ) : (
          <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <input
              type="number"
              inputMode="numeric"
              min={1}
              max={30}
              aria-label="Minimum nights"
              placeholder="Min"
              value={min ?? ""}
              onChange={(e) => onChange({ minNights: numOrNull(e.target.value) })}
              className={input}
            />
            –
            <input
              type="number"
              inputMode="numeric"
              min={1}
              max={30}
              aria-label="Maximum nights"
              placeholder="Max"
              value={max ?? ""}
              onChange={(e) => onChange({ maxNights: numOrNull(e.target.value) })}
              className={input}
            />
            nights
          </span>
        )}
      </div>
    </div>
  );
}

function OptionLabel({ label, hint, htmlFor }: { label: string; hint?: string; htmlFor?: string }) {
  return (
    <label htmlFor={htmlFor} className="flex items-center gap-1 text-[13px] font-medium text-muted-foreground" title={hint}>
      {label}
      {hint && (
        <span aria-hidden="true" className="flex size-4 items-center justify-center rounded-full bg-muted text-[10px] font-bold">
          i
        </span>
      )}
      {hint && <span className="sr-only">: {hint}</span>}
    </label>
  );
}

function OptionSelect({
  label,
  hint,
  value,
  onChange,
  options,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="space-y-1.5">
      <OptionLabel label={label} hint={hint} />
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger aria-label={label}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function NumberInput({
  ariaLabel,
  value,
  onChange,
  placeholder,
  disabled,
  prefix,
  suffix,
  max,
}: {
  ariaLabel: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
  prefix?: string;
  suffix?: string;
  max?: number;
}) {
  return (
    <div
      className={cn(
        "flex h-11 w-full overflow-hidden rounded-xl border border-input bg-card shadow-xs focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/20",
        disabled && "opacity-50",
      )}
    >
      {prefix && <span className="flex items-center border-r bg-muted px-3 text-sm font-medium text-muted-foreground">{prefix}</span>}
      <input
        type="number"
        inputMode="numeric"
        min={1}
        max={max}
        aria-label={ariaLabel}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full min-w-0 bg-transparent px-3 text-[15px] outline-none placeholder:text-muted-foreground/70"
      />
      {suffix && <span className="flex items-center border-l bg-muted px-3 text-sm font-medium text-muted-foreground">{suffix}</span>}
    </div>
  );
}

function NumberField(props: {
  label: string;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  prefix?: string;
  suffix?: string;
  max?: number;
}) {
  return (
    <div className="space-y-1.5">
      <OptionLabel label={props.label} hint={props.hint} />
      <NumberInput ariaLabel={props.label} {...props} />
    </div>
  );
}

function AirlinePicker({ value, onChange }: { value: string[]; onChange: (codes: string[]) => void }) {
  const label =
    value.length === 0
      ? "Any airline"
      : value.length === 1
        ? (AIRLINES.find((a) => a.code === value[0])?.name ?? value[0])
        : `${value.length} airlines`;
  return (
    <div className="space-y-1.5">
      <OptionLabel label="Airlines" />
      <Popover>
        <PopoverTrigger className="flex h-11 w-full items-center justify-between rounded-xl border border-input bg-card px-3.5 text-left text-[15px] shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/20">
          <span className={cn("truncate", value.length === 0 && "text-muted-foreground")}>{label}</span>
          <ChevronDown className="size-4 opacity-50" aria-hidden="true" />
        </PopoverTrigger>
        <PopoverContent className="w-72 p-2" align="end">
          <div className="flex items-center justify-between px-2 pb-2">
            <span className="text-sm font-semibold">Select airlines</span>
            {value.length > 0 && (
              <button type="button" onClick={() => onChange([])} className="text-xs font-semibold text-primary">
                Clear
              </button>
            )}
          </div>
          <ul className="max-h-64 overflow-y-auto">
            {AIRLINES.map((a) => {
              const id = `airline-pick-${a.code}`;
              const checked = value.includes(a.code);
              return (
                <li key={a.code}>
                  <label htmlFor={id} className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm hover:bg-muted">
                    <Checkbox
                      id={id}
                      checked={checked}
                      onCheckedChange={() => onChange(checked ? value.filter((c) => c !== a.code) : [...value, a.code])}
                    />
                    <span className="flex-1">{a.name}</span>
                    <span className="text-xs text-muted-foreground">{a.code}</span>
                  </label>
                </li>
              );
            })}
          </ul>
        </PopoverContent>
      </Popover>
    </div>
  );
}

