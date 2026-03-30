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
        select: { runNumber: true },
        orderBy: { runNumber: "desc" },
        take: 1,
      },
    },
  });

  if (!event || event.userId !== userId || !event.car) notFound();

  const nextRunNumber = (event.runs[0]?.runNumber ?? 0) + 1;

  return (
    <main className="container mx-auto px-4 py-6 max-w-xl">
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
      />
    </main>
  );
}
