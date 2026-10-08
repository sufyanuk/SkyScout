"use client";

import { createContext, useContext, useId, useState } from "react";
import { useCurrency } from "@/components/common/currency-provider";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { TIME_BUCKET_LABELS } from "@/lib/flights/filtering";
import { CABINS, TIME_BUCKETS, type SearchFacets, type TimeBucket } from "@/lib/flights/types";
import { CABIN_LABELS } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useSearchNavigation } from "./search-navigation";

const PRICE_PRESETS = [100, 250, 500];
const TRIP_LENGTH_OPTIONS = [
  { value: "any", label: "Any length" },
  { value: "weekend", label: "Weekend" },
  { value: "short", label: "3–5 days" },
  { value: "week", label: "1 week" },
  { value: "two-weeks", label: "2 weeks" },
  { value: "custom", label: "Custom" },
];
const STOP_LABELS = ["Direct", "1 stop", "2+ stops"];
export const FILTER_KEYS = [
  "maxPrice",
  "stops",
  "airlines",
  "dep",
  "arr",
  "length",
  "minNights",
  "maxNights",
  "maxDuration",
  "maxLayover",
  "transfer",
  "cabinBags",
  "checkedBags",
];

export function activeFilterCount(params: URLSearchParams) {
  return FILTER_KEYS.filter((k) => params.get(k) && !(k === "length" && params.get(k) === "any")).length;
}

/** Unique id prefix per panel: the sidebar and drawer can both be mounted. */
const IdPrefix = createContext("f");

export function FilterPanel(props: { facets: SearchFacets; hasExactDates: boolean }) {
  const prefix = useId();
  return (
    <IdPrefix.Provider value={prefix}>
      <FilterPanelInner {...props} />
    </IdPrefix.Provider>
  );
}

function FilterPanelInner({ facets, hasExactDates }: { facets: SearchFacets; hasExactDates: boolean }) {
  const { format } = useCurrency();
  const nav = useSearchNavigation();
  const prefix = useContext(IdPrefix);
  const maxPrice = nav.get("maxPrice");
  const priceMode = !maxPrice ? "any" : PRICE_PRESETS.includes(Number(maxPrice)) ? maxPrice : "custom";
  const [customPrice, setCustomPrice] = useState(priceMode === "custom" ? maxPrice! : "");
  const when = nav.get("when") ?? (hasExactDates ? "exact" : "anytime");
  const length = nav.get("length") ?? "any";
  const stops = nav.getList("stops");
  const airlines = nav.getList("airlines");

  const toggleIn = (key: string, list: string[], value: string) => {
    const next = list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
    nav.update({ [key]: next.join(",") });
  };

  return (
    <div className="space-y-7">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">Filters</h2>
        {activeFilterCount(nav.params) > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => nav.update(Object.fromEntries(FILTER_KEYS.map((k) => [k, null])))}
            className="text-primary"
          >
            <RotateCcw /> Reset
          </Button>
        )}
      </div>

      <FilterSection title="Price" hint={facets.priceRange ? `From ${format(facets.priceRange.min)}` : undefined}>
        <RadioGroup
          value={priceMode}
          onValueChange={(value) => {
            if (value === "custom") return nav.update({ maxPrice: customPrice || "300" });
            nav.update({ maxPrice: value === "any" ? null : value });
          }}
        >
          <RadioRow value="any" label="Any price" />
          {PRICE_PRESETS.map((p) => (
            <RadioRow key={p} value={String(p)} label={`Under ${format(p)}`} />
          ))}
          <RadioRow value="custom" label="Custom" />
        </RadioGroup>
        {priceMode === "custom" && (
          <form
            className="mt-3 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              const n = Number(customPrice);
              if (Number.isFinite(n) && n > 0) nav.update({ maxPrice: String(Math.round(n)) });
            }}
          >
            <Label htmlFor={`${prefix}-custom-price`} className="sr-only">
              Maximum price in US dollars
            </Label>
            <Input
              id={`${prefix}-custom-price`}
              type="number"
              inputMode="numeric"
              min={20}
              step={10}
              value={customPrice}
              onChange={(e) => setCustomPrice(e.target.value)}
              placeholder="Max $"
              className="h-9"
            />
            <Button type="submit" size="sm" variant="secondary" className="h-9">
              Apply
            </Button>
          </form>
        )}
      </FilterSection>

      <FilterSection title="Stops">
        {[0, 1, 2].map((s) => {
          const facet = facets.stops.find((f) => f.stops === s);
          return (
            <CheckRow
              key={s}
              id={`stops-${s}`}
              label={STOP_LABELS[s]}
              meta={facet ? format(facet.minPrice) : "—"}
              checked={stops.includes(String(s))}
              disabled={!facet}
              onChange={() => toggleIn("stops", stops, String(s))}
            />
          );
        })}
      </FilterSection>

      <FilterSection title="Dates">
        <RadioGroup value={when} onValueChange={(value) => nav.update({ when: value === "exact" ? null : value })}>
          <RadioRow value="exact" label="Exact dates" disabled={!hasExactDates} />
          <RadioRow value="flexible" label="Flexible (± 3 days)" disabled={!hasExactDates} />
          <RadioRow value="range" label="Date range (from your departure date)" disabled={!hasExactDates} />
          <RadioRow value="anytime" label="Any time (next 3 months)" />
          <RadioRow value="weekend" label="Upcoming weekends" />
          <RadioRow value="next-month" label="Next month" />
        </RadioGroup>
        {!hasExactDates && <p className="mt-2 text-xs text-muted-foreground">Pick dates in the search box to use exact dates.</p>}
      </FilterSection>

      <FilterSection title="Trip length">
        {when === "exact" ? (
          <p className="text-sm text-muted-foreground">Set by your exact dates. Switch to flexible dates to choose a length.</p>
        ) : (
          <>
            <div className="flex flex-wrap gap-2">
              {TRIP_LENGTH_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  aria-pressed={length === opt.value}
                  onClick={() => nav.update({ length: opt.value === "any" ? null : opt.value, minNights: null, maxNights: null })}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-[13px] font-medium transition",
                    length === opt.value ? "border-primary bg-accent text-accent-foreground" : "hover:bg-muted",
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            {length === "custom" && <CustomNights />}
          </>
        )}
      </FilterSection>

      {facets.airlines.length > 0 && (
        <FilterSection title="Airlines">
          <div className="max-h-64 space-y-0.5 overflow-y-auto pr-1">
            {facets.airlines.map((a) => (
              <CheckRow
                key={a.code}
                id={`airline-${a.code}`}
                label={a.name}
                meta={format(a.minPrice)}
                checked={airlines.includes(a.code)}
                onChange={() => toggleIn("airlines", airlines, a.code)}
              />
            ))}
          </div>
        </FilterSection>
      )}

      <FilterSection title="Bags (per traveller)">
        <div className="grid grid-cols-2 gap-3">
          <ChipGroup
            label="Cabin bag"
            value={nav.get("cabinBags") ?? "0"}
            options={[
              { value: "0", label: "None" },
              { value: "1", label: "1" },
            ]}
            onChange={(v) => nav.update({ cabinBags: v === "0" ? null : v })}
          />
          <ChipGroup
            label="Checked"
            value={nav.get("checkedBags") ?? "0"}
            options={[
              { value: "0", label: "None" },
              { value: "1", label: "1" },
              { value: "2", label: "2" },
            ]}
            onChange={(v) => nav.update({ checkedBags: v === "0" ? null : v })}
          />
        </div>
        <p className="mt-2 text-xs text-muted-foreground">Fares that don&apos;t include these bags show the fee in the price.</p>
      </FilterSection>

      <FilterSection title="Connections">
        <RadioGroup value={nav.get("transfer") ?? "include"} onValueChange={(v) => nav.update({ transfer: v === "include" ? null : v })}>
          <RadioRow value="include" label="Include self-transfer" />
          <RadioRow value="exclude" label="Protected connections only" />
          <RadioRow value="only" label="Self-transfer only" />
        </RadioGroup>
        <p className="mt-2 text-xs text-muted-foreground">
          Self-transfer combines separate tickets: often cheaper, but you re-check bags and missed connections aren&apos;t covered.
        </p>
      </FilterSection>

      <FilterSection title="Duration & layovers">
        <div className="grid grid-cols-2 gap-3">
          <ChipGroup
            label="Max journey"
            value={nav.get("maxDuration") ?? "any"}
            options={[
              { value: "any", label: "Any" },
              { value: "8", label: "8h" },
              { value: "12", label: "12h" },
              { value: "18", label: "18h" },
              { value: "24", label: "24h" },
            ]}
            onChange={(v) => nav.update({ maxDuration: v === "any" ? null : v })}
          />
          <ChipGroup
            label="Max layover"
            value={nav.get("maxLayover") ?? "any"}
            options={[
              { value: "any", label: "Any" },
              { value: "2", label: "2h" },
              { value: "4", label: "4h" },
              { value: "8", label: "8h" },
            ]}
            onChange={(v) => nav.update({ maxLayover: v === "any" ? null : v })}
          />
        </div>
      </FilterSection>

      <TimeFilter title="Departure time" paramKey="dep" />
      <TimeFilter title="Arrival time" paramKey="arr" />

      <FilterSection title="Cabin">
        <RadioGroup value={nav.get("cabin") ?? "economy"} onValueChange={(value) => nav.update({ cabin: value === "economy" ? null : value })}>
          {CABINS.map((c) => (
            <RadioRow key={c} value={c} label={CABIN_LABELS[c]} />
          ))}
        </RadioGroup>
      </FilterSection>
    </div>
  );
}

function CustomNights() {
  const nav = useSearchNavigation();
  const prefix = useContext(IdPrefix);
  const [min, setMin] = useState(nav.get("minNights") ?? "2");
  const [max, setMax] = useState(nav.get("maxNights") ?? "10");
  return (
    <form
      className="mt-3 flex items-end gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        const lo = Math.max(1, Math.min(30, Number(min) || 1));
        const hi = Math.max(lo, Math.min(30, Number(max) || lo));
        nav.update({ length: "custom", minNights: String(lo), maxNights: String(hi) });
      }}
    >
      <div className="space-y-1">
        <Label htmlFor={`${prefix}-min-nights`} className="text-xs text-muted-foreground">
          Min nights
        </Label>
        <Input id={`${prefix}-min-nights`} type="number" min={1} max={30} value={min} onChange={(e) => setMin(e.target.value)} className="h-9 w-20" />
      </div>
      <div className="space-y-1">
        <Label htmlFor={`${prefix}-max-nights`} className="text-xs text-muted-foreground">
          Max nights
        </Label>
        <Input id={`${prefix}-max-nights`} type="number" min={1} max={30} value={max} onChange={(e) => setMax(e.target.value)} className="h-9 w-20" />
      </div>
      <Button type="submit" size="sm" variant="secondary" className="h-9">
        Apply
      </Button>
    </form>
  );
}

function TimeFilter({ title, paramKey }: { title: string; paramKey: "dep" | "arr" }) {
  const nav = useSearchNavigation();
  const selected = nav.getList(paramKey);
  return (
    <FilterSection title={title}>
      <div className="grid grid-cols-2 gap-2">
        {TIME_BUCKETS.map((bucket: TimeBucket) => {
          const active = selected.includes(bucket);
          const [name, range] = TIME_BUCKET_LABELS[bucket].split(" ");
          return (
            <button
              key={bucket}
              type="button"
              aria-pressed={active}
              onClick={() => {
                const next = active ? selected.filter((b) => b !== bucket) : [...selected, bucket];
                nav.update({ [paramKey]: next.join(",") });
              }}
              className={cn(
                "rounded-xl border px-3 py-2 text-left transition",
                active ? "border-primary bg-accent" : "hover:bg-muted",
              )}
            >
              <span className={cn("block text-[13px] font-semibold", active && "text-accent-foreground")}>{name}</span>
              <span className="block text-[11px] text-muted-foreground">{range}</span>
            </button>
          );
        })}
      </div>
    </FilterSection>
  );
}

function FilterSection({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="border-t pt-5 first-of-type:border-t-0 first-of-type:pt-0">
      <div className="mb-3 flex items-baseline justify-between">
        <h3 className="text-sm font-semibold">{title}</h3>
        {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
      </div>
      {children}
    </section>
  );
}

function RadioRow({ value, label, disabled }: { value: string; label: string; disabled?: boolean }) {
  const id = `${useContext(IdPrefix)}-r-${label.replace(/\W+/g, "-").toLowerCase()}`;
  return (
    <div className="flex items-center gap-2.5">
      <RadioGroupItem value={value} id={id} disabled={disabled} />
      <Label htmlFor={id} className={cn("cursor-pointer font-normal", disabled && "text-muted-foreground")}>
        {label}
      </Label>
    </div>
  );
}

function CheckRow({
  id,
  label,
  meta,
  checked,
  disabled,
  onChange,
}: {
  id: string;
  label: string;
  meta?: string;
  checked: boolean;
  disabled?: boolean;
  onChange: () => void;
}) {
  const fullId = `${useContext(IdPrefix)}-${id}`;
  return (
    <div className="flex items-center gap-2.5 rounded-lg py-1.5">
      <Checkbox id={fullId} checked={checked} disabled={disabled} onCheckedChange={onChange} />
      <Label htmlFor={fullId} className={cn("flex-1 cursor-pointer font-normal", disabled && "text-muted-foreground")}>
        {label}
      </Label>
      {meta && <span className="text-xs tabular-nums text-muted-foreground">{meta}</span>}
    </div>
  );
}

function ChipGroup({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <div role="radiogroup" aria-label={label}>
      <p className="mb-1.5 text-xs font-medium text-muted-foreground">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={value === o.value}
            onClick={() => onChange(o.value)}
            className={cn(
              "min-w-9 rounded-full border px-2.5 py-1 text-[13px] font-medium transition",
              value === o.value ? "border-primary bg-accent text-accent-foreground" : "hover:bg-muted",
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}
