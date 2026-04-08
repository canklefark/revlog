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
import {
  CHART_COLORS,
  AXIS_STYLE,
  GRID_COLOR,
  TOOLTIP_STYLE,
  LEGEND_STYLE,
} from "./chart-theme";
import type { ConditionStats } from "@/types/analytics";

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
          height={Math.min(300, Math.max(200, data.length * 60))}
        >
          <BarChart layout="vertical" data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} />
            <XAxis
              type="number"
              tickFormatter={(v: number) => formatLapTime(v)}
              stroke={GRID_COLOR}
              tick={{ ...AXIS_STYLE, fontSize: 10 }}
            />
            <YAxis
              type="category"
              dataKey="condition"
              stroke={GRID_COLOR}
              tick={AXIS_STYLE}
              width={50}
            />
            <Tooltip
              formatter={(v) =>
                typeof v === "number" ? formatLapTime(v) : String(v)
              }
              contentStyle={TOOLTIP_STYLE}
            />
            <Legend wrapperStyle={LEGEND_STYLE} />
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
