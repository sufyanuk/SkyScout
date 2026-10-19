import Link from "next/link";
import { Price } from "@/components/common/price";
import { ArrowRight, BellRing, CalendarRange, Coins, Globe2, ShieldCheck, Sparkle, TrendingDown } from "lucide-react";
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
      <section aria-label="Search flights" className="bg-charcoal-hero text-white">
        <div className="container-page pt-12 pb-12 text-center sm:pt-20 sm:pb-16">
          <p className="inline-flex items-center gap-1.5 text-sm text-white/60">
            <Sparkle className="size-4 fill-brand text-brand" aria-hidden="true" /> SkyScout
          </p>
          <h1 className="mx-auto mt-3 max-w-3xl text-4xl font-bold tracking-tight text-balance sm:text-5xl">
            Fly when it&apos;s cheapest
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-white/65 sm:text-base">
            Tell us your travel window and destination — we&apos;ll find the best-value days to go.
          </p>
          <SearchBox className="mt-8 border-white/10 text-left text-foreground shadow-lift" today={today} initial={{ from: origin }} />
        </div>
      </section>

      {/* Cheapest flights from your airport */}
      <section aria-labelledby="from-airport" className="border-b bg-card">
        <div className="container-page py-14 sm:py-20">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">Deals from your airport</p>
              <h2 id="from-airport" className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
                Cheapest flights from {airport.city}
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">Return fares, lowest first · updated daily</p>
            </div>
            <Link href={`/explore?from=${origin}`} className="shrink-0 text-sm font-medium hover:underline">
              Explore all →
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {cheapest.map((q) => (
              <FareCard key={q.destination.code} quote={q} photo={photos[q.destination.code]} origin={airport.city} />
            ))}
          </div>
        </div>
      </section>

      {/* Why SkyScout */}
      <section aria-labelledby="why-skyscout" className="border-b bg-background">
        <div className="container-page grid gap-10 py-14 sm:py-20 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,2fr)] lg:gap-14">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">Why SkyScout</p>
            <h2 id="why-skyscout" className="mt-3 text-2xl font-bold tracking-tight text-balance sm:text-3xl">
              Built to find you the lowest fare — not to sell you one.
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              We compare fares across your whole travel window and show how each one stacks up against what the route
              usually costs. Free to use, no sign-up needed to search.
            </p>
            <Link
              href={`/explore?from=${origin}`}
              className="mt-6 inline-flex h-10 items-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
            >
              Start exploring <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
          <ul className="grid gap-px overflow-hidden rounded-2xl border bg-border sm:grid-cols-2 lg:grid-cols-3">
            {BENEFITS.map(({ icon: Icon, title, text }) => (
              <li key={title} className="bg-card p-6">
                <span className="flex size-10 items-center justify-center rounded-lg bg-accent text-primary">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <h3 className="mt-4 text-sm font-semibold">{title}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Price alerts */}
      <section aria-labelledby="alerts-cta" className="-mb-24 bg-card">
        <div className="container-page py-12 sm:py-14">
          <div className="flex flex-col items-start justify-between gap-6 rounded-2xl bg-charcoal-hero px-6 py-8 text-white sm:flex-row sm:items-center sm:px-10">
            <div className="flex items-start gap-4">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-white/10">
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
              className="inline-flex h-11 shrink-0 items-center gap-2 rounded-full bg-white px-6 text-sm font-semibold text-foreground transition hover:bg-white/90"
            >
              Create a price alert <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

const BENEFITS = [
  {
    icon: CalendarRange,
    title: "Flexible-date search",
    text: "Give a departure and return window; we compare every day in it to find the cheapest combination.",
  },
  {
    icon: TrendingDown,
    title: "Know a real deal",
    text: "Every fare is compared with what the route usually costs, so you see the saving at a glance.",
  },
  {
    icon: Globe2,
    title: "Search whole regions",
    text: "Fly from a country or to a region — say, UAE to Europe — across every airport at once.",
  },
  {
    icon: BellRing,
    title: "Price alerts",
    text: "Set a target and we watch the fares for you, so you don't have to keep checking.",
  },
  {
    icon: ShieldCheck,
    title: "No booking fees from us",
    text: "SkyScout is free. You book directly with trusted travel partners at the price shown there.",
  },
  {
    icon: Coins,
    title: "Your currency",
    text: "See every price in your own currency — over 20 to choose from.",
  },
] as const;

function FareCard({ quote, photo, origin }: { quote: DestinationQuote; photo?: Photo; origin: string }) {
  const deal = quote.cheapest;
  const minutes = deal.outbound.durationMinutes;
  return (
    <Link
      href={`/deals/${deal.id}`}
      className="group flex flex-col rounded-xl border bg-card transition hover:border-foreground/25"
    >
      <div className="flex flex-1 items-start gap-3 p-3.5">
        <DestinationThumb code={quote.destination.code} photo={photo} alt={`${quote.destination.city}, ${quote.destination.country}`} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold group-hover:underline">
            {origin} → {quote.destination.city}
          </p>
          <span className="mt-1 inline-block max-w-full truncate rounded-full border px-2 py-0.5 text-[10px] text-muted-foreground">
            {quote.destination.country}
          </span>
          <p className="mt-2 line-clamp-1 text-xs text-muted-foreground">
            {deal.airline.name} · {deal.outbound.stops === 0 ? "direct" : `${deal.outbound.stops} stop${deal.outbound.stops > 1 ? "s" : ""}`} ·{" "}
            {Math.floor(minutes / 60)}h {minutes % 60}m
          </p>
        </div>
      </div>
      <dl className="grid grid-cols-3 gap-2 border-t px-3.5 py-2.5 text-sm">
        <div>
          <dt className="text-[9px] uppercase tracking-wider text-muted-foreground">Fare</dt>
          <dd className="mt-0.5 font-semibold tabular-nums">
            <Price amount={deal.price} />
          </dd>
        </div>
        <div>
          <dt className="text-[9px] uppercase tracking-wider text-muted-foreground">Typical</dt>
          <dd className="mt-0.5 text-muted-foreground tabular-nums line-through decoration-muted-foreground/50">
            <Price amount={deal.typicalPrice} />
          </dd>
        </div>
        <div>
          <dt className="text-[9px] uppercase tracking-wider text-muted-foreground">Save</dt>
          <dd className="mt-0.5 font-semibold tabular-nums text-savings">{deal.savingsPercent}%</dd>
        </div>
      </dl>
    </Link>
  );
}

function DestinationThumb({ code, photo, alt }: { code: string; photo?: Photo; alt: string }) {
  const art = DESTINATIONS.find((d) => d.airport === code)?.art;
  return (
    <span className="relative size-10 shrink-0 overflow-hidden rounded-lg border bg-muted">
      {photo ? (
        // eslint-disable-next-line @next/next/no-img-element -- served straight from Wikimedia's CDN
        <img src={photo.src} alt={alt} loading="lazy" className="size-full object-cover" />
      ) : art ? (
        <DestinationArt code={code} theme={art.theme} from={art.from} to={art.to} showCode={false} photo={false} className="size-full" />
      ) : null}
    </span>
  );
}
