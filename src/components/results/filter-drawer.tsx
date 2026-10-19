"use client";

import { useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import type { SearchFacets } from "@/lib/flights/types";
import { activeFilterCount, FilterPanel } from "./filter-panel";
import { useSearchNavigation } from "./search-navigation";

/** Mobile/tablet filters in a bottom sheet. */
export function FilterDrawer({ facets, hasExactDates, resultCount }: { facets: SearchFacets; hasExactDates: boolean; resultCount: number }) {
  const [open, setOpen] = useState(false);
  const nav = useSearchNavigation();
  const count = activeFilterCount(nav.params);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="lg:hidden">
          <SlidersHorizontal /> Filters
          {count > 0 && (
            <span className="flex size-5 items-center justify-center rounded-full bg-primary text-[11px] text-primary-foreground">{count}</span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[88dvh] gap-0">
        <SheetHeader className="sr-only">
          <SheetTitle>Filters</SheetTitle>
          <SheetDescription>Narrow down flights by price, stops, dates and more.</SheetDescription>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto px-5 pt-6 pb-4">
          <FilterPanel facets={facets} hasExactDates={hasExactDates} />
        </div>
        <SheetFooter className="border-t">
          <Button size="lg" onClick={() => setOpen(false)} disabled={nav.isPending}>
            {nav.isPending ? "Updating…" : `Show ${resultCount} flight${resultCount === 1 ? "" : "s"}`}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
