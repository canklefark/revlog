import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { FlagIcon } from "lucide-react";
import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { getRunsForEvent } from "@/lib/queries/runs";
import { calculateConsistency } from "@/lib/utils/consistency";
import { formatLapTime } from "@/lib/utils/penalty-calc";
import { SessionSummary } from "@/components/times/session-summary";
import { SessionRunTable } from "@/components/times/session-run-table";
import { SessionNarrative } from "@/components/times/session-narrative";
import { SessionTabs } from "@/components/times/session-tabs";
import { AddRunSheet } from "@/components/times/add-run-sheet";
import { VenueHistory } from "@/components/times/venue-history";
import { TypeBadge } from "@/components/events/type-badge";
import { getVenueHistory } from "@/lib/queries/venue-history";
import { getTireSetsForCar } from "@/lib/queries/tire-sets";
import { getBrakeSetsForCar } from "@/lib/queries/brake-sets";
import { getSetupsForCar } from "@/lib/queries/suspension-setups";
import { BackLink } from "@/components/shared/back-link";

export default async function SessionPage({
  params,
  searchParams,
}: {
  params: Promise<{ eventId: string }>;
  searchParams: Promise<{ session?: string }>;
}) {
  const { eventId } = await params;
  const { session: activeSession } = await searchParams;
  const userId = await requireAuth();

  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event || event.userId !== userId) notFound();

  const allRuns = await getRunsForEvent(eventId, userId);

  // Distinct session labels across all runs (ordered by first appearance)
  const sessionLabels = [
    ...new Set(
      allRuns.map((r) => r.sessionLabel).filter((l): l is string => l !== null),
    ),
  ];
  const hasSessions = sessionLabels.length > 0;

  // Runs shown in the table — filtered by active session tab
  const displayRuns =
    hasSessions && activeSession
      ? allRuns.filter((r) => r.sessionLabel === activeSession)
      : allRuns;

  // Session memory: use the last run in the active session (or overall last)
  const lastRun =
    displayRuns.length > 0 ? displayRuns[displayRuns.length - 1] : null;
  const sessionDefaults = lastRun
    ? {
        conditions: lastRun.conditions,
        tireSetup: lastRun.tireSetup,
        tireSetId: lastRun.tireSetId ?? undefined,
        brakeSetId: lastRun.brakeSetId ?? undefined,
        setupId: lastRun.setupId ?? undefined,
      }
    : undefined;

  // Next run number is always global (across all sessions)
  const globalLastRun = allRuns.length > 0 ? allRuns[allRuns.length - 1] : null;
  const nextRunNumber = (globalLastRun?.runNumber ?? 0) + 1;

  // Active session label for the + button: use the current tab, or last run's label
  const addRunSessionLabel =
    activeSession ?? globalLastRun?.sessionLabel ?? undefined;

  // Fetch equipment options for the car (only if carId exists)
  const [activeTireSets, activeBrakeSets, setups] = event.carId
    ? await Promise.all([
        getTireSetsForCar(event.carId, userId).then((g) => g.active),
        getBrakeSetsForCar(event.carId, userId).then((g) => g.active),
        getSetupsForCar(event.carId, userId),
      ])
    : [[], [], []];

  if (allRuns.length === 0) {
    return (
      <main className="w-full">
        <BackLink href={`/events/${eventId}`} label={event.name} />
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
            tireSets={activeTireSets}
            brakeSets={activeBrakeSets}
            suspensionSetups={setups}
          />
        )}
      </main>
    );
  }

  // Overall analytics (always across ALL runs regardless of session filter)
  const allValidTimes = allRuns
    .map((r) => r.adjustedTime)
    .filter((t): t is number => t !== null);
  const bestTime = allValidTimes.length > 0 ? Math.min(...allValidTimes) : null;
  const consistency = calculateConsistency(
    allRuns.map((r) => r.adjustedTime ?? null),
  );
  const totalPenalties = allRuns.reduce((sum, r) => {
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
  const dnfCount = allRuns.filter((r) => r.adjustedTime === null).length;

  // RallyCross: cumulative time across ALL sessions
  const cumulativeTime =
    event.type === "RallyCross" && allValidTimes.length > 0
      ? allValidTimes.reduce((a, b) => a + b, 0)
      : undefined;

  // Per-session breakdown stats (for the summary cards)
  const sessionBreakdown = hasSessions
    ? sessionLabels.map((label) => {
        const sessionRuns = allRuns.filter((r) => r.sessionLabel === label);
        const sessionTimes = sessionRuns
          .map((r) => r.adjustedTime)
          .filter((t): t is number => t !== null);
        return {
          label,
          runCount: sessionRuns.length,
          bestTime: sessionTimes.length > 0 ? Math.min(...sessionTimes) : null,
        };
      })
    : [];

  const [previousBest, venueHistory] = await Promise.all([
    prisma.run.findFirst({
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
    }),
    event.venueName
      ? getVenueHistory(userId, event.venueName, eventId)
      : Promise.resolve(null),
  ]);

  // Best run ID in display set (for highlighting in table)
  const displayValidTimes = displayRuns
    .map((r) => r.adjustedTime)
    .filter((t): t is number => t !== null);
  const displayBestTime =
    displayValidTimes.length > 0 ? Math.min(...displayValidTimes) : null;
  const displayBestRunId =
    displayBestTime !== null
      ? (displayRuns.find((r) => r.adjustedTime === displayBestTime)?.id ??
        null)
      : null;

  return (
    <main className="w-full pb-24">
      <BackLink href={`/events/${eventId}`} label={event.name} />
      <div className="flex items-start gap-3 mt-1 mb-2">
        <h1 className="text-2xl font-semibold">Session</h1>
        <TypeBadge type={event.type} />
      </div>
      <p className="text-xs text-muted-foreground mb-6">
        {format(new Date(event.startDate), "EEEE, MMMM d, yyyy")}
        {event.venueName ? ` · ${event.venueName}` : ""}
      </p>

      <SessionSummary
        bestTime={bestTime}
        runCount={allRuns.length}
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
        runCount={allRuns.length}
        dnfCount={dnfCount}
        totalPenalties={totalPenalties}
        runs={allRuns}
      />

      {/* Per-session breakdown (only shown when sessions exist) */}
      {hasSessions && (
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {sessionBreakdown.map(
            ({ label, runCount, bestTime: sessionBest }) => (
              <div
                key={label}
                className="rounded-lg border border-border bg-card p-3 space-y-0.5"
              >
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide truncate">
                  {label}
                </p>
                <p className="text-sm font-semibold">
                  {sessionBest !== null ? formatLapTime(sessionBest) : "—"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {runCount} {runCount === 1 ? "run" : "runs"}
                </p>
              </div>
            ),
          )}
        </div>
      )}

      <div className="mt-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            {hasSessions && activeSession
              ? `${activeSession} Runs`
              : "All Runs"}
          </h2>
          <Link
            href={`/events/${eventId}/runs`}
            className="text-xs text-primary hover:underline underline-offset-4"
          >
            Manage runs →
          </Link>
        </div>

        <SessionTabs
          eventId={eventId}
          sessionLabels={sessionLabels}
          activeSession={activeSession ?? null}
        />

        <SessionRunTable runs={displayRuns} bestRunId={displayBestRunId} />
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
          sessionDefaults={sessionDefaults}
          sessionLabel={addRunSessionLabel}
          tireSets={activeTireSets}
          brakeSets={activeBrakeSets}
          suspensionSetups={setups}
        />
      )}
    </main>
  );
}
