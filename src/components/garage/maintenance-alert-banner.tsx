import Link from "next/link";
import { AlertTriangleIcon } from "lucide-react";
import type { MaintenanceAlert } from "@/lib/utils/maintenance-alerts";
import { MaintenanceSnoozeButton } from "@/components/garage/maintenance-snooze-button";

interface MaintenanceAlertBannerProps {
  alerts: MaintenanceAlert[];
  carId: string;
}

export function MaintenanceAlertBanner({
  alerts,
  carId,
}: MaintenanceAlertBannerProps) {
  if (alerts.length === 0) return null;

  const worstLevel = alerts[0].level;

  const bannerClass =
    worstLevel === "overdue"
      ? "border-red-500/50 bg-red-500/10"
      : worstLevel === "due"
        ? "border-orange-500/50 bg-orange-500/10"
        : "border-yellow-500/50 bg-yellow-500/10";

  const iconClass =
    worstLevel === "overdue"
      ? "text-red-500"
      : worstLevel === "due"
        ? "text-orange-500"
        : "text-yellow-500";

  const headingClass =
    worstLevel === "overdue"
      ? "text-red-400"
      : worstLevel === "due"
        ? "text-orange-400"
        : "text-yellow-400";

  return (
    <div className={`rounded-lg border p-4 mb-6 ${bannerClass}`}>
      <div className="flex items-start gap-3">
        <AlertTriangleIcon className={`size-4 mt-0.5 shrink-0 ${iconClass}`} />
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium mb-2 ${headingClass}`}>
            Maintenance alerts
          </p>
          <ul className="space-y-2">
            {alerts.map((alert) => (
              <li
                key={alert.entry.id}
                className="flex items-center justify-between gap-3 flex-wrap"
              >
                <span className="text-sm text-foreground">{alert.reason}</span>
                <div className="flex items-center gap-2 shrink-0">
                  <MaintenanceSnoozeButton
                    entryId={alert.entry.id}
                    snoozedUntil={alert.entry.snoozedUntil}
                    carId={carId}
                  />
                  <Link
                    href={`/garage/${carId}/maintenance/new?serviceType=${encodeURIComponent(alert.entry.serviceType)}`}
                    className="text-xs font-medium underline underline-offset-4 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Mark complete
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
