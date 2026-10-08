import type { SearchFacets } from "@/lib/flights/types";
import { FilterPanel } from "./filter-panel";

/** Desktop filters: a sticky column beside the results. */
export function FilterSidebar({ facets, hasExactDates }: { facets: SearchFacets; hasExactDates: boolean }) {
  return (
    <aside aria-label="Filters" className="hidden lg:block">
      <div className="sticky top-24 max-h-[calc(100dvh-7rem)] overflow-y-auto rounded-3xl border bg-card p-5 shadow-card">
        <FilterPanel facets={facets} hasExactDates={hasExactDates} />
      </div>
    </aside>
  );
}
