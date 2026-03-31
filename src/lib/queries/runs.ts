import { prisma } from "@/lib/prisma";

export async function getRunsForEvent(eventId: string, userId: string) {
  return prisma.run.findMany({
    where: { eventId, event: { userId } },
    orderBy: { runNumber: "asc" },
    include: {
      car: {
        select: {
          id: true,
          year: true,
          make: true,
          model: true,
          nickname: true,
        },
      },
    },
  });
}

export async function getAllRunsForUser(userId: string) {
  const events = await prisma.event.findMany({
    where: { userId, runs: { some: {} } },
    orderBy: { startDate: "desc" },
    include: {
      runs: { orderBy: { runNumber: "asc" } },
      car: {
        select: {
          id: true,
          year: true,
          make: true,
          model: true,
          nickname: true,
        },
      },
    },
  });
  return events;
}
