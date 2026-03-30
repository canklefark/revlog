import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { EventForm } from "@/components/events/event-form";

export default async function EditEventPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  const userId = await requireAuth();

  const [event, cars] = await Promise.all([
    prisma.event.findUnique({ where: { id: eventId } }),
    prisma.car.findMany({
      where: { userId },
      select: { id: true, year: true, make: true, model: true, nickname: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  if (!event || event.userId !== userId) {
    notFound();
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Edit event</h1>
      <EventForm cars={cars} event={event} />
    </div>
  );
}
