import Link from "next/link";
import { Price } from "@/components/common/price";
import { ArrowRight, BellRing, Compass, Sparkles, TrendingDown, Wallet } from "lucide-react";
import { JsonLd } from "@/components/common/json-ld";
import { PhotoCredit } from "@/components/common/photo-credit";
import { DestinationArt } from "@/components/destinations/destination-art";
import { DESTINATIONS } from "@/lib/catalog/destinations";
import { SectionHeader } from "@/components/common/section-header";
import { OriginPicker } from "@/components/explore/origin-picker";
import { ForecastChip } from "@/components/flights/forecast";
import { SearchBox } from "@/components/search/search-box";
import { Button } from "@/components/ui/button";
import { getAirport } from "@/lib/catalog/airports";
import { todayIso } from "@/lib/dates";
import { getFlightProvider } from "@/lib/flights";
import { forecastFare } from "@/lib/insights/forecast";
import { tripCost } from "@/lib/insights/trip-cost";
import { buildSearchHref } from "@/lib/search-params";
import { getAirplanePhoto, getDestinationPhotos, type Photo } from "@/lib/photos";
import { getHomeAirport } from "@/lib/services/preferences";
import { absoluteUrl, SITE } from "@/lib/site";

export default async function HomePage() {
  const origin = await getHomeAirport();
  const airport = getAirport(origin)!;
  const provider = getFlightProvider();
  const today = todayIso();

  const TRIP_BUDGET = 800;
  const TRIP_NIGHTS = 5;
  const [best, quotes, fiveNightQuotes] = await Promise.all([
    provider.getDeals({ origin, collection: "best", limit: 1 }),
    provider.exploreDestinations(origin),
    provider.exploreDestinations(origin, { nights: TRIP_NIGHTS }),
  ]);

  // Live examples for the "Only on SkyScout" section.
  const forecastDeal = best[0] ?? null;
  const forecast = forecastDeal
    ? forecastFare(forecastDeal, await provider.getPriceHistory(forecastDeal.origin.code, forecastDeal.destination.code), today)
    : null;
  const budgetTrips = fiveNightQuotes
    .map((q) => ({ q, cost: tripCost(q.destination.code, q.cheapest.price, TRIP_NIGHTS, "budget") }))
    .filter((t): t is { q: typeof t.q; cost: NonNullable<typeof t.cost> } => !!t.cost && t.cost.total <= TRIP_BUDGET)
    .sort((a, b) => a.cost.total - b.cost.total);
  const cheapest = quotes.slice(0, 8);
  const [photos, airplane] = await Promise.all([
    getDestinationPhotos(cheapest.map((q) => q.destination.code)),
    getAirplanePhoto(),
  ]);
  const credited = cheapest.filter((q) => photos[q.destination.code]);

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
          <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,460px)]">
          <div className="min-w-0 max-w-3xl">
            <p className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-card/70 px-3 py-1 text-xs font-semibold text-primary backdrop-blur">
              <span className="size-1.5 animate-pulse rounded-full bg-sunrise" aria-hidden="true" />
              {quotes.length} destinations priced from {airport.city} today
            </p>
            <h1 className="mt-5 text-[2.6rem] leading-[1.02] font-semibold tracking-[-0.035em] text-balance sm:text-6xl lg:text-7xl">
              Find flights <span className="font-display font-normal italic text-primary">worth</span> flying for.
            </h1>
            <p className="mt-5 max-w-xl text-lg text-muted-foreground sm:text-xl">
              SkyScout scans fares from your airport and surfaces the unusually cheap ones — plus destinations you
              might never have thought to search.
            </p>
          </div>
          {airplane && (
            <figure className="relative overflow-hidden rounded-[2rem] shadow-lift">
              {/* eslint-disable-next-line @next/next/no-img-element -- served straight from Wikimedia's CDN */}
              <img
                src={airplane.src}
                alt="A passenger airliner in flight"
                width={airplane.width}
                height={airplane.height}
                fetchPriority="high"
                className="h-48 w-full object-cover sm:h-64 lg:h-[340px]"
              />
              <figcaption className="absolute right-3 bottom-3">
                <PhotoCredit photo={airplane} />
              </figcaption>
            </figure>
          )}
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
          {credited.length > 0 && (
            <details className="mt-4 text-xs text-muted-foreground">
              <summary className="cursor-pointer">Photo credits</summary>
              <ul className="mt-2 space-y-1">
                {credited.map((q) => {
                  const photo = photos[q.destination.code];
                  return (
                    <li key={q.destination.code}>
                      {q.destination.city}:{" "}
                      <a href={photo.sourceUrl} target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">
                        {photo.author}
                      </a>{" "}
                      · {photo.license} · Wikimedia Commons
                    </li>
                  );
                })}
              </ul>
            </details>
          )}
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
            title="Smarter than a list of prices"
            description="Two things most flight sites won't tell you — built into every search."
          />
          <div className="grid gap-5 lg:grid-cols-2">
            {/* Fare Forecast */}
            <article className="flex flex-col rounded-[2rem] border bg-card p-6 shadow-card">
              <span className="flex size-11 items-center justify-center rounded-2xl bg-accent text-primary">
                <Sparkles className="size-5" aria-hidden="true" />
              </span>
              <h3 className="mt-4 text-lg font-semibold">Fare Forecast: buy or wait?</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Every fare gets a recommendation with a confidence score, based on its route&apos;s price history, how it
                compares with the usual price and how close departure is.
              </p>
              {forecastDeal && forecast && (
                <Link
                  href={`/deals/${forecastDeal.id}`}
                  className="mt-5 block rounded-2xl bg-muted p-4 transition hover:bg-accent"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold">
                      {forecastDeal.origin.code} → {forecastDeal.destination.city}
                    </span>
                    <ForecastChip forecast={forecast} />
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{forecast.headline}</p>
                  <p className="mt-2 text-sm font-semibold">
                    <Price amount={forecastDeal.price} />{" "}
                    <span className="font-normal text-muted-foreground">· {forecastDeal.savingsPercent}% below typical</span>
                  </p>
                </Link>
              )}
            </article>

            {/* Trip budget */}
            <article className="flex flex-col rounded-[2rem] border bg-card p-6 shadow-card">
              <span className="flex size-11 items-center justify-center rounded-2xl bg-sunrise-soft text-sunrise">
                <Wallet className="size-5" aria-hidden="true" />
              </span>
              <h3 className="mt-4 text-lg font-semibold">
                Where can <Price amount={TRIP_BUDGET} /> take you?
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Search by total trip budget — flight plus stay and daily spending — not just the fare. Here&apos;s{" "}
                {TRIP_NIGHTS} nights from {airport.city} on a budget:
              </p>
              <ul className="mt-4 space-y-2">
                {budgetTrips.slice(0, 3).map(({ q, cost }) => (
                  <li key={q.destination.code} className="flex items-center justify-between rounded-xl bg-muted px-3 py-2 text-sm">
                    <span className="font-medium">{q.destination.city}</span>
                    <span className="tabular-nums">
                      <span className="font-semibold">
                        <Price amount={cost.total} />
                      </span>{" "}
                      <span className="text-xs text-muted-foreground">all-in</span>
                    </span>
                  </li>
                ))}
              </ul>
              <Link
                href={`/explore?from=${origin}&budget=${TRIP_BUDGET}&nights=${TRIP_NIGHTS}&style=budget`}
                className="mt-auto inline-flex items-center gap-1 pt-4 text-sm font-semibold text-primary hover:underline"
              >
                See all {budgetTrips.length} trips within budget <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </article>
          </div>
        </section>

        {/* How it works + alerts */}
        <section aria-labelledby="how" className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <div className="rounded-[2rem] border bg-card p-8 shadow-card sm:p-10">
            <h2 id="how" className="text-2xl font-semibold tracking-tight sm:text-3xl">
              How SkyScout finds the good ones
            </h2>
            <ol className="mt-8 grid gap-6 sm:grid-cols-3">
              {[
                { icon: Compass, title: "Scan", text: "We price thousands of route and date combinations from your airport." },
                { icon: TrendingDown, title: "Compare", text: "Every fare is measured against what that route typically costs." },
                { icon: Sparkles, title: "Surface", text: "Only real drops get a deal rating — no sponsored placements." },
              ].map(({ icon: Icon, title, text }, i) => (
                <li key={title}>
                  <span className="flex size-11 items-center justify-center rounded-2xl bg-accent text-primary">
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  <h3 className="mt-4 font-semibold">
                    {i + 1}. {title}
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">{text}</p>
                </li>
              ))}
            </ol>
          </div>
          <div className="relative overflow-hidden rounded-[2rem] bg-foreground p-8 text-white shadow-lift sm:p-10">
            <div className="absolute -top-16 -right-16 size-56 rounded-full bg-primary/40 blur-3xl" aria-hidden="true" />
            <div className="absolute -bottom-20 -left-10 size-56 rounded-full bg-sunrise/30 blur-3xl" aria-hidden="true" />
            <BellRing className="relative size-9 text-sunrise" aria-hidden="true" />
            <h2 className="relative mt-5 text-2xl font-semibold tracking-tight">Let the deal come to you</h2>
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
        <DestinationArt code={code} theme={art.theme} from={art.from} to={art.to} showCode={false} className="size-full" />
      ) : null}
    </span>
  );
}
