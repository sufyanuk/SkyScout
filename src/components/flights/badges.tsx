import { Flame, Sparkles, ThumbsUp, TrendingDown } from "lucide-react";
import type { Airline, DealRating } from "@/lib/flights/types";
import { formatPrice, RATING_LABELS } from "@/lib/format";
import { cn } from "@/lib/utils";

export function AirlineMark({ airline, size = "md" }: { airline: Pick<Airline, "code" | "name" | "color">; size?: "sm" | "md" | "lg" }) {
  return (
    <span
      title={airline.name}
      aria-hidden="true"
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-xl font-bold tracking-tight text-white shadow-sm",
        size === "sm" && "size-7 rounded-lg text-[10px]",
        size === "md" && "size-9 text-xs",
        size === "lg" && "size-12 text-sm",
      )}
      style={{ background: `linear-gradient(135deg, ${airline.color}, ${airline.color}cc)` }}
    >
      {airline.code}
    </span>
  );
}

export function SavingsBadge({ percent, className }: { percent: number; className?: string }) {
  if (percent < 5) return null;
  return (
    <span className={cn("inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-savings-soft px-2 py-0.5 text-xs font-semibold text-savings", className)}>
      <TrendingDown className="size-3.5" aria-hidden="true" />
      {percent}% cheaper
    </span>
  );
}

const RATING_STYLES: Record<DealRating, { className: string; Icon: typeof Flame }> = {
  exceptional: { className: "bg-sunrise text-white", Icon: Flame },
  great: { className: "bg-sunrise-soft text-sunrise", Icon: Sparkles },
  good: { className: "bg-accent text-accent-foreground", Icon: ThumbsUp },
  fair: { className: "bg-muted text-muted-foreground", Icon: ThumbsUp },
};

export function DealRatingBadge({ rating, className }: { rating: DealRating; className?: string }) {
  const { className: styles, Icon } = RATING_STYLES[rating];
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide", styles, className)}>
      <Icon className="size-3.5" aria-hidden="true" />
      {RATING_LABELS[rating]}
    </span>
  );
}

export function PriceBadge({
  price,
  typicalPrice,
  size = "md",
  align = "right",
  caption = "per person",
}: {
  price: number;
  typicalPrice?: number;
  size?: "md" | "lg" | "xl";
  align?: "left" | "right";
  caption?: string;
}) {
  const showTypical = typicalPrice !== undefined && typicalPrice > price * 1.04;
  return (
    <div className={cn("flex flex-col", align === "right" ? "items-end text-right" : "items-start")}>
      {showTypical && (
        <span className="text-xs text-muted-foreground">
          Typical <span className="line-through">{formatPrice(typicalPrice)}</span>
        </span>
      )}
      <span
        className={cn(
          "font-semibold tracking-tight tabular-nums",
          size === "md" && "text-2xl",
          size === "lg" && "text-3xl",
          size === "xl" && "text-5xl",
        )}
      >
        {formatPrice(price)}
      </span>
      {caption && <span className="text-xs text-muted-foreground">{caption}</span>}
    </div>
  );
}
