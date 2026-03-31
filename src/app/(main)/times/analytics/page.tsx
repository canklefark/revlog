import { requireAuth } from "@/lib/auth-utils";
import {
  getProgressData,
  getPersonalRecords,
  getConditionsAnalysis,
  getCarComparisonData,
} from "@/lib/queries/analytics";
import { ProgressChart } from "@/components/analytics/progress-chart";
import { CarComparisonChart } from "@/components/analytics/car-comparison-chart";
import { ConditionsChart } from "@/components/analytics/conditions-chart";
import { PRTable } from "@/components/analytics/pr-table";
import { ConsistencyCard } from "@/components/analytics/consistency-card";

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
