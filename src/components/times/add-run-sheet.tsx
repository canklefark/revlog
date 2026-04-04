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
import { createRun } from "@/lib/actions/run";
import type { Run } from "@prisma/client";

interface AddRunSheetProps {
  eventId: string;
  carId: string;
  nextRunNumber: number;
  sessionDefaults?: Pick<Run, "conditions" | "penalties" | "tireSetup">;
}

export function AddRunSheet({
  eventId,
  carId,
  nextRunNumber,
  sessionDefaults,
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
            defaultValues={sessionDefaults}
            onSuccess={() => setOpen(false)}
          />
        </SheetContent>
      </Sheet>
    </>
  );
}
