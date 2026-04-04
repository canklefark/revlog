import Link from "next/link";
import { format } from "date-fns";
import {
  CalendarIcon,
  MapPinIcon,
  NavigationIcon,
  DollarSignIcon,
  CarIcon,
  ChevronRightIcon,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TypeBadge } from "@/components/events/type-badge";
import { StatusBadge } from "@/components/events/status-badge";

type EventSummary = {
  id: string;
  name: string;
  type: string;
  startDate: Date;
  registrationStatus: string;
  venueName: string | null;
  address: string | null;
  distanceFromHome: number | null;
  driveTimeMinutes: number | null;
  entryFee: number | null;
  car: {
    year: number;
    make: string;
    model: string;
    nickname: string | null;
  } | null;
};

interface UpcomingEventsCardProps {
  events: EventSummary[];
}

function formatDriveTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function carDisplayName(car: {
  year: number;
  make: string;
  model: string;
  nickname: string | null;
}): string {
  return car.nickname ?? `${car.year} ${car.make} ${car.model}`;
}

const formatUSD = (amount: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    amount,
  );

function PrimaryEvent({ event }: { event: EventSummary }) {
  const distanceDisplay =
    event.distanceFromHome != null && event.driveTimeMinutes != null
      ? `${Math.round(event.distanceFromHome)} mi · ${formatDriveTime(event.driveTimeMinutes)}`
      : event.distanceFromHome != null
        ? `${Math.round(event.distanceFromHome)} mi`
        : null;

  return (
    <>
      <CardHeader>
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Next Event
        </p>
        <CardTitle className="text-xl font-bold leading-tight">
          {event.name}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Date */}
        <div className="flex items-center gap-2 text-sm text-foreground">
          <CalendarIcon
            className="size-4 shrink-0 text-muted-foreground"
            aria-hidden="true"
          />
          <span>{format(new Date(event.startDate), "EEEE, MMMM d, yyyy")}</span>
        </div>

        {/* Type + Status badges */}
        <div className="flex items-center gap-2 flex-wrap">
          <TypeBadge type={event.type} />
          <StatusBadge status={event.registrationStatus} />
        </div>

        {/* Venue */}
        {(event.venueName ?? event.address) && (
          <div className="flex items-start gap-2 text-sm text-muted-foreground">
            <MapPinIcon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <span>
              {event.venueName}
              {event.venueName && event.address && " · "}
              {event.address}
            </span>
          </div>
        )}

        {/* Distance / Drive time */}
        {distanceDisplay && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <NavigationIcon className="size-4 shrink-0" aria-hidden="true" />
            <span>{distanceDisplay}</span>
          </div>
        )}

        {/* Entry fee */}
        {event.entryFee != null && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <DollarSignIcon className="size-4 shrink-0" aria-hidden="true" />
            <span>{formatUSD(event.entryFee)} entry fee</span>
          </div>
        )}

        {/* Linked car */}
        {event.car && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CarIcon className="size-4 shrink-0" aria-hidden="true" />
            <span>{carDisplayName(event.car)}</span>
          </div>
        )}

        {/* Link to detail */}
        <div className="pt-1">
          <Link
            href={`/events/${event.id}`}
            className="text-sm font-medium underline underline-offset-4 text-muted-foreground hover:text-foreground transition-colors"
          >
            View event details
          </Link>
        </div>
      </CardContent>
    </>
  );
}

function CompactEventRow({ event }: { event: EventSummary }) {
  return (
    <Link
      href={`/events/${event.id}`}
      className="flex items-center gap-3 px-6 py-3 hover:bg-muted/50 transition-colors group"
    >
      {/* Date */}
      <span className="w-12 shrink-0 text-xs font-medium tabular-nums text-muted-foreground">
        {format(new Date(event.startDate), "MMM d")}
      </span>

      {/* Type badge */}
      <TypeBadge type={event.type} />

      {/* Name + venue */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground group-hover:text-foreground">
          {event.name}
        </p>
        {event.venueName && (
          <p className="truncate text-xs text-muted-foreground">
            {event.venueName}
          </p>
        )}
      </div>

      <ChevronRightIcon
        className="size-4 shrink-0 text-muted-foreground/50 group-hover:text-muted-foreground transition-colors"
        aria-hidden="true"
      />
    </Link>
  );
}

export function UpcomingEventsCard({ events }: UpcomingEventsCardProps) {
  if (events.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <CalendarIcon
            className="mx-auto mb-3 size-8 text-muted-foreground"
            aria-hidden="true"
          />
          <p className="text-sm text-muted-foreground">No upcoming events.</p>
          <Link
            href="/events/new"
            className="mt-2 inline-block text-sm font-medium underline underline-offset-4 text-muted-foreground hover:text-foreground transition-colors"
          >
            Add your first event
          </Link>
        </CardContent>
      </Card>
    );
  }

  const [primary, ...rest] = events;

  return (
    <Card className="overflow-hidden">
      <PrimaryEvent event={primary} />

      {rest.length > 0 && (
        <div className="border-t border-border">
          {rest.map((event) => (
            <CompactEventRow key={event.id} event={event} />
          ))}
        </div>
      )}
    </Card>
  );
}
