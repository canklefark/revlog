import { Skeleton } from "@/components/ui/skeleton";

export default function BrakesLoading() {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-6 gap-4">
        <div className="space-y-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-8 w-32" />
        </div>
        <Skeleton className="h-9 w-32" />
      </div>

      <Skeleton className="h-4 w-40 mb-6" />

      <div className="space-y-8">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-5 w-6 rounded-full" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {Array.from({ length: 2 }).map((_, i) => (
              <div
                key={i}
                className="rounded-lg border border-border bg-card p-4 space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div className="flex gap-2">
                    <Skeleton className="h-5 w-16 rounded-full" />
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </div>
                  <Skeleton className="h-8 w-8 rounded" />
                </div>
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-24" />
                <div className="space-y-1">
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-2 w-full rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
