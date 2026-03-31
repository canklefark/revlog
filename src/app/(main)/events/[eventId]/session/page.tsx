import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { getRunsForEvent } from "@/lib/queries/runs";
import { calculateConsistency } from "@/lib/utils/consistency";
import { SessionSummary } from "@/components/times/session-summary";
import { SessionRunTable } from "@/components/times/session-run-table";
import { TypeBadge } from "@/components/events/type-badge";

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

  if (runs.length === 0) {
    return (
      <main className="container mx-auto px-4 py-6 max-w-2xl">
        <Link
          href={`/events/${eventId}`}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {event.name}
        </Link>
        <h1 className="text-2xl font-semibold mt-1 mb-6">Session</h1>
        <p className="text-sm text-muted-foreground">
          No runs logged for this event yet.
        </p>
        <Link
          href={`/events/${eventId}/runs/new`}
          className="text-xs text-primary hover:underline underline-offset-4 mt-2 inline-block"
        >
          Add your first run →
        </Link>
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

  return (
    <main className="container mx-auto px-4 py-6 max-w-2xl">
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
    </main>
  );
}
