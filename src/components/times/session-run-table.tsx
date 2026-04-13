import { formatLapTime } from "@/lib/utils/penalty-calc";
import { Badge } from "@/components/ui/badge";
import type { Run } from "@prisma/client";

type RunWithCar = Run & {
  car: {
    id: string;
    year: number;
    make: string;
    model: string;
    nickname: string | null;
  };
};

interface SessionRunTableProps {
  runs: RunWithCar[];
  bestRunId: string | null;
}

export function SessionRunTable({ runs, bestRunId }: SessionRunTableProps) {
  return (
    <div className="space-y-2">
      {runs.map((run) => {
        const isDnf = run.adjustedTime === null;
        const isBest = run.id === bestRunId;
        const penalties = (() => {
          try {
            return (
              Array.isArray(run.penalties)
                ? run.penalties
                : JSON.parse(run.penalties as string)
            ) as Array<{ type: string; count: number; secondsEach: number }>;
          } catch {
            return [];
          }
        })();
        const penaltySeconds = penalties.reduce(
          (sum, p) => sum + p.count * p.secondsEach,
          0,
        );

        return (
          <div
            key={run.id}
            className={`rounded-lg border p-3 ${
              isBest
                ? "border-green-500/60 bg-green-500/5"
                : isDnf
                  ? "border-border opacity-60"
                  : "border-border bg-card"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 text-center text-xs font-medium text-muted-foreground shrink-0">
                #{run.runNumber}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`text-sm font-mono ${
                      isDnf
                        ? "text-muted-foreground line-through"
                        : "font-medium"
                    }`}
                  >
                    {formatLapTime(run.rawTime)}
                  </span>
                  {penaltySeconds > 0 && (
                    <span className="text-xs text-muted-foreground">
                      +{penaltySeconds.toFixed(1)}s pen.
                    </span>
                  )}
                  {isDnf ? (
                    <Badge variant="destructive" className="text-xs">
                      DNF
                    </Badge>
                  ) : (
                    <>
                      <span className="text-xs text-muted-foreground">→</span>
                      <span
                        className={`text-sm font-mono ${
                          isBest ? "font-bold text-green-500" : ""
                        }`}
                      >
                        {formatLapTime(run.adjustedTime as number)}
                      </span>
                    </>
                  )}
                  {isBest && (
                    <Badge className="text-xs bg-green-600 hover:bg-green-600">
                      Best
                    </Badge>
                  )}
                </div>
                {(run.sessionLabel || run.conditions.length > 0) && (
                  <div className="flex gap-1 mt-0.5 flex-wrap items-center">
                    {run.sessionLabel && (
                      <span className="text-xs font-medium text-primary/80 bg-primary/10 rounded px-1.5 py-0.5">
                        {run.sessionLabel}
                      </span>
                    )}
                    {run.conditions.map((c) => (
                      <span key={c} className="text-xs text-muted-foreground">
                        {c}
                      </span>
                    ))}
                  </div>
                )}
                {run.notes && (
                  <p className="text-xs text-muted-foreground mt-0.5 italic">
                    {run.notes}
                  </p>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
