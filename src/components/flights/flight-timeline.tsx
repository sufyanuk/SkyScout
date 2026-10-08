import { Clock3, Plane } from "lucide-react";
import { getAirport } from "@/lib/catalog/airports";
import { getAirline } from "@/lib/catalog/airlines";
import type { FlightSlice } from "@/lib/flights/types";
import { dayOffset, formatDateWeekday, formatDuration, formatStops, formatTime } from "@/lib/format";

/** Vertical, segment-by-segment itinerary for the deal page. */
export function FlightTimeline({ slice, title }: { slice: FlightSlice; title: string }) {
  return (
    <section aria-label={title} className="rounded-3xl border bg-card p-5 shadow-card sm:p-6">
      <header className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="font-semibold">
          {title} <span className="font-normal text-muted-foreground">· {formatDateWeekday(slice.departure.slice(0, 10))}</span>
        </h3>
        <p className="text-sm text-muted-foreground">
          {formatDuration(slice.durationMinutes)} · {formatStops(slice.stops)}
        </p>
      </header>
      <ol className="mt-5">
        {slice.segments.map((seg, i) => {
          const from = getAirport(seg.from);
          const to = getAirport(seg.to);
          const layover = slice.layovers[i];
          const plus = dayOffset(slice.departure, seg.arrival);
          return (
            <li key={`${seg.flightNumber}-${i}`}>
              <div className="grid grid-cols-[56px_20px_1fr] gap-x-3">
                <p className="pt-0.5 text-right font-semibold tabular-nums">{formatTime(seg.departure)}</p>
                <div className="flex flex-col items-center pt-1.5" aria-hidden="true">
                  <span className="size-3 rounded-full border-2 border-primary bg-card" />
                  <span className="w-px flex-1 bg-primary/30" />
                </div>
                <div className="pb-4">
                  <p className="font-semibold">
                    {from?.city} <span className="font-normal text-muted-foreground">({seg.from})</span>
                  </p>
                  <p className="text-sm text-muted-foreground">{from?.name}</p>
                  <p className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 rounded-xl bg-muted px-3 py-2 text-xs text-muted-foreground">
                    <Plane className="size-3.5" aria-hidden="true" />
                    <span className="font-medium text-foreground">{seg.flightNumber}</span>
                    <span>· {getAirline(seg.airlineCode)?.name}</span>
                    <span>· {seg.aircraft}</span>
                    <span>· {formatDuration(seg.durationMinutes)}</span>
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-[56px_20px_1fr] gap-x-3">
                <p className="pt-0.5 text-right font-semibold tabular-nums">
                  {formatTime(seg.arrival)}
                  {plus > 0 && <sup className="ml-0.5 text-[10px] text-sunrise">+{plus}</sup>}
                </p>
                <div className="flex flex-col items-center pt-1.5" aria-hidden="true">
                  <span className="size-3 rounded-full bg-primary" />
                </div>
                <div className={layover ? "pb-3" : undefined}>
                  <p className="font-semibold">
                    {to?.city} <span className="font-normal text-muted-foreground">({seg.to})</span>
                  </p>
                  <p className="text-sm text-muted-foreground">{to?.name}</p>
                </div>
              </div>
              {layover && (
                <div className="my-3 ml-[88px] flex items-center gap-2 rounded-xl border border-dashed border-sunrise/40 bg-sunrise-soft px-3 py-2 text-xs font-medium text-sunrise">
                  <Clock3 className="size-3.5" aria-hidden="true" />
                  {formatDuration(layover.durationMinutes)} layover in {getAirport(layover.airport)?.city}
                  {layover.durationMinutes > 240 && " · long connection"}
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
