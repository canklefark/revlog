import { Skeleton } from "@/components/ui/skeleton";

export default function ExpensesLoading() {
  return (
    <main className="w-full">
      <div className="flex items-center justify-between mb-6 gap-4">
        <div className="space-y-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-8 w-32" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-28" />
          <Skeleton className="h-9 w-28" />
        </div>
      </div>

      {/* Stat cards skeleton */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <Skeleton className="h-24 rounded-lg" />
        <Skeleton className="h-24 rounded-lg" />
      </div>

      {/* Chart skeletons */}
      <Skeleton className="h-48 rounded-lg mb-4" />
      <Skeleton className="h-56 rounded-lg mb-6" />

      {/* List skeleton */}
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16 rounded-lg" />
        ))}
      </div>
    </main>
  );
}
