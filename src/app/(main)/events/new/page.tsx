import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { EventForm } from "@/components/events/event-form";

export default async function NewEventPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>;
}) {
  const userId = await requireAuth();
  const params = await searchParams;

  const [cars, user] = await Promise.all([
    prisma.car.findMany({
      where: { userId },
      select: { id: true, year: true, make: true, model: true, nickname: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.findUnique({
      where: { id: userId },
      select: { defaultEventType: true },
    }),
  ]);

  let template = null;
  if (params.from) {
    const source = await prisma.event.findUnique({
      where: { id: params.from },
    });
    if (source && source.userId === userId) {
      template = source;
    }
  }

  const heading = template ? "Duplicate Event" : "Add Event";

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-semibold mb-6">{heading}</h1>
      <EventForm
        cars={cars}
        defaultEventType={user?.defaultEventType ?? null}
        template={template ?? undefined}
      />
    </div>
  );
}
