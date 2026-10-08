"use client";

import { Minus, Plus, Users } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface TravelerSelectorProps {
  adults: number;
  childCount: number;
  onChange: (value: { adults: number; children: number }) => void;
  className?: string;
}

export function travelerLabel(adults: number, children: number) {
  const parts = [`${adults} adult${adults > 1 ? "s" : ""}`];
  if (children) parts.push(`${children} child${children > 1 ? "ren" : ""}`);
  return parts.join(", ");
}

export function TravelerSelector({ adults, childCount, onChange, className }: TravelerSelectorProps) {
  const total = adults + childCount;
  return (
    <Popover>
      <PopoverTrigger
        className={cn(
          "flex min-h-[60px] w-full items-center gap-3 rounded-2xl border border-input bg-card px-4 text-left outline-none transition hover:border-foreground/25 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/15",
          className,
        )}
        aria-label={`Travellers: ${travelerLabel(adults, childCount)}`}
      >
        <Users className="size-[18px] text-muted-foreground" aria-hidden="true" />
        <span className="flex min-w-0 flex-col py-2">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Travellers</span>
          <span className="truncate text-[15px] font-semibold">{travelerLabel(adults, childCount)}</span>
        </span>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-4">
          <Stepper
            label="Adults"
            hint="12 years and over"
            value={adults}
            min={1}
            max={9 - childCount}
            onChange={(v) => onChange({ adults: v, children: childCount })}
          />
          <Stepper
            label="Children"
            hint="2–11 years"
            value={childCount}
            min={0}
            max={Math.min(8, 9 - adults)}
            onChange={(v) => onChange({ adults, children: v })}
          />
          <p className="text-xs text-muted-foreground">
            Up to 9 travellers per search. Prices are shown per person; totals cover all {total}.
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function Stepper({
  label,
  hint,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  hint: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-semibold">{label}</p>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </div>
      <div className="flex items-center gap-3" role="group" aria-label={label}>
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          className="flex size-8 items-center justify-center rounded-full border transition hover:bg-muted disabled:opacity-40"
          aria-label={`Fewer ${label.toLowerCase()}`}
        >
          <Minus className="size-4" />
        </button>
        <span className="w-4 text-center font-semibold tabular-nums" aria-live="polite">
          {value}
        </span>
        <button
          type="button"
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
          className="flex size-8 items-center justify-center rounded-full border transition hover:bg-muted disabled:opacity-40"
          aria-label={`More ${label.toLowerCase()}`}
        >
          <Plus className="size-4" />
        </button>
      </div>
    </div>
  );
}
