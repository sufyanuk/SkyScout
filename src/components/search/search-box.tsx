"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeftRight, Armchair, Loader2, PlaneLanding, PlaneTakeoff, Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { addDays } from "@/lib/dates";
import { CABINS, type Cabin, type WhenOption } from "@/lib/flights/types";
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
  when: WhenOption;
  oneWay: boolean;
  adults: number;
  children: number;
  cabin: Cabin;
}

interface SearchBoxProps {
  initial: Partial<SearchBoxValues> & { from: string };
  /** Server "today" (YYYY-MM-DD) so server and client agree on min dates. */
  today: string;
  variant?: "hero" | "compact";
  /** Extra URL params to keep (e.g. current sort/view on the results page). */
  keep?: Record<string, string>;
  onSubmitted?: () => void;
  className?: string;
}

const FLEX_CHIPS: { when: WhenOption; label: string }[] = [
  { when: "anytime", label: "Any dates" },
  { when: "weekend", label: "Weekend" },
  { when: "next-month", label: "Next month" },
];

export function SearchBox({ initial, today, variant = "hero", keep, onSubmitted, className }: SearchBoxProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const defaultDeparture = addDays(today, 21);
  const [v, setV] = useState<SearchBoxValues>({
    to: ANYWHERE,
    departure: "",
    returnDate: "",
    when: "anytime",
    oneWay: false,
    adults: 1,
    children: 0,
    cabin: "economy",
    ...initial,
  });
  const update = (patch: Partial<SearchBoxValues>) => setV((prev) => ({ ...prev, ...patch }));
  const exactish = v.when === "exact" || v.when === "flexible";
  const minDate = addDays(today, 1);

  function chooseExact() {
    update({
      when: "exact",
      departure: v.departure || defaultDeparture,
      returnDate: v.oneWay ? "" : v.returnDate || addDays(v.departure || defaultDeparture, 7),
    });
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (exactish && !v.departure) {
      toast.error("Choose a departure date", { description: "Or pick “Any dates” to see the cheapest options." });
      return;
    }
    if (exactish && !v.oneWay && v.returnDate && v.returnDate <= v.departure) {
      toast.error("Return must be after departure");
      return;
    }
    if (v.to === v.from) {
      toast.error("Origin and destination are the same", { description: "Pick another destination or try “Anywhere”." });
      return;
    }
    const href = buildSearchHref({
      from: v.from,
      to: v.to,
      departure: exactish ? v.departure : null,
      returnDate: exactish && !v.oneWay ? v.returnDate || addDays(v.departure, 7) : null,
      when: v.when,
      oneWay: v.oneWay,
      adults: v.adults,
      children: v.children,
      cabin: v.cabin,
      extra: keep,
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
      {/* Trip type + flexible shortcuts */}
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
        <Chip active={v.to === ANYWHERE} onClick={() => update({ to: v.to === ANYWHERE ? "" : ANYWHERE })}>
          Anywhere
        </Chip>
        {FLEX_CHIPS.map((chip) => (
          <Chip
            key={chip.when}
            active={v.when === chip.when}
            onClick={() => (v.when === chip.when ? chooseExact() : update({ when: chip.when }))}
          >
            {chip.label}
          </Chip>
        ))}
        {exactish && (
          <Chip active={v.when === "flexible"} onClick={() => update({ when: v.when === "flexible" ? "exact" : "flexible" })}>
            ± 3 days
          </Chip>
        )}
      </div>

      <div className="grid gap-2 lg:grid-cols-[1fr_1fr_0.8fr_0.8fr]">
        <div className="relative grid gap-2 sm:grid-cols-2 lg:col-span-2">
          <AirportSelector label="From" value={v.from} onChange={(from) => update({ from })} icon={<PlaneTakeoff />} exclude={v.to} />
          <AirportSelector
            label="To"
            value={v.to || ANYWHERE}
            onChange={(to) => update({ to })}
            allowAnywhere
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
          <DateSelector
            label="Departure"
            value={v.departure}
            min={minDate}
            when={v.when}
            onExactRequested={chooseExact}
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
            onExactRequested={chooseExact}
            onChange={(returnDate) => update({ returnDate })}
            disabled={v.oneWay}
            disabledLabel="One-way"
          />
        </div>

        <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto] lg:col-span-4">
          <TravelerSelector adults={v.adults} childCount={v.children} onChange={(t) => update(t)} />
          <Select value={v.cabin} onValueChange={(cabin) => update({ cabin: cabin as Cabin })}>
            <SelectTrigger
              aria-label="Cabin class"
              className="h-auto min-h-[60px] rounded-2xl px-4 [&>span]:flex [&>span]:items-center"
            >
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
          <Button
            type="submit"
            size="xl"
            disabled={pending}
            className="h-[60px] rounded-2xl px-8 text-base sm:min-w-52"
          >
            {pending ? <Loader2 className="size-5 animate-spin" aria-hidden="true" /> : <Search className="size-5" aria-hidden="true" />}
            {compact ? "Search" : "Find Flights"}
          </Button>
        </div>
      </div>
    </form>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
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
