import { formatLapTime } from "@/lib/utils/penalty-calc";
import type { ConsistencyResult } from "@/lib/utils/consistency";
import { Badge } from "@/components/ui/badge";

const CONSISTENCY_COLORS: Record<ConsistencyResult["rating"], string> = {
  Excellent: "bg-green-600 hover:bg-green-600",
  Good: "bg-blue-600 hover:bg-blue-600",
  Fair: "bg-yellow-600 hover:bg-yellow-600",
  Inconsistent: "bg-red-600 hover:bg-red-600",
};

interface SessionSummaryProps {
  bestTime: number | null;
  runCount: number;
  dnfCount: number;
  totalPenalties: number;
  consistency: ConsistencyResult | null;
}

export function SessionSummary({
  bestTime,
  runCount,
  dnfCount,
  totalPenalties,
  consistency,
}: SessionSummaryProps) {
  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="text-center mb-5">
        <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
          Best Time
        </p>
        {bestTime !== null ? (
          <p className="text-4xl font-mono font-bold tracking-tight">
            {formatLapTime(bestTime)}
          </p>
        ) : (
          <p className="text-2xl text-muted-foreground">—</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 pt-4 border-t border-border">
        <div className="text-center">
          <p className="text-xs text-muted-foreground">Runs</p>
          <p className="text-lg font-semibold">{runCount}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-muted-foreground">DNFs</p>
          <p className="text-lg font-semibold">
            {dnfCount > 0 ? dnfCount : "—"}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-muted-foreground">Penalties</p>
          <p className="text-lg font-semibold">
            {totalPenalties > 0 ? totalPenalties : "—"}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-muted-foreground mb-1">Consistency</p>
          {consistency ? (
            <Badge
              className={`text-xs ${CONSISTENCY_COLORS[consistency.rating]}`}
            >
              {consistency.rating}
            </Badge>
          ) : (
            <p className="text-sm text-muted-foreground">—</p>
          )}
        </div>
      </div>

      {consistency && (
        <p className="text-xs text-muted-foreground text-center mt-3">
          σ = {consistency.stdDev.toFixed(3)}s
        </p>
      )}
    </div>
  );
}
