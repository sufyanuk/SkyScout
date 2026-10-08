import { LoadingSkeleton } from "@/components/common/loading-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div>
      <div className="border-b bg-gradient-to-b from-sky to-background">
        <div className="container-page space-y-3 py-8">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-9 w-80 max-w-full" />
          <Skeleton className="h-4 w-60" />
          <Skeleton className="mt-5 hidden h-[150px] w-full rounded-3xl lg:block" />
        </div>
      </div>
      <div className="container-page grid gap-8 py-8 lg:grid-cols-[290px_1fr]">
        <Skeleton className="hidden h-[600px] rounded-3xl lg:block" />
        <div className="space-y-5">
          <div className="flex justify-between">
            <Skeleton className="h-10 w-40" />
            <Skeleton className="h-10 w-44 rounded-full" />
          </div>
          <LoadingSkeleton variant="list" count={4} />
        </div>
      </div>
    </div>
  );
}
