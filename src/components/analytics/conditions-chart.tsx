"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatLapTime } from "@/lib/utils/penalty-calc";
import type { ConditionStats } from "@/types/analytics";

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

interface ConditionsChartProps {
  data: ConditionStats[];
}

export function ConditionsChart({ data }: ConditionsChartProps) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Times by Conditions</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground py-8 text-center">
            No conditions data yet.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Times by Conditions</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer
          width="100%"
          height={Math.max(200, data.length * 60)}
        >
          <BarChart layout="vertical" data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} />
            <XAxis
              type="number"
              tickFormatter={(v: number) => formatLapTime(v)}
              stroke={AXIS_COLOR}
              tick={{ fontSize: 10 }}
            />
            <YAxis
              type="category"
              dataKey="condition"
              stroke={AXIS_COLOR}
              tick={{ fontSize: 11 }}
              width={50}
            />
            <Tooltip
              formatter={(v) =>
                typeof v === "number" ? formatLapTime(v) : String(v)
              }
              contentStyle={{
                backgroundColor: "hsl(var(--popover))",
                border: "1px solid hsl(var(--border))",
                borderRadius: 6,
                fontSize: 12,
              }}
            />
            <Legend />
            <Bar
              dataKey="bestTime"
              name="Best"
              fill={CHART_COLORS[0]}
              radius={[0, 3, 3, 0]}
            />
            <Bar
              dataKey="avgTime"
              name="Average"
              fill={CHART_COLORS[1]}
              radius={[0, 3, 3, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
