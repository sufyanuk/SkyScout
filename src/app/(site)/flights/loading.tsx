import { LoadingSkeleton } from "@/components/common/loading-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div>
      <div className="container-page space-y-3 pt-6 pb-8 sm:pt-10">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-9 w-80 max-w-full" />
        <Skeleton className="h-4 w-60" />
        <Skeleton className="mt-5 h-[60px] w-full rounded-2xl" />
      </div>
      <div className="bg-results border-t">
        <div className="container-page space-y-5 py-8">
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
