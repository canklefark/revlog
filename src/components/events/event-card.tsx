import Link from "next/link";
import { format } from "date-fns";
import { MapPinIcon, DollarSignIcon, NavigationIcon } from "lucide-react";
import { TypeBadge } from "./type-badge";
import { StatusBadge } from "./status-badge";
import type { Event } from "@prisma/client";

interface EventCardProps {
  event: Event;
}

export function EventCard({ event }: EventCardProps) {
  return (
    <Link href={`/events/${event.id}`} className="block group">
      <div className="rounded-lg border border-border bg-card px-4 py-3 transition-colors hover:bg-accent/50 active:bg-accent">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="text-xs text-muted-foreground font-mono tabular-nums shrink-0">
                {format(new Date(event.startDate), "EEE, MMM d")}
              </span>
            </div>
            <p className="text-sm font-semibold text-foreground leading-tight truncate">
              {event.name}
            </p>
            <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
              <TypeBadge type={event.type} />
              <StatusBadge status={event.registrationStatus} />
            </div>
            {event.venueName && (
              <div className="flex items-center gap-1 mt-1.5 text-xs text-muted-foreground">
                <MapPinIcon className="size-3 shrink-0" />
                <span className="truncate">{event.venueName}</span>
              </div>
            )}
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0 text-right">
            {event.entryFee != null && (
              <div className="flex items-center gap-0.5 text-xs text-muted-foreground">
                <DollarSignIcon className="size-3" />
                <span>{event.entryFee.toFixed(0)}</span>
              </div>
            )}
            {event.distanceFromHome != null && (
              <div className="flex items-center gap-0.5 text-xs text-muted-foreground">
                <NavigationIcon className="size-3" />
                <span>{Math.round(event.distanceFromHome)} mi</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
