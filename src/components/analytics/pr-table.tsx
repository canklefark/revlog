import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatLapTime } from "@/lib/utils/penalty-calc";
import type { PersonalRecord } from "@/types/analytics";

interface PRTableProps {
  records: PersonalRecord[];
}

export function PRTable({ records }: PRTableProps) {
  if (records.length === 0) return null;

  // Group by carLabel preserving sort order from query
  const carGroups = new Map<string, PersonalRecord[]>();
  for (const record of records) {
    const existing = carGroups.get(record.carLabel);
    if (existing) {
      existing.push(record);
    } else {
      carGroups.set(record.carLabel, [record]);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Personal Records</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {Array.from(carGroups.entries()).map(([carLabel, carRecords]) => (
          <div key={carLabel}>
            <h3 className="text-sm font-medium mb-3 text-foreground">
              {carLabel}
            </h3>
            <div className="space-y-2">
              {/* Mobile: vertical list; desktop: 3-column grid */}
              <div className="hidden md:grid md:grid-cols-3 gap-2 text-xs text-muted-foreground pb-1 border-b border-border">
                <span>Event Type</span>
                <span>Best Time</span>
                <span>Event</span>
              </div>
              {carRecords.map((record) => (
                <div
                  key={`${record.carId}-${record.eventType}`}
                  className="text-sm md:grid md:grid-cols-3 md:gap-2 flex flex-col gap-0.5"
                >
                  <span className="font-medium">{record.eventType}</span>
                  <span className="font-mono text-primary">
                    {formatLapTime(record.bestTime)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {record.eventName}
                    {" · "}
                    {format(
                      record.eventDate instanceof Date
                        ? record.eventDate
                        : new Date(record.eventDate),
                      "MMM d, yyyy",
                    )}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
