import { notFound } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import {
  PencilIcon,
  CalendarIcon,
  MapPinIcon,
  CarIcon,
  TimerIcon,
  ExternalLinkIcon,
  FileTextIcon,
  PlusIcon,
} from "lucide-react";
import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { TypeBadge } from "@/components/events/type-badge";
import { StatusBadge } from "@/components/events/status-badge";
import { EventStatusUpdater } from "@/components/events/event-status-updater";
import { DeleteEventButton } from "@/components/events/delete-event-button";
import { AdditionalCostsSection } from "@/components/events/additional-costs-section";
import { BackLink } from "@/components/shared/back-link";

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  const userId = await requireAuth();

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      car: {
        select: {
          id: true,
          year: true,
          make: true,
          model: true,
          nickname: true,
        },
      },
      runs: {
        select: { id: true, adjustedTime: true },
        orderBy: { runNumber: "asc" },
      },
      additionalCosts: {
        select: { id: true, description: true, amount: true },
        orderBy: { createdAt: "asc" as const },
      },
    },
  });

  if (!event || event.userId !== userId) {
    notFound();
  }

  const carLabel = event.car
    ? event.car.nickname
      ? `${event.car.nickname} (${event.car.year} ${event.car.make} ${event.car.model})`
      : `${event.car.year} ${event.car.make} ${event.car.model}`
    : null;

  return (
    <div className="w-full">
      <BackLink href="/events" label="Events" />
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold leading-tight">{event.name}</h1>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <TypeBadge type={event.type} />
            <StatusBadge status={event.registrationStatus} />
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button asChild variant="outline" size="sm">
            <Link href={`/events/${eventId}/edit`}>
              <PencilIcon className="size-4" />
              Edit
            </Link>
          </Button>
          <DeleteEventButton eventId={eventId} />
        </div>
      </div>

      <Separator className="mb-6" />

      {/* Date & venue */}
      <div className="space-y-3 mb-6">
        <div className="flex items-start gap-2.5 text-sm">
          <CalendarIcon className="size-4 text-muted-foreground mt-0.5 shrink-0" />
          <div>
            <p className="font-medium">
              {format(new Date(event.startDate), "EEEE, MMMM d, yyyy")}
            </p>
            {event.endDate && (
              <p className="text-muted-foreground text-xs mt-0.5">
                Ends {format(new Date(event.endDate), "EEEE, MMMM d, yyyy")}
              </p>
            )}
          </div>
        </div>

        {(event.venueName || event.address) && (
          <div className="flex items-start gap-2.5 text-sm">
            <MapPinIcon className="size-4 text-muted-foreground mt-0.5 shrink-0" />
            <div>
              {event.venueName && (
                <p className="font-medium">{event.venueName}</p>
              )}
              {event.address && (
                <p className="text-muted-foreground">{event.address}</p>
              )}
              {event.distanceFromHome != null ? (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {Math.round(event.distanceFromHome)} mi away
                  {event.driveTimeMinutes != null
                    ? ` · ${Math.floor(event.driveTimeMinutes / 60)}h ${event.driveTimeMinutes % 60}m drive`
                    : ""}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground mt-0.5">
                  — distance not calculated yet
                </p>
              )}
            </div>
          </div>
        )}

        {event.car && (
          <div className="flex items-start gap-2.5 text-sm">
            <CarIcon className="size-4 text-muted-foreground mt-0.5 shrink-0" />
            <Link
              href={`/garage/${event.car.id}`}
              className="font-medium hover:underline underline-offset-4"
            >
              {carLabel}
            </Link>
          </div>
        )}
        {!event.car && (
          <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
            <CarIcon className="size-4 shrink-0" />
            <span>No car linked</span>
          </div>
        )}
      </div>

      {/* Registration details */}
      <div className="rounded-lg border border-border bg-card p-4 space-y-3 mb-6">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Registration
        </h2>

        <div className="grid grid-cols-2 gap-3 text-sm">
          {event.registrationDeadline && (
            <div>
              <p className="text-xs text-muted-foreground">Deadline</p>
              <p className="font-medium">
                {format(new Date(event.registrationDeadline), "MMM d, yyyy")}
              </p>
            </div>
          )}
          {event.entryFee != null && (
            <div>
              <p className="text-xs text-muted-foreground">Entry fee</p>
              <p className="font-medium">${event.entryFee.toFixed(2)}</p>
            </div>
          )}
          {event.runGroup && (
            <div>
              <p className="text-xs text-muted-foreground">Run group</p>
              <p className="font-medium">{event.runGroup}</p>
            </div>
          )}
          {event.organizingBody && (
            <div>
              <p className="text-xs text-muted-foreground">Organizer</p>
              <p className="font-medium">{event.organizingBody}</p>
            </div>
          )}
        </div>

        {event.registrationUrl && (
          <a
            href={event.registrationUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline underline-offset-4"
          >
            <ExternalLinkIcon className="size-3.5" />
            Registration link
          </a>
        )}

        {/* Calendar sync indicator */}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-1 border-t border-border">
          <CalendarIcon className="size-3.5" />
          {event.calendarEventId
            ? "Synced to calendar"
            : "Not synced to calendar (coming soon)"}
        </div>
      </div>

      {/* Additional costs */}
      <div className="mb-6">
        <AdditionalCostsSection
          eventId={eventId}
          costs={event.additionalCosts}
        />
      </div>

      {/* Status updater */}
      <div className="mb-6">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Update status
        </h2>
        <EventStatusUpdater
          eventId={eventId}
          currentStatus={event.registrationStatus}
        />
      </div>

      {/* Runs section */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Runs
          </h2>
          {event.car && (
            <Button asChild variant="outline" size="sm">
              <Link href={`/events/${eventId}/runs/new`}>
                <PlusIcon className="size-4 mr-1" />
                Add Run
              </Link>
            </Button>
          )}
        </div>
        {event.runs.length > 0 ? (
          <div className="flex items-center gap-3 text-sm">
            <span className="text-muted-foreground">
              {event.runs.length} run{event.runs.length !== 1 ? "s" : ""}
            </span>
            <Link
              href={`/events/${eventId}/runs`}
              className="text-primary hover:underline underline-offset-4 text-xs"
            >
              View runs
            </Link>
            <Link
              href={`/events/${eventId}/session`}
              className="text-primary hover:underline underline-offset-4 text-xs"
            >
              Session view
            </Link>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No runs logged yet.</p>
        )}
      </div>

      {/* Notes */}
      {event.notes && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <FileTextIcon className="size-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Notes
            </h2>
          </div>
          <p className="text-sm whitespace-pre-wrap text-foreground/90 leading-relaxed">
            {event.notes}
          </p>
        </div>
      )}

      {/* Drive time placeholder row */}
      {!event.venueName && !event.address && (
        <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
          <TimerIcon className="size-4 shrink-0" />
          <span>No venue set</span>
        </div>
      )}
    </div>
  );
}
