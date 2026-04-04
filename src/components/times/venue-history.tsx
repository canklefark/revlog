import Link from "next/link";
import { format } from "date-fns";
import { MapPinIcon } from "lucide-react";
import { formatLapTime } from "@/lib/utils/penalty-calc";
import type { VenueHistoryEvent } from "@/lib/queries/venue-history";

interface VenueHistoryProps {
  events: VenueHistoryEvent[];
  venueName: string;
}

export function VenueHistory({ events, venueName }: VenueHistoryProps) {
  if (events.length === 0) return null;

  const allTimeBest = Math.min(...events.map((e) => e.bestTime));

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <MapPinIcon
          className="size-3.5 text-muted-foreground shrink-0"
          aria-hidden="true"
        />
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Your History at {venueName}
        </h2>
      </div>
      <div className="space-y-1">
        {events.map((event) => {
          const delta = event.bestTime - allTimeBest;
          return (
            <Link
              key={event.id}
              href={`/events/${event.id}/session`}
              className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2.5 hover:bg-muted/40 transition-colors"
            >
              <span className="text-xs text-muted-foreground w-16 shrink-0">
                {format(new Date(event.startDate), "MMM d, yy")}
              </span>
              <span className="font-mono text-sm font-medium flex-1">
                {formatLapTime(event.bestTime)}
              </span>
              {delta === 0 ? (
                <span className="text-xs font-medium text-green-500 w-16 text-right shrink-0">
                  Best
                </span>
              ) : (
                <span className="text-xs text-muted-foreground w-16 text-right shrink-0">
                  +{formatLapTime(delta)}
                </span>
              )}
              <span className="text-xs text-muted-foreground truncate max-w-24 hidden sm:block">
                {event.carLabel}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
