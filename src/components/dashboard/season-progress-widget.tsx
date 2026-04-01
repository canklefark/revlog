import { TrendingUpIcon, TrendingDownIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { SeasonProgress } from "@/types/analytics";

type SeasonProgressWidgetProps = {
  data: SeasonProgress;
};

export function SeasonProgressWidget({ data }: SeasonProgressWidgetProps) {
  const { year, eventsCompleted, eventsRemaining, improvementSeconds } = data;
  const total = eventsCompleted + eventsRemaining;
  const pct = total > 0 ? (eventsCompleted / total) * 100 : 0;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Season Progress</CardTitle>
        <p className="text-xs text-muted-foreground">{year}</p>
      </CardHeader>
      <CardContent>
        {total === 0 ? (
          <p className="text-sm text-muted-foreground">
            No events this season yet.
          </p>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">
                {eventsCompleted}
              </span>{" "}
              of <span className="font-semibold text-foreground">{total}</span>{" "}
              events
            </p>

            <Progress value={pct} className="h-2 mt-2" />

            <p className="text-xs text-muted-foreground">
              {eventsRemaining} remaining this season
            </p>

            {improvementSeconds !== null && (
              <p
                className="text-xs mt-1"
                title="Compared to your first event this season"
              >
                {improvementSeconds > 0 ? (
                  <span className="text-green-500">
                    <TrendingUpIcon
                      className="size-3 inline mr-1"
                      aria-hidden="true"
                    />
                    <span className="sr-only">Improvement:</span>
                    {Math.abs(improvementSeconds).toFixed(3)}s faster this
                    season
                  </span>
                ) : (
                  <span className="text-red-400">
                    <TrendingDownIcon
                      className="size-3 inline mr-1"
                      aria-hidden="true"
                    />
                    <span className="sr-only">Regression:</span>
                    {Math.abs(improvementSeconds).toFixed(3)}s slower this
                    season
                  </span>
                )}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
