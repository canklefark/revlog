import type { BrakeSet, MaintenanceEntry, Run, Event } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type PositionOrder = { [key: string]: number };

const POSITION_ORDER: PositionOrder = {
  Front: 0,
  Rear: 1,
  All: 2,
};

function sortByPosition(a: BrakeSet, b: BrakeSet): number {
  return (
    (POSITION_ORDER[a.position] ?? 99) - (POSITION_ORDER[b.position] ?? 99)
  );
}

export type GroupedBrakeSets = {
  active: BrakeSet[];
  stored: BrakeSet[];
  retired: BrakeSet[];
};

export async function getBrakeSetsForCar(
  carId: string,
  userId: string,
): Promise<GroupedBrakeSets> {
  const brakeSets = await prisma.brakeSet.findMany({
    where: { carId, car: { userId } },
    orderBy: { createdAt: "desc" },
  });

  const active = brakeSets
    .filter((b) => b.status === "Active")
    .sort(sortByPosition);
  const stored = brakeSets
    .filter((b) => b.status === "Stored")
    .sort(sortByPosition);
  const retired = brakeSets
    .filter((b) => b.status === "Retired")
    .sort(sortByPosition);

  return { active, stored, retired };
}

export type BrakeSetWithRuns = BrakeSet & {
  runs: (Run & { event: Pick<Event, "name" | "startDate"> })[];
};

export type BrakeSetDetailResult = {
  brakeSet: BrakeSetWithRuns;
  maintenanceHistory: MaintenanceEntry[];
};

export async function getBrakeSetDetail(
  id: string,
  userId: string,
): Promise<BrakeSetDetailResult | null> {
  const brakeSet = await prisma.brakeSet.findFirst({
    where: { id, car: { userId } },
    include: {
      runs: {
        orderBy: { createdAt: "desc" },
        include: {
          event: {
            select: { name: true, startDate: true },
          },
        },
      },
    },
  });

  if (!brakeSet) return null;

  const maintenanceHistory = await prisma.maintenanceEntry.findMany({
    where: {
      carId: brakeSet.carId,
      serviceType: { in: ["Brake Pads", "Brake Rotors"] },
    },
    orderBy: { date: "desc" },
  });

  return { brakeSet, maintenanceHistory };
}
