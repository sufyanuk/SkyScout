import type { FlightSlice } from "@/lib/flights/types";
import { dayOffset, formatDuration, formatStops, formatTime } from "@/lib/format";
import { cn } from "@/lib/utils";

/** Compact one-line view of a slice: 08:50 DOH ——•—— 14:35 BKK. */
export function SliceSummary({ slice, label }: { slice: FlightSlice; label?: string }) {
  const plusDays = dayOffset(slice.departure, slice.arrival);
  return (
    <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3 sm:gap-4">
      <div>
        {label && <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>}
        <p className="text-lg font-semibold tabular-nums leading-tight">{formatTime(slice.departure)}</p>
        <p className="text-xs font-medium text-muted-foreground">{slice.from}</p>
      </div>
      <div className="flex min-w-0 flex-col items-center gap-1 pt-3">
        <span className="text-xs text-muted-foreground">{formatDuration(slice.durationMinutes)}</span>
        <div className="relative flex w-full items-center" aria-hidden="true">
          <span className="size-1.5 rounded-full bg-foreground/30" />
          <span className="h-px flex-1 bg-foreground/20" />
          {slice.layovers.map((l) => (
            <span key={l.airport} className="flex items-center">
              <span className="size-2 rounded-full border-2 border-sunrise bg-card" />
              <span className="h-px w-6 bg-foreground/20 sm:w-10" />
            </span>
          ))}
          <span className="h-px flex-1 bg-foreground/20" />
          <span className="size-1.5 rounded-full bg-foreground/30" />
        </div>
        <span className={cn("truncate text-xs font-medium", slice.stops === 0 ? "text-savings" : "text-muted-foreground")}>
          {formatStops(slice.stops)}
          {slice.layovers.length > 0 && ` · ${slice.layovers.map((l) => l.airport).join(", ")}`}
        </span>
      </div>
      <div className="text-right">
        {label && <p className="text-[11px] text-transparent select-none">.</p>}
        <p className="text-lg font-semibold tabular-nums leading-tight">
          {formatTime(slice.arrival)}
          {plusDays > 0 && <sup className="ml-0.5 text-[10px] font-semibold text-sunrise">+{plusDays}</sup>}
        </p>
        <p className="text-xs font-medium text-muted-foreground">{slice.to}</p>
      </div>
    </div>
  );
}
