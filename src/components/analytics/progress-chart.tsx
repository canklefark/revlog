"use client";

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
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatLapTime } from "@/lib/utils/penalty-calc";
import type { ProgressDataPoint } from "@/types/analytics";

const CHART_COLORS = [
  "#3b82f6",
  "#f97316",
  "#22c55e",
  "#a855f7",
  "#ec4899",
  "#14b8a6",
];
const AXIS_COLOR = "hsl(var(--muted-foreground))";
const GRID_COLOR = "hsl(var(--border))";

type ChartRow = Record<string, string | number>;

interface ProgressChartProps {
  data: ProgressDataPoint[];
}

export function ProgressChart({ data }: ProgressChartProps) {
  if (data.length === 0) return null;

  // Collect all unique car labels in order of first appearance
  const carLabels: string[] = [];
  const seen = new Set<string>();
  for (const point of data) {
    if (!seen.has(point.carLabel)) {
      carLabels.push(point.carLabel);
      seen.add(point.carLabel);
    }
  }

  // Build a map keyed by ISO date string → row object
  const rowMap = new Map<string, ChartRow>();
  for (const point of data) {
    const dateKey =
      point.startDate instanceof Date
        ? point.startDate.toISOString()
        : new Date(point.startDate).toISOString();

    const existing = rowMap.get(dateKey) ?? { eventDate: dateKey };
    existing[point.carLabel] = point.bestAdjustedTime;
    rowMap.set(dateKey, existing);
  }

  // Sort rows by date ascending
  const chartData = Array.from(rowMap.values()).sort((a, b) => {
    return (
      new Date(a.eventDate as string).getTime() -
      new Date(b.eventDate as string).getTime()
    );
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Progress Over Time</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} />
            <XAxis
              dataKey="eventDate"
              tickFormatter={(d: string) => format(new Date(d), "MMM d")}
              stroke={AXIS_COLOR}
              tick={{ fontSize: 11 }}
              interval="preserveStartEnd"
            />
            <YAxis
              tickFormatter={(v: number) => formatLapTime(v)}
              stroke={AXIS_COLOR}
              tick={{ fontSize: 11 }}
              width={60}
              domain={["dataMin - 2", "dataMax + 2"]}
            />
            <Tooltip
              formatter={(v) =>
                typeof v === "number" ? [formatLapTime(v), ""] : [String(v), ""]
              }
              labelFormatter={(l) =>
                typeof l === "string" ? format(new Date(l), "MMM d, yyyy") : ""
              }
              contentStyle={{
                backgroundColor: "hsl(var(--popover))",
                border: "1px solid hsl(var(--border))",
                borderRadius: 6,
                fontSize: 12,
              }}
            />
            <Legend />
            {carLabels.map((label, i) => (
              <Line
                key={label}
                type="monotone"
                dataKey={label}
                stroke={CHART_COLORS[i % CHART_COLORS.length]}
                dot={{ r: 3 }}
                connectNulls
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
