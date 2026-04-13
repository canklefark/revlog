"use client";

import { useState } from "react";
import { PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { RunForm } from "@/components/times/run-form";
import type {
  TireSetOption,
  BrakeSetOption,
  SuspensionSetupOption,
} from "@/components/times/run-form";
import { createRun } from "@/lib/actions/run";
import type { Run } from "@prisma/client";

type SessionDefaults = Pick<Run, "conditions" | "tireSetup"> & {
  tireSetId?: string | null;
  brakeSetId?: string | null;
  setupId?: string | null;
};

interface AddRunSheetProps {
  eventId: string;
  carId: string;
  nextRunNumber: number;
  sessionDefaults?: SessionDefaults;
  sessionLabel?: string;
  tireSets?: TireSetOption[];
  brakeSets?: BrakeSetOption[];
  suspensionSetups?: SuspensionSetupOption[];
}

export function AddRunSheet({
  eventId,
  carId,
  nextRunNumber,
  sessionDefaults,
  sessionLabel,
  tireSets,
  brakeSets,
  suspensionSetups,
}: AddRunSheetProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className="fixed bottom-20 right-4 z-40 size-14 rounded-full shadow-lg"
        aria-label="Add run"
      >
        <PlusIcon className="size-6" />
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto">
          <SheetHeader className="mb-4">
            <SheetTitle>Add Run #{nextRunNumber}</SheetTitle>
          </SheetHeader>
          <RunForm
            action={createRun}
            eventId={eventId}
            carId={carId}
            defaultRunNumber={nextRunNumber}
            defaultValues={sessionDefaults ?? undefined}
            sessionLabel={sessionLabel}
            tireSets={tireSets}
            brakeSets={brakeSets}
            suspensionSetups={suspensionSetups}
            onSuccess={() => setOpen(false)}
          />
        </SheetContent>
      </Sheet>
    </>
  );
}
