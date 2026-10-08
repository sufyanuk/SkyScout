"use client";

import { useState } from "react";
import { Minus, Plane, Plus, Wallet } from "lucide-react";
import { useCurrency } from "@/components/common/currency-provider";
import type { TravelStyle } from "@/lib/catalog/trip-costs";
import { tripCost } from "@/lib/insights/trip-cost";
import { cn } from "@/lib/utils";

interface TripCostCardProps {
  destination: string;
  city: string;
  /** Per-person flight price (incl. any bag fees), USD. */
  flightUsd: number;
  nights: number | null;
}

/**
 * Whole-trip budget: the fare plus estimated daily costs at the destination,
 * so a cheap flight to an expensive city can be compared honestly.
 */
export function TripCostCard({ destination, city, flightUsd, nights: initialNights }: TripCostCardProps) {
  const { format } = useCurrency();
  const [style, setStyle] = useState<TravelStyle>("budget");
  const [nights, setNights] = useState(initialNights ?? 5);
  const cost = tripCost(destination, flightUsd, nights, style);
  if (!cost) return null;
  const flightShare = Math.round((cost.flight / cost.total) * 100);

  return (
    <section aria-labelledby="trip-cost-title" className="rounded-3xl border bg-card p-5 shadow-card sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-primary">
            <Wallet className="size-3.5" aria-hidden="true" /> Whole-trip cost
          </p>
          <h2 id="trip-cost-title" className="mt-1 text-xl font-semibold tracking-tight">
            {format(cost.total)} for {nights} night{nights === 1 ? "" : "s"} in {city}
          </h2>
          <p className="text-sm text-muted-foreground">Per person: flight plus an estimate for stay, food and getting around.</p>
        </div>
        <div role="radiogroup" aria-label="Travel style" className="flex rounded-full bg-muted p-1">
          {(["budget", "comfort"] as const).map((s) => (
            <button
              key={s}
              type="button"
              role="radio"
              aria-checked={style === s}
              onClick={() => setStyle(s)}
              className={cn(
                "rounded-full px-3.5 py-1.5 text-[13px] font-semibold capitalize text-muted-foreground transition",
                style === s && "bg-card text-foreground shadow-sm",
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5 flex h-3 overflow-hidden rounded-full bg-muted" aria-hidden="true">
        <div className="h-full bg-primary" style={{ width: `${flightShare}%` }} />
        <div className="h-full flex-1 bg-sunrise/70" />
      </div>
      <dl className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="flex items-center gap-3">
          <span className="size-3 rounded-full bg-primary" aria-hidden="true" />
          <div>
            <dt className="flex items-center gap-1 text-xs text-muted-foreground">
              <Plane className="size-3" aria-hidden="true" /> Flight
            </dt>
            <dd className="font-semibold tabular-nums">{format(cost.flight)}</dd>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="size-3 rounded-full bg-sunrise/70" aria-hidden="true" />
          <div>
            <dt className="text-xs text-muted-foreground">
              On the ground · {format(cost.perDay)}/day ({style})
            </dt>
            <dd className="font-semibold tabular-nums">{format(cost.stay)}</dd>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:justify-end">
          <span className="text-xs text-muted-foreground">Nights</span>
          <div className="flex items-center gap-2" role="group" aria-label="Nights">
            <button
              type="button"
              onClick={() => setNights((n) => Math.max(1, n - 1))}
              className="flex size-8 items-center justify-center rounded-full border hover:bg-muted"
              aria-label="One night fewer"
            >
              <Minus className="size-4" />
            </button>
            <span className="w-6 text-center font-semibold tabular-nums" aria-live="polite">
              {nights}
            </span>
            <button
              type="button"
              onClick={() => setNights((n) => Math.min(30, n + 1))}
              className="flex size-8 items-center justify-center rounded-full border hover:bg-muted"
              aria-label="One night more"
            >
              <Plus className="size-4" />
            </button>
          </div>
        </div>
      </dl>
      <p className="mt-4 text-xs text-muted-foreground">
        Daily costs are indicative averages for a traveller sharing a double room. Your trip may cost more or less.
      </p>
    </section>
  );
}
