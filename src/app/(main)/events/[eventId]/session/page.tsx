import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { FlagIcon } from "lucide-react";
import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { getRunsForEvent } from "@/lib/queries/runs";
import { calculateConsistency } from "@/lib/utils/consistency";
import { SessionSummary } from "@/components/times/session-summary";
import { SessionRunTable } from "@/components/times/session-run-table";
import { SessionNarrative } from "@/components/times/session-narrative";
import { AddRunSheet } from "@/components/times/add-run-sheet";
import { VenueHistory } from "@/components/times/venue-history";
import { TypeBadge } from "@/components/events/type-badge";
import { getVenueHistory } from "@/lib/queries/venue-history";

export default async function SessionPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  const userId = await requireAuth();

  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event || event.userId !== userId) notFound();

  const runs = await getRunsForEvent(eventId, userId);

  // Session memory: extract last run's fields to pre-fill next run form
  const lastRun = runs.length > 0 ? runs[runs.length - 1] : null;
  const sessionDefaults = lastRun
    ? {
        conditions: lastRun.conditions,
        penalties: lastRun.penalties,
        tireSetup: lastRun.tireSetup,
      }
    : undefined;

  const nextRunNumber = (lastRun?.runNumber ?? 0) + 1;

  if (runs.length === 0) {
    return (
      <main className="w-full">
        <Link
          href={`/events/${eventId}`}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {event.name}
        </Link>
        <h1 className="text-2xl font-semibold mt-1 mb-6">Session</h1>
        <div className="py-12 text-center">
          <FlagIcon
            className="mx-auto mb-3 size-8 text-muted-foreground"
            aria-hidden="true"
          />
          <p className="text-sm text-muted-foreground">No runs logged yet.</p>
          <p className="text-xs text-muted-foreground mt-1">
            Tap the + button to log your first run and start tracking times,
            consistency, and personal bests.
          </p>
          <Link
            href={`/events/${eventId}/runs/new`}
            className="text-xs text-primary hover:underline underline-offset-4 mt-3 inline-block"
          >
            Add your first run →
          </Link>
        </div>
        {event.carId && (
          <AddRunSheet
            eventId={eventId}
            carId={event.carId}
            nextRunNumber={1}
          />
        )}
      </main>
    );
  }

  // Compute analytics
  const validTimes = runs
    .map((r) => r.adjustedTime)
    .filter((t): t is number => t !== null);
  const bestTime = validTimes.length > 0 ? Math.min(...validTimes) : null;
  const bestRun =
    bestTime !== null
      ? (runs.find((r) => r.adjustedTime === bestTime) ?? null)
      : null;
  const consistency = calculateConsistency(
    runs.map((r) => r.adjustedTime ?? null),
  );
  const totalPenalties = runs.reduce((sum, r) => {
    try {
      const p = Array.isArray(r.penalties)
        ? r.penalties
        : JSON.parse(r.penalties as string);
      return (
        sum +
        (p as Array<{ count: number }>).reduce((s, pen) => s + pen.count, 0)
      );
    } catch {
      return sum;
    }
  }, 0);
  const dnfCount = runs.filter((r) => r.adjustedTime === null).length;

  // RallyCross: cumulative time
  const cumulativeTime =
    event.type === "RallyCross" && validTimes.length > 0
      ? validTimes.reduce((a, b) => a + b, 0)
      : undefined;

  // Narrative: previous best at this event type / venue
  const previousBest = await prisma.run.findFirst({
    where: {
      isDnf: false,
      adjustedTime: { not: null },
      event: {
        userId,
        type: event.type,
        ...(event.venueName ? { venueName: event.venueName } : {}),
        NOT: { id: eventId },
      },
    },
    orderBy: { adjustedTime: "asc" },
    select: { adjustedTime: true },
  });

  // Venue history
  const venueHistory = event.venueName
    ? await getVenueHistory(userId, event.venueName, eventId)
    : null;

  return (
    <main className="w-full pb-24">
      <Link
        href={`/events/${eventId}`}
        className="text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        {event.name}
      </Link>
      <div className="flex items-start gap-3 mt-1 mb-6">
        <h1 className="text-2xl font-semibold">Session</h1>
        <TypeBadge type={event.type} />
      </div>
      <p className="text-xs text-muted-foreground mb-6">
        {format(new Date(event.startDate), "EEEE, MMMM d, yyyy")}
        {event.venueName ? ` · ${event.venueName}` : ""}
      </p>

      <SessionSummary
        bestTime={bestTime}
        runCount={runs.length}
        dnfCount={dnfCount}
        totalPenalties={totalPenalties}
        consistency={consistency}
        eventType={event.type}
        cumulativeTime={cumulativeTime}
      />

      <SessionNarrative
        bestTime={bestTime}
        previousBest={previousBest?.adjustedTime ?? null}
        eventType={event.type}
        venueName={event.venueName}
        runCount={runs.length}
        dnfCount={dnfCount}
        totalPenalties={totalPenalties}
        runs={runs}
      />

      <div className="mt-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            All Runs
          </h2>
          <Link
            href={`/events/${eventId}/runs`}
            className="text-xs text-primary hover:underline underline-offset-4"
          >
            Manage runs →
          </Link>
        </div>
        <SessionRunTable runs={runs} bestRunId={bestRun?.id ?? null} />
      </div>

      {venueHistory && venueHistory.length > 0 && (
        <div className="mt-8">
          <VenueHistory events={venueHistory} venueName={event.venueName!} />
        </div>
      )}

      {event.carId && (
        <AddRunSheet
          eventId={eventId}
          carId={event.carId}
          nextRunNumber={nextRunNumber}
          sessionDefaults={
            sessionDefaults as Parameters<
              typeof AddRunSheet
            >[0]["sessionDefaults"]
          }
        />
      )}
    </main>
  );
}
