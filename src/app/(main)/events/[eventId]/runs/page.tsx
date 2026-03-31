import Link from "next/link";
import { notFound } from "next/navigation";
import { PlusIcon } from "lucide-react";
import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { getRunsForEvent } from "@/lib/queries/runs";
import { RunList } from "@/components/times/run-list";
import { Button } from "@/components/ui/button";

export default async function EventRunsPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  const userId = await requireAuth();

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: { car: { select: { id: true } } },
  });

  if (!event || event.userId !== userId) notFound();

  const runs = await getRunsForEvent(eventId, userId);

  return (
    <main className="container mx-auto px-4 py-6 max-w-2xl">
      <div className="flex items-center justify-between mb-6 gap-4">
        <div>
          <Link
            href={`/events/${eventId}`}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {event.name}
          </Link>
          <h1 className="text-2xl font-semibold">Runs</h1>
        </div>
        {event.car && (
          <Button asChild size="sm">
            <Link href={`/events/${eventId}/runs/new`}>
              <PlusIcon />
              Add Run
            </Link>
          </Button>
        )}
      </div>
      {!event.car && (
        <p className="text-sm text-muted-foreground mb-4">
          Link a car to this event to log runs.
        </p>
      )}
      <RunList runs={runs} eventId={eventId} />
    </main>
  );
}
