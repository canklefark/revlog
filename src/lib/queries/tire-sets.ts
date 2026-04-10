import { prisma } from "@/lib/prisma";
import type {
  TireSet,
  TreadDepthLog,
  MaintenanceEntry,
  Run,
  Event,
} from "@prisma/client";

export type TireSetWithLogs = TireSet & {
  treadDepthLogs: TreadDepthLog[];
};

export type GroupedTireSets = {
  active: TireSetWithLogs[];
  stored: TireSetWithLogs[];
  retired: TireSetWithLogs[];
};

export type RunWithEvent = Run & {
  event: { name: string; startDate: Date };
};

export type TireSetDetail = {
  tireSet: TireSet & {
    treadDepthLogs: TreadDepthLog[];
    runs: RunWithEvent[];
  };
  maintenanceHistory: MaintenanceEntry[];
};

export async function getTireSetsForCar(
  carId: string,
  userId: string,
): Promise<GroupedTireSets> {
  const car = await prisma.car.findUnique({ where: { id: carId } });
  if (!car || car.userId !== userId) {
    return { active: [], stored: [], retired: [] };
  }

  const tireSets = await prisma.tireSet.findMany({
    where: { carId, car: { userId } },
    include: {
      treadDepthLogs: {
        orderBy: { date: "desc" },
        take: 1,
      },
    },
    orderBy: [{ createdAt: "desc" }],
  });

  const active: TireSetWithLogs[] = [];
  const stored: TireSetWithLogs[] = [];
  const retired: TireSetWithLogs[] = [];

  for (const ts of tireSets) {
    if (ts.status === "Active") active.push(ts);
    else if (ts.status === "Stored") stored.push(ts);
    else retired.push(ts);
  }

  return { active, stored, retired };
}

export async function getTireSetDetail(
  id: string,
  userId: string,
): Promise<TireSetDetail | null> {
  const tireSet = await prisma.tireSet.findFirst({
    where: { id, car: { userId } },
    include: {
      treadDepthLogs: {
        orderBy: { date: "desc" },
      },
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

  if (!tireSet) return null;

  const maintenanceHistory = await prisma.maintenanceEntry.findMany({
    where: {
      carId: tireSet.carId,
      car: { userId },
      serviceType: { in: ["Tire Rotation", "Tire Change"] },
    },
    orderBy: { date: "desc" },
  });

  return { tireSet, maintenanceHistory };
}
