import type { MaintenanceEntry } from "@prisma/client";

export type AlertLevel = "overdue" | "due" | "upcoming" | "none";

export interface MaintenanceAlert {
  level: AlertLevel;
  entry: MaintenanceEntry;
  reason: string;
}

export function getAlertLevel(
  entry: MaintenanceEntry,
  currentOdometer: number | null,
  today: Date = new Date(),
): AlertLevel {
  const { nextDueDate, nextDueMileage, snoozedUntil } = entry;

  // If snoozed and snooze hasn't expired, no alert
  if (snoozedUntil && snoozedUntil > today) return "none";

  // Date-based checks
  if (nextDueDate) {
    const daysUntil = Math.ceil(
      (nextDueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
    );
    if (daysUntil < 0) return "overdue";
    if (daysUntil <= 7) return "due";
    if (daysUntil <= 30) return "upcoming";
  }

  // Mileage-based checks
  if (
    nextDueMileage !== null &&
    nextDueMileage !== undefined &&
    currentOdometer !== null
  ) {
    const milesUntil = nextDueMileage - currentOdometer;
    if (milesUntil < 0) return "overdue";
    if (milesUntil <= 100) return "due";
    if (milesUntil <= 500) return "upcoming";
  }

  return "none";
}

export function getAlertColor(level: AlertLevel): string {
  switch (level) {
    case "overdue":
      return "text-red-500";
    case "due":
      return "text-orange-500";
    case "upcoming":
      return "text-yellow-500";
    default:
      return "text-muted-foreground";
  }
}

export function getAlertBadgeVariant(level: AlertLevel) {
  switch (level) {
    case "overdue":
      return "destructive" as const;
    case "due":
      return "secondary" as const; // style with orange via className
    case "upcoming":
      return "outline" as const;
    default:
      return "outline" as const;
  }
}

export function getMaintenanceAlerts(
  entries: MaintenanceEntry[],
  currentOdometer: number | null,
): MaintenanceAlert[] {
  return entries
    .map((entry) => ({ entry, level: getAlertLevel(entry, currentOdometer) }))
    .filter(({ level }) => level !== "none")
    .sort((a, b) => {
      const order: Record<AlertLevel, number> = {
        overdue: 0,
        due: 1,
        upcoming: 2,
        none: 3,
      };
      return order[a.level] - order[b.level];
    })
    .map(({ entry, level }) => ({
      entry,
      level,
      reason: buildReasonString(entry, level),
    }));
}

function buildReasonString(entry: MaintenanceEntry, level: AlertLevel): string {
  const name =
    entry.serviceType === "Custom" && entry.customServiceName
      ? entry.customServiceName
      : entry.serviceType;

  if (level === "overdue") return `${name} is overdue`;
  if (level === "due") return `${name} due soon`;
  return `${name} coming up`;
}
