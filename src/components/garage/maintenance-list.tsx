"use client";

import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";
import { PencilIcon, Trash2Icon } from "lucide-react";
import type { MaintenanceEntry } from "@prisma/client";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  getAlertLevel,
  getAlertBadgeVariant,
} from "@/lib/utils/maintenance-alerts";
import {
  deleteMaintenance,
  updateMaintenance,
  type MaintenanceActionState,
} from "@/lib/actions/maintenance";
import { MaintenanceForm } from "@/components/garage/maintenance-form";

interface MaintenanceListProps {
  entries: MaintenanceEntry[];
  carId: string;
  carOdometer: number | null;
}

const deleteInitialState: MaintenanceActionState = {};

function DeleteForm({ entryId }: { entryId: string }) {
  const [state, formAction, isPending] = useActionState(
    deleteMaintenance,
    deleteInitialState,
  );
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    if (state.data) toast.success("Entry deleted");
    if (state.error) toast.error(state.error);
  }, [state]);

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-8 text-muted-foreground hover:text-destructive"
        aria-label="Delete entry"
        onClick={() => setConfirmOpen(true)}
      >
        <Trash2Icon className="size-4" />
      </Button>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete maintenance entry?</DialogTitle>
            <DialogDescription>
              This will permanently delete this maintenance entry. This cannot
              be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <form action={formAction}>
              <input type="hidden" name="entryId" value={entryId} />
              <Button type="submit" variant="destructive" disabled={isPending}>
                {isPending ? "Deleting..." : "Delete"}
              </Button>
            </form>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
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
  const [editOpen, setEditOpen] = useState(false);
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
          {entry.snoozedUntil && entry.snoozedUntil > new Date() && (
            <Badge variant="outline" className="text-xs text-muted-foreground">
              Snoozed until {format(entry.snoozedUntil, "MMM d")}
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
          variant="ghost"
          size="icon"
          className="size-8 text-muted-foreground hover:text-foreground"
          aria-label="Edit entry"
          onClick={() => setEditOpen(true)}
        >
          <PencilIcon className="size-4" />
        </Button>
        <DeleteForm entryId={entry.id} />
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Maintenance Entry</DialogTitle>
          </DialogHeader>
          <MaintenanceForm
            action={updateMaintenance}
            carId={carId}
            defaultValues={entry}
            onSuccess={() => setEditOpen(false)}
            onCancel={() => setEditOpen(false)}
          />
        </DialogContent>
      </Dialog>
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
