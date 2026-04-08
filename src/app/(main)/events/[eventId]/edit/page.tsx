import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { EventForm } from "@/components/events/event-form";
import { getVenueOptions } from "@/lib/queries/venues";

export default async function EditEventPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  const userId = await requireAuth();

  const [event, cars, venues] = await Promise.all([
    prisma.event.findUnique({ where: { id: eventId, userId } }),
    prisma.car.findMany({
      where: { userId },
      select: { id: true, year: true, make: true, model: true, nickname: true },
      orderBy: { createdAt: "desc" },
    }),
    getVenueOptions(userId),
  ]);

  if (!event) {
    notFound();
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-semibold mb-6">Edit Event</h1>
      <EventForm cars={cars} event={event} venues={venues} />
    </div>
  );
}
