import Link from "next/link";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatLapTime } from "@/lib/utils/penalty-calc";
import type { RecentRun } from "@/types/analytics";

type RecentRunsWidgetProps = {
  runs: RecentRun[];
};

export function RecentRunsWidget({ runs }: RecentRunsWidgetProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">Recent Runs</CardTitle>
          <Link href="/times" className="text-xs text-primary">
            View all →
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {runs.length === 0 ? (
          <p className="text-sm text-muted-foreground">No runs logged yet.</p>
        ) : (
          <div className="space-y-3">
            {runs.map((run, index) => (
              <div key={run.id}>
                {index > 0 && <div className="border-t border-border mb-3" />}
                <div className="py-1">
                  {/* Row 1: Event name + time/DNF */}
                  <div className="flex items-center justify-between gap-2">
                    <Link
                      href={`/events/${run.eventId}/session`}
                      className="text-sm font-medium truncate hover:text-primary transition-colors"
                    >
                      {run.eventName}
                    </Link>
                    <span className="text-sm font-mono shrink-0">
                      {run.isDnf ? (
                        <span className="text-muted-foreground line-through">
                          DNF
                        </span>
                      ) : (
                        formatLapTime(run.adjustedTime ?? run.rawTime)
                      )}
                    </span>
                  </div>

                  {/* Row 2: Car + date + condition badges */}
                  <div className="flex items-center justify-between gap-2 mt-0.5">
                    <p className="text-xs text-muted-foreground truncate">
                      {run.carLabel}
                      {" · "}
                      {format(run.eventDate, "MMM d")}
                    </p>
                    {run.conditions.length > 0 && (
                      <div className="flex items-center gap-1 shrink-0">
                        {run.conditions.slice(0, 2).map((condition) => (
                          <Badge
                            key={condition}
                            variant="outline"
                            className="text-xs"
                          >
                            {condition}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
