"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BellPlus, Loader2, PlaneLanding, PlaneTakeoff } from "lucide-react";
import { toast } from "sonner";
import { AirportSelector, ANYWHERE } from "@/components/search/airport-selector";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AIRPORT_OPTIONS } from "@/lib/catalog/airports";
import { addDays } from "@/lib/dates";
import { cn } from "@/lib/utils";

const FLEX = [
  { value: "ANY", label: "Any time" },
  { value: "PLUS_MINUS_3", label: "± 3 days" },
  { value: "EXACT", label: "Exact date" },
] as const;
const DURATIONS = [
  { value: "ANY", label: "Any length" },
  { value: "WEEKEND", label: "Weekend" },
  { value: "SHORT", label: "3–5 days" },
  { value: "WEEK", label: "1 week" },
  { value: "TWO_WEEKS", label: "2 weeks" },
] as const;
const STOPS = [
  { value: "any", label: "Any stops" },
  { value: "0", label: "Direct only" },
  { value: "1", label: "Max 1 stop" },
] as const;
const CABINS = [
  { value: "ECONOMY", label: "Economy" },
  { value: "PREMIUM_ECONOMY", label: "Premium economy" },
  { value: "BUSINESS", label: "Business" },
  { value: "FIRST", label: "First" },
] as const;

interface AlertFormProps {
  today: string;
  initial: { origin: string; destination?: string | null; maxPrice?: number | null };
}

const cityOf = (code: string) =>
  code === ANYWHERE ? "anywhere" : (AIRPORT_OPTIONS.find((a) => a.code === code)?.city ?? code);

export function AlertForm({ today, initial }: AlertFormProps) {
  const router = useRouter();
  const [origin, setOrigin] = useState(initial.origin);
  const [destination, setDestination] = useState(initial.destination ?? ANYWHERE);
  const [maxPrice, setMaxPrice] = useState(initial.maxPrice ? String(initial.maxPrice) : "350");
  const [flex, setFlex] = useState<(typeof FLEX)[number]["value"]>("ANY");
  const [departureDate, setDepartureDate] = useState(addDays(today, 30));
  const [duration, setDuration] = useState<(typeof DURATIONS)[number]["value"]>("ANY");
  const [stops, setStops] = useState<(typeof STOPS)[number]["value"]>("any");
  const [cabin, setCabin] = useState<(typeof CABINS)[number]["value"]>("ECONOMY");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    setSubmitting(true);
    try {
      const res = await fetch("/api/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          origin,
          destination: destination === ANYWHERE ? "ANYWHERE" : destination,
          maxPrice: Number(maxPrice),
          dateFlexibility: flex,
          departureDate: flex === "ANY" ? null : departureDate,
          tripDuration: duration,
          maxStops: stops === "any" ? null : Number(stops),
          cabin,
        }),
      });
      const body = (await res.json().catch(() => ({}))) as {
        error?: string;
        fields?: Record<string, string>;
        alert?: { status: string; lastSeenPrice: number | null };
      };
      if (res.status === 401) {
        toast("Log in to create alerts", { action: { label: "Log in", onClick: () => router.push("/login?callbackUrl=/alerts") } });
        return;
      }
      if (!res.ok) {
        setErrors(body.fields ?? {});
        toast.error(body.error ?? "Please check the highlighted fields");
        return;
      }
      if (body.alert?.status === "TRIGGERED") {
        toast.success("Good news — a fare already matches!", {
          description: `We found ${cityOf(origin)} → ${cityOf(destination)} for $${body.alert.lastSeenPrice}. See it under Triggered.`,
        });
      } else {
        toast.success("Price alert created", {
          description: body.alert?.lastSeenPrice ? `Cheapest right now: $${body.alert.lastSeenPrice}. We'll keep watching.` : "We'll keep watching.",
        });
      }
      router.refresh();
    } catch {
      toast.error("Couldn't reach SkyScout. Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5" noValidate>
      <div className="grid gap-2 sm:grid-cols-2">
        <AirportSelector label="From" value={origin} onChange={setOrigin} icon={<PlaneTakeoff />} exclude={destination} />
        <AirportSelector label="To" value={destination} onChange={setDestination} allowAnywhere icon={destination === ANYWHERE ? undefined : <PlaneLanding />} exclude={origin} />
      </div>
      {errors.destination && <p className="text-sm text-destructive">{errors.destination}</p>}

      <div className="space-y-2">
        <Label htmlFor="alert-max">Notify me when the price drops below</Label>
        <div className="relative max-w-[200px]">
          <span className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 font-semibold text-muted-foreground">$</span>
          <Input
            id="alert-max"
            type="number"
            inputMode="numeric"
            min={20}
            step={5}
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            aria-invalid={!!errors.maxPrice}
            aria-describedby={errors.maxPrice ? "alert-max-error" : undefined}
            className="pl-7 text-lg font-semibold"
          />
        </div>
        {errors.maxPrice && (
          <p id="alert-max-error" className="text-sm text-destructive">
            {errors.maxPrice}
          </p>
        )}
      </div>

      <Segmented label="Date flexibility" value={flex} options={FLEX} onChange={setFlex} />
      {flex !== "ANY" && (
        <div className="space-y-2">
          <Label htmlFor="alert-date">Departure date</Label>
          <Input
            id="alert-date"
            type="date"
            min={addDays(today, 1)}
            value={departureDate}
            onChange={(e) => setDepartureDate(e.target.value)}
            aria-invalid={!!errors.departureDate}
            className="max-w-[220px]"
          />
          {errors.departureDate && <p className="text-sm text-destructive">{errors.departureDate}</p>}
        </div>
      )}
      <Segmented label="Travel duration" value={duration} options={DURATIONS} onChange={setDuration} />
      <Segmented label="Stops" value={stops} options={STOPS} onChange={setStops} />

      <div className="space-y-2">
        <Label>Cabin</Label>
        <Select value={cabin} onValueChange={(v) => setCabin(v as typeof cabin)}>
          <SelectTrigger aria-label="Cabin" className="max-w-[240px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CABINS.map((c) => (
              <SelectItem key={c.value} value={c.value}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-2xl bg-accent p-4 text-sm text-accent-foreground">
        Notify me when <strong>{cityOf(origin)} → {cityOf(destination)}</strong> drops below{" "}
        <strong>${Number(maxPrice) || "…"}</strong>
        {flex === "ANY" ? " for any dates" : ` around ${departureDate}`}.
      </div>

      <Button type="submit" size="lg" disabled={submitting} className="w-full sm:w-auto">
        {submitting ? <Loader2 className="animate-spin" /> : <BellPlus />}
        Create price alert
      </Button>
    </form>
  );
}

function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: readonly { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <fieldset className="space-y-2">
      <legend className="mb-2 text-sm font-medium">{label}</legend>
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={label}>
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={value === o.value}
            onClick={() => onChange(o.value)}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition",
              value === o.value ? "border-primary bg-accent text-accent-foreground" : "hover:bg-muted",
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}
