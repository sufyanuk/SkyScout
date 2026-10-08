import { LoadingSkeleton } from "@/components/common/loading-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="container-page space-y-8 py-10">
      <Skeleton className="h-12 w-80 max-w-full" />
      <Skeleton className="h-10 w-full max-w-2xl rounded-full" />
      <LoadingSkeleton />
    </div>
  );
}
