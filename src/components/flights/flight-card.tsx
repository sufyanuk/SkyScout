import Link from "next/link";
import { ArrowRight, Luggage } from "lucide-react";
import type { FlightDeal } from "@/lib/flights/types";
import { CABIN_LABELS, formatDateRange, formatPrice } from "@/lib/format";
import { AirlineMark, DealRatingBadge, SavingsBadge } from "./badges";
import { FavoriteButton } from "./favorite-button";
import { ShareButton } from "./share-button";
import { SliceSummary } from "./slice-summary";

interface FlightCardProps {
  deal: FlightDeal;
  travelers: number;
  /** Show the destination city prominently (for "anywhere" searches). */
  showDestination?: boolean;
}

/** Horizontal itinerary card used in list view on the results page. */
export function FlightCard({ deal, travelers, showDestination }: FlightCardProps) {
  const href = `/deals/${deal.id}${travelers > 1 ? `?travelers=${travelers}` : ""}`;
  const routeLabel = `${deal.origin.city} to ${deal.destination.city}`;
  return (
    <article className="group relative grid gap-4 rounded-3xl border bg-card p-4 shadow-card transition-shadow hover:shadow-lift sm:grid-cols-[1fr_200px] sm:p-5">
      <div className="min-w-0 space-y-4">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <AirlineMark airline={deal.airline} />
          <div className="min-w-0">
            {showDestination ? (
              <p className="font-semibold leading-tight">
                {deal.destination.city}, <span className="font-normal text-muted-foreground">{deal.destination.country}</span>
              </p>
            ) : (
              <p className="font-semibold leading-tight">{deal.airline.name}</p>
            )}
            <p className="text-xs text-muted-foreground">
              {showDestination ? `${deal.airline.name} · ` : ""}
              {formatDateRange(deal.departureDate, deal.returnDate)}
              {deal.nights !== null && ` · ${deal.nights} nights`} · {CABIN_LABELS[deal.cabin]}
            </p>
          </div>
          <DealRatingBadge rating={deal.rating} className="sm:ml-auto" />
        </div>
        <div className="space-y-3">
          <SliceSummary slice={deal.outbound} />
          {deal.inbound && (
            <div className="border-t border-dashed pt-3">
              <SliceSummary slice={deal.inbound} />
            </div>
          )}
        </div>
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Luggage className="size-3.5" aria-hidden="true" />
          {deal.baggage.checkedBags > 0
            ? `${deal.baggage.checkedBags}× ${deal.baggage.checkedKg}kg checked bag included`
            : deal.baggage.cabinKg > 0
              ? `Cabin bag ${deal.baggage.cabinKg}kg · no checked bag`
              : "Personal item only"}
          {deal.seatsLeft && <span className="font-medium text-sunrise"> · {deal.seatsLeft} seats left at this price</span>}
        </p>
      </div>

      <div className="flex flex-wrap items-end justify-between gap-3 border-t pt-4 sm:flex-col sm:flex-nowrap sm:items-stretch sm:border-t-0 sm:border-l sm:pt-0 sm:pl-5">
        <div className="space-y-1 sm:text-right">
          <SavingsBadge percent={deal.savingsPercent} />
          <p className="text-3xl font-semibold tracking-tight tabular-nums">{formatPrice(deal.price)}</p>
          <p className="text-xs text-muted-foreground">
            {travelers > 1 ? `${formatPrice(deal.price * travelers)} total · ${travelers} travellers` : `per person, ${deal.returnDate ? "return" : "one-way"}`}
          </p>
          {deal.typicalPrice > deal.price * 1.04 && (
            <p className="text-xs text-muted-foreground">
              Typical <span className="line-through">{formatPrice(deal.typicalPrice)}</span>
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 max-sm:flex-row-reverse sm:flex-col sm:items-stretch">
          <div className="relative z-10 flex justify-end gap-1.5">
            <ShareButton
              title={`${routeLabel} for ${formatPrice(deal.price)}`}
              text={`${routeLabel} from ${formatPrice(deal.price)} on SkyScout:`}
              path={href}
              className="border"
            />
            <FavoriteButton dealId={deal.id} label={`${routeLabel} flight`} className="border" />
          </div>
          <Link
            href={href}
            className="inline-flex h-10 items-center justify-center gap-1.5 whitespace-nowrap rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground transition-colors after:absolute after:inset-0 after:content-[''] hover:bg-primary/90 focus-visible:ring-[3px] focus-visible:ring-ring/40 focus-visible:outline-none"
          >
            View deal <ArrowRight className="size-4" aria-hidden="true" />
            <span className="sr-only">: {routeLabel} with {deal.airline.name}, {formatPrice(deal.price)}</span>
          </Link>
        </div>
      </div>
    </article>
  );
}
