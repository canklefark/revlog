import dynamic from "next/dynamic";
import { requireAuth } from "@/lib/auth-utils";
import {
  getProgressData,
  getPersonalRecords,
  getConditionsAnalysis,
  getCarComparisonData,
} from "@/lib/queries/analytics";
import { PRTable } from "@/components/analytics/pr-table";
import { ConsistencyCard } from "@/components/analytics/consistency-card";

// Recharts uses ResizeObserver (browser-only) — disable SSR to prevent hydration mismatch
const ProgressChart = dynamic(
  () =>
    import("@/components/analytics/progress-chart").then(
      (m) => m.ProgressChart,
    ),
  { ssr: false },
);
const ConditionsChart = dynamic(
  () =>
    import("@/components/analytics/conditions-chart").then(
      (m) => m.ConditionsChart,
    ),
  { ssr: false },
);
const CarComparisonChart = dynamic(
  () =>
    import("@/components/analytics/car-comparison-chart").then(
      (m) => m.CarComparisonChart,
    ),
  { ssr: false },
);

export default async function AnalyticsPage() {
  const userId = await requireAuth();

  const [progressData, personalRecords, conditionsData, carComparisonData] =
    await Promise.all([
      getProgressData(userId),
      getPersonalRecords(userId),
      getConditionsAnalysis(userId),
      getCarComparisonData(userId),
    ]);

  const hasData = progressData.length > 0;

  if (!hasData) {
    return (
      <div className="py-12 text-center text-muted-foreground mt-6">
        <p className="text-sm">No run data yet.</p>
        <p className="text-xs mt-1">
          Log runs on your events to see analytics.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 mt-6">
      <ProgressChart data={progressData} />
      <div className="grid gap-6 md:grid-cols-2">
        <ConsistencyCard records={personalRecords} />
        <ConditionsChart data={conditionsData} />
      </div>
      <PRTable records={personalRecords} />
      {carComparisonData.length >= 2 && (
        <CarComparisonChart data={carComparisonData} />
      )}
    </div>
  );
}
