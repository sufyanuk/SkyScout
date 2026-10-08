import Link from "next/link";
import { BellPlus, Eye, Hourglass, ShoppingCart, Sparkles } from "lucide-react";
import { Price } from "@/components/common/price";
import type { FareForecast, ForecastVerdict } from "@/lib/insights/forecast";
import { cn } from "@/lib/utils";

const VERDICT: Record<ForecastVerdict, { label: string; Icon: typeof Eye; chip: string; bar: string; text: string }> = {
  buy: { label: "Buy now", Icon: ShoppingCart, chip: "bg-savings-soft text-savings", bar: "bg-savings", text: "text-savings" },
  wait: { label: "Wait", Icon: Hourglass, chip: "bg-sunrise-soft text-sunrise", bar: "bg-sunrise", text: "text-sunrise" },
  watch: { label: "Watch", Icon: Eye, chip: "bg-accent text-accent-foreground", bar: "bg-primary", text: "text-primary" },
};

/** Compact verdict for result cards: "Buy now · 84%". */
export function ForecastChip({ forecast, className }: { forecast: FareForecast; className?: string }) {
  const { label, Icon, chip } = VERDICT[forecast.verdict];
  return (
    <span
      title={`Fare Forecast: ${forecast.headline} (${forecast.confidence}% confidence)`}
      className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold", chip, className)}
    >
      <Icon className="size-3.5" aria-hidden="true" />
      {label}
      <span className="font-semibold opacity-80">· {forecast.confidence}%</span>
      <span className="sr-only">confidence. {forecast.headline}</span>
    </span>
  );
}

/** Full "Buy or wait?" explanation for the deal page. */
export function FareForecastPanel({ forecast, alertHref }: { forecast: FareForecast; alertHref: string }) {
  const { label, Icon, chip, bar, text } = VERDICT[forecast.verdict];
  const change = forecast.expectedChange;
  return (
    <section aria-labelledby="forecast-title" className="rounded-3xl border bg-card p-5 shadow-card sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-primary">
            <Sparkles className="size-3.5" aria-hidden="true" /> Fare Forecast
          </p>
          <h2 id="forecast-title" className="mt-1 text-xl font-semibold tracking-tight">
            {forecast.headline}
          </h2>
        </div>
        <span className={cn("inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-bold", chip)}>
          <Icon className="size-4" aria-hidden="true" /> {label}
        </span>
      </div>

      <div className="mt-5 grid gap-5 sm:grid-cols-[220px_1fr]">
        <div className="space-y-4">
          <div>
            <div className="flex items-baseline justify-between text-sm">
              <span className="text-muted-foreground">Confidence</span>
              <span className={cn("text-lg font-semibold tabular-nums", text)}>{forecast.confidence}%</span>
            </div>
            <div
              className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted"
              role="meter"
              aria-label="Forecast confidence"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={forecast.confidence}
            >
              <div className={cn("h-full rounded-full", bar)} style={{ width: `${forecast.confidence}%` }} />
            </div>
          </div>
          <div className="rounded-2xl bg-muted p-3 text-sm">
            <p className="text-muted-foreground">Expected in the next 2 weeks</p>
            <p className="mt-0.5 font-semibold">
              {Math.abs(change) < 5 ? (
                "Roughly flat"
              ) : change > 0 ? (
                <>
                  Up about <Price amount={change} />
                </>
              ) : (
                <>
                  Down about <Price amount={-change} />
                </>
              )}
            </p>
          </div>
          {forecast.cheaperThanPercent !== null && (
            <p className="text-sm">
              <span className="text-2xl font-semibold tabular-nums">{forecast.cheaperThanPercent}%</span>{" "}
              <span className="text-muted-foreground">of recent fares on this route cost more</span>
            </p>
          )}
        </div>
        <div>
          <h3 className="text-sm font-semibold">Why</h3>
          <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
            {forecast.reasons.map((r) => (
              <li key={r} className="flex gap-2">
                <span className={cn("mt-2 size-1.5 shrink-0 rounded-full", bar)} aria-hidden="true" />
                {r}
              </li>
            ))}
          </ul>
          {forecast.verdict !== "buy" && (
            <Link
              href={alertHref}
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-white hover:bg-primary"
            >
              <BellPlus className="size-4" aria-hidden="true" /> Alert me when it drops
            </Link>
          )}
        </div>
      </div>
      <p className="mt-5 border-t pt-3 text-xs text-muted-foreground">
        Based on recent price history for this route, how this fare compares with what it usually costs, and time to
        departure. A guide, not a guarantee.
      </p>
    </section>
  );
}
