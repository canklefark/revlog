import { Skeleton } from "@/components/ui/skeleton";

export default function TimesLoading() {
  return (
    <div>
      {/* Export button area */}
      <div className="flex justify-end mb-4">
        <Skeleton className="h-8 w-24" />
      </div>

      {/* Event run cards */}
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-lg border border-border bg-card p-4">
            {/* Header: event name + type badge */}
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>

            {/* Run count + best time */}
            <div className="flex items-center gap-3 mt-2">
              <Skeleton className="h-3 w-12" />
              <Skeleton className="h-3 w-20" />
            </div>

            {/* View links */}
            <div className="mt-3 flex gap-2">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-3 w-2" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
