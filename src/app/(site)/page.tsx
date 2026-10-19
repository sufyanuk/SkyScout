import Link from "next/link";
import { Price } from "@/components/common/price";
import { ArrowRight, BellRing, Compass, Plane, ShieldCheck, Sparkles, Tag } from "lucide-react";
import { JsonLd } from "@/components/common/json-ld";
import { DestinationArt } from "@/components/destinations/destination-art";
import { DESTINATIONS } from "@/lib/catalog/destinations";
import type { DestinationQuote } from "@/lib/flights/types";
import { SearchBox } from "@/components/search/search-box";
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
      <section aria-label="Search flights" className="bg-sky-hero">
        <div className="container-page pt-10 pb-12 sm:pt-16 sm:pb-16">
          <p className="inline-flex items-center gap-1.5 rounded-md bg-card/80 px-2.5 py-1 text-xs font-medium text-primary shadow-sm">
            <Plane className="size-3.5" aria-hidden="true" /> Smarter flights. Better prices.
          </p>
          <h1 className="mt-4 max-w-3xl text-4xl font-bold tracking-tight text-balance sm:text-5xl">
            Fly when it&apos;s <span className="text-primary">cheapest</span>
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            Tell us your travel window and destination — we&apos;ll find the best-value days to go.
          </p>
          <SearchBox className="mt-8 border-white shadow-lift" today={today} initial={{ from: origin }} />
        </div>
      </section>

      {/* Cheapest flights from your airport */}
      <section aria-labelledby="from-airport">
        <div className="container-page pt-12 pb-10 sm:pt-14">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <h2 id="from-airport" className="flex items-center gap-2 text-lg font-semibold">
                <Tag className="size-4 text-primary" aria-hidden="true" /> Cheapest flights from {airport.city}
              </h2>
              <p className="mt-0.5 text-xs text-muted-foreground">Return fares, lowest first · updated daily</p>
            </div>
            <Link href={`/explore?from=${origin}`} className="shrink-0 text-sm font-medium text-primary hover:underline">
              Explore all →
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {cheapest.map((q) => (
              <FareCard key={q.destination.code} quote={q} photo={photos[q.destination.code]} origin={airport.city} />
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section aria-label="Why SkyScout" className="container-page">
        <ul className="grid gap-4 rounded-2xl bg-accent/70 p-5 sm:grid-cols-2 sm:p-6 lg:grid-cols-4">
          {[
            { icon: Sparkles, title: "Flexible dates", text: "See the best prices across your travel window.", href: flexHref },
            { icon: BellRing, title: "Price alerts", text: "Get notified when fares drop for your trip.", href: `/alerts?from=${origin}` },
            { icon: ShieldCheck, title: "Recent fares", text: "Prices found in the last few days by airline and travel partners.", href: `/flights?from=${origin}&to=anywhere` },
            { icon: Compass, title: "More destinations", text: "Search anywhere in the world with ease.", href: "/destinations" },
          ].map(({ icon: Icon, title, text, href }) => (
            <li key={title}>
              <Link href={href} className="group flex items-start gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-card text-primary shadow-sm">
                  <Icon className="size-4" aria-hidden="true" />
                </span>
                <span>
                  <span className="block text-sm font-semibold group-hover:text-primary">{title}</span>
                  <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">{text}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <div className="container-page space-y-14 py-12 sm:space-y-16 sm:py-16">
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

      </div>
    </>
  );
}

function FareCard({ quote, photo, origin }: { quote: DestinationQuote; photo?: Photo; origin: string }) {
  const deal = quote.cheapest;
  const minutes = deal.outbound.durationMinutes;
  const stops = deal.outbound.stops === 0 ? "direct" : `${deal.outbound.stops} stop${deal.outbound.stops > 1 ? "s" : ""}`;
  return (
    <Link
      href={`/deals/${deal.id}`}
      className="group flex flex-col overflow-hidden rounded-xl border bg-card shadow-card transition hover:-translate-y-0.5 hover:shadow-lift"
    >
      <DestinationCover code={quote.destination.code} photo={photo} alt={`${quote.destination.city}, ${quote.destination.country}`} />
      <div className="flex flex-1 flex-col p-3.5">
        <p className="flex items-center gap-1.5 text-sm font-semibold">
          <Plane className="size-3.5 shrink-0 text-primary" aria-hidden="true" />
          <span className="truncate">
            {origin} → {quote.destination.city}
          </span>
        </p>
        <p className="mt-1 truncate text-xs text-muted-foreground">
          {quote.destination.country} · {quote.destination.code}
        </p>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">
          {deal.airline.name} · {stops} · {Math.floor(minutes / 60)}h {minutes % 60}m
        </p>
        <div className="mt-auto flex items-center gap-2 pt-3">
          <span className="text-base font-bold tabular-nums">
            <Price amount={deal.price} />
          </span>
          {deal.typicalPrice > deal.price && (
            <span className="text-xs text-muted-foreground line-through tabular-nums">
              <Price amount={deal.typicalPrice} />
            </span>
          )}
          {deal.savingsPercent >= 5 && (
            <span className="ml-auto rounded-full bg-savings-soft px-2 py-0.5 text-[11px] font-semibold text-savings">
              {deal.savingsPercent}%
            </span>
          )}
        </div>
      </div>
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

function DestinationCover({ code, photo, alt }: { code: string; photo?: Photo; alt: string }) {
  const art = DESTINATIONS.find((d) => d.airport === code)?.art;
  return (
    <span className="relative block aspect-[16/7] overflow-hidden bg-muted">
      {photo ? (
        // eslint-disable-next-line @next/next/no-img-element -- served straight from Wikimedia's CDN
        <img src={photo.src} alt={alt} loading="lazy" className="size-full object-cover transition-transform duration-500 group-hover:scale-105" />
      ) : art ? (
        <DestinationArt code={code} theme={art.theme} from={art.from} to={art.to} showCode={false} photo={false} className="size-full" />
      ) : null}
    </span>
  );
}
