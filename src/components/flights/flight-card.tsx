import Link from "next/link";
import { AlertTriangle, ArrowRight, Luggage } from "lucide-react";
import { Price } from "@/components/common/price";
import { totalPrice } from "@/lib/flights/filtering";
import { carrierNames, groupTotal, type PartySize } from "@/lib/flights/pricing";
import type { FlightDeal } from "@/lib/flights/types";
import { CABIN_LABELS, formatDateRange } from "@/lib/format";
import type { FareForecast } from "@/lib/insights/forecast";
import { AirlineMark, DealRatingBadge, SavingsBadge } from "./badges";
import { FavoriteButton } from "./favorite-button";
import { ForecastChip } from "./forecast";
import { ShareButton } from "./share-button";
import { SliceSummary } from "./slice-summary";

interface FlightCardProps {
  deal: FlightDeal;
  party: PartySize;
  /** Query string carried to the deal page (travellers, bags), without "?". */
  linkQuery?: string;
  /** Show the destination city prominently (for multi-destination searches). */
  showDestination?: boolean;
  forecast?: FareForecast | null;
}

/** Horizontal itinerary card used in list view on the results page. */
export function FlightCard({ deal, party, linkQuery, showDestination, forecast }: FlightCardProps) {
  const href = `/deals/${deal.id}${linkQuery ? `?${linkQuery}` : ""}`;
  const routeLabel = `${deal.origin.city} to ${deal.destination.city}`;
  const carriers = carrierNames(deal);
  const perPerson = totalPrice(deal);
  const groupSize = party.seated + party.infants;
  return (
    <article className="group relative grid gap-4 rounded-3xl border bg-card p-4 shadow-card transition-shadow hover:shadow-lift sm:grid-cols-[1fr_210px] sm:p-5">
      <div className="min-w-0 space-y-4">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <AirlineMark airline={deal.airline} />
          <div className="min-w-0">
            {showDestination ? (
              <p className="font-semibold leading-tight">
                {deal.origin.code} → {deal.destination.city},{" "}
                <span className="font-normal text-muted-foreground">{deal.destination.country}</span>
              </p>
            ) : (
              <p className="font-semibold leading-tight">{carriers}</p>
            )}
            <p className="text-xs text-muted-foreground">
              {showDestination ? `${carriers} · ` : ""}
              {formatDateRange(deal.departureDate, deal.returnDate)}
              {deal.nights !== null && ` · ${deal.nights} nights`} · {CABIN_LABELS[deal.cabin]}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-1.5 sm:ml-auto">
            {forecast && <ForecastChip forecast={forecast} />}
            <DealRatingBadge rating={deal.rating} />
          </div>
        </div>
        <div className="space-y-3">
          <SliceSummary slice={deal.outbound} />
          {deal.inbound && (
            <div className="border-t border-dashed pt-3">
              <SliceSummary slice={deal.inbound} />
            </div>
          )}
        </div>
        {deal.selfTransfer && (
          <p className="flex items-start gap-1.5 rounded-xl bg-sunrise-soft px-3 py-2 text-xs text-sunrise">
            <AlertTriangle className="mt-px size-3.5 shrink-0" aria-hidden="true" />
            <span>
              <strong>Self-transfer</strong> in {deal.outbound.layovers.map((l) => l.airport).join(", ")}: separate tickets, so
              you collect and re-check bags, and missed connections aren&apos;t protected.
            </span>
          </p>
        )}
        <p className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
          <Luggage className="size-3.5" aria-hidden="true" />
          {deal.baggage.checkedBags > 0
            ? `${deal.baggage.checkedBags}× ${deal.baggage.checkedKg}kg checked bag included`
            : deal.baggage.cabinKg > 0
              ? `Cabin bag ${deal.baggage.cabinKg}kg · no checked bag`
              : "Personal item only"}
          {deal.bagFee > 0 && (
            <span className="font-medium text-foreground">
              · +<Price amount={deal.bagFee} /> for your bags (included in price)
            </span>
          )}
          {deal.seatsLeft && <span className="font-medium text-sunrise"> · {deal.seatsLeft} seats left at this price</span>}
        </p>
      </div>

      <div className="flex flex-wrap items-end justify-between gap-3 border-t pt-4 sm:flex-col sm:flex-nowrap sm:items-stretch sm:border-t-0 sm:border-l sm:pt-0 sm:pl-5">
        <div className="space-y-1 sm:text-right">
          <SavingsBadge percent={deal.savingsPercent} />
          <p className="text-3xl font-semibold tracking-tight tabular-nums">
            <Price amount={perPerson} />
          </p>
          <p className="text-xs text-muted-foreground">
            {groupSize > 1 ? (
              <>
                <Price amount={groupTotal(deal, party)} /> total · {groupSize} travellers
              </>
            ) : (
              `per person, ${deal.returnDate ? "return" : "one-way"}${deal.bagFee > 0 ? " incl. bags" : ""}`
            )}
          </p>
          {deal.typicalPrice > deal.price * 1.04 && (
            <p className="text-xs text-muted-foreground">
              Typical fare{" "}
              <span className="line-through">
                <Price amount={deal.typicalPrice} />
              </span>
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 max-sm:flex-row-reverse sm:flex-col sm:items-stretch">
          <div className="relative z-10 flex justify-end gap-1.5">
            <ShareButton
              title={`${routeLabel} for {price}`}
              text={`${routeLabel} from {price} on SkyScout:`}
              priceUsd={perPerson}
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
            <span className="sr-only">
              : {routeLabel} with {carriers}, <Price amount={perPerson} />
            </span>
          </Link>
        </div>
      </div>
    </article>
  );
}
