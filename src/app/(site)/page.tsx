import Link from "next/link";
import { BellRing, CalendarHeart, Compass, Globe2, Plane, Sparkles, TicketPercent, TrendingDown } from "lucide-react";
import { JsonLd } from "@/components/common/json-ld";
import { SectionHeader } from "@/components/common/section-header";
import { DestinationCard } from "@/components/destinations/destination-card";
import { OriginPicker } from "@/components/explore/origin-picker";
import { DealCard } from "@/components/flights/deal-card";
import { SearchBox } from "@/components/search/search-box";
import { Button } from "@/components/ui/button";
import { getAirport } from "@/lib/catalog/airports";
import { DESTINATIONS } from "@/lib/catalog/destinations";
import { todayIso } from "@/lib/dates";
import { getFlightProvider } from "@/lib/flights";
import { formatPrice } from "@/lib/format";
import { buildSearchHref } from "@/lib/search-params";
import { getHomeAirport } from "@/lib/services/preferences";
import { absoluteUrl, SITE } from "@/lib/site";

export default async function HomePage() {
  const origin = await getHomeAirport();
  const airport = getAirport(origin)!;
  const provider = getFlightProvider();
  const today = todayIso();

  const [best, weekend, longHaul, quotes] = await Promise.all([
    provider.getDeals({ origin, collection: "best", limit: 6 }),
    provider.getDeals({ origin, collection: "weekend", limit: 4 }),
    provider.getDeals({ origin, collection: "long-haul", limit: 3 }),
    provider.exploreDestinations(origin),
  ]);
  const cheapest = quotes.slice(0, 8);
  const priceByAirport = new Map(quotes.map((q) => [q.destination.code, q.cheapest.price]));
  const trending = DESTINATIONS.filter((d) => d.trending && d.airport !== origin).slice(0, 6);

  const quickSearches = [
    { label: "Anywhere", icon: Globe2, href: buildSearchHref({ from: origin, to: null, extra: { sort: "cheapest" } }) },
    { label: "This weekend", icon: CalendarHeart, href: buildSearchHref({ from: origin, when: "weekend", extra: { sort: "cheapest" } }) },
    { label: "Next month", icon: Sparkles, href: buildSearchHref({ from: origin, when: "next-month", extra: { sort: "cheapest" } }) },
    { label: "Under $300", icon: TicketPercent, href: buildSearchHref({ from: origin, extra: { maxPrice: 300, sort: "cheapest" } }) },
    { label: "Direct flights only", icon: Plane, href: buildSearchHref({ from: origin, extra: { stops: "0", sort: "cheapest" } }) },
  ];

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
        <HeroDecoration />
        <div className="container-page relative pt-12 pb-12 sm:pt-20 sm:pb-14">
          <div className="max-w-3xl">
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

          <SearchBox className="mt-9" today={today} initial={{ from: origin }} />

          <nav aria-label="Quick searches" className="no-scrollbar -mx-4 mt-5 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
            {quickSearches.map(({ label, icon: Icon, href }) => (
              <Link
                key={label}
                href={href}
                className="inline-flex shrink-0 items-center gap-2 rounded-full border bg-card/80 px-4 py-2 text-sm font-medium shadow-sm backdrop-blur transition hover:border-primary/40 hover:text-primary"
              >
                <Icon className="size-4 text-primary" aria-hidden="true" />
                {label}
              </Link>
            ))}
          </nav>
        </div>
      </section>

      <div className="container-page space-y-20 pt-14 sm:space-y-24">
        {/* Best deals */}
        <section aria-labelledby="best-deals">
          <SectionHeader
            id="best-deals"
            eyebrow="Hand-picked by price, not by ads"
            title="Best deals right now"
            description={`The biggest drops below typical fares from ${airport.city}, refreshed daily.`}
            href="/deals"
          />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {best.map((deal, i) => (
              <DealCard key={deal.id} deal={deal} priority={i < 3} />
            ))}
          </div>
        </section>

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
          <ol className="grid gap-x-10 sm:grid-cols-2">
            {cheapest.map((q, i) => (
              <li key={q.destination.code}>
                <Link
                  href={`/deals/${q.cheapest.id}`}
                  className="group flex items-center gap-4 border-b py-4 transition-colors hover:text-primary"
                >
                  <span className="w-5 text-sm font-semibold text-muted-foreground tabular-nums">{i + 1}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold">
                      {origin} → {q.destination.city}
                    </span>
                    <span className="block truncate text-sm text-muted-foreground">
                      {q.destination.country} · {q.cheapest.airline.name}
                      {q.cheapest.outbound.stops === 0 ? " · direct" : ""}
                    </span>
                  </span>
                  <span className="text-right">
                    <span className="block text-lg font-semibold tabular-nums">{formatPrice(q.cheapest.price)}</span>
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

        {/* Trending destinations */}
        <section aria-labelledby="trending">
          <SectionHeader id="trending" eyebrow="What travellers are scouting" title="Trending destinations" href="/destinations" linkLabel="All destinations" />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {trending.map((d) => (
              <DestinationCard key={d.slug} destination={d} fromPrice={priceByAirport.get(d.airport)} originCity={airport.city} />
            ))}
          </div>
        </section>

        {/* Weekend escapes */}
        {weekend.length > 0 && (
          <section aria-labelledby="weekend">
            <SectionHeader
              id="weekend"
              eyebrow="Leave Thursday or Friday, back by Monday"
              title="Weekend escapes"
              description="Short flights, long weekends."
              href="/deals?collection=weekend"
            />
            <div className="no-scrollbar -mx-4 flex snap-x gap-5 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-4">
              {weekend.map((deal) => (
                <DealCard key={deal.id} deal={deal} className="w-[82%] shrink-0 snap-start sm:w-auto" />
              ))}
            </div>
          </section>
        )}

        {/* Long-haul */}
        {longHaul.length > 0 && (
          <section aria-labelledby="long-haul">
            <SectionHeader
              id="long-haul"
              eyebrow="Big trips, small fares"
              title="Long-haul bargains"
              description="Over 5,000 km for well under the usual price."
              href="/deals?collection=long-haul"
            />
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {longHaul.map((deal) => (
                <DealCard key={deal.id} deal={deal} />
              ))}
            </div>
          </section>
        )}

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

function HeroDecoration() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 600 400"
      className="pointer-events-none absolute top-10 right-0 hidden w-[560px] opacity-80 xl:block"
    >
      <path d="M20 360 C 180 120, 380 60, 560 70" fill="none" stroke="var(--primary)" strokeOpacity="0.35" strokeWidth="2" strokeDasharray="2 10" strokeLinecap="round" className="animate-dash" />
      <path d="M120 390 C 260 230, 420 200, 590 210" fill="none" stroke="var(--sunrise)" strokeOpacity="0.35" strokeWidth="2" strokeDasharray="2 10" strokeLinecap="round" />
      <circle cx="20" cy="360" r="6" fill="var(--primary)" fillOpacity="0.5" />
      <g transform="translate(548 80) rotate(-8) scale(-1 1)">
        <path d="M0 0 L36 -6 L46 -18 L52 -17 L48 -4 L66 -2 L72 -10 L76 -9 L74 2 L76 13 L72 14 L66 6 L48 8 L52 21 L46 22 L36 10 Z" fill="var(--foreground)" fillOpacity="0.85" />
      </g>
    </svg>
  );
}
