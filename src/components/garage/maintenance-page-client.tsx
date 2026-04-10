"use client";

import { useState } from "react";
import { PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MaintenanceForm } from "@/components/garage/maintenance-form";
import { MaintenanceList } from "@/components/garage/maintenance-list";
import { MaintenanceAlertBanner } from "@/components/garage/maintenance-alert-banner";
import { createMaintenance } from "@/lib/actions/maintenance";
import type { MaintenanceEntry } from "@prisma/client";
import type { MaintenanceAlert } from "@/lib/utils/maintenance-alerts";

interface MaintenancePageClientProps {
  entries: MaintenanceEntry[];
  alerts: MaintenanceAlert[];
  carId: string;
  carOdometer: number | null;
}

export function MaintenancePageClient({
  entries,
  alerts,
  carId,
  carOdometer,
}: MaintenancePageClientProps) {
  const [addOpen, setAddOpen] = useState(false);

  return (
    <>
      <div className="flex items-center justify-end mb-6 gap-2">
        <Button size="sm" onClick={() => setAddOpen(true)}>
          <PlusIcon className="size-4 mr-1" />
          Add Entry
        </Button>
      </div>

      <MaintenanceAlertBanner alerts={alerts} carId={carId} />

      <MaintenanceList
        entries={entries}
        carId={carId}
        carOdometer={carOdometer}
      />

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Maintenance Entry</DialogTitle>
          </DialogHeader>
          <MaintenanceForm
            action={createMaintenance}
            carId={carId}
            onSuccess={() => setAddOpen(false)}
            onCancel={() => setAddOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
