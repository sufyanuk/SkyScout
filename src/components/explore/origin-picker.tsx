"use client";

import { useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { PlaneTakeoff } from "lucide-react";
import { AirportSelector } from "@/components/search/airport-selector";
import { setHomeAirport } from "@/actions/preferences";
import { cn } from "@/lib/utils";

/** Change the origin of a page via ?from= and remember it as the home airport. */
export function OriginPicker({ value, query, className }: { value: string; query: string; className?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();
  return (
    <div className={cn("w-full max-w-xs transition-opacity", pending && "opacity-60", className)}>
      <AirportSelector
        label="Flying from"
        value={value}
        icon={<PlaneTakeoff />}
        onChange={(code) => {
          const sp = new URLSearchParams(query);
          sp.set("from", code);
          startTransition(async () => {
            await setHomeAirport(code);
            router.push(`${pathname}?${sp.toString()}`, { scroll: false });
          });
        }}
      />
    </div>
  );
}
