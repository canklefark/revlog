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
import type { CarComparisonSeries } from "@/types/analytics";

const RATING_CLASSES: Record<string, string> = {
  Excellent: "bg-green-500/20 text-green-400",
  Good: "bg-blue-500/20 text-blue-400",
  Fair: "bg-yellow-500/20 text-yellow-400",
  Inconsistent: "bg-red-500/20 text-red-400",
};

interface CarComparisonChartProps {
  data: CarComparisonSeries[];
}

export function CarComparisonChart({ data }: CarComparisonChartProps) {
  if (data.length < 2) return null;

  const barData = data.map((s) => ({
    car: s.carLabel,
    "Best Time": s.overallBest,
    "Avg Best": s.avgBest,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Car Comparison</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={barData}>
            <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} />
            <XAxis dataKey="car" stroke={GRID_COLOR} tick={AXIS_STYLE} />
            <YAxis
              tickFormatter={(v: number) => formatLapTime(v)}
              stroke={GRID_COLOR}
              tick={AXIS_STYLE}
              width={60}
            />
            <Tooltip
              formatter={(v) =>
                typeof v === "number" ? formatLapTime(v) : String(v)
              }
              contentStyle={TOOLTIP_STYLE}
            />
            <Legend wrapperStyle={LEGEND_STYLE} />
            <Bar
              dataKey="Best Time"
              fill={CHART_COLORS[0]}
              radius={[3, 3, 0, 0]}
            />
            <Bar
              dataKey="Avg Best"
              fill={CHART_COLORS[1]}
              radius={[3, 3, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>

        <div className="flex flex-wrap gap-3 pt-2">
          {data.map((s) => {
            const rating = s.consistency?.rating;
            return (
              <div key={s.carId} className="flex items-center gap-2 text-xs">
                <span className="text-muted-foreground">{s.carLabel}</span>
                {rating && (
                  <span
                    className={`px-1.5 py-0.5 rounded text-xs font-medium ${RATING_CLASSES[rating] ?? ""}`}
                  >
                    {rating}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
