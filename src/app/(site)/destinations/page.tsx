import type { Metadata } from "next";
import Link from "next/link";
import { DestinationCard } from "@/components/destinations/destination-card";
import { getAirport } from "@/lib/catalog/airports";
import { DESTINATIONS, type DestinationTag } from "@/lib/catalog/destinations";
import { getFlightProvider } from "@/lib/flights";
import { getHomeAirport } from "@/lib/services/preferences";
import { cn } from "@/lib/utils";

const TAGS: { id: DestinationTag | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "beach", label: "Beaches" },
  { id: "city", label: "City breaks" },
  { id: "culture", label: "Culture" },
  { id: "food", label: "Food" },
  { id: "nature", label: "Nature" },
  { id: "adventure", label: "Adventure" },
  { id: "nightlife", label: "Nightlife" },
];

export const metadata: Metadata = {
  title: "Destinations",
  description: "Travel guides and the cheapest flights to 33 destinations across Europe, Asia, Africa, the Gulf and beyond.",
  alternates: { canonical: "/destinations" },
};

export default async function DestinationsPage({ searchParams }: PageProps<"/destinations">) {
  const sp = await searchParams;
  const tag = TAGS.find((t) => t.id === sp.tag)?.id ?? "all";
  const origin = await getHomeAirport();
  const quotes = await getFlightProvider().exploreDestinations(origin);
  const prices = new Map(quotes.map((q) => [q.destination.code, q.cheapest.price]));
  const list = DESTINATIONS.filter((d) => d.airport !== origin && (tag === "all" || d.tags.includes(tag))).sort(
    (a, b) => (prices.get(a.airport) ?? Infinity) - (prices.get(b.airport) ?? Infinity),
  );

  return (
    <div className="container-page py-10">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Destination guides</p>
      <h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-5xl">Where to next?</h1>
      <p className="mt-2 max-w-xl text-muted-foreground">
        Best times to go, what flights usually cost and today&apos;s cheapest fares from {getAirport(origin)?.city}.
      </p>
      <nav aria-label="Filter by interest" className="no-scrollbar -mx-4 mt-8 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
        {TAGS.map((t) => (
          <Link
            key={t.id}
            href={t.id === "all" ? "/destinations" : `/destinations?tag=${t.id}`}
            scroll={false}
            aria-current={tag === t.id ? "page" : undefined}
            className={cn(
              "shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition",
              tag === t.id ? "border-foreground bg-foreground text-white" : "bg-card hover:border-foreground/30",
            )}
          >
            {t.label}
          </Link>
        ))}
      </nav>
      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((d) => (
          <DestinationCard key={d.slug} destination={d} fromPrice={prices.get(d.airport)} originCity={getAirport(origin)?.city} />
        ))}
      </div>
    </div>
  );
}
