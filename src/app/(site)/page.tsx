import Link from "next/link";
import { Price } from "@/components/common/price";
import { ArrowRight, BellRing } from "lucide-react";
import { JsonLd } from "@/components/common/json-ld";
import { DestinationArt } from "@/components/destinations/destination-art";
import { DESTINATIONS } from "@/lib/catalog/destinations";
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
      <section aria-label="Search flights" className="border-b">
        <div className="container-page pt-12 pb-12 sm:pt-20 sm:pb-16">
          <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
            Fly when it&apos;s <span className="text-primary">cheapest</span>.
          </h1>
          <p className="mt-3 max-w-xl text-base text-muted-foreground sm:text-lg">
            Tell us your travel window and destination — we&apos;ll find the best-value days to go.
          </p>
          <SearchBox className="mt-8" today={today} initial={{ from: origin }} />
        </div>
      </section>

      <div className="container-page space-y-16 py-14 sm:space-y-20 sm:py-20">
        {/* Cheap flights from your airport */}
        <section aria-labelledby="from-airport">
          <MinimalHeader
            id="from-airport"
            title={`Cheapest flights from ${airport.city}`}
            subtitle="Return fares to anywhere, lowest first."
            href={`/explore?from=${origin}`}
            linkLabel="Explore all"
          />
          <ol className="grid grid-cols-1 gap-x-10 sm:grid-cols-2">
            {cheapest.map((q) => (
              <li key={q.destination.code}>
                <Link
                  href={`/deals/${q.cheapest.id}`}
                  className="group flex min-w-0 items-center gap-3 border-b py-3 transition-colors hover:text-primary"
                >
                  <DestinationThumb code={q.destination.code} photo={photos[q.destination.code]} alt={`${q.destination.city}, ${q.destination.country}`} />
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium">{q.destination.city}</span>
                    <span className="block truncate text-sm text-muted-foreground">
                      {q.destination.country}
                      {q.cheapest.outbound.stops === 0 ? " · direct" : ""}
                    </span>
                  </span>
                  <span className="shrink-0 font-semibold tabular-nums">
                    <Price amount={q.cheapest.price} />
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        </section>

        {/* Ways to save */}
        <section aria-labelledby="ways-to-save">
          <MinimalHeader id="ways-to-save" title="Two ways to pay less" subtitle="Be flexible on when — or on where." />
          <div className="grid gap-4 md:grid-cols-2">
            {/* Flexible dates */}
            <article className="flex flex-col rounded-2xl border p-5 sm:p-6">
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
            <article className="flex flex-col rounded-2xl border p-5 sm:p-6">
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
        <section aria-labelledby="alerts-cta" className="flex flex-col items-start justify-between gap-4 rounded-2xl border p-5 sm:flex-row sm:items-center sm:p-6">
          <div className="flex items-start gap-3">
            <BellRing className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
            <div>
              <h2 id="alerts-cta" className="font-semibold">
                Get a price alert
              </h2>
              <p className="text-sm text-muted-foreground">Set a target fare and we&apos;ll tell you when it drops.</p>
            </div>
          </div>
          <Button asChild variant="outline">
            <Link href={`/alerts?from=${origin}&to=LHR&max=350`}>Create alert</Link>
          </Button>
        </section>
      </div>
    </>
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
    <span className="relative size-10 shrink-0 overflow-hidden rounded-lg bg-muted">
      {photo ? (
        // eslint-disable-next-line @next/next/no-img-element -- served straight from Wikimedia's CDN
        <img src={photo.src} alt={alt} loading="lazy" className="size-full object-cover" />
      ) : art ? (
        <DestinationArt code={code} theme={art.theme} from={art.from} to={art.to} showCode={false} photo={false} className="size-full" />
      ) : null}
    </span>
  );
}
