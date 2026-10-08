import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="container-page grid gap-8 pt-12 lg:grid-cols-[1fr_380px]">
      <div className="space-y-6">
        <Skeleton className="h-80 rounded-[2rem]" />
        <Skeleton className="h-64 rounded-3xl" />
        <Skeleton className="h-64 rounded-3xl" />
      </div>
      <Skeleton className="h-[420px] rounded-[2rem]" />
    </div>
  );
}
