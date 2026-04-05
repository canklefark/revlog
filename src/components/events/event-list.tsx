"use client";

import { useSearchParams } from "next/navigation";
import { CalendarDaysIcon, CalendarPlusIcon, DownloadIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { EventCard } from "./event-card";
import { EventFilters } from "./event-filters";
import { ExportButton } from "@/components/shared/export-button";
import { groupByKey } from "@/lib/utils/group-by";
import type { Event } from "@prisma/client";

interface EventListProps {
  events: Event[];
  total: number;
}

export function EventList({ events, total }: EventListProps) {
  const searchParams = useSearchParams();
  const groupBy = searchParams.get("group");

  const grouped = groupBy === "type" ? groupByKey(events, (e) => e.type) : null;
  const groupCategories = grouped ? Object.keys(grouped) : null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <EventFilters />
        <div className="flex items-center gap-2">
          <ExportButton section="events" />
          <Button asChild variant="outline" size="sm">
            <Link href="/events/calendar">
              <CalendarDaysIcon className="size-4 mr-1.5" />
              Calendar
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/events/import">
              <DownloadIcon className="size-4 mr-1.5" />
              Import
            </Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/events/new">
              <CalendarPlusIcon className="size-4 mr-1.5" />
              Add event
            </Link>
          </Button>
        </div>
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
      ) : grouped && groupCategories ? (
        <div className="space-y-6 max-w-2xl">
          {groupCategories.map((type, idx) => (
            <div key={type}>
              {idx > 0 && <Separator className="mb-6" />}
              <div className="flex items-center gap-2 mb-3">
                <h2 className="text-sm font-semibold">{type}</h2>
                <Badge variant="secondary" className="text-xs">
                  {grouped[type].length}
                </Badge>
              </div>
              <div className="flex flex-col gap-2">
                {grouped[type].map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            </div>
          ))}
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
