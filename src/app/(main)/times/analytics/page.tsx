import Link from "next/link";
import { BarChart2Icon } from "lucide-react";
import { requireAuth } from "@/lib/auth-utils";
import {
  getProgressData,
  getPersonalRecords,
  getConditionsAnalysis,
  getCarComparisonData,
  getModMarkers,
} from "@/lib/queries/analytics";
import { PRTable } from "@/components/analytics/pr-table";
import { ConsistencyCard } from "@/components/analytics/consistency-card";
import { AnalyticsCharts } from "@/components/analytics/analytics-charts";

export default async function AnalyticsPage() {
  const userId = await requireAuth();

  const [
    progressData,
    personalRecords,
    conditionsData,
    carComparisonData,
    modMarkers,
  ] = await Promise.all([
    getProgressData(userId),
    getPersonalRecords(userId),
    getConditionsAnalysis(userId),
    getCarComparisonData(userId),
    getModMarkers(userId),
  ]);

  const hasData = progressData.length > 0;

  if (!hasData) {
    return (
      <div className="py-12 text-center mt-6">
        <BarChart2Icon
          className="mx-auto mb-3 size-8 text-muted-foreground"
          aria-hidden="true"
        />
        <p className="text-sm text-muted-foreground">No run data yet.</p>
        <p className="text-xs text-muted-foreground mt-1">
          Log runs on your events to see performance analytics, personal
          records, and consistency trends.
        </p>
        <Link
          href="/events"
          className="mt-3 inline-block text-sm font-medium underline underline-offset-4 text-muted-foreground hover:text-foreground transition-colors"
        >
          Go to Events →
        </Link>
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
        modMarkers={modMarkers}
      />
      <PRTable records={personalRecords} />
    </div>
  );
}
