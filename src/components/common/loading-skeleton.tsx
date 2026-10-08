import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function DealCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-3xl border bg-card shadow-card">
      <Skeleton className="h-36 rounded-none" />
      <div className="space-y-3 p-5">
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-3 w-3/4" />
        <Skeleton className="h-3 w-2/3" />
        <div className="flex items-end justify-between pt-3">
          <Skeleton className="h-7 w-20" />
          <Skeleton className="h-9 w-28 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export function FlightCardSkeleton() {
  return (
    <div className="grid gap-4 rounded-3xl border bg-card p-5 shadow-card sm:grid-cols-[1fr_200px]">
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Skeleton className="size-9" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-3 w-48" />
          </div>
        </div>
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
      <div className="space-y-3 sm:border-l sm:pl-5">
        <Skeleton className="ml-auto h-8 w-24" />
        <Skeleton className="ml-auto h-3 w-20" />
        <Skeleton className="h-10 w-full rounded-full" />
      </div>
    </div>
  );
}

export function LoadingSkeleton({ variant = "grid", count = 6, className }: { variant?: "grid" | "list"; count?: number; className?: string }) {
  return (
    <div
      role="status"
      aria-label="Loading flights"
      className={cn(variant === "grid" ? "grid gap-5 sm:grid-cols-2 lg:grid-cols-3" : "space-y-4", className)}
    >
      {Array.from({ length: count }, (_, i) =>
        variant === "grid" ? <DealCardSkeleton key={i} /> : <FlightCardSkeleton key={i} />,
      )}
      <span className="sr-only">Loading…</span>
    </div>
  );
}
