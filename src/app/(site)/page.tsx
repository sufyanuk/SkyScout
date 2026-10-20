import Link from "next/link";
import { Price } from "@/components/common/price";
import { ArrowRight, BellRing, Plane } from "lucide-react";
import { JsonLd } from "@/components/common/json-ld";
import { DestinationArt } from "@/components/destinations/destination-art";
import { DESTINATIONS } from "@/lib/catalog/destinations";
import type { DestinationQuote } from "@/lib/flights/types";
import { SearchBox } from "@/components/search/search-box";
import { getAirport } from "@/lib/catalog/airports";
import { todayIso } from "@/lib/dates";
import { getFlightProvider } from "@/lib/flights";
import { getDestinationPhotos, type Photo } from "@/lib/photos";
import { getHomeAirport } from "@/lib/services/preferences";
import { absoluteUrl, SITE } from "@/lib/site";

export default async function HomePage() {
  const origin = await getHomeAirport();
  const airport = getAirport(origin)!;
  const provider = getFlightProvider();
  const today = todayIso();

  const quotes = await provider.exploreDestinations(origin);
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
      <section aria-label="Search flights" className="relative">
        <div aria-hidden="true" className="bg-sky-photo absolute inset-x-0 top-0 bottom-16 sm:bottom-24" />
        <div className="container-page relative pt-10 pb-4 sm:pt-16">
          <p className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground shadow-sm">
            <Plane className="size-3.5" aria-hidden="true" /> Smarter flights. Better prices.
          </p>
          <h1 className="mt-5 max-w-xl text-4xl font-bold tracking-tight text-balance sm:text-6xl">Fly when it&apos;s cheapest</h1>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-foreground/75 sm:text-base">
            Tell us your travel window and destination — we&apos;ll find the best-value days to go.
          </p>
          <SearchBox key={origin} className="mt-10 border-white shadow-float sm:mt-20" today={today} initial={{ from: origin }} />
        </div>
      </section>

      {/* Cheapest flights from your airport */}
      <section aria-labelledby="from-airport">
        <div className="container-page pt-12 pb-6 sm:pt-16">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">Deals from your airport</p>
              <h2 id="from-airport" className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
                Cheapest flights from {airport.city}
              </h2>
              <p className="mt-1.5 text-sm text-muted-foreground">Return fares, lowest first · updated daily</p>
            </div>
            <Link href={`/explore?from=${origin}`} className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-primary hover:underline">
              Explore all <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {cheapest.map((q) => (
              <FareCard key={q.destination.code} quote={q} photo={photos[q.destination.code]} origin={airport.city} />
            ))}
          </div>
        </div>
      </section>

      {/* Price alerts — overlaps the footer's top rule so no separator shows around the panel. */}
      <section aria-labelledby="alerts-cta" className="relative z-10 -mb-[calc(6rem+1px)] bg-background">
        <div className="container-page pt-8 pb-14 sm:pb-16">
          <div className="relative flex flex-col items-start justify-between gap-6 overflow-hidden rounded-2xl bg-navy-hero px-6 py-8 text-white shadow-lift sm:flex-row sm:items-center sm:px-10">
            <Plane aria-hidden="true" className="absolute top-1/2 right-[30%] hidden size-10 -translate-y-1/2 -rotate-12 text-white/15 sm:block" />
            <div className="flex items-start gap-4">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-white/10">
                <BellRing className="size-5" aria-hidden="true" />
              </span>
              <div>
                <h2 id="alerts-cta" className="text-lg font-semibold">
                  Not ready to book?
                </h2>
                <p className="mt-1 text-sm text-white/70">Set a target fare and we&apos;ll tell you when it drops.</p>
              </div>
            </div>
            <Link
              href={`/alerts?from=${origin}&to=LHR&max=350`}
              className="inline-flex h-11 shrink-0 items-center gap-2 rounded-full bg-white px-6 text-sm font-semibold text-navy transition hover:bg-white/90"
            >
              Create a price alert <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

function FareCard({ quote, photo, origin }: { quote: DestinationQuote; photo?: Photo; origin: string }) {
  const deal = quote.cheapest;
  const minutes = deal.outbound.durationMinutes;
  const stops = deal.outbound.stops === 0 ? "Direct" : `${deal.outbound.stops} stop${deal.outbound.stops > 1 ? "s" : ""}`;
  return (
    <Link
      href={`/deals/${deal.id}`}
      className="card-zoom group flex flex-col rounded-xl border bg-card p-4 shadow-card"
    >
      <div className="flex items-start gap-3">
        <DestinationThumb code={quote.destination.code} photo={photo} alt={`${quote.destination.city}, ${quote.destination.country}`} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">
            {origin} → {quote.destination.city}
          </p>
          <p className="mt-0.5 truncate text-xs font-medium text-primary">{deal.airline.name}</p>
        </div>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        {stops} · {Math.floor(minutes / 60)}h {minutes % 60}m
      </p>
      <div className="mt-2 flex items-center gap-2">
        <span className="text-base font-bold tabular-nums">
          <Price amount={deal.price} />
        </span>
        {deal.typicalPrice > deal.price && (
          <span className="text-xs text-muted-foreground line-through tabular-nums">
            <Price amount={deal.typicalPrice} />
          </span>
        )}
        {deal.savingsPercent > 0 && (
          <span className="ml-auto rounded-full bg-savings-soft px-2 py-0.5 text-[11px] font-semibold text-savings">
            {deal.savingsPercent}%
          </span>
        )}
      </div>
      <span className="mt-3 inline-flex items-center gap-1 self-end text-xs font-semibold text-primary group-hover:underline">
        View details <ArrowRight className="size-3.5" aria-hidden="true" />
      </span>
    </Link>
  );
}

function DestinationThumb({ code, photo, alt }: { code: string; photo?: Photo; alt: string }) {
  const art = DESTINATIONS.find((d) => d.airport === code)?.art;
  return (
    <span className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-muted">
      {photo ? (
        // eslint-disable-next-line @next/next/no-img-element -- served straight from Wikimedia's CDN
        <img src={photo.src} alt={alt} loading="lazy" className="size-full object-cover" />
      ) : art ? (
        <DestinationArt code={code} theme={art.theme} from={art.from} to={art.to} showCode={false} photo={false} className="size-full" />
      ) : null}
    </span>
  );
}
