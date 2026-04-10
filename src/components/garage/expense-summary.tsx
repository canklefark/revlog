"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CHART_COLORS,
  AXIS_STYLE,
  GRID_COLOR,
  TOOLTIP_STYLE,
} from "@/components/analytics/chart-theme";
import type { ExpenseSummary } from "@/lib/queries/expenses";

interface ExpenseSummaryProps {
  summary: ExpenseSummary;
}

function formatCurrency(amount: number): string {
  return amount.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatCurrencyCompact(amount: number): string {
  if (amount >= 1000) {
    return `$${(amount / 1000).toFixed(1)}k`;
  }
  return `$${amount.toFixed(0)}`;
}

export function ExpenseSummaryView({ summary }: ExpenseSummaryProps) {
  const hasData = summary.allTime > 0;

  return (
    <div className="space-y-4">
      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardHeader className="pb-1 pt-4 px-4">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Total (All Time)
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="text-2xl font-semibold tabular-nums">
              {formatCurrency(summary.allTime)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1 pt-4 px-4">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Total (This Year)
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="text-2xl font-semibold tabular-nums">
              {formatCurrency(summary.currentYear)}
            </p>
          </CardContent>
        </Card>
      </div>

      {hasData && (
        <>
          {/* Spend by category */}
          {summary.byCategory.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Spend by Category</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer
                  width="100%"
                  height={Math.max(160, summary.byCategory.length * 36)}
                >
                  <BarChart
                    data={summary.byCategory}
                    layout="vertical"
                    margin={{ top: 0, right: 16, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke={GRID_COLOR}
                      horizontal={false}
                    />
                    <XAxis
                      type="number"
                      tickFormatter={formatCurrencyCompact}
                      stroke={GRID_COLOR}
                      tick={AXIS_STYLE}
                    />
                    <YAxis
                      type="category"
                      dataKey="category"
                      width={110}
                      stroke={GRID_COLOR}
                      tick={AXIS_STYLE}
                    />
                    <Tooltip
                      formatter={(v) =>
                        typeof v === "number"
                          ? [formatCurrency(v), "Amount"]
                          : [String(v), "Amount"]
                      }
                      contentStyle={TOOLTIP_STYLE}
                    />
                    <Bar
                      dataKey="total"
                      fill={CHART_COLORS[0]}
                      radius={[0, 4, 4, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Monthly trend */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">
                Monthly Spend (Last 12 Months)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {summary.byMonth.every((m) => m.total === 0) ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No expenses in the last 12 months.
                </p>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart
                    data={summary.byMonth}
                    margin={{ top: 4, right: 16, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} />
                    <XAxis
                      dataKey="month"
                      stroke={GRID_COLOR}
                      tick={{ ...AXIS_STYLE, fontSize: 10 }}
                      interval="preserveStartEnd"
                      tickFormatter={(v: string) => {
                        const parts = v.split(" ");
                        return parts[0] ?? v;
                      }}
                    />
                    <YAxis
                      tickFormatter={formatCurrencyCompact}
                      stroke={GRID_COLOR}
                      tick={AXIS_STYLE}
                      width={52}
                    />
                    <Tooltip
                      formatter={(v) =>
                        typeof v === "number"
                          ? [formatCurrency(v), "Spent"]
                          : [String(v), "Spent"]
                      }
                      contentStyle={TOOLTIP_STYLE}
                    />
                    <Line
                      type="monotone"
                      dataKey="total"
                      stroke={CHART_COLORS[2]}
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
