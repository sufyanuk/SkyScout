"use client";

import { createContext, useCallback, useContext, useMemo, useTransition, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

type Patch = Record<string, string | null | undefined>;

interface SearchNavigation {
  /** Current URL params (as rendered by the server). */
  params: URLSearchParams;
  get: (key: string) => string | null;
  getList: (key: string) => string[];
  /** Merge a patch into the URL; null/"" removes a key. Resets pagination. */
  update: (patch: Patch, options?: { keepLimit?: boolean }) => void;
  isPending: boolean;
}

const Ctx = createContext<SearchNavigation | null>(null);

/**
 * Keeps all search state in the URL. Filters call update(); the server
 * re-renders results, and isPending lets the UI dim stale results meanwhile.
 */
export function SearchNavigationProvider({ query, children }: { query: string; children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const params = useMemo(() => new URLSearchParams(query), [query]);

  const update = useCallback(
    (patch: Patch, options?: { keepLimit?: boolean }) => {
      const next = new URLSearchParams(params);
      for (const [key, value] of Object.entries(patch)) {
        if (value === null || value === undefined || value === "") next.delete(key);
        else next.set(key, value);
      }
      if (!options?.keepLimit) next.delete("limit");
      startTransition(() => router.replace(`${pathname}?${next.toString()}`, { scroll: false }));
    },
    [params, pathname, router],
  );

  const value = useMemo<SearchNavigation>(
    () => ({
      params,
      get: (key) => params.get(key),
      getList: (key) => (params.get(key) ?? "").split(",").filter(Boolean),
      update,
      isPending,
    }),
    [params, update, isPending],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSearchNavigation() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useSearchNavigation must be used inside SearchNavigationProvider");
  return ctx;
}

/** Dims results while a new search is loading. */
export function PendingResults({ children, className }: { children: ReactNode; className?: string }) {
  const { isPending } = useSearchNavigation();
  return (
    <div
      aria-busy={isPending}
      className={cn("transition-opacity duration-200", isPending && "pointer-events-none opacity-50", className)}
    >
      {children}
    </div>
  );
}
