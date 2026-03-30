import Link from "next/link";
import { format } from "date-fns";
import { requireAuth } from "@/lib/auth-utils";
import { getAllRunsForUser } from "@/lib/queries/runs";
import { formatLapTime } from "@/lib/utils/penalty-calc";
import { TypeBadge } from "@/components/events/type-badge";

export default async function TimesPage() {
  const userId = await requireAuth();
  const events = await getAllRunsForUser(userId);

  if (events.length === 0) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-2xl">
        <h1 className="text-2xl font-semibold mb-6">Times</h1>
        <div className="py-12 text-center text-muted-foreground">
          <p className="text-sm">No runs logged yet.</p>
          <p className="text-xs mt-1">
            Add runs to an event to track your times.
          </p>
        </div>
      </div>
    );
  }

  return (
    <main className="container mx-auto px-4 py-6 max-w-2xl">
      <h1 className="text-2xl font-semibold mb-6">Times</h1>
      <div className="space-y-4">
        {events.map((event) => {
          const validTimes = event.runs
            .map((r) => r.adjustedTime)
            .filter((t): t is number => t !== null);
          const bestTime =
            validTimes.length > 0 ? Math.min(...validTimes) : null;
          return (
            <div
              key={event.id}
              className="rounded-lg border border-border bg-card p-4"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <Link
                    href={`/events/${event.id}`}
                    className="font-medium text-sm hover:underline underline-offset-4"
                  >
                    {event.name}
                  </Link>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {format(new Date(event.startDate), "MMM d, yyyy")}
                  </p>
                </div>
                <TypeBadge type={event.type} />
              </div>
              <div className="flex items-center gap-3 flex-wrap text-xs text-muted-foreground mt-2">
                <span>
                  {event.runs.length} run{event.runs.length !== 1 ? "s" : ""}
                </span>
                {bestTime !== null && (
                  <span className="font-medium text-foreground">
                    Best: {formatLapTime(bestTime)}
                  </span>
                )}
              </div>
              <div className="mt-3 flex gap-2">
                <Link
                  href={`/events/${event.id}/runs`}
                  className="text-xs text-primary hover:underline underline-offset-4"
                >
                  View runs
                </Link>
                <span className="text-xs text-muted-foreground">·</span>
                <Link
                  href={`/events/${event.id}/session`}
                  className="text-xs text-primary hover:underline underline-offset-4"
                >
                  Session view
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}
