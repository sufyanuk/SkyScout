import type { Metadata } from "next";
import { formatMoney } from "@/lib/currency";
import { getCurrency } from "@/lib/services/preferences";
import { Price } from "@/components/common/price";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  BadgeCheck,
  BellPlus,
  Briefcase,
  ChevronRight,
  CircleDollarSign,
  Clock,
  Luggage,
  MapPinned,
  Plane,
  RefreshCcw,
  Armchair,
  Utensils,
  Users,
} from "lucide-react";
import { JsonLd } from "@/components/common/json-ld";
import { SectionHeader } from "@/components/common/section-header";
import { DestinationArtFor } from "@/components/destinations/destination-art-for";
import { DealRatingBadge, SavingsBadge, AirlineMark } from "@/components/flights/badges";
import { BookDialog } from "@/components/flights/book-dialog";
import { FareForecastPanel } from "@/components/flights/forecast";
import { TripCostCard } from "@/components/flights/trip-cost-card";
import { bagFeeFor, carrierNames, groupTotal } from "@/lib/flights/pricing";
import { forecastFare } from "@/lib/insights/forecast";
import { DealCard } from "@/components/flights/deal-card";
import { FavoriteButton } from "@/components/flights/favorite-button";
import { FlightTimeline } from "@/components/flights/flight-timeline";
import { PriceHistoryChart } from "@/components/flights/price-history-chart";
import { ShareButton } from "@/components/flights/share-button";
import { Button } from "@/components/ui/button";
import { getDestinationByAirport } from "@/lib/catalog/destinations";
import { todayIso } from "@/lib/dates";
import { getFlightProvider } from "@/lib/flights";
import type { FlightDeal } from "@/lib/flights/types";
import {
  CABIN_LABELS,
  formatDateLong,
  formatDateRange,
  formatDuration,
  formatPrice,
  formatStops,
} from "@/lib/format";
import { buildSearchHref } from "@/lib/search-params";
import { absoluteUrl } from "@/lib/site";
import { cn } from "@/lib/utils";

async function loadDeal(id: string) {
  return getFlightProvider().getDeal(decodeURIComponent(id));
}

function title(deal: FlightDeal) {
  return `${deal.origin.city} to ${deal.destination.city} from ${formatPrice(deal.price)}`;
}

export async function generateMetadata({ params }: PageProps<"/deals/[id]">): Promise<Metadata> {
  const deal = await loadDeal((await params).id);
  if (!deal) return { title: "Deal not found", robots: { index: false } };
  const description = `${deal.airline.name}, ${formatDateRange(deal.departureDate, deal.returnDate)}, ${formatStops(
    deal.outbound.stops,
  ).toLowerCase()}. ${deal.savingsPercent > 0 ? `${deal.savingsPercent}% below the typical ${formatPrice(deal.typicalPrice)}.` : ""}`;
  return {
    title: title(deal),
    description,
    alternates: { canonical: `/deals/${deal.id}` },
    openGraph: { title: title(deal), description, url: `/deals/${deal.id}`, type: "website" },
    // Fares expire quickly — let crawlers follow but not index individual deals.
    robots: { index: false, follow: true },
  };
}

export default async function DealPage({ params, searchParams }: PageProps<"/deals/[id]">) {
  const currency = await getCurrency();
  const money = (usd: number) => formatMoney(usd, currency);
  const baseDeal = await loadDeal((await params).id);
  if (!baseDeal) notFound();
  const sp = await searchParams;
  const int = (v: unknown, min: number, max: number, fallback: number) =>
    Math.min(max, Math.max(min, Math.floor(Number(v)) || fallback));
  const seated = int(sp.travelers, 1, 9, 1);
  const infants = Math.min(seated, int(sp.infants, 0, 4, 0));
  const bags = { cabin: int(sp.cabinBags, 0, 1, 0), checked: int(sp.checkedBags, 0, 2, 0) };
  // Price the fare with the bags the traveller asked for, as on the results page.
  const deal = { ...baseDeal, bagFee: bagFeeFor(baseDeal, bags) };
  const perPerson = deal.price + deal.bagFee;
  const party = { seated, infants };
  const travelers = seated + infants;
  const provider = getFlightProvider();
  const today = todayIso();
  const departed = deal.departureDate < today;

  const [history, similar] = await Promise.all([
    provider.getPriceHistory(deal.origin.code, deal.destination.code, deal.cabin, 90),
    provider.getSimilarDeals(deal, 6),
  ]);
  const destination = getDestinationByAirport(deal.destination.code);
  const forecast = departed ? null : forecastFare(deal, history, today);
  const alertTarget = Math.max(20, Math.floor((deal.price * 0.9) / 5) * 5);
  const alertHref = `/alerts?from=${deal.origin.code}&to=${deal.destination.code}&max=${alertTarget}`;
  const carriers = carrierNames(deal);
  const flights = [...deal.outbound.segments, ...(deal.inbound?.segments ?? [])].map((s) => s.flightNumber);
  const routeLabel = `${deal.origin.city} → ${deal.destination.city}`;

  const facts = [
    { icon: Clock, label: "Flight time", value: formatDuration(deal.outbound.durationMinutes) },
    { icon: Plane, label: "Stops", value: formatStops(deal.outbound.stops) },
    { icon: Armchair, label: "Cabin", value: CABIN_LABELS[deal.cabin] },
    { icon: MapPinned, label: "Distance", value: `${deal.distanceKm.toLocaleString("en-US")} km` },
  ];

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Flight",
          provider: { "@type": "Airline", name: deal.airline.name, iataCode: deal.airline.code },
          flightNumber: deal.outbound.segments[0].flightNumber.replace(" ", ""),
          departureAirport: { "@type": "Airport", name: deal.origin.name, iataCode: deal.origin.code },
          arrivalAirport: { "@type": "Airport", name: deal.destination.name, iataCode: deal.destination.code },
          departureTime: deal.outbound.departure,
          arrivalTime: deal.outbound.arrival,
          offers: {
            "@type": "Offer",
            price: deal.price,
            priceCurrency: deal.currency,
            url: absoluteUrl(`/deals/${deal.id}`),
            availability: departed ? "https://schema.org/SoldOut" : "https://schema.org/InStock",
          },
        }}
      />
      <div className="container-page pt-6">
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Link href="/deals" className="hover:text-foreground">
            Deals
          </Link>
          <ChevronRight className="size-3.5" aria-hidden="true" />
          <Link href={buildSearchHref({ from: deal.origin.code, to: deal.destination.code })} className="hover:text-foreground">
            {deal.origin.city} to {deal.destination.city}
          </Link>
          <ChevronRight className="size-3.5" aria-hidden="true" />
          <span aria-current="page" className="text-foreground">
            {formatDateRange(deal.departureDate, deal.returnDate)}
          </span>
        </nav>
      </div>

      <div className="container-page mt-5 grid gap-8 lg:grid-cols-[1fr_380px]">
        <div className="min-w-0 space-y-8">
          {/* Hero */}
          <section className="overflow-hidden rounded-[2rem] border bg-card shadow-card">
            <div className="relative h-48 sm:h-64">
              <DestinationArtFor code={deal.destination.code} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
              <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                <DealRatingBadge rating={deal.rating} className="shadow-sm" />
                {deal.seatsLeft && (
                  <span className="rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-bold text-sunrise shadow-sm">
                    Only {deal.seatsLeft} seats left at this price
                  </span>
                )}
              </div>
              <div className="absolute right-5 bottom-5 left-5 text-white">
                <p className="font-mono text-sm font-semibold tracking-widest text-white/85">
                  {deal.origin.code} — {deal.destination.code}
                </p>
                <h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-5xl">{routeLabel}</h1>
                <p className="mt-1 text-white/85">
                  {deal.destination.country} · {formatDateRange(deal.departureDate, deal.returnDate)}
                  {deal.nights !== null && ` · ${deal.nights} nights`}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-4 p-5 sm:p-6">
              <AirlineMark airline={deal.airline} size="lg" />
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{carriers}</p>
                <p className="text-sm text-muted-foreground">
                  {deal.fare.fareBrand}
                  {deal.airline.alliance ? ` · ${deal.airline.alliance}` : ""}
                  {deal.airline.lowCost ? " · Low-cost carrier" : ""}
                </p>
              </div>
              <dl className="grid w-full grid-cols-2 gap-3 sm:w-auto sm:grid-cols-4">
                {facts.map(({ icon: Icon, label, value }) => (
                  <div key={label} className="rounded-2xl bg-muted px-3 py-2">
                    <dt className="flex items-center gap-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                      <Icon className="size-3" aria-hidden="true" /> {label}
                    </dt>
                    <dd className="text-sm font-semibold">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </section>

          {deal.selfTransfer && (
            <div role="note" className="rounded-2xl border border-sunrise/30 bg-sunrise-soft p-4 text-sm text-sunrise">
              <p className="font-semibold">Self-transfer itinerary — two separate tickets</p>
              <p className="mt-1">
                In {deal.outbound.layovers.map((l) => l.airport).join(", ")} you&apos;ll collect your bags, re-check them and
                pass security again. If the first flight is delayed, the second airline isn&apos;t obliged to rebook you, so
                we&apos;ve only shown connections of 2½ hours or more.
              </p>
            </div>
          )}

          {forecast && <FareForecastPanel forecast={forecast} alertHref={alertHref} />}

          {departed && (
            <div role="status" className="rounded-2xl border border-sunrise/30 bg-sunrise-soft p-4 text-sm text-sunrise">
              This flight has already departed. Have a look at similar deals below.
            </div>
          )}

          {/* Itinerary */}
          <section aria-labelledby="itinerary" className="space-y-4">
            <h2 id="itinerary" className="text-xl font-semibold tracking-tight">
              Itinerary
            </h2>
            <FlightTimeline slice={deal.outbound} title="Outbound" />
            {deal.inbound && <FlightTimeline slice={deal.inbound} title="Return" />}
          </section>

          {/* Fare & baggage */}
          <section aria-labelledby="fare" className="rounded-3xl border bg-card p-5 shadow-card sm:p-6">
            <h2 id="fare" className="text-xl font-semibold tracking-tight">
              Baggage &amp; fare details
            </h2>
            <ul className="mt-5 grid gap-3 sm:grid-cols-2">
              <FareItem icon={Briefcase} ok={deal.baggage.personalItem} title="Personal item" text="Small bag that fits under the seat" />
              <FareItem
                icon={Briefcase}
                ok={deal.baggage.cabinKg > 0}
                title={deal.baggage.cabinKg > 0 ? `Cabin bag up to ${deal.baggage.cabinKg} kg` : "No cabin bag"}
                text={deal.baggage.cabinKg > 0 ? "Overhead locker" : "Can be added at checkout"}
              />
              <FareItem
                icon={Luggage}
                ok={deal.baggage.checkedBags > 0}
                title={deal.baggage.checkedBags > 0 ? `${deal.baggage.checkedBags} × ${deal.baggage.checkedKg} kg checked bag${deal.baggage.checkedBags > 1 ? "s" : ""}` : "No checked bag"}
                text={deal.baggage.checkedBags > 0 ? "Included in the price" : "Usually $35–60 per bag, each way"}
              />
              <FareItem
                icon={RefreshCcw}
                ok={deal.fare.changeFee !== null}
                title={deal.fare.changeFee === null ? "Changes not allowed" : deal.fare.changeFee === 0 ? "Free date changes" : `Changes for ${money(deal.fare.changeFee)}`}
                text="Plus any fare difference"
              />
              <FareItem
                icon={CircleDollarSign}
                ok={deal.fare.refundable}
                title={deal.fare.refundable ? "Refundable" : "Non-refundable"}
                text={deal.fare.refundable ? "Refund minus taxes if cancelled" : "Taxes may be refundable on request"}
              />
              <FareItem
                icon={Utensils}
                ok={deal.fare.mealsIncluded}
                title={deal.fare.mealsIncluded ? "Meals included" : "Meals for purchase"}
                text={deal.fare.seatSelection === "free" ? "Free seat selection" : "Seat selection from $9"}
              />
            </ul>
            <p className="mt-4 text-xs text-muted-foreground">
              Fare rules are indicative. Always confirm baggage and change conditions with the airline before booking.
            </p>
          </section>

          {/* Price history */}
          <section aria-labelledby="history" className="rounded-3xl border bg-card p-5 shadow-card sm:p-6">
            <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
              <h2 id="history" className="text-xl font-semibold tracking-tight">
                Price history
              </h2>
              <p className="text-sm text-muted-foreground">Lowest return fare seen per day, {routeLabel}</p>
            </div>
            <PriceHistoryChart points={history} typicalPrice={deal.typicalPrice} dealPrice={deal.price} />
          </section>

          <TripCostCard
            destination={deal.destination.code}
            city={deal.destination.city}
            flightUsd={perPerson}
            nights={deal.nights}
          />
        </div>

        {/* Price panel */}
        <aside aria-label="Price and booking" className="lg:row-span-2">
          <div className="sticky top-24 space-y-4">
            <div className="rounded-[2rem] border bg-card p-6 shadow-lift">
              <SavingsBadge percent={deal.savingsPercent} />
              <p className="mt-3 text-5xl font-semibold tracking-tight tabular-nums">
                <Price amount={perPerson} />
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                per person · {deal.returnDate ? "return" : "one-way"} · {CABIN_LABELS[deal.cabin].toLowerCase()}
              </p>
              {deal.bagFee > 0 && (
                <p className="mt-1 text-sm text-muted-foreground">
                  Fare <Price amount={deal.price} /> + bags <Price amount={deal.bagFee} />
                </p>
              )}
              {deal.typicalPrice > deal.price && (
                <p className="mt-3 text-sm">
                  Typically <span className="font-semibold line-through decoration-muted-foreground/60"><Price amount={deal.typicalPrice} /></span> —
                  you save <span className="font-semibold text-savings"><Price amount={deal.typicalPrice - deal.price} /></span>
                </p>
              )}
              {travelers > 1 && (
                <p className="mt-3 flex items-center gap-2 rounded-2xl bg-muted px-3 py-2 text-sm">
                  <Users className="size-4 text-muted-foreground" aria-hidden="true" />
                  <span>
                    <strong>
                      <Price amount={groupTotal(deal, party)} />
                    </strong>{" "}
                    total for {travelers} travellers{infants ? ` (incl. ${infants} lap infant${infants > 1 ? "s" : ""})` : ""}
                  </span>
                </p>
              )}
              <div className="mt-5 space-y-2.5 border-t pt-5 text-sm">
                <p className="flex justify-between">
                  <span className="text-muted-foreground">Depart</span>
                  <span className="font-medium">{formatDateLong(deal.departureDate)}</span>
                </p>
                {deal.returnDate && (
                  <p className="flex justify-between">
                    <span className="text-muted-foreground">Return</span>
                    <span className="font-medium">{formatDateLong(deal.returnDate)}</span>
                  </p>
                )}
                <p className="flex justify-between">
                  <span className="text-muted-foreground">Fare</span>
                  <span className="font-medium">{deal.fare.fareBrand}</span>
                </p>
              </div>
              <BookDialog
                className="mt-6 w-full"
                provider={deal.provider}
                summary={{
                  route: routeLabel,
                  dates: formatDateRange(deal.departureDate, deal.returnDate),
                  airline: carriers,
                  priceUsd: perPerson,
                  travelers,
                  flights,
                }}
              />
              <div className="mt-3 grid grid-cols-2 gap-2">
                <FavoriteButton dealId={deal.id} label={`${routeLabel} deal`} withText className="w-full" />
                <ShareButton
                  withText
                  className="w-full"
                  title={`${deal.origin.city} to ${deal.destination.city} from {price}`}
                  text={`${routeLabel} from {price} (${formatDateRange(deal.departureDate, deal.returnDate)}) on SkyScout:`}
                  priceUsd={perPerson}
                  path={`/deals/${deal.id}`}
                />
              </div>
            </div>

            <div className="rounded-3xl border bg-card p-5 shadow-card">
              <p className="flex items-center gap-2 font-semibold">
                <BellPlus className="size-4 text-primary" aria-hidden="true" /> Not ready to book?
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Get notified if {routeLabel} drops below <Price amount={alertTarget} />.
              </p>
              <Button asChild variant="secondary" className="mt-4 w-full">
                <Link href={alertHref}>
                  Create price alert
                </Link>
              </Button>
            </div>

            {destination && (
              <Link
                href={`/destinations/${destination.slug}`}
                className="group flex items-center gap-3 rounded-3xl border bg-card p-4 shadow-card transition hover:shadow-lift"
              >
                <span className="size-14 shrink-0 overflow-hidden rounded-2xl">
                  <DestinationArtFor code={deal.destination.code} showCode={false} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold">{destination.city} travel guide</span>
                  <span className="block truncate text-sm text-muted-foreground">{destination.tagline}</span>
                </span>
                <ChevronRight className="size-4 text-muted-foreground transition group-hover:translate-x-0.5" aria-hidden="true" />
              </Link>
            )}
          </div>
        </aside>
      </div>

      {/* Mobile: keep price and CTA in reach above the tab bar */}
      <div className="fixed inset-x-0 bottom-[calc(61px+env(safe-area-inset-bottom))] z-30 md:bottom-0 border-t bg-card/95 px-4 py-3 shadow-float backdrop-blur-lg lg:hidden">
        <div className="mx-auto flex max-w-xl items-center justify-between gap-3">
          <div>
            <p className="text-xl font-semibold tabular-nums leading-tight">
              <Price amount={perPerson} />
            </p>
            <p className="text-xs text-muted-foreground">
              {deal.savingsPercent >= 5 ? `${deal.savingsPercent}% below typical` : "per person"}
            </p>
          </div>
          <BookDialog
            size="default"
            label="Search flight"
            provider={deal.provider}
            summary={{
              route: routeLabel,
              dates: formatDateRange(deal.departureDate, deal.returnDate),
              airline: carriers,
              priceUsd: perPerson,
              travelers,
              flights,
            }}
          />
        </div>
      </div>

      <div className="h-20 lg:hidden" aria-hidden="true" />

      {similar.length > 0 && (
        <section aria-labelledby="similar" className="container-page mt-16">
          <SectionHeader
            id="similar"
            title="Similar flights"
            description={`Other dates to ${deal.destination.city} and nearby alternatives from ${deal.origin.city}.`}
            href={buildSearchHref({ from: deal.origin.code, to: deal.destination.code, extra: { sort: "cheapest" } })}
            linkLabel="All dates"
          />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {similar.map((d) => (
              <DealCard key={d.id} deal={d} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}

function FareItem({ icon: Icon, ok, title, text }: { icon: typeof Luggage; ok: boolean; title: string; text: string }) {
  return (
    <li className="flex gap-3 rounded-2xl border p-3.5">
      <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-xl", ok ? "bg-savings-soft text-savings" : "bg-muted text-muted-foreground")}>
        <Icon className="size-4" aria-hidden="true" />
      </span>
      <span>
        <span className="flex items-center gap-1.5 text-sm font-semibold">
          {title}
          {ok && <BadgeCheck className="size-3.5 text-savings" aria-label="Included" />}
        </span>
        <span className="block text-xs text-muted-foreground">{text}</span>
      </span>
    </li>
  );
}
