"use client";

import { LayoutGrid, List } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSearchNavigation } from "./search-navigation";

export function ViewToggle() {
  const nav = useSearchNavigation();
  const view = nav.get("view") === "grid" ? "grid" : "list";
  return (
    <div role="radiogroup" aria-label="Results layout" className="flex rounded-full border bg-card p-1">
      {[
        { value: "list", label: "List view", Icon: List },
        { value: "grid", label: "Grid view", Icon: LayoutGrid },
      ].map(({ value, label, Icon }) => (
        <button
          key={value}
          type="button"
          role="radio"
          aria-checked={view === value}
          aria-label={label}
          onClick={() => nav.update({ view: value === "list" ? null : value }, { keepLimit: true })}
          className={cn(
            "flex size-8 items-center justify-center rounded-full text-muted-foreground transition",
            view === value && "bg-foreground text-white",
          )}
        >
          <Icon className="size-4" aria-hidden="true" />
        </button>
      ))}
    </div>
  );
}
