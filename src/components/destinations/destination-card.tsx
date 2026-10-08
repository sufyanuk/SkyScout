import Link from "next/link";
import { Price } from "@/components/common/price";
import { ArrowUpRight } from "lucide-react";
import type { DestinationInfo } from "@/lib/catalog/destinations";
import { DestinationArt } from "./destination-art";

export function DestinationCard({
  destination,
  fromPrice,
  originCity,
  size = "md",
}: {
  destination: DestinationInfo;
  fromPrice?: number;
  originCity?: string;
  size?: "md" | "lg";
}) {
  return (
    <Link
      href={`/destinations/${destination.slug}`}
      className="group relative block overflow-hidden rounded-3xl border bg-card shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lift focus-visible:ring-[3px] focus-visible:ring-ring/40 focus-visible:outline-none"
    >
      <div className={size === "lg" ? "h-56" : "h-44"}>
        <DestinationArt
          code={destination.airport}
          theme={destination.art.theme}
          from={destination.art.from}
          to={destination.art.to}
          className="transition-transform duration-500 group-hover:scale-105"
        />
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4 text-white">
        <div className="min-w-0">
          <p className="text-xl font-semibold leading-tight">{destination.city}</p>
          <p className="truncate text-sm text-white/85">{destination.tagline}</p>
        </div>
        {fromPrice !== undefined ? (
          <div className="shrink-0 rounded-2xl bg-white/95 px-3 py-1.5 text-right text-foreground shadow-sm">
            <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              {originCity ? `from ${originCity}` : "from"}
            </p>
            <p className="font-semibold tabular-nums"><Price amount={fromPrice} /></p>
          </div>
        ) : (
          <ArrowUpRight className="size-5 shrink-0" aria-hidden="true" />
        )}
      </div>
    </Link>
  );
}
