import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { RunForm } from "@/components/times/run-form";
import { createRun } from "@/lib/actions/run";

export default async function NewRunPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  const userId = await requireAuth();

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      car: { select: { id: true } },
      runs: {
        select: {
          runNumber: true,
          conditions: true,
          penalties: true,
          tireSetup: true,
        },
        orderBy: { runNumber: "desc" },
        take: 1,
      },
    },
  });

  if (!event || event.userId !== userId || !event.car) notFound();

  const lastRun = event.runs[0] ?? null;
  const nextRunNumber = (lastRun?.runNumber ?? 0) + 1;
  const sessionDefaults = lastRun
    ? {
        conditions: lastRun.conditions,
        penalties: lastRun.penalties,
        tireSetup: lastRun.tireSetup,
      }
    : undefined;

  return (
    <div className="max-w-2xl">
      <Link
        href={`/events/${eventId}/runs`}
        className="text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        {event.name} / Runs
      </Link>
      <h1 className="text-2xl font-semibold mb-6 mt-1">Add Run</h1>
      <RunForm
        action={createRun}
        eventId={eventId}
        carId={event.car.id}
        defaultRunNumber={nextRunNumber}
        defaultValues={sessionDefaults}
      />
    </div>
  );
}
