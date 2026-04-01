import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { EventForm } from "@/components/events/event-form";

export default async function NewEventPage() {
  const userId = await requireAuth();

  const cars = await prisma.car.findMany({
    where: { userId },
    select: { id: true, year: true, make: true, model: true, nickname: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Add Event</h1>
      <EventForm cars={cars} />
    </div>
  );
}
