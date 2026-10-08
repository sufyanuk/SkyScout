import type { Metadata } from "next";
import { Price } from "@/components/common/price";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BellPlus, CalendarCheck2, Clock, Coins, Globe2, Languages, Lightbulb, Plane, Search, Sun, TrendingDown } from "lucide-react";
import { JsonLd } from "@/components/common/json-ld";
import { SectionHeader } from "@/components/common/section-header";
import { DestinationArt } from "@/components/destinations/destination-art";
import { OriginPicker } from "@/components/explore/origin-picker";
import { AirlineMark } from "@/components/flights/badges";
import { DealCard } from "@/components/flights/deal-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getAirline } from "@/lib/catalog/airlines";
import { getAirport } from "@/lib/catalog/airports";
import { DESTINATIONS, getDestination, MONTH_NAMES } from "@/lib/catalog/destinations";
import { getFlightProvider } from "@/lib/flights";
import { makeSearchParams } from "@/lib/flights/params";
import { formatDateRange, formatDuration, formatStops } from "@/lib/format";
import { buildSearchHref } from "@/lib/search-params";
import { getHomeAirport } from "@/lib/services/preferences";
import { absoluteUrl } from "@/lib/site";
import { cn } from "@/lib/utils";

export function generateStaticParams() {
  return DESTINATIONS.map((d) => ({ slug: d.slug }));
}

export async function generateMetadata({ params }: PageProps<"/destinations/[slug]">): Promise<Metadata> {
  const d = getDestination((await params).slug);
  if (!d) return { title: "Destination not found" };
  const title = `Cheap flights to ${d.city}, ${d.country}`;
  const description = `${d.tagline}. Find cheap flights to ${d.city}, the best time to visit, typical fares, airlines and sample itineraries.`;
  return {
    title,
    description,
    alternates: { canonical: `/destinations/${d.slug}` },
    openGraph: { title, description, url: `/destinations/${d.slug}`, type: "article" },
    twitter: { card: "summary_large_image", title, description },
  };
}

async function resolveOrigin(requested: string | undefined, destinationCode: string) {
  const fromParam = getAirport(requested)?.code;
  const home = fromParam ?? (await getHomeAirport());
  // Can't fly to where you already are — fall back to a major hub.
  return home === destinationCode ? (destinationCode === "DXB" ? "LHR" : "DXB") : home;
}

export default async function DestinationPage({ params, searchParams }: PageProps<"/destinations/[slug]">) {
  const d = getDestination((await params).slug);
  if (!d) notFound();
  const sp = await searchParams;
  const origin = await resolveOrigin(typeof sp.from === "string" ? sp.from : undefined, d.airport);
  const originAirport = getAirport(origin)!;
  const destAirport = getAirport(d.airport)!;
  const provider = getFlightProvider();

  const base = makeSearchParams({ from: origin, to: d.airport });
  const [cheapestResult, history, nextMonth] = await Promise.all([
    provider.searchFlights({ ...base, when: "anytime" }, { sort: "cheapest" }),
    provider.getPriceHistory(origin, d.airport, "economy", 90),
    provider.searchFlights({ ...base, when: "next-month" }, { sort: "value" }),
  ]);

  const cheapestByDate = new Map<string, (typeof cheapestResult.deals)[number]>();
  for (const deal of cheapestResult.deals) if (!cheapestByDate.has(deal.departureDate)) cheapestByDate.set(deal.departureDate, deal);
  const cheapestRows = [...cheapestByDate.values()].sort((a, b) => a.departureDate.localeCompare(b.departureDate)).slice(0, 6);
  const cheapest = cheapestResult.deals[0];
  const average = history.length ? Math.round(history.reduce((s, p) => s + p.price, 0) / history.length) : null;
  const fastest = [...cheapestResult.deals].sort((a, b) => a.outbound.durationMinutes - b.outbound.durationMinutes)[0];
  const dealCards = [...nextMonth.deals, ...cheapestResult.deals]
    .filter((x, i, arr) => arr.findIndex((y) => y.departureDate === x.departureDate) === i)
    .sort((a, b) => b.savingsPercent - a.savingsPercent)
    .slice(0, 3);
  const airlines = cheapestResult.facets.airlines.slice(0, 6);
  const searchHref = buildSearchHref({ from: origin, to: d.airport, extra: { sort: "cheapest" } });

  return (
    <>
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "TouristDestination",
            name: `${d.city}, ${d.country}`,
            description: d.summary,
            url: absoluteUrl(`/destinations/${d.slug}`),
            geo: { "@type": "GeoCoordinates", latitude: destAirport.lat, longitude: destAirport.lon },
            touristType: d.tags,
          },
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Destinations", item: absoluteUrl("/destinations") },
              { "@type": "ListItem", position: 2, name: d.city, item: absoluteUrl(`/destinations/${d.slug}`) },
            ],
          },
        ]}
      />

      {/* Hero */}
      <section className="relative isolate overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <DestinationArt code={d.airport} theme={d.art.theme} from={d.art.from} to={d.art.to} />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-black/5" />
        </div>
        <div className="container-page flex min-h-[380px] flex-col justify-end pt-16 pb-10 text-white sm:min-h-[460px]">
          <nav aria-label="Breadcrumb" className="mb-4 text-sm text-white/80">
            <Link href="/destinations" className="hover:text-white">
              Destinations
            </Link>{" "}
            / <span aria-current="page">{d.city}</span>
          </nav>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-white/85">{d.country}</p>
          <h1 className="mt-1 text-5xl font-semibold tracking-tight sm:text-7xl">{d.city}</h1>
          <p className="mt-2 max-w-xl font-display text-2xl italic text-white/95 sm:text-3xl">{d.tagline}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {d.tags.map((t) => (
              <Badge key={t} className="bg-white/15 capitalize text-white backdrop-blur">
                {t}
              </Badge>
            ))}
          </div>
          <div className="mt-7 flex flex-wrap gap-3">
            <Button asChild size="lg" variant="sunrise">
              <Link href={searchHref}>
                <Search /> Find flights to {d.city}
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-white/40 bg-white/10 text-white backdrop-blur hover:bg-white/20 hover:text-white">
              <Link href={`/alerts?from=${origin}&to=${d.airport}${cheapest ? `&max=${Math.floor((cheapest.price * 0.9) / 5) * 5}` : ""}`}>
                <BellPlus /> Price alert
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <div className="container-page space-y-16 pt-8">
        {/* Key stats */}
        <section aria-label="Flight facts" className="flex flex-col gap-4 rounded-[2rem] border bg-card p-5 shadow-card sm:p-6 lg:flex-row lg:items-center">
          <OriginPicker value={origin} query="" className="lg:max-w-60" />
          <dl className="grid flex-1 grid-cols-2 gap-4 md:grid-cols-4">
            <Stat icon={TrendingDown} label="Cheapest right now" value={cheapest ? <Price amount={cheapest.price} /> : "—"} hint={cheapest ? formatDateRange(cheapest.departureDate, cheapest.returnDate) : undefined} highlight />
            <Stat icon={Coins} label="Average price" value={average ? <Price amount={average} /> : "—"} hint="Last 90 days, return" />
            <Stat icon={Clock} label="Fastest flight" value={fastest ? formatDuration(fastest.outbound.durationMinutes) : "—"} hint={fastest ? formatStops(fastest.outbound.stops) : undefined} />
            <Stat icon={Sun} label="Best time to go" value={d.bestMonths.slice(0, 3).map((m) => MONTH_NAMES[m - 1].slice(0, 3)).join(", ")} hint={d.climate} />
          </dl>
        </section>

        {/* Cheapest flights */}
        <section aria-labelledby="cheapest" className="grid grid-cols-1 gap-8 lg:grid-cols-[1.3fr_1fr]">
          <div className="min-w-0">
            <SectionHeader id="cheapest" title={`Cheapest flights from ${originAirport.city}`} href={searchHref} linkLabel="All flights" />
            <ul className="divide-y rounded-3xl border bg-card shadow-card">
              {cheapestRows.map((deal) => (
                <li key={deal.id}>
                  <Link href={`/deals/${deal.id}`} className="flex items-center gap-4 px-5 py-4 transition hover:bg-muted/60">
                    <AirlineMark airline={deal.airline} size="sm" />
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold">{formatDateRange(deal.departureDate, deal.returnDate)}</span>
                      <span className="block truncate text-sm text-muted-foreground">
                        {deal.airline.name} · {formatStops(deal.outbound.stops)} · {formatDuration(deal.outbound.durationMinutes)}
                      </span>
                    </span>
                    <span className="text-right">
                      <span className="block text-lg font-semibold tabular-nums"><Price amount={deal.price} /></span>
                      {deal.savingsPercent >= 10 && <span className="block text-xs font-semibold text-savings">−{deal.savingsPercent}%</span>}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div className="space-y-6">
            <div className="rounded-3xl border bg-card p-6 shadow-card">
              <h2 className="flex items-center gap-2 font-semibold">
                <CalendarCheck2 className="size-5 text-primary" aria-hidden="true" /> Best time to visit
              </h2>
              <ol className="mt-4 grid grid-cols-6 gap-1.5" aria-label="Months, best months highlighted">
                {MONTH_NAMES.map((m, i) => {
                  const good = d.bestMonths.includes(i + 1);
                  return (
                    <li
                      key={m}
                      className={cn(
                        "rounded-xl py-2 text-center text-xs font-semibold",
                        good ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                      )}
                    >
                      {m.slice(0, 3)}
                      <span className="sr-only">{good ? " — great time to visit" : ""}</span>
                    </li>
                  );
                })}
              </ol>
              <p className="mt-4 text-sm text-muted-foreground">{d.bestTimeNote}</p>
            </div>
            <div className="rounded-3xl border bg-card p-6 shadow-card">
              <h2 className="flex items-center gap-2 font-semibold">
                <Plane className="size-5 text-primary" aria-hidden="true" /> Popular airlines from {originAirport.code}
              </h2>
              <ul className="mt-4 space-y-3">
                {airlines.map((a) => {
                  const airline = getAirline(a.code);
                  return (
                    <li key={a.code} className="flex items-center gap-3">
                      {airline && <AirlineMark airline={airline} size="sm" />}
                      <span className="flex-1 text-sm font-medium">{a.name}</span>
                      <span className="text-sm text-muted-foreground">from <Price amount={a.minPrice} /></span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </section>

        {/* Deals */}
        {dealCards.length > 0 && (
          <section aria-labelledby="deals">
            <SectionHeader id="deals" eyebrow="Below the usual price" title={`Flight deals to ${d.city}`} href={searchHref} />
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {dealCards.map((deal) => (
                <DealCard key={deal.id} deal={deal} />
              ))}
            </div>
          </section>
        )}

        {/* About + itineraries */}
        <section aria-labelledby="itineraries" className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_1.4fr]">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">About {d.city}</h2>
            <p className="mt-3 text-lg leading-relaxed text-muted-foreground">{d.summary}</p>
          </div>
          <div>
            <h2 id="itineraries" className="text-2xl font-semibold tracking-tight">
              Example itineraries
            </h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {d.itineraries.map((it) => (
                <article key={it.title} className="rounded-3xl border bg-card p-5 shadow-card">
                  <p className="text-xs font-semibold uppercase tracking-wide text-primary">{it.days} days</p>
                  <h3 className="mt-1 font-semibold">{it.title}</h3>
                  <ol className="mt-3 space-y-2 text-sm">
                    {it.plan.map((step, i) => (
                      <li key={step} className="flex gap-3">
                        <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-accent text-[11px] font-bold text-accent-foreground">
                          {i + 1}
                        </span>
                        <span className="text-muted-foreground">{step}</span>
                      </li>
                    ))}
                  </ol>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Travel info */}
        <section aria-labelledby="info" className="rounded-[2rem] border bg-card p-6 shadow-card sm:p-8">
          <h2 id="info" className="text-2xl font-semibold tracking-tight">
            Travel information
          </h2>
          <dl className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <Info icon={Coins} label="Currency" value={d.currency} />
            <Info icon={Languages} label="Language" value={d.language} />
            <Info
              icon={Globe2}
              label="Time zone"
              value={`UTC${destAirport.utcOffset >= 0 ? "+" : "−"}${Math.floor(Math.abs(destAirport.utcOffset) / 60)}${destAirport.utcOffset % 60 ? `:${String(Math.abs(destAirport.utcOffset % 60)).padStart(2, "0")}` : ""} (standard time)`}
            />
            <Info icon={Plane} label="Main airport" value={`${destAirport.name} (${destAirport.code})`} />
          </dl>
          <div className="mt-6 rounded-2xl bg-muted p-5">
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <Lightbulb className="size-4 text-sunrise" aria-hidden="true" /> Good to know
            </h3>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
              {d.tips.map((t) => (
                <li key={t}>{t}</li>
              ))}
              <li>Entry rules change — check visa and passport requirements with official government sources before you book.</li>
            </ul>
          </div>
        </section>
      </div>
    </>
  );
}

function Stat({ icon: Icon, label, value, hint, highlight }: { icon: typeof Sun; label: string; value: React.ReactNode; hint?: string; highlight?: boolean }) {
  return (
    <div>
      <dt className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        <Icon className="size-3.5" aria-hidden="true" /> {label}
      </dt>
      <dd className={cn("mt-1 text-2xl font-semibold tracking-tight tabular-nums", highlight && "text-primary")}>{value}</dd>
      {hint && <dd className="text-xs text-muted-foreground">{hint}</dd>}
    </div>
  );
}

function Info({ icon: Icon, label, value }: { icon: typeof Sun; label: string; value: string }) {
  return (
    <div className="flex gap-3">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent text-primary">
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <div>
        <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</dt>
        <dd className="text-sm font-medium">{value}</dd>
      </div>
    </div>
  );
}
