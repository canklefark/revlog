import { prisma } from "@/lib/prisma";

export interface VenueHistoryEvent {
  id: string;
  name: string;
  startDate: Date;
  bestTime: number;
  carLabel: string;
}

export async function getVenueHistory(
  userId: string,
  venueName: string,
  excludeEventId: string,
): Promise<VenueHistoryEvent[]> {
  const events = await prisma.event.findMany({
    where: {
      userId,
      venueName,
      NOT: { id: excludeEventId },
      runs: { some: { isDnf: false, adjustedTime: { not: null } } },
    },
    orderBy: { startDate: "asc" },
    take: 20,
    select: {
      id: true,
      name: true,
      startDate: true,
      car: { select: { year: true, make: true, model: true, nickname: true } },
      runs: {
        where: { isDnf: false, adjustedTime: { not: null } },
        select: { adjustedTime: true },
        orderBy: { adjustedTime: "asc" },
        take: 1,
      },
    },
  });

  return events
    .filter((e) => e.runs[0]?.adjustedTime != null)
    .map((e) => ({
      id: e.id,
      name: e.name,
      startDate: e.startDate,
      bestTime: e.runs[0].adjustedTime as number,
      carLabel: e.car
        ? (e.car.nickname ?? `${e.car.year} ${e.car.make} ${e.car.model}`)
        : "Unknown",
    }));
}
