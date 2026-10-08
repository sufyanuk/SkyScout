import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Compass, Plane } from "lucide-react";
import { EmptyState } from "@/components/common/empty-state";
import { DestinationArtFor } from "@/components/destinations/destination-art-for";
import { OriginPicker } from "@/components/explore/origin-picker";
import { RouteRadar } from "@/components/explore/route-radar";
import { Button } from "@/components/ui/button";
import { getAirport } from "@/lib/catalog/airports";
import { getDestinationByAirport } from "@/lib/catalog/destinations";
import { getFlightProvider } from "@/lib/flights";
import type { DestinationQuote } from "@/lib/flights/types";
import { formatDateRange, formatDuration, formatPrice } from "@/lib/format";
import { buildSearchHref } from "@/lib/search-params";
import { getHomeAirport } from "@/lib/services/preferences";
import { cn } from "@/lib/utils";

const WHEN = [
  { id: "anytime", label: "Any time" },
  { id: "weekend", label: "Weekends" },
  { id: "next-month", label: "Next month" },
] as const;
const PRICES = [null, 150, 300, 500, 1000] as const;

export async function generateMetadata({ searchParams }: PageProps<"/explore">): Promise<Metadata> {
  const sp = await searchParams;
  const origin = getAirport(typeof sp.from === "string" ? sp.from : undefined) ?? getAirport(await getHomeAirport())!;
  return {
    title: `Explore cheap flights from ${origin.city}`,
    description: `Every destination you can reach from ${origin.city}, sorted by price. Find the cheapest places to fly this month.`,
    alternates: { canonical: `/explore?from=${origin.code}` },
  };
}

export default async function ExplorePage({ searchParams }: PageProps<"/explore">) {
  const sp = await searchParams;
  const origin = getAirport(typeof sp.from === "string" ? sp.from : undefined) ?? getAirport(await getHomeAirport())!;
  const when = WHEN.find((w) => w.id === sp.when)?.id ?? "anytime";
  const maxPrice = PRICES.find((p) => p !== null && String(p) === sp.max) ?? null;
  const directOnly = sp.direct === "1";

  const quotes = await getFlightProvider().exploreDestinations(origin.code, {
    when,
    maxPrice,
    directOnly,
  });

  const link = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams({ from: origin.code, when, ...(maxPrice ? { max: String(maxPrice) } : {}), ...(directOnly ? { direct: "1" } : {}) });
    for (const [k, v] of Object.entries(patch)) {
      if (v === null) next.delete(k);
      else next.set(k, v);
    }
    if (next.get("when") === "anytime") next.delete("when");
    return `/explore?${next.toString()}`;
  };
  const hrefFor = (q: DestinationQuote) =>
    buildSearchHref({
      from: origin.code,
      to: q.destination.code,
      when,
      extra: { sort: "cheapest", ...(directOnly ? { stops: "0" } : {}), ...(maxPrice ? { maxPrice } : {}) },
    });

  return (
    <div className="container-page py-10">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Explore anywhere</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-5xl">Where can you go from {origin.city}?</h1>
          <p className="mt-2 text-muted-foreground">
            Every destination we price from {origin.code}, cheapest first. Pick one to see all available deals.
          </p>
        </div>
        <OriginPicker value={origin.code} query={new URLSearchParams(Object.entries(sp).filter((e): e is [string, string] => typeof e[1] === "string")).toString()} />
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
        <FilterGroup label="When">
          {WHEN.map((w) => (
            <Pill key={w.id} href={link({ when: w.id })} active={when === w.id}>
              {w.label}
            </Pill>
          ))}
        </FilterGroup>
        <FilterGroup label="Budget">
          {PRICES.map((p) => (
            <Pill key={String(p)} href={link({ max: p ? String(p) : null })} active={maxPrice === p}>
              {p ? `Under ${formatPrice(p)}` : "Any"}
            </Pill>
          ))}
        </FilterGroup>
        <Pill href={link({ direct: directOnly ? null : "1" })} active={directOnly}>
          Direct only
        </Pill>
      </div>

      {quotes.length === 0 ? (
        <EmptyState
          className="mt-10"
          icon={Compass}
          title="Nothing matches those filters"
          description="Try a higher budget or allow connecting flights."
          action={
            <Button asChild>
              <Link href={`/explore?from=${origin.code}`}>Reset filters</Link>
            </Button>
          }
        />
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
          <div className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-[2rem] border bg-card p-4 shadow-card sm:p-6">
              <RouteRadar origin={origin} quotes={quotes} hrefFor={hrefFor} />
              <p className="mt-2 text-center text-xs text-muted-foreground">
                Distance from centre = flight time · direction = compass bearing · <span className="font-semibold text-sunrise">orange</span> = 6 cheapest
              </p>
            </div>
          </div>
          <ol className="space-y-3" aria-label={`Destinations from ${origin.city} sorted by price`}>
            {quotes.map((q, i) => {
              const guide = getDestinationByAirport(q.destination.code);
              return (
                <li key={q.destination.code} className="group relative flex items-center gap-4 rounded-3xl border bg-card p-3 pr-4 shadow-card transition hover:shadow-lift">
                  <span className="relative size-16 shrink-0 overflow-hidden rounded-2xl">
                    <DestinationArtFor code={q.destination.code} showCode={false} />
                    <span className="absolute inset-0 flex items-center justify-center font-mono text-xs font-bold text-white drop-shadow">
                      {q.destination.code}
                    </span>
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">
                      <span className="mr-1.5 text-sm text-muted-foreground tabular-nums">{i + 1}.</span>
                      <Link href={hrefFor(q)} className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-none">
                        {origin.code} → {q.destination.city}
                      </Link>
                    </p>
                    <p className="truncate text-sm text-muted-foreground">
                      {q.destination.country} · {formatDateRange(q.cheapest.departureDate, q.cheapest.returnDate)} ·{" "}
                      {formatDuration(q.cheapest.outbound.durationMinutes)}
                    </p>
                    <p className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                      {q.hasDirect && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-savings-soft px-2 py-0.5 font-semibold text-savings">
                          <Plane className="size-3" aria-hidden="true" /> Direct available
                        </span>
                      )}
                      {guide && (
                        <Link href={`/destinations/${guide.slug}`} className="relative z-10 font-medium text-primary hover:underline">
                          {guide.city} guide
                        </Link>
                      )}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-semibold tabular-nums">{formatPrice(q.cheapest.price)}</p>
                    {q.cheapest.savingsPercent >= 10 && <p className="text-xs font-semibold text-savings">−{q.cheapest.savingsPercent}%</p>}
                  </div>
                  <ArrowRight className="hidden size-4 text-muted-foreground transition group-hover:translate-x-0.5 sm:block" aria-hidden="true" />
                </li>
              );
            })}
          </ol>
        </div>
      )}
    </div>
  );
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-2" role="group" aria-label={label}>
      <span className="text-sm font-medium text-muted-foreground">{label}</span>
      {children}
    </div>
  );
}

function Pill({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      scroll={false}
      aria-current={active ? "true" : undefined}
      className={cn(
        "rounded-full border px-3.5 py-1.5 text-sm font-medium transition",
        active ? "border-primary bg-accent text-accent-foreground" : "bg-card hover:border-foreground/30",
      )}
    >
      {children}
    </Link>
  );
}
