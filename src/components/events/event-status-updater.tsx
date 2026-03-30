"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { REGISTRATION_STATUSES } from "@/lib/constants/event-types";
import { updateEventStatus, type EventActionState } from "@/lib/actions/event";

interface EventStatusUpdaterProps {
  eventId: string;
  currentStatus: string;
}

const initialState: EventActionState = {};

export function EventStatusUpdater({
  eventId,
  currentStatus,
}: EventStatusUpdaterProps) {
  const [state, formAction, isPending] = useActionState(
    updateEventStatus,
    initialState,
  );

  useEffect(() => {
    if (state?.error) toast.error(state.error);
    if (state?.data && state.data !== true) toast.success("Status updated.");
  }, [state]);

  return (
    <div className="flex flex-wrap gap-2">
      {REGISTRATION_STATUSES.map((status) => {
        const isActive = status === currentStatus;

        return (
          <form key={status} action={formAction}>
            <input type="hidden" name="eventId" value={eventId} />
            <input type="hidden" name="status" value={status} />
            <Button
              type="submit"
              variant={isActive ? "default" : "outline"}
              size="sm"
              disabled={isPending || isActive}
              className={cn(isActive && "pointer-events-none")}
            >
              {status}
            </Button>
          </form>
        );
      })}
    </div>
  );
}
