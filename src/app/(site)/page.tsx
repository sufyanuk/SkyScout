import Link from "next/link";
import { Price } from "@/components/common/price";
import { ArrowRight, BellRing, CalendarRange, Compass, Wallet } from "lucide-react";
import { JsonLd } from "@/components/common/json-ld";
import { DestinationArt } from "@/components/destinations/destination-art";
import { DESTINATIONS } from "@/lib/catalog/destinations";
import { SectionHeader } from "@/components/common/section-header";
import { OriginPicker } from "@/components/explore/origin-picker";
import { SearchBox } from "@/components/search/search-box";
import { Button } from "@/components/ui/button";
import { getAirport } from "@/lib/catalog/airports";
import { addDays, todayIso } from "@/lib/dates";
import { makeSearchParams } from "@/lib/flights/params";
import { formatDateRange } from "@/lib/format";
import { getFlightProvider } from "@/lib/flights";
import { buildSearchHref } from "@/lib/search-params";
import { getDestinationPhotos, type Photo } from "@/lib/photos";
import { getHomeAirport } from "@/lib/services/preferences";
import { absoluteUrl, SITE } from "@/lib/site";

export default async function HomePage() {
  const origin = await getHomeAirport();
  const airport = getAirport(origin)!;
  const provider = getFlightProvider();
  const today = todayIso();

  /** Flight budget for the "Where can … take you?" card; must match an Explore price filter. */
  const FARE_BUDGET = 300;
  // Flexible-dates example: one route, any departure in the next 30 days, 5–7 nights.
  const flexTo = origin === "LHR" ? "CDG" : "LHR";
  const flexWindow = { start: addDays(today, 7), end: addDays(today, 37) };
  const [quotes, flexResult] = await Promise.all([
    provider.exploreDestinations(origin),
    provider.searchFlights(
      makeSearchParams({
        from: origin,
        to: flexTo,
        when: "range",
        departure: flexWindow.start,
        departureEnd: flexWindow.end,
        tripLength: "custom",
        minNights: 5,
        maxNights: 7,
      }),
      { sort: "cheapest" },
    ),
  ]);
  // Cheapest fare for each distinct pair of dates, then the three best.
  const byDates = new Map<string, (typeof flexResult.deals)[number]>();
  for (const d of flexResult.deals) {
    const key = `${d.departureDate}-${d.returnDate}`;
    if (!byDates.has(key) || d.price < byDates.get(key)!.price) byDates.set(key, d);
  }
  const flexDates = [...byDates.values()].sort((a, b) => a.price - b.price);
  const flexSaving = flexDates.length > 1 ? flexDates[flexDates.length - 1].price - flexDates[0].price : 0;
  const flexCity = getAirport(flexTo)!.city;
  const flexHref = buildSearchHref({
    from: origin,
    to: flexTo,
    departure: flexWindow.start,
    when: "range",
    extra: { until: flexWindow.end, minNights: 5, maxNights: 7, sort: "cheapest" },
  });

  const underBudget = quotes.filter((q) => q.cheapest.price <= FARE_BUDGET).sort((a, b) => a.cheapest.price - b.cheapest.price);
  const cheapest = quotes.slice(0, 8);
  const photos = await getDestinationPhotos(cheapest.map((q) => q.destination.code));

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: SITE.name,
          url: SITE.url,
          description: SITE.description,
          potentialAction: {
            "@type": "SearchAction",
            target: { "@type": "EntryPoint", urlTemplate: `${absoluteUrl("/flights")}?from=${origin}&to={destination}` },
            "query-input": "required name=destination",
          },
        }}
      />

      {/* Hero */}
      <section className="relative overflow-hidden bg-horizon">
        <div className="container-page relative pt-10 pb-12 sm:pt-16 sm:pb-14">
          <div className="max-w-3xl">
            <p className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-card/70 px-3 py-1 text-xs font-semibold text-primary backdrop-blur">
              <span className="size-1.5 animate-pulse rounded-full bg-sunrise" aria-hidden="true" />
              {quotes.length} destinations priced from {airport.city} today
            </p>
            <h1 className="mt-5 text-[2.6rem] leading-[1.02] font-semibold tracking-[-0.035em] text-balance sm:text-6xl lg:text-7xl">
              Find flights <span className="font-display font-normal italic text-primary">worth</span> flying for.
            </h1>
            <p className="mt-5 max-w-2xl text-lg text-muted-foreground sm:text-xl">
              Uncover <strong className="font-semibold text-foreground">cheaper routes</strong> and the{" "}
              <strong className="font-semibold text-foreground">best-value dates</strong> across your whole{" "}
              <strong className="font-semibold text-foreground">travel window</strong>.
            </p>
          </div>

          <SearchBox className="mt-9" today={today} initial={{ from: origin }} />

        </div>
      </section>

      <div className="container-page space-y-20 pt-14 sm:space-y-24">
        {/* Cheap from your airport */}
        <section aria-labelledby="from-airport" className="rounded-[2rem] border bg-card p-6 shadow-card sm:p-10">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Anywhere, sorted by price</p>
              <h2 id="from-airport" className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
                Cheap flights from {airport.city}
              </h2>
            </div>
            <OriginPicker value={origin} query="" />
          </div>
          <ol className="grid grid-cols-1 gap-x-10 sm:grid-cols-2">
            {cheapest.map((q, i) => (
              <li key={q.destination.code}>
                <Link
                  href={`/deals/${q.cheapest.id}`}
                  className="group flex min-w-0 items-center gap-3 border-b py-3.5 transition-colors hover:text-primary sm:gap-4"
                >
                  <span className="w-4 shrink-0 text-sm font-semibold text-muted-foreground tabular-nums">{i + 1}</span>
                  <DestinationThumb code={q.destination.code} photo={photos[q.destination.code]} alt={`${q.destination.city}, ${q.destination.country}`} />
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold">
                      {origin} → {q.destination.city}
                    </span>
                    <span className="block truncate text-sm text-muted-foreground">
                      {q.destination.country} · {q.cheapest.airline.name}
                      {q.cheapest.outbound.stops === 0 ? " · direct" : ""}
                    </span>
                  </span>
                  <span className="shrink-0 text-right">
                    <span className="block text-lg font-semibold tabular-nums"><Price amount={q.cheapest.price} /></span>
                    {q.cheapest.savingsPercent >= 10 && (
                      <span className="block text-xs font-medium text-savings">−{q.cheapest.savingsPercent}%</span>
                    )}
                  </span>
                </Link>
              </li>
            ))}
          </ol>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild>
              <Link href={`/explore?from=${origin}`}>
                <Compass /> Explore every destination
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={buildSearchHref({ from: origin, extra: { sort: "cheapest" } })}>See all flights</Link>
            </Button>
          </div>
        </section>

        {/* Differentiators */}
        <section aria-labelledby="only-here">
          <SectionHeader
            id="only-here"
            eyebrow="Only on SkyScout"
            title="Fly further for less"
            description="Tell us roughly when, or how much — we'll find the cheapest way to go."
          />
          <div className="grid gap-5 lg:grid-cols-2">
            {/* Flexible dates */}
            <article className="flex flex-col rounded-[2rem] border bg-card p-6 shadow-card">
              <span className="flex size-11 items-center justify-center rounded-2xl bg-accent text-primary">
                <CalendarRange className="size-5" aria-hidden="true" />
              </span>
              <h3 className="mt-4 text-lg font-semibold">Flexible dates? Find the cheapest days to fly.</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Give us a travel window instead of fixed dates and we&apos;ll compare every departure and return
                in it. Example: {airport.city} → {flexCity}, leaving any day in the next month, 5–7 nights:
              </p>
              {flexDates.length === 0 && (
                <p className="mt-4 rounded-xl bg-muted px-3 py-2 text-sm text-muted-foreground">
                  No recent fares for this example right now — try it with your own route and dates.
                </p>
              )}
              <ul className="mt-4 space-y-2">
                {flexDates.slice(0, 3).map((d) => (
                  <li key={d.id}>
                    <Link
                      href={`/deals/${d.id}`}
                      className="flex items-center justify-between rounded-xl bg-muted px-3 py-2 text-sm transition hover:bg-accent"
                    >
                      <span className="font-medium">
                        {formatDateRange(d.departureDate, d.returnDate)}
                        <span className="font-normal text-muted-foreground"> · {d.nights} nights</span>
                      </span>
                      <span className="font-semibold tabular-nums">
                        <Price amount={d.price} />
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
              {flexSaving > 0 && (
                <p className="mt-3 text-sm">
                  <span className="font-semibold text-savings">
                    Save up to <Price amount={flexSaving} />
                  </span>{" "}
                  <span className="text-muted-foreground">versus the priciest dates in the same window.</span>
                </p>
              )}
              <Link
                href={flexHref}
                className="mt-auto inline-flex items-center gap-1 pt-4 text-sm font-semibold text-primary hover:underline"
              >
                Search your own date range <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </article>

            {/* Fare budget */}
            <article className="flex flex-col rounded-[2rem] border bg-card p-6 shadow-card">
              <span className="flex size-11 items-center justify-center rounded-2xl bg-sunrise-soft text-sunrise">
                <Wallet className="size-5" aria-hidden="true" />
              </span>
              <h3 className="mt-4 text-lg font-semibold">
                Where can a <Price amount={FARE_BUDGET} /> flight take you?
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                The cheapest return fares from {airport.city} right now, per person:
              </p>
              <ul className="mt-4 space-y-2">
                {underBudget.slice(0, 3).map((q) => (
                  <li key={q.destination.code}>
                    <Link
                      href={`/deals/${q.cheapest.id}`}
                      className="flex items-center justify-between rounded-xl bg-muted px-3 py-2 text-sm transition hover:bg-accent"
                    >
                      <span className="font-medium">
                        {airport.city} → {q.destination.city}
                      </span>
                      <span className="tabular-nums">
                        <span className="text-xs text-muted-foreground">from</span>{" "}
                        <span className="font-semibold">
                          <Price amount={q.cheapest.price} />
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
              <Link
                href={`/explore?from=${origin}&max=${FARE_BUDGET}`}
                className="mt-auto inline-flex items-center gap-1 pt-4 text-sm font-semibold text-primary hover:underline"
              >
                See all {underBudget.length} destinations with flights under <Price amount={FARE_BUDGET} />{" "}
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </article>
          </div>
        </section>

        {/* Price alerts */}
        <section aria-labelledby="alerts-cta">
          <div className="relative overflow-hidden rounded-[2rem] bg-foreground p-8 text-white shadow-lift sm:p-10">
            <div className="absolute -top-16 -right-16 size-56 rounded-full bg-primary/40 blur-3xl" aria-hidden="true" />
            <div className="absolute -bottom-20 -left-10 size-56 rounded-full bg-sunrise/30 blur-3xl" aria-hidden="true" />
            <BellRing className="relative size-9 text-sunrise" aria-hidden="true" />
            <h2 id="alerts-cta" className="relative mt-5 text-2xl font-semibold tracking-tight">
              Let the deal come to you
            </h2>
            <p className="relative mt-2 text-white/75">
              “Notify me when {airport.city} → London drops below $350.” Set a target and we&apos;ll watch the fares.
            </p>
            <Button asChild variant="sunrise" size="lg" className="relative mt-7">
              <Link href={`/alerts?from=${origin}&to=LHR&max=350`}>Create a price alert</Link>
            </Button>
          </div>
        </section>
      </div>
    </>
  );
}

function DestinationThumb({ code, photo, alt }: { code: string; photo?: Photo; alt: string }) {
  const art = DESTINATIONS.find((d) => d.airport === code)?.art;
  return (
    <span className="relative size-14 shrink-0 overflow-hidden rounded-2xl bg-muted">
      {photo ? (
        // eslint-disable-next-line @next/next/no-img-element -- served straight from Wikimedia's CDN
        <img src={photo.src} alt={alt} loading="lazy" className="size-full object-cover transition-transform duration-300 group-hover:scale-110" />
      ) : art ? (
        <DestinationArt code={code} theme={art.theme} from={art.from} to={art.to} showCode={false} photo={false} className="size-full" />
      ) : null}
    </span>
  );
}
