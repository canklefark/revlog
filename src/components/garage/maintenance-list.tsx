"use client";

import { useActionState } from "react";
import Link from "next/link";
import { PencilIcon, Trash2Icon } from "lucide-react";
import type { MaintenanceEntry } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  getAlertLevel,
  getAlertBadgeVariant,
} from "@/lib/utils/maintenance-alerts";
import {
  deleteMaintenance,
  type MaintenanceActionState,
} from "@/lib/actions/maintenance";

interface MaintenanceListProps {
  entries: MaintenanceEntry[];
  carId: string;
  carOdometer: number | null;
}

const deleteInitialState: MaintenanceActionState = {};

function DeleteForm({ entryId }: { entryId: string }) {
  const [, formAction, isPending] = useActionState(
    deleteMaintenance,
    deleteInitialState,
  );

  return (
    <form action={formAction}>
      <input type="hidden" name="entryId" value={entryId} />
      <Button
        type="submit"
        variant="ghost"
        size="icon"
        disabled={isPending}
        className="size-8 text-muted-foreground hover:text-destructive"
        aria-label="Delete entry"
      >
        <Trash2Icon className="size-4" />
      </Button>
    </form>
  );
}

function EntryCard({
  entry,
  carId,
  carOdometer,
}: {
  entry: MaintenanceEntry;
  carId: string;
  carOdometer: number | null;
}) {
  const alertLevel = getAlertLevel(entry, carOdometer);
  const badgeVariant = getAlertBadgeVariant(alertLevel);
  const alertBadgeClass =
    alertLevel === "due" ? "text-orange-400 border-orange-500" : "";

  const displayName =
    entry.serviceType === "Custom" && entry.customServiceName
      ? entry.customServiceName
      : entry.serviceType;

  return (
    <div className="flex items-start justify-between gap-3 py-3 border-b border-border last:border-0">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <span className="font-medium text-sm">{displayName}</span>
          {alertLevel !== "none" && (
            <Badge
              variant={badgeVariant}
              className={`text-xs ${alertBadgeClass}`}
            >
              {alertLevel === "overdue"
                ? "Overdue"
                : alertLevel === "due"
                  ? "Due soon"
                  : "Upcoming"}
            </Badge>
          )}
        </div>

        <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
          <span>{new Date(entry.date).toLocaleDateString()}</span>
          {entry.odometer !== null && entry.odometer !== undefined && (
            <span>{entry.odometer.toLocaleString()} mi</span>
          )}
          {entry.cost !== null && entry.cost !== undefined && (
            <span>${entry.cost.toFixed(2)}</span>
          )}
        </div>

        {(entry.nextDueDate || entry.nextDueMileage !== null) && (
          <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted-foreground mt-0.5">
            {entry.nextDueDate && (
              <span>
                Next: {new Date(entry.nextDueDate).toLocaleDateString()}
              </span>
            )}
            {entry.nextDueMileage !== null &&
              entry.nextDueMileage !== undefined && (
                <span>Next: {entry.nextDueMileage.toLocaleString()} mi</span>
              )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-1 shrink-0">
        <Button
          asChild
          variant="ghost"
          size="icon"
          className="size-8 text-muted-foreground hover:text-foreground"
        >
          <Link
            href={`/garage/${carId}/maintenance/${entry.id}/edit`}
            aria-label="Edit entry"
          >
            <PencilIcon className="size-4" />
          </Link>
        </Button>
        <DeleteForm entryId={entry.id} />
      </div>
    </div>
  );
}

export function MaintenanceList({
  entries,
  carId,
  carOdometer,
}: MaintenanceListProps) {
  if (entries.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4">
        No maintenance entries yet.
      </p>
    );
  }

  // Group entries by year (most recent first)
  const grouped = entries.reduce<Record<number, MaintenanceEntry[]>>(
    (acc, entry) => {
      const year = new Date(entry.date).getFullYear();
      if (!acc[year]) acc[year] = [];
      acc[year].push(entry);
      return acc;
    },
    {},
  );

  const years = Object.keys(grouped)
    .map(Number)
    .sort((a, b) => b - a);

  return (
    <div className="space-y-6">
      {years.map((year) => (
        <div key={year}>
          <div className="flex items-center gap-2 mb-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {year}
            </p>
            <span className="text-xs text-muted-foreground">
              ({grouped[year].length})
            </span>
          </div>
          <div>
            {grouped[year].map((entry) => (
              <EntryCard
                key={entry.id}
                entry={entry}
                carId={carId}
                carOdometer={carOdometer}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
