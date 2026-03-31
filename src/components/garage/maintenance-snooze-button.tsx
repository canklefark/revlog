"use client";

import { useState, useActionState, useEffect, useRef } from "react";
import { format } from "date-fns";
import { ClockIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import {
  snoozeMaintenance,
  unsnoozeMaintenance,
} from "@/lib/actions/maintenance";
import type { MaintenanceActionState } from "@/lib/actions/maintenance";

interface MaintenanceSnoozeButtonProps {
  entryId: string;
  snoozedUntil: Date | null;
  carId: string;
}

const initialState: MaintenanceActionState = {};

// ---------------------------------------------------------------------------
// Unsnooze form
// ---------------------------------------------------------------------------

function UnsnoozeForm({ entryId }: { entryId: string }) {
  const [state, formAction, isPending] = useActionState(
    unsnoozeMaintenance,
    initialState,
  );

  useEffect(() => {
    if (state.error) toast.error(state.error);
    if (state.data) toast.success("Snooze removed");
  }, [state]);

  return (
    <form action={formAction}>
      <input type="hidden" name="entryId" value={entryId} />
      <Button
        type="submit"
        variant="ghost"
        size="sm"
        disabled={isPending}
        className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
      >
        Unsnooze
      </Button>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Pre-set duration snooze form (hidden; submitted imperatively via ref)
// ---------------------------------------------------------------------------

type PresetDuration = "1week" | "2weeks" | "1month";

interface PresetSnoozeFormProps {
  formRef: React.RefObject<HTMLFormElement | null>;
  entryId: string;
  duration: PresetDuration;
}

function PresetSnoozeForm({
  formRef,
  entryId,
  duration,
}: PresetSnoozeFormProps) {
  const [state, formAction] = useActionState(snoozeMaintenance, initialState);

  useEffect(() => {
    if (state.error) toast.error(state.error);
    if (state.data) toast.success("Snoozed");
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="hidden">
      <input type="hidden" name="entryId" value={entryId} />
      <input type="hidden" name="duration" value={duration} />
      <button type="submit" />
    </form>
  );
}

// ---------------------------------------------------------------------------
// Custom date snooze form (hidden; submitted imperatively via ref)
// ---------------------------------------------------------------------------

interface CustomSnoozeFormProps {
  formRef: React.RefObject<HTMLFormElement | null>;
  entryId: string;
  customDateIso: string;
  onSuccess: () => void;
}

function CustomSnoozeForm({
  formRef,
  entryId,
  customDateIso,
  onSuccess,
}: CustomSnoozeFormProps) {
  const [state, formAction] = useActionState(snoozeMaintenance, initialState);

  useEffect(() => {
    if (state.error) toast.error(state.error);
    if (state.data) {
      toast.success("Snoozed");
      onSuccess();
    }
  }, [state, onSuccess]);

  return (
    <form ref={formRef} action={formAction} className="hidden">
      <input type="hidden" name="entryId" value={entryId} />
      <input type="hidden" name="duration" value="custom" />
      <input type="hidden" name="customDate" value={customDateIso} />
      <button type="submit" />
    </form>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function MaintenanceSnoozeButton({
  entryId,
  snoozedUntil,
  carId: _carId,
}: MaintenanceSnoozeButtonProps) {
  const isSnoozed = snoozedUntil !== null && snoozedUntil > new Date();

  const [customOpen, setCustomOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [customDateIso, setCustomDateIso] = useState("");
  // Tracks whether the custom form should submit after the next render
  const pendingCustomSubmit = useRef(false);

  const form1week = useRef<HTMLFormElement>(null);
  const form2weeks = useRef<HTMLFormElement>(null);
  const form1month = useRef<HTMLFormElement>(null);
  const formCustom = useRef<HTMLFormElement>(null);

  // Submit the custom form once the new customDateIso has rendered into the DOM
  useEffect(() => {
    if (pendingCustomSubmit.current && customDateIso) {
      pendingCustomSubmit.current = false;
      formCustom.current?.requestSubmit();
    }
  }, [customDateIso]);

  function handleCustomConfirm() {
    if (!selectedDate) return;
    pendingCustomSubmit.current = true;
    setCustomDateIso(selectedDate.toISOString());
    setCustomOpen(false);
  }

  function handleCustomSuccess() {
    setSelectedDate(undefined);
    setCustomDateIso("");
  }

  if (isSnoozed) {
    return (
      <div className="flex items-center gap-1">
        <span className="text-xs text-muted-foreground">
          Snoozed until {format(snoozedUntil, "MMM d")}
        </span>
        <UnsnoozeForm entryId={entryId} />
      </div>
    );
  }

  return (
    <>
      {/* Hidden forms owned outside dropdown so each has its own action state */}
      <PresetSnoozeForm
        formRef={form1week}
        entryId={entryId}
        duration="1week"
      />
      <PresetSnoozeForm
        formRef={form2weeks}
        entryId={entryId}
        duration="2weeks"
      />
      <PresetSnoozeForm
        formRef={form1month}
        entryId={entryId}
        duration="1month"
      />
      <CustomSnoozeForm
        formRef={formCustom}
        entryId={entryId}
        customDateIso={customDateIso}
        onSuccess={handleCustomSuccess}
      />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
            aria-label="Snooze"
          >
            <ClockIcon className="size-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => form1week.current?.requestSubmit()}>
            1 week
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => form2weeks.current?.requestSubmit()}
          >
            2 weeks
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => form1month.current?.requestSubmit()}
          >
            1 month
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={(e) => {
              e.preventDefault();
              setCustomOpen(true);
            }}
          >
            Custom date...
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={customOpen} onOpenChange={setCustomOpen}>
        <DialogContent className="w-auto p-4">
          <DialogHeader>
            <DialogTitle>Choose snooze date</DialogTitle>
          </DialogHeader>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            disabled={{ before: new Date() }}
          />
          <Button
            onClick={handleCustomConfirm}
            disabled={!selectedDate}
            className="w-full mt-2"
            size="sm"
          >
            Snooze until {selectedDate ? format(selectedDate, "MMM d") : "..."}
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
