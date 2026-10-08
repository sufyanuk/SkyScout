import type { Metadata } from "next";
import Link from "next/link";
import { Tag } from "lucide-react";
import { EmptyState } from "@/components/common/empty-state";
import { OriginPicker } from "@/components/explore/origin-picker";
import { DealCard } from "@/components/flights/deal-card";
import { Button } from "@/components/ui/button";
import { getAirport } from "@/lib/catalog/airports";
import { getFlightProvider } from "@/lib/flights";
import type { DealCollection } from "@/lib/flights/types";
import { getHomeAirport } from "@/lib/services/preferences";
import { cn } from "@/lib/utils";

const COLLECTIONS: { id: DealCollection; label: string; blurb: string }[] = [
  { id: "best", label: "Biggest drops", blurb: "Fares furthest below what the route usually costs." },
  { id: "cheapest", label: "Cheapest", blurb: "The lowest fare to every destination, cheapest first." },
  { id: "weekend", label: "Weekend escapes", blurb: "Out Thursday or Friday, back by Monday, under 6 hours each way." },
  { id: "under-300", label: "Under $300", blurb: "Return trips that cost less than $300." },
  { id: "direct", label: "Direct only", blurb: "Non-stop flights with real savings." },
  { id: "long-haul", label: "Long-haul", blurb: "Over 5,000 km for well under the usual price." },
];

export const metadata: Metadata = {
  title: "Flight deals",
  description: "Today's best flight deals: biggest price drops, weekend escapes, long-haul bargains and fares under $300.",
  alternates: { canonical: "/deals" },
};

export default async function DealsPage({ searchParams }: PageProps<"/deals">) {
  const sp = await searchParams;
  const requested = getAirport(typeof sp.from === "string" ? sp.from : undefined)?.code;
  const origin = requested ?? (await getHomeAirport());
  const collection = COLLECTIONS.find((c) => c.id === sp.collection) ?? COLLECTIONS[0];
  const deals = await getFlightProvider().getDeals({ origin, collection: collection.id, limit: 24 });
  const city = getAirport(origin)!.city;

  return (
    <div className="container-page py-10">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Updated daily</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-5xl">Deals from {city}</h1>
          <p className="mt-2 max-w-xl text-muted-foreground">{collection.blurb}</p>
        </div>
        <OriginPicker value={origin} query={`collection=${collection.id}`} />
      </div>

      <nav aria-label="Deal collections" className="no-scrollbar -mx-4 mt-8 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
        {COLLECTIONS.map((c) => (
          <Link
            key={c.id}
            href={`/deals?collection=${c.id}${requested ? `&from=${requested}` : ""}`}
            aria-current={c.id === collection.id ? "page" : undefined}
            scroll={false}
            className={cn(
              "shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition",
              c.id === collection.id ? "border-foreground bg-foreground text-white" : "bg-card hover:border-foreground/30",
            )}
          >
            {c.label}
          </Link>
        ))}
      </nav>

      <div className="mt-8">
        {deals.length === 0 ? (
          <EmptyState
            icon={Tag}
            title={`No ${collection.label.toLowerCase()} from ${city} today`}
            description="Deals refresh daily. Try another collection, or explore every destination."
            action={
              <Button asChild>
                <Link href={`/explore?from=${origin}`}>Explore from {city}</Link>
              </Button>
            }
          />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {deals.map((deal) => (
              <DealCard key={deal.id} deal={deal} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
