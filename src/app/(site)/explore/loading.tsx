import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="container-page py-10">
      <Skeleton className="h-12 w-96 max-w-full" />
      <Skeleton className="mt-8 h-10 w-full max-w-3xl rounded-full" />
      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <Skeleton className="aspect-square rounded-[2rem]" />
        <div className="space-y-3">
          {Array.from({ length: 7 }, (_, i) => (
            <Skeleton key={i} className="h-[88px] rounded-3xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
