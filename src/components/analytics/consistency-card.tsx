import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { calculateConsistency } from "@/lib/utils/consistency";
import type { PersonalRecord } from "@/types/analytics";

const RATING_CLASSES: Record<string, string> = {
  Excellent: "bg-green-500/20 text-green-400",
  Good: "bg-blue-500/20 text-blue-400",
  Fair: "bg-yellow-500/20 text-yellow-400",
  Inconsistent: "bg-red-500/20 text-red-400",
};

interface ConsistencyCardProps {
  records: PersonalRecord[];
}

export function ConsistencyCard({ records }: ConsistencyCardProps) {
  if (records.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Consistency</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground py-8 text-center">
            Not enough data.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Collect unique car IDs in order of first appearance
  const carIds: string[] = [];
  const seenCars = new Set<string>();
  for (const r of records) {
    if (!seenCars.has(r.carId)) {
      carIds.push(r.carId);
      seenCars.add(r.carId);
    }
  }

  // Build per-car label map
  const carLabelMap = new Map<string, string>();
  for (const r of records) {
    if (!carLabelMap.has(r.carId)) {
      carLabelMap.set(r.carId, r.carLabel);
    }
  }

  // Compute consistency per car using all best times for that car
  const carStats = carIds.map((carId) => {
    const times = records
      .filter((r) => r.carId === carId)
      .map((r) => r.bestTime);
    const consistency = calculateConsistency(times);
    return {
      carId,
      carLabel: carLabelMap.get(carId) ?? carId,
      consistency,
    };
  });

  const hasAnyConsistency = carStats.some((s) => s.consistency !== null);

  if (!hasAnyConsistency) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Consistency</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground py-8 text-center">
            Not enough data.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Consistency</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {carStats.map(({ carId, carLabel, consistency }) => (
          <div key={carId} className="flex items-center justify-between gap-3">
            <span className="text-sm text-foreground truncate">{carLabel}</span>
            {consistency ? (
              <div className="flex items-center gap-2 shrink-0">
                <span
                  className={`px-2 py-0.5 rounded text-xs font-medium ${RATING_CLASSES[consistency.rating] ?? ""}`}
                >
                  {consistency.rating}
                </span>
                <span className="text-xs text-muted-foreground font-mono">
                  ±{consistency.stdDev.toFixed(3)}s
                </span>
              </div>
            ) : (
              <span className="text-xs text-muted-foreground shrink-0">
                Not enough data
              </span>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
