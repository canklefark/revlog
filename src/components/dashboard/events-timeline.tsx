import Link from "next/link";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TypeBadge } from "@/components/events/type-badge";
import { StatusBadge } from "@/components/events/status-badge";
import type { Event } from "@prisma/client";

type EventsTimelineProps = {
  events: Event[];
};

const formatUSD = (amount: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    amount,
  );

export function EventsTimeline({ events }: EventsTimelineProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Upcoming Events</CardTitle>
      </CardHeader>
      <CardContent className="px-0 pb-0">
        {events.length === 0 ? (
          <div className="px-6 pb-6 flex flex-col items-center gap-2 py-6 text-center">
            <CalendarIcon
              className="size-7 text-muted-foreground"
              aria-hidden="true"
            />
            <p className="text-sm text-muted-foreground">No upcoming events.</p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {events.map((event) => {
              const date = new Date(event.startDate);
              return (
                <li key={event.id}>
                  <Link
                    href={`/events/${event.id}`}
                    className="flex items-center gap-4 px-6 py-3 hover:bg-accent/50 active:bg-accent transition-colors"
                  >
                    {/* Date chip */}
                    <div
                      className="flex w-10 shrink-0 flex-col items-center rounded-md bg-muted px-1.5 py-1.5 text-center"
                      aria-label={format(date, "MMMM d")}
                    >
                      <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground leading-none">
                        {format(date, "MMM")}
                      </span>
                      <span className="text-lg font-bold tabular-nums leading-tight text-foreground">
                        {format(date, "d")}
                      </span>
                    </div>

                    {/* Event info */}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-foreground leading-tight truncate">
                        {event.name}
                      </p>
                      <div className="mt-1 flex items-center gap-3 flex-wrap">
                        <TypeBadge type={event.type} />
                        <StatusBadge status={event.registrationStatus} />
                      </div>
                    </div>

                    {/* Entry fee */}
                    {event.entryFee != null && (
                      <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                        {formatUSD(event.entryFee)}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
