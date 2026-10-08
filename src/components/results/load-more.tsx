"use client";

import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSearchNavigation } from "./search-navigation";

export function LoadMore({ nextLimit, count }: { nextLimit: number; count: number }) {
  const nav = useSearchNavigation();
  return (
    <div className="mt-8 flex justify-center">
      <Button variant="outline" size="lg" disabled={nav.isPending} onClick={() => nav.update({ limit: String(nextLimit) }, { keepLimit: true })}>
        {nav.isPending && <Loader2 className="animate-spin" />}
        Show {count} more flight{count === 1 ? "" : "s"}
      </Button>
    </div>
  );
}
