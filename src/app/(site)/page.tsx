import Link from "next/link";
import { Price } from "@/components/common/price";
import { ArrowRight, BellRing, Sparkle } from "lucide-react";
import { JsonLd } from "@/components/common/json-ld";
import { DestinationArt } from "@/components/destinations/destination-art";
import { DESTINATIONS } from "@/lib/catalog/destinations";
import type { DestinationQuote } from "@/lib/flights/types";
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

      {/* Search */}
      <section aria-label="Search flights">
        <div className="container-page pt-12 pb-10 text-center sm:pt-20 sm:pb-14">
          <p className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
            <Sparkle className="size-4 fill-brand text-brand" aria-hidden="true" /> SkyScout
          </p>
          <h1 className="mx-auto mt-3 max-w-3xl text-4xl font-bold tracking-tight text-balance sm:text-5xl">
            Fly when it&apos;s cheapest
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            Tell us your travel window and destination — we&apos;ll find the best-value days to go.
          </p>
          <SearchBox className="mt-8 text-left" today={today} initial={{ from: origin }} />
        </div>
      </section>

      <div className="container-page space-y-14 pb-16 sm:space-y-16 sm:pb-20">
        {/* Cheapest flights from your airport */}
        <section aria-labelledby="from-airport">
          <div className="mb-4 flex items-center justify-between gap-4">
            <h2 id="from-airport" className="text-sm text-muted-foreground">
              {cheapest.length} cheapest flights from {airport.city}
            </h2>
            <Link href={`/explore?from=${origin}`} className="text-sm font-medium hover:underline">
              Explore all →
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {cheapest.map((q) => (
              <FareCard key={q.destination.code} quote={q} photo={photos[q.destination.code]} origin={airport.city} />
            ))}
          </div>
        </section>

        {/* Ways to save */}
        <section aria-labelledby="ways-to-save">
          <MinimalHeader id="ways-to-save" title="Two ways to pay less" subtitle="Be flexible on when — or on where." />
          <div className="grid gap-4 md:grid-cols-2">
            {/* Flexible dates */}
            <article className="flex flex-col rounded-xl border bg-card p-5 sm:p-6">
              <h3 className="font-semibold">Flexible dates</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Cheapest days to fly {airport.city} → {flexCity} in the next month (5–7 nights):
              </p>
              {flexDates.length === 0 ? (
                <p className="mt-4 text-sm text-muted-foreground">No recent fares for this example — try your own dates.</p>
              ) : (
                <ul className="mt-4 divide-y">
                  {flexDates.slice(0, 3).map((d) => (
                    <li key={d.id}>
                      <Link href={`/deals/${d.id}`} className="flex items-center justify-between py-2.5 text-sm hover:text-primary">
                        <span>
                          {formatDateRange(d.departureDate, d.returnDate)}
                          <span className="text-muted-foreground"> · {d.nights} nights</span>
                        </span>
                        <span className="font-semibold tabular-nums">
                          <Price amount={d.price} />
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
              {flexSaving > 0 && (
                <p className="mt-3 text-sm text-savings">
                  Up to <Price amount={flexSaving} /> less than the priciest dates.
                </p>
              )}
              <Link href={flexHref} className="mt-auto inline-flex items-center gap-1 pt-5 text-sm font-medium text-primary hover:underline">
                Search your date range <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </article>

            {/* Fare budget */}
            <article className="flex flex-col rounded-xl border bg-card p-5 sm:p-6">
              <h3 className="font-semibold">
                Flights under <Price amount={FARE_BUDGET} />
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">Cheapest return fares from {airport.city} right now:</p>
              <ul className="mt-4 divide-y">
                {underBudget.slice(0, 3).map((q) => (
                  <li key={q.destination.code}>
                    <Link href={`/deals/${q.cheapest.id}`} className="flex items-center justify-between py-2.5 text-sm hover:text-primary">
                      <span>{q.destination.city}</span>
                      <span className="font-semibold tabular-nums">
                        <Price amount={q.cheapest.price} />
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
              <Link
                href={`/explore?from=${origin}&max=${FARE_BUDGET}`}
                className="mt-auto inline-flex items-center gap-1 pt-5 text-sm font-medium text-primary hover:underline"
              >
                All {underBudget.length} destinations under <Price amount={FARE_BUDGET} /> <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </article>
          </div>
        </section>

        {/* Price alerts */}
        <section aria-labelledby="alerts-cta" className="flex flex-col items-start justify-between gap-4 rounded-xl border bg-card p-5 sm:flex-row sm:items-center sm:p-6">
          <div className="flex items-start gap-3">
            <BellRing className="mt-0.5 size-5 shrink-0 text-brand" aria-hidden="true" />
            <div>
              <h2 id="alerts-cta" className="font-semibold">
                Get a price alert
              </h2>
              <p className="text-sm text-muted-foreground">Set a target fare and we&apos;ll tell you when it drops.</p>
            </div>
          </div>
          <Button asChild>
            <Link href={`/alerts?from=${origin}&to=LHR&max=350`}>+ Create alert</Link>
          </Button>
        </section>
      </div>
    </>
  );
}

function FareCard({ quote, photo, origin }: { quote: DestinationQuote; photo?: Photo; origin: string }) {
  const deal = quote.cheapest;
  const minutes = deal.outbound.durationMinutes;
  return (
    <Link
      href={`/deals/${deal.id}`}
      className="group block rounded-xl border bg-card transition hover:border-foreground/25"
    >
      <div className="flex items-start gap-4 p-4 sm:p-5">
        <DestinationThumb code={quote.destination.code} photo={photo} alt={`${quote.destination.city}, ${quote.destination.country}`} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-semibold group-hover:underline">
            {origin} → {quote.destination.city}
          </p>
          <span className="mt-1 inline-block rounded-full border px-2 py-0.5 text-[11px] text-muted-foreground">
            {quote.destination.country}
          </span>
          <p className="mt-3 line-clamp-1 text-sm text-muted-foreground">
            {deal.airline.name} · {deal.outbound.stops === 0 ? "direct" : `${deal.outbound.stops} stop${deal.outbound.stops > 1 ? "s" : ""}`} ·{" "}
            {Math.floor(minutes / 60)}h {minutes % 60}m
          </p>
        </div>
      </div>
      <dl className="grid grid-cols-3 gap-2 border-t px-4 py-3 sm:px-5">
        <div>
          <dt className="text-[10px] uppercase tracking-wider text-muted-foreground">Fare (return)</dt>
          <dd className="mt-0.5 font-semibold tabular-nums">
            <Price amount={deal.price} />
          </dd>
        </div>
        <div>
          <dt className="text-[10px] uppercase tracking-wider text-muted-foreground">Typical</dt>
          <dd className="mt-0.5 text-muted-foreground tabular-nums line-through decoration-muted-foreground/50">
            <Price amount={deal.typicalPrice} />
          </dd>
        </div>
        <div>
          <dt className="text-[10px] uppercase tracking-wider text-muted-foreground">You save</dt>
          <dd className="mt-0.5 font-semibold tabular-nums text-savings">{deal.savingsPercent}%</dd>
        </div>
      </dl>
    </Link>
  );
}

function MinimalHeader({
  id,
  title,
  subtitle,
  href,
  linkLabel,
}: {
  id: string;
  title: string;
  subtitle?: string;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4">
      <div>
        <h2 id={id} className="text-xl font-semibold tracking-tight">
          {title}
        </h2>
        {subtitle && <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {href && (
        <Link href={href} className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-primary hover:underline">
          {linkLabel} <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      )}
    </div>
  );
}

function DestinationThumb({ code, photo, alt }: { code: string; photo?: Photo; alt: string }) {
  const art = DESTINATIONS.find((d) => d.airport === code)?.art;
  return (
    <span className="relative size-12 shrink-0 overflow-hidden rounded-xl border bg-muted">
      {photo ? (
        // eslint-disable-next-line @next/next/no-img-element -- served straight from Wikimedia's CDN
        <img src={photo.src} alt={alt} loading="lazy" className="size-full object-cover" />
      ) : art ? (
        <DestinationArt code={code} theme={art.theme} from={art.from} to={art.to} showCode={false} photo={false} className="size-full" />
      ) : null}
    </span>
  );
}
