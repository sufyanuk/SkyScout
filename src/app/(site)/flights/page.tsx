import type { Metadata } from "next";
import { Price } from "@/components/common/price";
import Link from "next/link";
import { after } from "next/server";
import { BellPlus, ChevronDown, PlaneTakeoff, SearchX } from "lucide-react";
import { EmptyState } from "@/components/common/empty-state";
import { DealCard } from "@/components/flights/deal-card";
import { FlightCard } from "@/components/flights/flight-card";
import { LoadMore } from "@/components/results/load-more";
import { PendingResults, SearchNavigationProvider } from "@/components/results/search-navigation";
import { SortDropdown } from "@/components/results/sort-dropdown";
import { ViewToggle } from "@/components/results/view-toggle";
import { SearchBox } from "@/components/search/search-box";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth/session";
import { locationLabel } from "@/lib/catalog/locations";
import { totalPrice } from "@/lib/flights/filtering";
import { isSingleRoute } from "@/lib/flights/params";
import { addDays, todayIso } from "@/lib/dates";
import { getFlightProvider } from "@/lib/flights";
import type { FlightSearchParams } from "@/lib/flights/types";
import { CABIN_LABELS, formatDate, formatDateRange } from "@/lib/format";
import { PAGE_SIZE, parseSearchPage } from "@/lib/search-params";
import { getHomeAirport } from "@/lib/services/preferences";
import { recordPriceObservations, recordSearch } from "@/lib/services/searches";

type SearchParams = Record<string, string | string[] | undefined>;

function routeTitle(params: FlightSearchParams) {
  return `Flights from ${locationLabel(params.from)} to ${locationLabel(params.to)}`;
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
    case "range": {
      const stay =
        params.oneWay || (!params.minNights && !params.maxNights)
          ? ""
          : `, ${params.minNights ?? 1}–${params.maxNights ?? params.minNights ?? 30} nights`;
      if (!params.departure) return "Flexible dates";
      const end = params.departureEnd ?? params.departure;
      const leave = end === params.departure ? `Departing ${formatDate(params.departure)}` : `Leave ${formatDateRange(params.departure, end)}`;
      const back =
        !params.oneWay && params.returnFrom && params.returnUntil
          ? ` · return ${formatDateRange(params.returnFrom, params.returnUntil)}`
          : "";
      return `${leave}${back}${stay}`;
    }
    default:
      return "Any dates in the next 3 months";
  }
}

/** Departure date for the search box (the first day of any date window). */
function searchWindows(params: FlightSearchParams) {
  if (!params.departure) return {};
  return { departure: params.when === "flexible" ? addDays(params.departure, -3) : params.departure };
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
  const party = { seated: params.adults + params.children, infants: params.infants };
  const travelers = party.seated + party.infants;
  const cheapest = deals.reduce<number | null>((m, d) => (m === null || totalPrice(d) < m ? totalPrice(d) : m), null);
  const multiDestination = !isSingleRoute(params);

  // Carried to deal pages so totals and bag fees match.
  const linkParams = new URLSearchParams();
  if (party.seated > 1) linkParams.set("travelers", String(party.seated));
  if (party.infants) linkParams.set("infants", String(party.infants));
  if (filters.bags.cabin) linkParams.set("cabinBags", String(filters.bags.cabin));
  if (filters.bags.checked) linkParams.set("checkedBags", String(filters.bags.checked));
  const linkQuery = linkParams.toString();

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
      keep={view !== "list" ? { view } : undefined}
      initial={{
        from: params.from,
        to: params.to ?? "anywhere",
        ...searchWindows(params),
        oneWay: params.oneWay,
        adults: params.adults,
        children: params.children,
        infants: params.infants,
        cabin: params.cabin,
        sort,
        stops: filters.stops.length === 1 && filters.stops[0] === 0 ? "0" : filters.stops.length === 2 && !filters.stops.includes(2) ? "1" : "any",
        limit,
        maxPriceUsd: filters.maxPrice,
        maxLayover: filters.maxLayoverMinutes ? filters.maxLayoverMinutes / 60 : null,
        minNights: params.minNights,
        maxNights: params.maxNights,
        dep: filters.departureTimes.length === 1 ? filters.departureTimes[0] : "any",
        transfer: filters.transfer,
        airlines: filters.airlines,
      }}
    />
  );

  // Alerts watch a single origin airport; for country/region searches use the first airport.
  const alertFrom = params.origins[0];
  const alertTo = params.destinations?.length === 1 ? params.destinations[0] : null;
  const alertHref = `/alerts?from=${alertFrom}${alertTo ? `&to=${alertTo}` : ""}${cheapest ? `&max=${Math.max(20, Math.floor((cheapest * 0.9) / 5) * 5)}` : ""}`;

  return (
    <SearchNavigationProvider query={query}>
      <div className="border-b bg-gradient-to-b from-sky to-background">
        <div className="container-page py-6 sm:py-8">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="flex items-center gap-2 text-sm font-medium text-primary">
                <PlaneTakeoff className="size-4" aria-hidden="true" /> {params.from.length === 3 ? params.from : locationLabel(params.from)} →{" "}
                {params.to ? (params.to.length === 3 ? params.to : locationLabel(params.to)) : "Anywhere"}
              </p>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-4xl">{routeTitle(params)}</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {whenLabel(params)} · {travelers} traveller{travelers > 1 ? "s" : ""} · {CABIN_LABELS[params.cabin]}
                {filters.bags.cabin + filters.bags.checked > 0
                  ? ` · prices incl. ${[filters.bags.cabin ? "cabin bag" : "", filters.bags.checked ? `${filters.bags.checked} checked bag${filters.bags.checked > 1 ? "s" : ""}` : ""].filter(Boolean).join(" + ")}`
                  : ""}
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

      <div className="container-page py-8">
        <section aria-labelledby="results-heading" className="min-w-0">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 id="results-heading" className="font-semibold" aria-live="polite">
                {deals.length} flight{deals.length === 1 ? "" : "s"}
                {multiDestination && deals.length > 0 ? ` to ${new Set(deals.map((d) => d.destination.code)).size} destinations` : ""}
              </h2>
              {cheapest !== null && <p className="text-sm text-muted-foreground">Cheapest from <Price amount={cheapest} /> per person</p>}
            </div>
            <div className="flex items-center gap-2">
              <SortDropdown />
              <div className="hidden sm:block">
                <ViewToggle />
              </div>
            </div>
          </div>

          {deals[0]?.provider === "travelpayouts" && (
            <p className="mb-4 rounded-2xl bg-muted px-4 py-2.5 text-sm text-muted-foreground">
              Real fares found recently on Aviasales. Prices can change before you book; baggage and fare rules are
              shown on the booking site.
            </p>
          )}
          <PendingResults>
            {deals.length === 0 ? (
              <EmptyState
                icon={SearchX}
                title="No flights match this search"
                description="Try wider date ranges, a longer stay or a higher budget — or let us show you anywhere that's cheap."
                action={
                  <>
                    <Button asChild>
                      <Link href={`/flights?from=${params.from}&to=${params.to ?? "anywhere"}`}>Reset search</Link>
                    </Button>
                    <Button asChild variant="outline">
                      <Link href={`/explore?from=${params.origins[0]}`}>Explore anywhere</Link>
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
                  <FlightCard
                    key={deal.id}
                    deal={deal}
                    party={party}
                    linkQuery={linkQuery}
                    showDestination={multiDestination}
                  />
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

