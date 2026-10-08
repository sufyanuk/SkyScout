import type { Metadata } from "next";
import { Price } from "@/components/common/price";
import Link from "next/link";
import { Heart } from "lucide-react";
import { EmptyState } from "@/components/common/empty-state";
import { DealCard } from "@/components/flights/deal-card";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth/session";
import { formatRelative } from "@/lib/format";
import { listFavorites, type SavedDeal } from "@/lib/services/favorites";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Saved flights", robots: { index: false } };

export default async function FavoritesPage() {
  const user = await requireUser("/favorites");
  let saved: SavedDeal[] = [];
  let failed = false;
  try {
    saved = await listFavorites(user.id);
  } catch (error) {
    console.error("[favorites]", error);
    failed = true;
  }

  return (
    <div className="container-page py-10">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Your shortlist</p>
      <h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-5xl">Saved flights</h1>
      <p className="mt-2 text-muted-foreground">
        {saved.length > 0 ? `${saved.length} saved deal${saved.length === 1 ? "" : "s"}. Prices refresh every time you visit.` : "Tap the heart on any deal to keep it here."}
      </p>

      {failed ? (
        <p role="alert" className="mt-8 rounded-2xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
          We couldn&apos;t load your saved flights right now. Please try again shortly.
        </p>
      ) : saved.length === 0 ? (
        <EmptyState
          className="mt-8"
          icon={Heart}
          title="No saved flights yet"
          description="Found something tempting? Save it to compare later and keep an eye on the price."
          action={
            <>
              <Button asChild>
                <Link href="/deals">Browse deals</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/explore">Explore anywhere</Link>
              </Button>
            </>
          }
        />
      ) : (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {saved.map((s) => {
            const diff = s.deal.price - s.savedPrice;
            return (
              <div key={s.favoriteId} className="space-y-2">
                <div className={cn(s.status !== "available" && "opacity-60 grayscale")}>
                  <DealCard deal={s.deal} refreshOnFavoriteChange />
                </div>
                <p className="flex flex-wrap items-center justify-between gap-2 px-2 text-xs text-muted-foreground">
                  <span>Saved {formatRelative(s.savedAt)}</span>
                  {s.status === "departed" ? (
                    <span className="font-semibold">Departed</span>
                  ) : s.status === "unavailable" ? (
                    <span className="font-semibold">No longer available</span>
                  ) : diff !== 0 ? (
                    <span className={cn("font-semibold", diff < 0 ? "text-savings" : "text-sunrise")}>
                      {diff < 0 ? "▼" : "▲"} <Price amount={Math.abs(diff)} /> since you saved it
                    </span>
                  ) : (
                    <span>Price unchanged</span>
                  )}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
