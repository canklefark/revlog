"use client";

import { useState } from "react";
import { format } from "date-fns";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatLapTime } from "@/lib/utils/penalty-calc";
import {
  CHART_COLORS,
  AXIS_STYLE,
  GRID_COLOR,
  TOOLTIP_STYLE,
  LEGEND_STYLE,
} from "./chart-theme";
import type { ProgressDataPoint, ModMarker } from "@/types/analytics";

type ChartRow = Record<string, string | number>;

interface ProgressChartProps {
  data: ProgressDataPoint[];
  modMarkers?: ModMarker[];
}

export function ProgressChart({ data, modMarkers }: ProgressChartProps) {
  // Unique event types present in data, preserving first-seen order
  const eventTypesSeen = new Set<string>();
  const eventTypes: string[] = [];
  for (const d of data) {
    if (!eventTypesSeen.has(d.eventType)) {
      eventTypesSeen.add(d.eventType);
      eventTypes.push(d.eventType);
    }
  }

  const [selectedType, setSelectedType] = useState<string>(
    () => eventTypes[0] ?? "",
  );

  // Keep selected type valid if data changes
  const activeType = eventTypes.includes(selectedType)
    ? selectedType
    : (eventTypes[0] ?? "");

  const filtered = data.filter((d) => d.eventType === activeType);

  // Collect car labels in first-seen order for the filtered set
  const carLabelsSeen = new Set<string>();
  const carLabels: string[] = [];
  for (const d of filtered) {
    if (!carLabelsSeen.has(d.carLabel)) {
      carLabelsSeen.add(d.carLabel);
      carLabels.push(d.carLabel);
    }
  }

  // Build chart rows keyed by ISO date
  const rowMap = new Map<string, ChartRow>();
  for (const point of filtered) {
    const dateKey =
      point.startDate instanceof Date
        ? point.startDate.toISOString()
        : new Date(point.startDate).toISOString();
    const existing = rowMap.get(dateKey) ?? { eventDate: dateKey };
    existing[point.carLabel] = point.bestAdjustedTime;
    rowMap.set(dateKey, existing);
  }
  const chartData = Array.from(rowMap.values()).sort(
    (a, b) =>
      new Date(a.eventDate as string).getTime() -
      new Date(b.eventDate as string).getTime(),
  );

  const labelSet = new Set(carLabels);
  const relevantMarkers = (modMarkers ?? []).filter((m) =>
    labelSet.has(m.carLabel),
  );

  if (data.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>Best Times</CardTitle>
          {eventTypes.length > 1 && (
            <div className="flex flex-wrap gap-1.5">
              {eventTypes.map((type) => (
                <button
                  key={type}
                  onClick={() => setSelectedType(type)}
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                    activeType === type
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:text-foreground",
                  )}
                >
                  {type}
                </button>
              ))}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {chartData.length < 2 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            {chartData.length === 0
              ? `No ${activeType} runs logged yet.`
              : `Only one ${activeType} event logged — add more to see trends.`}
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} />
              <XAxis
                dataKey="eventDate"
                tickFormatter={(d: string) => format(new Date(d), "MMM d")}
                stroke={GRID_COLOR}
                tick={AXIS_STYLE}
                interval="preserveStartEnd"
              />
              <YAxis
                tickFormatter={(v: number) => formatLapTime(v)}
                stroke={GRID_COLOR}
                tick={AXIS_STYLE}
                width={60}
                domain={["dataMin - 2", "dataMax + 2"]}
              />
              <Tooltip
                formatter={(v) =>
                  typeof v === "number"
                    ? [formatLapTime(v), ""]
                    : [String(v), ""]
                }
                labelFormatter={(l) =>
                  typeof l === "string"
                    ? format(new Date(l), "MMM d, yyyy")
                    : ""
                }
                contentStyle={TOOLTIP_STYLE}
              />
              <Legend wrapperStyle={LEGEND_STYLE} />
              {carLabels.map((label, i) => (
                <Line
                  key={label}
                  type="monotone"
                  dataKey={label}
                  stroke={CHART_COLORS[i % CHART_COLORS.length]}
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 5 }}
                  connectNulls
                />
              ))}
              {relevantMarkers.map((marker, i) => (
                <ReferenceLine
                  key={i}
                  x={marker.date}
                  stroke="#ef4444"
                  strokeDasharray="3 3"
                  strokeOpacity={0.7}
                  label={{
                    value: marker.label,
                    position: "top",
                    fontSize: 9,
                    fill: "#ef4444",
                    opacity: 0.8,
                  }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
