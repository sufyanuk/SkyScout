"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeftRight,
  Armchair,
  ChevronDown,
  Coins,
  Loader2,
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
import { CABINS, type Cabin, type SortOption, type TimeBucket, type TransferOption, type WhenOption } from "@/lib/flights/types";
import { CABIN_LABELS } from "@/lib/format";
import { buildSearchHref } from "@/lib/search-params";
import { cn } from "@/lib/utils";
import { AirportSelector, ANYWHERE } from "./airport-selector";
import { DateSelector } from "./date-selector";
import { TravelerSelector } from "./traveler-selector";

export interface SearchBoxValues {
  from: string;
  to: string;
  departure: string;
  returnDate: string;
  /** End of the departure window in "range" mode. */
  until: string;
  when: WhenOption;
  oneWay: boolean;
  adults: number;
  children: number;
  infants: number;
  cabin: Cabin;
  // Additional options
  sort: SortOption;
  stops: "any" | "0" | "1";
  limit: number;
  cabinBags: number;
  checkedBags: number;
  /** Max budget per person in USD (shown in the visitor's currency). */
  maxPriceUsd: number | null;
  maxDuration: number | null;
  maxLayover: number | null;
  minNights: number | null;
  maxNights: number | null;
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

const DATE_MODES: { when: WhenOption; label: string }[] = [
  { when: "exact", label: "Exact dates" },
  { when: "range", label: "Date range" },
  { when: "anytime", label: "Any dates" },
  { when: "weekend", label: "Weekend" },
  { when: "next-month", label: "Next month" },
];

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "cheapest", label: "Lowest price" },
  { value: "best", label: "Best overall" },
  { value: "fastest", label: "Fastest" },
  { value: "value", label: "Biggest saving" },
];

const DEFAULTS: Omit<SearchBoxValues, "from"> = {
  to: ANYWHERE,
  departure: "",
  returnDate: "",
  until: "",
  when: "anytime",
  oneWay: false,
  adults: 1,
  children: 0,
  infants: 0,
  cabin: "economy",
  sort: "best",
  stops: "any",
  limit: 24,
  cabinBags: 0,
  checkedBags: 0,
  maxPriceUsd: null,
  maxDuration: null,
  maxLayover: null,
  minNights: null,
  maxNights: null,
  dep: "any",
  transfer: "include",
  airlines: [],
};

/** How many "Additional options" differ from their defaults. */
function advancedCount(v: SearchBoxValues) {
  return [
    v.sort !== DEFAULTS.sort,
    v.stops !== "any",
    v.limit !== DEFAULTS.limit,
    v.cabinBags > 0,
    v.checkedBags > 0,
    v.maxPriceUsd !== null,
    v.maxDuration !== null,
    v.maxLayover !== null,
    v.minNights !== null || v.maxNights !== null,
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
  const defaultDeparture = addDays(today, 21);
  const [v, setV] = useState<SearchBoxValues>({ ...DEFAULTS, ...initial });
  const [showMore, setShowMore] = useState(() => advancedCount({ ...DEFAULTS, ...initial }) > 0 && variant === "compact");
  const [budgetText, setBudgetText] = useState(() =>
    initial.maxPriceUsd ? String(Math.round(money.convert(initial.maxPriceUsd))) : "",
  );
  const update = (patch: Partial<SearchBoxValues>) => setV((prev) => ({ ...prev, ...patch }));
  const exactish = v.when === "exact" || v.when === "flexible";
  const range = v.when === "range";
  const minDate = addDays(today, 1);
  const moreCount = advancedCount(v);

  function chooseMode(when: WhenOption) {
    if (when === "exact") {
      const departure = v.departure || defaultDeparture;
      update({ when, departure, returnDate: v.oneWay ? "" : v.returnDate || addDays(departure, 7) });
    } else if (when === "range") {
      const departure = v.departure || addDays(today, 7);
      update({ when, departure, until: v.until && v.until > departure ? v.until : addDays(departure, 30) });
    } else {
      update({ when });
    }
  }

  function changeCurrency(code: string) {
    startCurrency(async () => {
      await setCurrency(code);
      router.refresh();
    });
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if ((exactish || range) && !v.departure) {
      toast.error("Choose a departure date", { description: "Or pick “Any dates” to see the cheapest options." });
      return;
    }
    if (exactish && !v.oneWay && v.returnDate && v.returnDate <= v.departure) {
      toast.error("Return must be after departure");
      return;
    }
    if (range && (!v.until || v.until < v.departure)) {
      toast.error("The date range must end after it starts");
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
    const stay = !v.oneWay && (range || !exactish);
    const href = buildSearchHref({
      from: v.from,
      to: v.to,
      departure: exactish || range ? v.departure : null,
      returnDate: exactish && !v.oneWay ? v.returnDate || addDays(v.departure, 7) : null,
      when: v.when,
      oneWay: v.oneWay,
      adults: v.adults,
      children: v.children,
      infants: v.infants,
      cabin: v.cabin,
      extra: {
        ...keep,
        until: range ? v.until : null,
        sort: v.sort !== "best" ? v.sort : null,
        stops: v.stops === "any" ? null : v.stops === "0" ? "0" : "0,1",
        limit: v.limit !== DEFAULTS.limit ? v.limit : null,
        cabinBags: v.cabinBags || null,
        checkedBags: v.checkedBags || null,
        maxPrice: budget ? Math.round(money.toUsd(budget)) : null,
        maxDuration: v.maxDuration,
        maxLayover: v.maxLayover,
        minNights: stay ? v.minNights : null,
        maxNights: stay ? v.maxNights : null,
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
      {/* Trip type + date modes */}
      <div className="no-scrollbar -mx-1 mb-3 flex items-center gap-2 overflow-x-auto px-1 pb-0.5">
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
              onClick={() => update({ oneWay: opt.oneWay, returnDate: opt.oneWay ? "" : v.returnDate })}
              className={cn(
                "rounded-full px-3.5 py-1.5 text-[13px] font-semibold text-muted-foreground transition",
                v.oneWay === opt.oneWay && "bg-card text-foreground shadow-sm",
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <span className="mx-1 h-5 w-px shrink-0 bg-border" aria-hidden="true" />
        <div role="radiogroup" aria-label="Dates" className="flex gap-2">
          {DATE_MODES.map((mode) => {
            const active = v.when === mode.when || (mode.when === "exact" && v.when === "flexible");
            return (
              <Chip key={mode.when} role="radio" active={active} onClick={() => chooseMode(mode.when)}>
                {mode.label}
              </Chip>
            );
          })}
        </div>
        {exactish && (
          <Chip active={v.when === "flexible"} onClick={() => update({ when: v.when === "flexible" ? "exact" : "flexible" })}>
            ± 3 days
          </Chip>
        )}
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
        <div className="grid grid-cols-2 gap-2 lg:col-span-2">
          {range ? (
            <>
              <DateSelector
                label="Depart from"
                value={v.departure}
                min={minDate}
                when="exact"
                onExactRequested={() => {}}
                onChange={(departure) =>
                  update({ departure, until: v.until && v.until > departure ? v.until : addDays(departure, 30) })
                }
              />
              <DateSelector
                label="Depart until"
                value={v.until}
                min={v.departure || minDate}
                when="exact"
                onExactRequested={() => {}}
                onChange={(until) => update({ until })}
              />
            </>
          ) : (
            <>
              <DateSelector
                label="Departure"
                value={v.departure}
                min={minDate}
                when={v.when}
                onExactRequested={() => chooseMode("exact")}
                onChange={(departure) => {
                  const patch: Partial<SearchBoxValues> = { departure, when: v.when === "flexible" ? "flexible" : "exact" };
                  if (!v.oneWay && (!v.returnDate || v.returnDate <= departure)) patch.returnDate = addDays(departure, 7);
                  update(patch);
                }}
              />
              <DateSelector
                label="Return"
                value={v.returnDate}
                min={v.departure ? addDays(v.departure, 1) : minDate}
                when={v.when}
                onExactRequested={() => chooseMode("exact")}
                onChange={(returnDate) => update({ returnDate })}
                disabled={v.oneWay}
                disabledLabel="One-way"
              />
            </>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2 lg:col-span-4 lg:grid-cols-[1.2fr_1fr_1fr_auto]">
          <TravelerSelector
            adults={v.adults}
            childCount={v.children}
            infants={v.infants}
            onChange={(t) => update(t)}
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
          <Button type="submit" size="xl" disabled={pending} className="col-span-2 h-[60px] rounded-2xl px-8 text-base lg:col-span-1 lg:min-w-48">
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
            <OptionSelect
              label="Cabin bags"
              hint="Per traveller. Fares without an included cabin bag show the estimated fee in the price."
              value={String(v.cabinBags)}
              onChange={(n) => update({ cabinBags: Number(n) })}
              options={[0, 1].map((n) => ({ value: String(n), label: n ? "1 cabin bag" : "No cabin bag needed" }))}
            />
            <OptionSelect
              label="Checked bags"
              hint="Per traveller. Bag fees are added to fares that don't include them, so prices are comparable."
              value={String(v.checkedBags)}
              onChange={(n) => update({ checkedBags: Number(n) })}
              options={[0, 1, 2].map((n) => ({ value: String(n), label: n ? `${n} checked bag${n > 1 ? "s" : ""}` : "None" }))}
            />
            <NumberField
              label="Max budget"
              prefix={money.currency}
              value={budgetText}
              onChange={setBudgetText}
              placeholder="Any"
              hint="Per person, including any bags you selected."
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
              label="Max duration"
              suffix="Hours"
              value={v.maxDuration ? String(v.maxDuration) : ""}
              onChange={(t) => update({ maxDuration: numOrNull(t) })}
              placeholder="Any"
              max={72}
            />
            <NumberField
              label="Max layover"
              suffix="Hours"
              value={v.maxLayover ? String(v.maxLayover) : ""}
              onChange={(t) => update({ maxLayover: numOrNull(t) })}
              placeholder="Any"
              max={48}
            />
            <div className="col-span-2 space-y-1.5 lg:col-span-1">
              <p className="text-[13px] font-medium text-muted-foreground">
                Length of stay (nights){" "}
                {v.oneWay || exactish ? <span className="font-normal">· flexible dates</span> : null}
              </p>
              <div className="flex items-center gap-2">
                <NumberInput
                  ariaLabel="Minimum nights"
                  value={v.minNights ? String(v.minNights) : ""}
                  onChange={(t) => update({ minNights: numOrNull(t) })}
                  placeholder="Min"
                  disabled={v.oneWay || exactish}
                />
                <span className="text-muted-foreground">–</span>
                <NumberInput
                  ariaLabel="Maximum nights"
                  value={v.maxNights ? String(v.maxNights) : ""}
                  onChange={(t) => update({ maxNights: numOrNull(t) })}
                  placeholder="Max"
                  disabled={v.oneWay || exactish}
                />
              </div>
            </div>
            <AirlinePicker value={v.airlines} onChange={(airlines) => update({ airlines })} />
          </div>
        )}
      </div>
    </form>
  );
}

function Chip({
  active,
  onClick,
  children,
  role,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  role?: "radio";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      role={role}
      aria-checked={role ? active : undefined}
      aria-pressed={role ? undefined : active}
      className={cn(
        "shrink-0 rounded-full border px-3.5 py-1.5 text-[13px] font-semibold transition",
        active
          ? "border-sunrise/30 bg-sunrise-soft text-sunrise"
          : "border-border bg-card text-muted-foreground hover:border-foreground/25 hover:text-foreground",
      )}
    >
      {children}
    </button>
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

