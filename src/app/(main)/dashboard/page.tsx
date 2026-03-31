import { requireAuth } from "@/lib/auth-utils";
import {
  getNextEvent,
  getUpcomingEvents,
  getBudgetSnapshot,
  getMaintenanceAlertsForDashboard,
} from "@/lib/queries/dashboard";
import { getSeasonProgress, getRecentRuns } from "@/lib/queries/analytics";
import { NextEventCard } from "@/components/dashboard/next-event-card";
import { BudgetSnapshot } from "@/components/dashboard/budget-snapshot";
import { MaintenanceAlertsWidget } from "@/components/dashboard/maintenance-alerts-widget";
import { EventsTimeline } from "@/components/dashboard/events-timeline";
import { SeasonProgressWidget } from "@/components/dashboard/season-progress-widget";
import { RecentRunsWidget } from "@/components/dashboard/recent-runs-widget";

export default async function DashboardPage() {
  const userId = await requireAuth();

  const [
    nextEvent,
    upcomingEvents,
    budgetSnapshot,
    maintenanceData,
    seasonProgress,
    recentRuns,
  ] = await Promise.all([
    getNextEvent(userId),
    getUpcomingEvents(userId),
    getBudgetSnapshot(userId),
    getMaintenanceAlertsForDashboard(userId),
    getSeasonProgress(userId),
    getRecentRuns(userId, 5),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      <NextEventCard event={nextEvent} />

      <SeasonProgressWidget data={seasonProgress} />

      <BudgetSnapshot
        spent={budgetSnapshot.spent}
        budget={budgetSnapshot.budget}
      />

      <RecentRunsWidget runs={recentRuns} />

      {maintenanceData.length > 0 && (
        <MaintenanceAlertsWidget data={maintenanceData} />
      )}

      <EventsTimeline events={upcomingEvents} />
    </div>
  );
}
