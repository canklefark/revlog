import { Suspense } from "react";
import type { Prisma } from "@prisma/client";
import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { EventList } from "@/components/events/event-list";

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const userId = await requireAuth();
  const params = await searchParams;

  const type = typeof params.type === "string" ? params.type : undefined;
  const status = typeof params.status === "string" ? params.status : undefined;
  const dateFilter = typeof params.date === "string" ? params.date : "upcoming";

  const now = new Date();

  const where: Prisma.EventWhereInput = {
    userId,
    ...(type ? { type } : {}),
    ...(status ? { registrationStatus: status } : {}),
    ...(dateFilter === "upcoming"
      ? { startDate: { gte: now } }
      : dateFilter === "past"
        ? { startDate: { lt: now } }
        : {}),
  };

  const events = await prisma.event.findMany({
    where,
    orderBy: { startDate: "asc" },
  });

  const total = await prisma.event.count({ where: { userId } });

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Events</h1>
      <Suspense>
        <EventList events={events} total={total} />
      </Suspense>
    </div>
  );
}
