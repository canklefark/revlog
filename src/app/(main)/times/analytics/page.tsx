import { requireAuth } from "@/lib/auth-utils";
import {
  getProgressData,
  getPersonalRecords,
  getConditionsAnalysis,
  getCarComparisonData,
} from "@/lib/queries/analytics";
import { PRTable } from "@/components/analytics/pr-table";
import { ConsistencyCard } from "@/components/analytics/consistency-card";
import { AnalyticsCharts } from "@/components/analytics/analytics-charts";

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
      <AnalyticsCharts
        progressData={progressData}
        conditionsData={conditionsData}
        carComparisonData={carComparisonData}
        consistencySlot={<ConsistencyCard records={personalRecords} />}
      />
      <PRTable records={personalRecords} />
    </div>
  );
}
