import type { Metadata } from "next";
import Link from "next/link";
import { after } from "next/server";
import { BellPlus, ChevronDown, PlaneTakeoff, SearchX } from "lucide-react";
import { EmptyState } from "@/components/common/empty-state";
import { DealCard } from "@/components/flights/deal-card";
import { FlightCard } from "@/components/flights/flight-card";
import { FilterDrawer } from "@/components/results/filter-drawer";
import { FilterSidebar } from "@/components/results/filter-sidebar";
import { LoadMore } from "@/components/results/load-more";
import { PendingResults, SearchNavigationProvider } from "@/components/results/search-navigation";
import { SortDropdown } from "@/components/results/sort-dropdown";
import { ViewToggle } from "@/components/results/view-toggle";
import { SearchBox } from "@/components/search/search-box";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth/session";
import { getAirport } from "@/lib/catalog/airports";
import { todayIso } from "@/lib/dates";
import { getFlightProvider } from "@/lib/flights";
import type { FlightSearchParams } from "@/lib/flights/types";
import { CABIN_LABELS, formatDateRange, formatPrice } from "@/lib/format";
import { PAGE_SIZE, parseSearchPage } from "@/lib/search-params";
import { getHomeAirport } from "@/lib/services/preferences";
import { recordPriceObservations, recordSearch } from "@/lib/services/searches";

type SearchParams = Record<string, string | string[] | undefined>;

function routeTitle(params: FlightSearchParams) {
  const from = getAirport(params.from)?.city ?? params.from;
  const to = params.to ? (getAirport(params.to)?.city ?? params.to) : "Anywhere";
  return `Flights from ${from} to ${to}`;
}

function whenLabel(params: FlightSearchParams) {
  switch (params.when) {
    case "exact":
      return params.departure ? formatDateRange(params.departure, params.returnDate) : "Any dates";
    case "flexible":
      return params.departure ? `${formatDateRange(params.departure, params.returnDate)} (± 3 days)` : "Flexible dates";
    case "weekend":
      return "Upcoming weekends";
    case "next-month":
      return "Next month";
    default:
      return "Any dates in the next 3 months";
  }
}

function toQuery(sp: SearchParams): string {
  const out = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) {
    if (typeof v === "string") out.set(k, v);
    else if (Array.isArray(v) && v[0]) out.set(k, v[0]);
  }
  return out.toString();
}

export async function generateMetadata({ searchParams }: PageProps<"/flights">): Promise<Metadata> {
  const parsed = parseSearchPage(await searchParams, await getHomeAirport());
  const title = routeTitle(parsed.params);
  const canonical = `/flights?from=${parsed.params.from}&to=${parsed.params.to ?? "anywhere"}`;
  return {
    title,
    description: `${title}: compare fares, airlines and stops, and spot prices below the usual on SkyScout.`,
    alternates: { canonical },
    // Individual filter combinations are thin content; destination pages are the SEO entry points.
    robots: { index: false, follow: true },
  };
}

export default async function FlightsPage({ searchParams }: PageProps<"/flights">) {
  const sp = await searchParams;
  const parsed = parseSearchPage(sp, await getHomeAirport());
  const { params, filters, sort, view, limit } = parsed;
  const query = toQuery(sp);

  const result = await getFlightProvider().searchFlights(params, { filters, sort });
  const deals = result.deals;
  const visible = deals.slice(0, limit);
  const travelers = params.adults + params.children;
  const cheapest = deals.reduce<number | null>((m, d) => (m === null || d.price < m ? d.price : m), null);
  const anywhere = params.to === null;

  const user = await getCurrentUser();
  after(async () => {
    try {
      if (user) await recordSearch(user.id, params, `/flights?${query}`, deals);
      await recordPriceObservations(deals);
    } catch (error) {
      console.warn("[flights] could not record search", error instanceof Error ? error.message : error);
    }
  });

  const searchBox = (
    <SearchBox
      variant="compact"
      today={todayIso()}
      keep={{ ...(sort !== "best" ? { sort } : {}), ...(view !== "list" ? { view } : {}) }}
      initial={{
        from: params.from,
        to: params.to ?? "anywhere",
        departure: params.departure ?? "",
        returnDate: params.returnDate ?? "",
        when: params.when,
        oneWay: params.oneWay,
        adults: params.adults,
        children: params.children,
        cabin: params.cabin,
      }}
    />
  );

  const alertHref = `/alerts?from=${params.from}${params.to ? `&to=${params.to}` : ""}${cheapest ? `&max=${Math.max(20, Math.floor((cheapest * 0.9) / 5) * 5)}` : ""}`;

  return (
    <SearchNavigationProvider query={query}>
      <div className="border-b bg-gradient-to-b from-sky to-background">
        <div className="container-page py-6 sm:py-8">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="flex items-center gap-2 text-sm font-medium text-primary">
                <PlaneTakeoff className="size-4" aria-hidden="true" /> {params.from} → {params.to ?? "Anywhere"}
              </p>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-4xl">{routeTitle(params)}</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {whenLabel(params)} · {travelers} traveller{travelers > 1 ? "s" : ""} · {CABIN_LABELS[params.cabin]}
                {params.oneWay ? " · One-way" : ""}
              </p>
            </div>
            <Button asChild variant="outline" size="sm" className="h-9">
              <Link href={alertHref}>
                <BellPlus /> Track prices
              </Link>
            </Button>
          </div>
          <div className="mt-5 hidden lg:block">{searchBox}</div>
          <details className="group mt-4 lg:hidden">
            <summary className="flex cursor-pointer list-none items-center justify-between rounded-2xl border bg-card px-4 py-3 text-sm font-semibold shadow-sm [&::-webkit-details-marker]:hidden">
              Edit search
              <ChevronDown className="size-4 transition-transform group-open:rotate-180" aria-hidden="true" />
            </summary>
            <div className="mt-3">{searchBox}</div>
          </details>
        </div>
      </div>

      <div className="container-page grid gap-8 py-8 lg:grid-cols-[290px_1fr]">
        <FilterSidebar facets={result.facets} hasExactDates={!!params.departure} />

        <section aria-labelledby="results-heading" className="min-w-0">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 id="results-heading" className="font-semibold" aria-live="polite">
                {deals.length} flight{deals.length === 1 ? "" : "s"}
                {anywhere && deals.length > 0 ? ` to ${new Set(deals.map((d) => d.destination.code)).size} destinations` : ""}
              </h2>
              {cheapest !== null && <p className="text-sm text-muted-foreground">Cheapest from {formatPrice(cheapest)} per person</p>}
            </div>
            <div className="flex items-center gap-2">
              <FilterDrawer facets={result.facets} hasExactDates={!!params.departure} resultCount={deals.length} />
              <SortDropdown />
              <div className="hidden sm:block">
                <ViewToggle />
              </div>
            </div>
          </div>

          <PendingResults>
            {deals.length === 0 ? (
              <EmptyState
                icon={SearchX}
                title="No flights match these filters"
                description="Try removing a filter, widening your price limit or using flexible dates — or let us show you anywhere that's cheap."
                action={
                  <>
                    <Button asChild>
                      <Link href={`/flights?from=${params.from}&to=${params.to ?? "anywhere"}`}>Clear filters</Link>
                    </Button>
                    <Button asChild variant="outline">
                      <Link href={`/explore?from=${params.from}`}>Explore anywhere</Link>
                    </Button>
                  </>
                }
              />
            ) : view === "grid" ? (
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {visible.map((deal) => (
                  <DealCard key={deal.id} deal={deal} />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {visible.map((deal) => (
                  <FlightCard key={deal.id} deal={deal} travelers={travelers} showDestination={anywhere} />
                ))}
              </div>
            )}
            {deals.length > visible.length && (
              <LoadMore nextLimit={limit + PAGE_SIZE} count={Math.min(PAGE_SIZE, deals.length - visible.length)} />
            )}
          </PendingResults>
        </section>
      </div>
    </SearchNavigationProvider>
  );
}

