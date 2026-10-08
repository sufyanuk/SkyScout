"use client";

import { ArrowUpDown } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { SortOption } from "@/lib/flights/types";
import { useSearchNavigation } from "./search-navigation";

export const SORT_LABELS: Record<SortOption, string> = {
  best: "Best",
  cheapest: "Cheapest",
  fastest: "Fastest",
  value: "Best value",
};

export function SortDropdown() {
  const nav = useSearchNavigation();
  const value = (nav.get("sort") as SortOption | null) ?? "best";
  return (
    <Select value={value} onValueChange={(sort) => nav.update({ sort: sort === "best" ? null : sort })}>
      <SelectTrigger aria-label="Sort results" className="h-10 w-auto min-w-40 rounded-full">
        <ArrowUpDown className="size-4 text-muted-foreground" aria-hidden="true" />
        <span className="text-muted-foreground">Sort:</span>
        <SelectValue />
      </SelectTrigger>
      <SelectContent align="end">
        {(Object.keys(SORT_LABELS) as SortOption[]).map((s) => (
          <SelectItem key={s} value={s}>
            {SORT_LABELS[s]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
