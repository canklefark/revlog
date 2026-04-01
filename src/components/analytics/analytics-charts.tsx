"use client";

import React from "react";
import dynamic from "next/dynamic";
import type {
  ProgressDataPoint,
  ConditionStats,
  CarComparisonSeries,
} from "@/types/analytics";

// Recharts uses ResizeObserver (browser-only) — ssr: false must live in a Client Component
const ProgressChart = dynamic(
  () => import("./progress-chart").then((m) => m.ProgressChart),
  { ssr: false },
);
const ConditionsChart = dynamic(
  () => import("./conditions-chart").then((m) => m.ConditionsChart),
  { ssr: false },
);
const CarComparisonChart = dynamic(
  () => import("./car-comparison-chart").then((m) => m.CarComparisonChart),
  { ssr: false },
);

interface AnalyticsChartsProps {
  progressData: ProgressDataPoint[];
  conditionsData: ConditionStats[];
  carComparisonData: CarComparisonSeries[];
  consistencySlot: React.ReactNode;
}

export function AnalyticsCharts({
  progressData,
  conditionsData,
  carComparisonData,
  consistencySlot,
}: AnalyticsChartsProps) {
  return (
    <>
      <ProgressChart data={progressData} />
      <div className="grid gap-6 md:grid-cols-2">
        {consistencySlot}
        <ConditionsChart data={conditionsData} />
      </div>
      {carComparisonData.length >= 2 && (
        <CarComparisonChart data={carComparisonData} />
      )}
    </>
  );
}
