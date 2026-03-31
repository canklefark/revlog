import Link from "next/link";
import { WrenchIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { MaintenanceAlert } from "@/lib/utils/maintenance-alerts";
import { MaintenanceSnoozeButton } from "@/components/garage/maintenance-snooze-button";

interface MaintenanceAlertCardProps {
  carName: string;
  carId: string;
  alerts: MaintenanceAlert[];
}

export function MaintenanceAlertCard({
  carName,
  carId,
  alerts,
}: MaintenanceAlertCardProps) {
  if (alerts.length === 0) return null;

  const worstLevel = alerts[0].level;

  const badgeClass =
    worstLevel === "due" ? "border-orange-500 text-orange-400" : "";

  const visibleAlerts = alerts.filter(
    (a) => a.level === "overdue" || a.level === "due",
  );

  return (
    <Card className="border-border">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <WrenchIcon className="size-3.5 text-muted-foreground" />
            {carName}
          </CardTitle>
          <Badge
            variant={
              worstLevel === "overdue"
                ? "destructive"
                : worstLevel === "due"
                  ? "secondary"
                  : "outline"
            }
            className={`text-xs ${badgeClass}`}
          >
            {worstLevel === "overdue"
              ? "Overdue"
              : worstLevel === "due"
                ? "Due soon"
                : "Upcoming"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <ul className="space-y-1 mb-3">
          {visibleAlerts.slice(0, 3).map((alert) => (
            <li
              key={alert.entry.id}
              className="flex items-center justify-between gap-2"
            >
              <span className="text-xs text-muted-foreground">
                {alert.reason}
              </span>
              <MaintenanceSnoozeButton
                entryId={alert.entry.id}
                snoozedUntil={alert.entry.snoozedUntil}
                carId={carId}
              />
            </li>
          ))}
          {visibleAlerts.length > 3 && (
            <li className="text-xs text-muted-foreground">
              +{visibleAlerts.length - 3} more
            </li>
          )}
        </ul>
        <Link
          href={`/garage/${carId}/maintenance`}
          className="text-xs font-medium underline underline-offset-4 text-muted-foreground hover:text-foreground transition-colors"
        >
          View maintenance log
        </Link>
      </CardContent>
    </Card>
  );
}
