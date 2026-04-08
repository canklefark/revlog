import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardHeader } from "@/components/ui/card";

export default function SettingsLoading() {
  return (
    <div>
      <Skeleton className="mb-6 h-8 w-28" />
      <div className="flex flex-col gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center gap-4 space-y-0 py-4">
              <Skeleton className="h-9 w-9 rounded-md shrink-0" />
              <div className="space-y-1.5 flex-1">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-3/4" />
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
}
