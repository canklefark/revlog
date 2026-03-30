"use client";

import { CalendarPlusIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { EventCard } from "./event-card";
import { EventFilters } from "./event-filters";
import type { Event } from "@prisma/client";

interface EventListProps {
  events: Event[];
  total: number;
}

export function EventList({ events, total }: EventListProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <EventFilters />
        <Button asChild size="sm">
          <Link href="/events/new">
            <CalendarPlusIcon className="size-4 mr-1.5" />
            Add event
          </Link>
        </Button>
      </div>

      {total > 0 && (
        <p className="text-xs text-muted-foreground">
          {total} event{total !== 1 ? "s" : ""}
        </p>
      )}

      {events.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16 px-6 text-center">
          <CalendarPlusIcon className="size-10 text-muted-foreground/40 mb-3" />
          <p className="text-sm font-medium text-muted-foreground">
            No events yet
          </p>
          <p className="text-xs text-muted-foreground/60 mt-1 mb-4">
            Add your first event to start tracking your motorsport season.
          </p>
          <Button asChild size="sm" variant="outline">
            <Link href="/events/new">Add your first event</Link>
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-2 max-w-2xl">
          {events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </div>
  );
}
