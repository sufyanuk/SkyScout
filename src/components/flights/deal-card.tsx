import Link from "next/link";
import { ArrowRight, CalendarDays, Clock, Plane } from "lucide-react";
import { DestinationArtFor } from "@/components/destinations/destination-art-for";
import type { FlightDeal } from "@/lib/flights/types";
import { formatDateRange, formatDuration, formatPrice, formatStops } from "@/lib/format";
import { cn } from "@/lib/utils";
import { DealRatingBadge, SavingsBadge } from "./badges";
import { FavoriteButton } from "./favorite-button";
import { ShareButton } from "./share-button";

export function DealCard({
  deal,
  className,
  priority,
  refreshOnFavoriteChange,
}: {
  deal: FlightDeal;
  className?: string;
  priority?: boolean;
  /** Re-render server data after un-saving (used on the favourites page). */
  refreshOnFavoriteChange?: boolean;
}) {
  const href = `/deals/${deal.id}`;
  const routeLabel = `${deal.origin.city} to ${deal.destination.city}`;
  return (
    <article
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-3xl border bg-card shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lift",
        className,
      )}
      data-priority={priority ? "" : undefined}
    >
      <div className="relative h-36 overflow-hidden">
        <DestinationArtFor code={deal.destination.code} className="transition-transform duration-500 group-hover:scale-105" />
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/35 to-transparent" />
        <div className="absolute top-3 left-3">
          <DealRatingBadge rating={deal.rating} className="shadow-sm" />
        </div>
        <div className="absolute top-3 right-3 z-10 flex gap-1.5">
          <ShareButton
            title={`${routeLabel} for ${formatPrice(deal.price)}`}
            text={`${routeLabel} from ${formatPrice(deal.price)} on SkyScout:`}
            path={href}
          />
          <FavoriteButton dealId={deal.id} label={`${routeLabel} deal`} refreshOnChange={refreshOnFavoriteChange} />
        </div>
        <div className="absolute bottom-3 left-4 text-white">
          <p className="text-xl font-semibold leading-tight drop-shadow-sm">{deal.destination.city}</p>
          <p className="text-xs text-white/85">{deal.destination.country}</p>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-4 p-5">
        <div className="flex items-center justify-between gap-2">
          <p className="flex items-center gap-2 font-mono text-sm font-semibold tracking-wide">
            {deal.origin.code}
            <Plane className="size-3.5 text-muted-foreground" aria-hidden="true" />
            {deal.destination.code}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {deal.origin.city} → {deal.destination.city}
          </p>
        </div>

        <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-[13px] text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <dt className="sr-only">Dates</dt>
            <CalendarDays className="size-3.5 shrink-0" aria-hidden="true" />
            <dd className="truncate">{formatDateRange(deal.departureDate, deal.returnDate)}</dd>
          </div>
          <div className="flex items-center gap-1.5">
            <dt className="sr-only">Duration</dt>
            <Clock className="size-3.5 shrink-0" aria-hidden="true" />
            <dd>{formatDuration(deal.outbound.durationMinutes)}</dd>
          </div>
          <div className="col-span-2 flex items-center gap-1.5">
            <dt className="sr-only">Airline and stops</dt>
            <dd className="truncate">
              {deal.airline.name} ·{" "}
              <span className={deal.outbound.stops === 0 ? "font-medium text-savings" : undefined}>
                {formatStops(deal.outbound.stops)}
              </span>
            </dd>
          </div>
        </dl>

        <div className="mt-auto flex items-end justify-between gap-3 border-t pt-4">
          <div>
            <SavingsBadge percent={deal.savingsPercent} />
            <p className="mt-1.5 flex items-baseline gap-2">
              <span className="text-2xl font-semibold tracking-tight tabular-nums">{formatPrice(deal.price)}</span>
              {deal.typicalPrice > deal.price * 1.04 && (
                <span className="text-xs text-muted-foreground">
                  typical <span className="line-through">{formatPrice(deal.typicalPrice)}</span>
                </span>
              )}
            </p>
          </div>
          <Link
            href={href}
            className="inline-flex h-9 shrink-0 items-center gap-1 rounded-full bg-foreground px-4 text-sm font-semibold text-white transition-colors after:absolute after:inset-0 after:content-[''] hover:bg-primary focus-visible:ring-[3px] focus-visible:ring-ring/40 focus-visible:outline-none"
          >
            View deal <ArrowRight className="size-4" aria-hidden="true" />
            <span className="sr-only">: {routeLabel}, {formatPrice(deal.price)}</span>
          </Link>
        </div>
      </div>
    </article>
  );
}
