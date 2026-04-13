import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { RunForm } from "@/components/times/run-form";
import { updateRun } from "@/lib/actions/run";
import { BackLink } from "@/components/shared/back-link";

export default async function EditRunPage({
  params,
}: {
  params: Promise<{ eventId: string; runId: string }>;
}) {
  const { eventId, runId } = await params;
  const userId = await requireAuth();

  const run = await prisma.run.findUnique({
    where: { id: runId },
    include: {
      event: { select: { userId: true, name: true, id: true, carId: true } },
    },
  });

  if (!run || run.event.userId !== userId) notFound();

  return (
    <main className="container mx-auto px-4 py-6 max-w-xl">
      <BackLink
        href={`/events/${eventId}/runs`}
        label={`${run.event.name} / Runs`}
      />
      <h1 className="text-2xl font-semibold mb-6">Edit Run</h1>
      <RunForm
        action={updateRun}
        eventId={eventId}
        carId={run.carId}
        defaultValues={run}
      />
    </main>
  );
}
